import { z } from "zod";
import { getSql, hasDatabaseUrl } from "@/lib/db";
import { auditEvent, requireUser } from "@/lib/authz";

const RequestSchema = z.object({
    requestedRoleKey: z.string().trim().min(1).max(80),
    hierarchyNodeId: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(8).max(2000)
});

export async function POST(req) {
    const required = await requireUser();
    if (required.error) return required.error;
    const body = RequestSchema.parse(await req.json());

    if (!hasDatabaseUrl()) {
        return Response.json({ ok: true, mode: "dry-run", request: body }, { status: 202 });
    }

    const sql = await getSql();
    const result = await sql`
        insert into access_requests (requester_clerk_user_id, requested_role_key, hierarchy_node_id, reason, status)
        values (${required.session.userId}, ${body.requestedRoleKey}, ${body.hierarchyNodeId}, ${body.reason}, 'pending')
        returning id, status, created_at
    `;
    await auditEvent({
        actorClerkUserId: required.session.userId,
        eventType: "access.requested",
        hierarchyNodeId: body.hierarchyNodeId,
        summary: `Requested ${body.requestedRoleKey} access`,
        metadata: body
    });
    return Response.json({ ok: true, request: result.rows[0] }, { status: 201 });
}
