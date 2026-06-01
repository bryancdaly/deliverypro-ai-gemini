import { auth, currentUser } from "@clerk/nextjs/server";
import { hasDatabaseUrl, getSql } from "./db";
import { ROLE_LABELS, uniquePermissions, PERMISSIONS } from "./permissions";
import { hasClerkConfig } from "./runtime";

const DEFAULT_SCOPE = {
    id: "enterprise-global",
    type: "enterprise",
    name: "Enterprise (Global Corp)",
    inherits: true
};

function fallbackRoleFor(email) {
    if (!hasClerkConfig()) return "system-admin";
    const initialAdmin = process.env.INITIAL_ADMIN_EMAIL;
    if (initialAdmin && email && initialAdmin.toLowerCase() === email.toLowerCase()) {
        return "system-admin";
    }
    return "viewer";
}

export async function requireUser() {
    if (!hasClerkConfig()) {
        return {
            session: { userId: "local-dev-admin" },
            user: {
                fullName: "Local Development Admin",
                username: "local-admin",
                imageUrl: "",
                primaryEmailAddress: { emailAddress: process.env.INITIAL_ADMIN_EMAIL || "local-admin@deliverypro.ai" }
            },
            email: process.env.INITIAL_ADMIN_EMAIL || "local-admin@deliverypro.ai"
        };
    }

    const session = await auth();
    if (!session.userId) {
        return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || "";
    return { session, user, email };
}

export async function getEffectiveAccess() {
    const required = await requireUser();
    if (required.error) return { error: required.error };

    const { session, user, email } = required;
    const displayName = user?.fullName || user?.username || email || "DeliveryPro User";

    if (!hasDatabaseUrl()) {
        const role = fallbackRoleFor(email);
        return {
            userId: session.userId,
            profile: {
                clerkUserId: session.userId,
                displayName,
                email,
                title: role === "system-admin" ? "System Administrator" : "Workspace User",
                department: "Portfolio Office",
                avatarUrl: user?.imageUrl || "",
                status: "active",
                timezone: "Pacific/Auckland"
            },
            roles: [{ key: role, name: ROLE_LABELS[role] || role, scope: DEFAULT_SCOPE }],
            permissions: uniquePermissions([role]),
            scopes: [DEFAULT_SCOPE],
            source: "env-fallback"
        };
    }

    const sql = await getSql();
    await sql`
        insert into profiles (clerk_user_id, display_name, email, avatar_url)
        values (${session.userId}, ${displayName}, ${email}, ${user?.imageUrl || ""})
        on conflict (clerk_user_id) do update
        set display_name = excluded.display_name,
            email = excluded.email,
            avatar_url = excluded.avatar_url,
            updated_at = now()
    `;

    const memberships = await sql`
        select
            r.key as role_key,
            r.name as role_name,
            h.id as scope_id,
            h.node_type as scope_type,
            h.name as scope_name,
            m.inherits_down
        from memberships m
        join roles r on r.id = m.role_id
        join hierarchy_nodes h on h.id = m.hierarchy_node_id
        join profiles p on p.id = m.profile_id
        where p.clerk_user_id = ${session.userId}
          and m.status = 'active'
    `;

    let rows = memberships.rows;
    if (rows.length === 0) {
        const role = fallbackRoleFor(email);
        rows = [{
            role_key: role,
            role_name: ROLE_LABELS[role] || role,
            scope_id: DEFAULT_SCOPE.id,
            scope_type: DEFAULT_SCOPE.type,
            scope_name: DEFAULT_SCOPE.name,
            inherits_down: true
        }];
    }

    const roleKeys = rows.map((row) => row.role_key);
    return {
        userId: session.userId,
        profile: {
            clerkUserId: session.userId,
            displayName,
            email,
            title: "",
            department: "",
            avatarUrl: user?.imageUrl || "",
            status: "active",
            timezone: "Pacific/Auckland"
        },
        roles: rows.map((row) => ({
            key: row.role_key,
            name: row.role_name,
            scope: {
                id: row.scope_id,
                type: row.scope_type,
                name: row.scope_name,
                inherits: row.inherits_down
            }
        })),
        permissions: uniquePermissions(roleKeys),
        scopes: rows.map((row) => ({
            id: row.scope_id,
            type: row.scope_type,
            name: row.scope_name,
            inherits: row.inherits_down
        })),
        source: "database"
    };
}

export async function requirePermission(permission) {
    const access = await getEffectiveAccess();
    if (access.error) return { error: access.error };
    if (!access.permissions.includes(permission)) {
        return { error: Response.json({ error: "Forbidden", permission }, { status: 403 }) };
    }
    return { access };
}

export async function requireAccessManager() {
    return requirePermission(PERMISSIONS.ACCESS_MANAGE);
}

export async function auditEvent(event) {
    if (!hasDatabaseUrl()) return;
    const sql = await getSql();
    await sql`
        insert into audit_events (actor_clerk_user_id, event_type, permission_key, hierarchy_node_id, summary, metadata)
        values (
            ${event.actorClerkUserId || null},
            ${event.eventType},
            ${event.permissionKey || null},
            ${event.hierarchyNodeId || null},
            ${event.summary},
            ${JSON.stringify(event.metadata || {})}::jsonb
        )
    `;
}
