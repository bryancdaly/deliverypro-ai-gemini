// api/copilot.js - Vercel Serverless Function Proxy for OpenRouter.ai
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, state, model } = req.body;
    
    // Retrieve environment variable
    const apiKey = process.env.Openarouter || process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'OpenRouter API Key is missing on the server. Please configure the "Openarouter" environment variable in Vercel.' });
    }

    // Build rich, systemic PM developer instructions
    const systemPrompt = `You are the expert AI PM Copilot for DeliveryPro.AI, an enterprise Strategic PPM tool.
Your workspace state is passed below. You must reference actual projects, OKRs, benefits, and costs in your responses.

Current Portfolio State:
- Enterprise Strategy: "${state.strategy.title}"
- Active Objectives: ${JSON.stringify(state.strategy.objectives)}
- Aligned Benefits: ${JSON.stringify(state.benefits.map(b => ({ id: b.id, name: b.name, current: b.metric.current, target: b.metric.target })))}
- Project Scopes: ${JSON.stringify(state.scopes.map(s => ({ id: s.id, name: s.name, progress: s.progress, capEx: s.financials.capEx.plan, fte: s.fteAllocations })))}
- Active Tasks: ${JSON.stringify(state.tasks.map(t => ({ title: t.title, scopeId: t.scopeId, status: t.status, assignee: t.assignee })))}
- Budget Cap: $${state.scenario.budgetCap} | Active Project Scopes: ${JSON.stringify(state.scenario.includedProjectIds)}

INSTRUCTIONS:
1. Speak concisely in professional, high-end PM terminology. Formulate responses in clean HTML/Markdown.
2. If the user asks you to alter timelines, create projects, balance resources, or update tasks, you MUST return a structured "Change Proposal" in your response inside a separate JSON object.
3. The JSON object for the proposal must match this schema:
   {
     "proposal": {
       "actionLabel": "Human-readable label of the action",
       "diffs": ["Add task X", "Change status of Y", "Include Project Z in mix"],
       "actionType": "create_project" | "balance_resources" | "update_task",
       "payload": {
         // relative payload details like:
         // For create_project: { "name": "...", "description": "...", "methodology": "...", "capEx": 150000, "opEx": 25000, "alignedBenefitId": "...", "fte": 3 }
         // For update_task: { "taskId": "...", "status": "..." }
       }
     }
   }
Ensure the JSON block is enclosed within \`\`\`json ... \`\`\` tags.`;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
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
            return res.status(response.status).json({ error: `OpenRouter API failed: ${errText}` });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch(e) {
        return res.status(500).json({ error: `Server error: ${e.message}` });
    }
}
