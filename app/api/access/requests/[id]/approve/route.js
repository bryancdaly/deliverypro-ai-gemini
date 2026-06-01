import { getSql, hasDatabaseUrl } from "@/lib/db";
import { auditEvent, requireAccessManager } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";

export async function POST(_req, { params }) {
    const result = await requireAccessManager();
    if (result.error) return result.error;
    const { id } = await params;

    if (!hasDatabaseUrl()) {
        return Response.json({ ok: true, mode: "dry-run", id, status: "approved" });
    }

    const sql = await getSql();
    const updated = await sql`
        update access_requests
        set status = 'approved',
            decided_by_clerk_user_id = ${result.access.userId},
            decided_at = now()
        where id = ${id}
        returning *
    `;
    await auditEvent({
        actorClerkUserId: result.access.userId,
        eventType: "access.approved",
        permissionKey: PERMISSIONS.ACCESS_MANAGE,
        summary: `Approved access request ${id}`,
        metadata: { id }
    });
    return Response.json({ ok: true, request: updated.rows[0] || null });
}
