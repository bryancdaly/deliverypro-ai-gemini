import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
    const result = await requirePermission(PERMISSIONS.AI_PROPOSE);
    if (result.error) return result.error;

    const apiKey = process.env.Openrouter || process.env.OPENROUTER_API_KEY;
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const response = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers
    });

    if (!response.ok) {
        const errText = await response.text();
        return Response.json({ error: `OpenRouter failed: ${errText}` }, { status: response.status });
    }

    return Response.json(await response.json());
}
