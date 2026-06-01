import { requirePermission, auditEvent } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";

function summarizeAuthorizedState(state, access) {
    if (!state || typeof state !== "object") return {};
    const authorizedProjectIds = new Set(
        access.scopes
            .filter((scope) => scope.type === "project")
            .map((scope) => scope.id)
    );
    const enterpriseWide = access.scopes.some((scope) => ["enterprise", "portfolio", "program"].includes(scope.type));
    const canSeeProject = (id) => enterpriseWide || authorizedProjectIds.size === 0 || authorizedProjectIds.has(id);

    const scopes = Array.isArray(state.scopes) ? state.scopes.filter((scope) => canSeeProject(scope.id)) : [];
    const scopeIds = new Set(scopes.map((scope) => scope.id));
    return {
        strategy: state.strategy || [],
        benefits: Array.isArray(state.benefits)
            ? state.benefits.filter((benefit) => (benefit.scopeDependencies || []).some((id) => scopeIds.has(id)) || enterpriseWide)
            : [],
        scopes,
        tasks: Array.isArray(state.tasks) ? state.tasks.filter((task) => scopeIds.has(task.scopeId) || enterpriseWide) : [],
        scenario: state.scenario || {}
    };
}

export async function POST(req) {
    const result = await requirePermission(PERMISSIONS.AI_PROPOSE);
    if (result.error) return result.error;

    const { prompt, state, model } = await req.json();
    const filteredState = summarizeAuthorizedState(state, result.access);
    const apiKey = process.env.Openrouter || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return Response.json({ error: "OpenRouter API Key is missing on the server." }, { status: 500 });
    }

    const systemPrompt = `You are the expert AI PM Copilot for DeliveryPro.AI.
Only use the authorized portfolio state below. Never infer or disclose projects outside this filtered context.

Authorized Portfolio State:
- Enterprise Strategy: "${(filteredState.strategy || []).map((s) => s.title).join(", ")}"
- Active Objectives: ${JSON.stringify((filteredState.strategy || []).flatMap((s) => s.objectives || []))}
- Aligned Benefits: ${JSON.stringify((filteredState.benefits || []).map((b) => ({ id: b.id, name: b.name, current: b.metric?.current, target: b.metric?.target })))}
- Project Scopes: ${JSON.stringify((filteredState.scopes || []).map((s) => ({ id: s.id, name: s.name, progress: s.progress, capEx: s.financials?.capEx?.plan, fte: s.fteAllocations })))}
- Active Tasks: ${JSON.stringify((filteredState.tasks || []).map((t) => ({ title: t.title, scopeId: t.scopeId, status: t.status, assignee: t.assignee })))}

If the user asks for a change, return a separate fenced JSON Change Proposal object.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Title": "DeliveryPro.AI"
        },
        body: JSON.stringify({
            model: model || "google/gemini-2.5-pro",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ]
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        return Response.json({ error: `OpenRouter API failed: ${errText}` }, { status: response.status });
    }

    await auditEvent({
        actorClerkUserId: result.access.userId,
        eventType: "ai.copilot.prompted",
        permissionKey: PERMISSIONS.AI_PROPOSE,
        summary: "Submitted an authorized Copilot prompt",
        metadata: { model: model || "google/gemini-2.5-pro" }
    });
    return Response.json(await response.json());
}
