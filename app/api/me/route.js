import { getEffectiveAccess } from "@/lib/authz";

export async function GET() {
    const access = await getEffectiveAccess();
    if (access.error) return access.error;
    return Response.json(access);
}
