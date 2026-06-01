import { getEffectiveAccess } from "@/lib/authz";

export async function GET() {
    const access = await getEffectiveAccess();
    if (access.error) return access.error;
    return Response.json({
        permissions: access.permissions,
        roles: access.roles,
        scopes: access.scopes,
        source: access.source
    });
}
