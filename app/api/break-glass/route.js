import { z } from "zod";
import { getSql, hasDatabaseUrl } from "@/lib/db";
import { auditEvent, requireUser } from "@/lib/authz";

const BreakGlassSchema = z.object({
    hierarchyNodeId: z.string().trim().min(1),
    permissionKey: z.string().trim().min(1),
    reason: z.string().trim().min(16).max(2000),
    expiresAt: z.string().trim().min(1)
});

export async function POST(req) {
    const required = await requireUser();
    if (required.error) return required.error;
    const body = BreakGlassSchema.parse(await req.json());

    if (!hasDatabaseUrl()) {
        return Response.json({ ok: true, mode: "dry-run", breakGlass: body }, { status: 202 });
    }

    const sql = await getSql();
    const inserted = await sql`
        insert into break_glass_events (
            actor_clerk_user_id, hierarchy_node_id, permission_key,
            reason, expires_at, status, review_required
        )
        values (
            ${required.session.userId}, ${body.hierarchyNodeId}, ${body.permissionKey},
            ${body.reason}, ${body.expiresAt}, 'active', true
        )
        returning id, status, expires_at
    `;
    await auditEvent({
        actorClerkUserId: required.session.userId,
        eventType: "break_glass.activated",
        permissionKey: body.permissionKey,
        hierarchyNodeId: body.hierarchyNodeId,
        summary: "Activated break-glass access",
        metadata: body
    });
    return Response.json({ ok: true, breakGlass: inserted.rows[0] }, { status: 201 });
}
