import { z } from "zod";
import { getSql, hasDatabaseUrl } from "@/lib/db";
import { auditEvent, requireAccessManager } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";

const DelegationSchema = z.object({
    delegateClerkUserId: z.string().trim().min(1),
    roleKey: z.string().trim().min(1),
    hierarchyNodeId: z.string().trim().min(1),
    startsAt: z.string().trim().min(1),
    endsAt: z.string().trim().min(1),
    reason: z.string().trim().min(8).max(2000)
});

export async function POST(req) {
    const result = await requireAccessManager();
    if (result.error) return result.error;
    const body = DelegationSchema.parse(await req.json());

    if (!hasDatabaseUrl()) {
        return Response.json({ ok: true, mode: "dry-run", delegation: body }, { status: 202 });
    }

    const sql = await getSql();
    const inserted = await sql`
        insert into delegations (
            grantor_clerk_user_id, delegate_clerk_user_id, role_key,
            hierarchy_node_id, starts_at, ends_at, reason, status
        )
        values (
            ${result.access.userId}, ${body.delegateClerkUserId}, ${body.roleKey},
            ${body.hierarchyNodeId}, ${body.startsAt}, ${body.endsAt}, ${body.reason}, 'active'
        )
        returning id, status, starts_at, ends_at
    `;
    await auditEvent({
        actorClerkUserId: result.access.userId,
        eventType: "delegation.created",
        permissionKey: PERMISSIONS.ACCESS_MANAGE,
        hierarchyNodeId: body.hierarchyNodeId,
        summary: `Delegated ${body.roleKey} access`,
        metadata: body
    });
    return Response.json({ ok: true, delegation: inserted.rows[0] }, { status: 201 });
}
