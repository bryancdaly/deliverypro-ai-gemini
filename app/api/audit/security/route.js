import { getSql, hasDatabaseUrl } from "@/lib/db";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
    const result = await requirePermission(PERMISSIONS.AUDIT_READ);
    if (result.error) return result.error;

    if (!hasDatabaseUrl()) {
        return Response.json({
            events: [{
                id: "env-fallback",
                event_type: "audit.fallback",
                summary: "Database is not configured; audit events will be persisted after POSTGRES_URL is configured.",
                created_at: new Date().toISOString()
            }]
        });
    }

    const sql = await getSql();
    const events = await sql`
        select id, actor_clerk_user_id, event_type, permission_key, hierarchy_node_id, summary, metadata, created_at
        from audit_events
        order by created_at desc
        limit 100
    `;
    return Response.json({ events: events.rows });
}
