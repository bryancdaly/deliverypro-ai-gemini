import { redirect } from "next/navigation";
import { z } from "zod";
import { getSql, hasDatabaseUrl } from "@/lib/db";
import { auditEvent, requireUser } from "@/lib/authz";

const ProfileSchema = z.object({
    displayName: z.string().trim().min(1).max(160),
    title: z.string().trim().max(160).optional().default(""),
    department: z.string().trim().max(160).optional().default(""),
    timezone: z.string().trim().max(80).optional().default("Pacific/Auckland")
});

async function updateProfile(req) {
    const required = await requireUser();
    if (required.error) return required.error;

    const contentType = req.headers.get("content-type") || "";
    const raw = contentType.includes("application/json")
        ? await req.json()
        : Object.fromEntries((await req.formData()).entries());
    const profile = ProfileSchema.parse(raw);

    if (hasDatabaseUrl()) {
        const sql = await getSql();
        await sql`
            update profiles
            set display_name = ${profile.displayName},
                title = ${profile.title},
                department = ${profile.department},
                timezone = ${profile.timezone},
                updated_at = now()
            where clerk_user_id = ${required.session.userId}
        `;
        await auditEvent({
            actorClerkUserId: required.session.userId,
            eventType: "profile.updated",
            summary: "Updated profile settings",
            metadata: profile
        });
    }

    if (contentType.includes("application/json")) {
        return Response.json({ ok: true, profile });
    }
    redirect("/profile");
}

export async function PATCH(req) {
    return updateProfile(req);
}

export async function POST(req) {
    return updateProfile(req);
}
