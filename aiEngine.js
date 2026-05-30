/* ==========================================================================
   DELIVERYPRO.AI SIMULATION ENGINE & OPENROUTER.AI CLIENT
   ========================================================================== */

import { store } from './store.js';

class DeliveryProAIEngine {
    constructor() {
        this.apiConfig = {
            mode: localStorage.getItem("dp_ai_mode") || "sim", // 'sim' or 'live'
            apiKey: localStorage.getItem("dp_openrouter_key") || "",
            model: localStorage.getItem("dp_openrouter_model") || "google/gemini-2.5-pro"
        };
    }

    // Update settings in runtime and save to LocalStorage
    updateSettings(mode, apiKey, model) {
        this.apiConfig.mode = mode;
        this.apiConfig.apiKey = apiKey;
        this.apiConfig.model = model;
        
        localStorage.setItem("dp_ai_mode", mode);
        localStorage.setItem("dp_openrouter_key", apiKey);
        localStorage.setItem("dp_openrouter_model", model);

        // Update dot status on UI
        const statusDot = document.getElementById("copilot-pulse-dot");
        const statusTxt = document.getElementById("connection-status");
        if (statusDot) {
            statusDot.className = `status-dot ${mode === 'live' ? 'active-live' : 'active-sim'}`;
        }
        if (statusTxt) {
            statusTxt.textContent = mode === 'live' ? `Live OpenRouter (${model.split('/').pop()})` : "Deterministic Simulation Mode";
        }
    }

    // Core Gateway to send prompt to LLM (OpenRouter) or Fallback Simulator
    async sendMessage(prompt) {
        const activeState = store.state;
        
        if (this.apiConfig.mode === "live") {
            try {
                return await this.fetchOpenRouterResponse(prompt, activeState);
            } catch(e) {
                console.error("OpenRouter API failed, falling back to client-side simulator:", e);
                // Return fallback and show warning
                return {
                    text: `⚠️ <b>OpenRouter API connection failed.</b> Ref: ${e.message}. Toggling temporary simulation fallback.<br><br>` + this.simulateResponse(prompt, activeState).text,
                    proposal: this.simulateResponse(prompt, activeState).proposal,
                    isFallback: true
                };
            }
        } else {
            // Wait 600ms for realistic thinking feel
            await new Promise(r => setTimeout(r, 600));
            return this.simulateResponse(prompt, activeState);
        }
    }

    // ==========================================================================
    // OPENROUTER.AI API FETCH INTEGRATION
    // ==========================================================================
    async fetchOpenRouterResponse(prompt, state) {
        // 1. Try Vercel Serverless API Proxy first
        try {
            const serverlessResponse = await fetch("/api/copilot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prompt: prompt,
                    state: state,
                    model: this.apiConfig.model
                })
            });

            if (serverlessResponse.ok) {
                const data = await serverlessResponse.json();
                const aiMessage = data.choices[0].message.content;
                return this.parseAiResponse(aiMessage);
            } else if (serverlessResponse.status === 404) {
                console.log("Vercel serverless API not detected (likely running locally). Falling back to direct client-side fetch.");
            } else {
                const errText = await serverlessResponse.text();
                console.warn(`Vercel serverless API returned error: ${errText}. Falling back to direct client-side fetch.`);
            }
        } catch (e) {
            console.log("Vercel serverless fetch failed. Falling back to direct client-side fetch:", e);
        }

        // 2. Direct client-side fetch fallback (uses LocalStorage key)
        if (!this.apiConfig.apiKey) {
            throw new Error("No API Key detected. Please configure your OpenRouter API Key in the settings.");
        }

        // Build rich, systemic developer instructions
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

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiConfig.apiKey}`,
                "Content-Type": "application/json",
                "X-Title": "DeliveryPro.AI"
            },
            body: JSON.stringify({
                model: this.apiConfig.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`HTTP ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message.content;
        return this.parseAiResponse(aiMessage);
    }

    parseAiResponse(aiMessage) {
        // Parse JSON proposal if present
        let parsedProposal = null;
        const jsonMatch = aiMessage.match(/```json\s*([\s\S]*?)\s*```/);
        let cleanedText = aiMessage;
        
        if (jsonMatch) {
            try {
                const parsedJson = JSON.parse(jsonMatch[1]);
                if (parsedJson.proposal) {
                    parsedProposal = parsedJson.proposal;
                }
                // Strip JSON block from displayed chat bubble to keep it clean
                cleanedText = aiMessage.replace(/```json\s*[\s\S]*?\s*```/, "").trim();
            } catch(e) {
                console.error("Failed to parse JSON proposal from AI message:", e);
            }
        }

        return {
            text: cleanedText,
            proposal: parsedProposal
        };
    }

    // ==========================================================================
    // DETERMINISTIC SIMULATION ENGINE (STANDALONE OFFLINE EXPERT SYSTEM)
    // ==========================================================================
    simulateResponse(prompt, state) {
        const p = prompt.toLowerCase();
        
        // 1. DIRECTIVE: CREATE PROJECT / ADD INTAKE
        if (p.includes("create") || p.includes("add project") || p.includes("promote") || p.includes("bamboo")) {
            const isBamboo = p.includes("bamboo") || p.includes("packag");
            
            const title = isBamboo ? "Decarbonize Pacific Fruit Packaging" : "Automated Route Dispatch Systems";
            const desc = isBamboo 
                ? "Replace single-use plastic shipping shells with biodegradable bamboo fiber packaging to cut supply chain emissions."
                : "Procure and configure real-time automated dispatch engines for truck route optimization.";
            const alignedBenefit = isBamboo ? "ben-transport-transition" : "ben-ops-savings";
            const capEx = isBamboo ? 85000 : 120000;
            const opEx = isBamboo ? 15000 : 20000;
            const fte = isBamboo ? 3 : 2;

            return {
                text: `<p>I have processed your operational request to initialize a new execution scope.</p>
                <p>Based on our active strategy mapping, this initiative aligns directly with the <b>${isBamboo ? 'Low-Emission Transport' : 'Warehouse Ops Savings'}</b> benefit track. I have estimated the budget, schedule lag, and resource load from our historical velocity indexes.</p>`,
                proposal: {
                    actionLabel: `Promote "${title}" to active Portfolio`,
                    diffs: [
                        `[NEW] Project Scope: "${title}" (${capEx + opEx} USD budget)`,
                        `[NEW] 3 default activities assigned to John Doe & Sarah Connor`,
                        `[LINK] Connect scope enablers to Benefit: "${isBamboo ? 'Low-Emission logistics' : 'Annual operations savings'}"`
                    ],
                    actionType: "create_project",
                    payload: {
                        name: title,
                        description: desc,
                        methodology: isBamboo ? "Waterfall" : "Agile",
                        capEx: capEx,
                        opEx: opEx,
                        alignedBenefitId: alignedBenefit,
                        fte: fte
                    }
                }
            };
        }

        // 2. DIRECTIVE: PORTFOLIO OPTIMIZATION
        if (p.includes("optimize") || p.includes("balance") || p.includes("frontier") || p.includes("budget cut")) {
            const isCut = p.includes("cut") || p.includes("20");
            const newCap = isCut ? 1000000 : 1500000;
            
            return {
                text: `<p>I have parsed your directive to run our <b>Efficient Frontier Portfolio Optimization Solver</b>.</p>
                <p>Accounting for the ${isCut ? '20% budget reduction' : 'current state constraints'} (Budget Cap: $${newCap.toLocaleString()}), the solver will identify the project combination that yields the highest Strategic Value index with the minimal Execution Risk coefficient.</p>`,
                proposal: {
                    actionLabel: isCut ? "Run AI Optimization (Fit $1.0M budget)" : "Run AI Allocation & FTE Balancing Solver",
                    diffs: [
                        `Adjust Portfolio Budget Cap slider constraint to $${newCap.toLocaleString()}`,
                        `Include high-ROI "Route Optimization" and "Transit Fleet" scopes`,
                        `Exclude lower-scoring "Warehouse Safety Module" to preserve capital efficiency`,
                        `Verify that resource allocations fall within the 15 FTE cap`
                    ],
                    actionType: "balance_resources",
                    payload: {
                        budgetCap: newCap,
                        fteCap: 15,
                        includedProjectIds: ["scope-route-optimization", "scope-transport-fleet"]
                    }
                }
            };
        }

        // 3. INVESTIGATION: ROADBLOCKS / RISKS / DISBENEFITS
        if (p.includes("block") || p.includes("risk") || p.includes("disbenefit") || p.includes("friction")) {
            const riskScopes = state.scopes.filter(s => s.executionRisk > 40);
            const activeDisbenefits = state.benefits.filter(b => b.isDisbenefit);

            let responseText = `<p>I have scanned the active strategic portfolio nodes for operational bottlenecks and disbenefit friction points.</p>
            <h3>⚠️ Key Risk Factors Identified:</h3>
            <ul style="margin: 12px 0 0 20px; font-size: 13px; color: var(--color-text-secondary); line-height: 1.5;">`;

            // List risk scopes
            riskScopes.forEach(s => {
                responseText += `<li style="margin-bottom: 6px;"><b>Project Risk:</b> "${s.name}" is flagged at <b>${s.executionRisk}% Risk</b>. Downstream dependencies for the Low-Emission Transport Benefit could experience schedule slippage if Bay dock installations lag.</li>`;
            });

            // List disbenefits
            activeDisbenefits.forEach(d => {
                responseText += `<li style="margin-bottom: 6px;"><b>Active Disbenefit Friction:</b> "${d.name}" is currently reporting <b>+${d.metric.current} ${d.metric.unit}</b> dispatch latency. Toggling this scope introduces a direct margin drag on OKR 2.</li>`;
            });

            responseText += `</ul>
            <p style="margin-top: 12px;"><i>Mitigation Suggestion:</i> You can click on the <b>Portfolio Optimizer</b> to simulate dates adjustments, shifting resource allocations to relieve critical paths.</p>`;

            return {
                text: responseText,
                proposal: null
            };
        }

        // 4. INVESTIGATION: OKR ALIGNMENT
        if (p.includes("okr") || p.includes("alignment") || p.includes("logistics")) {
            const emissionsOkr = state.strategy.objectives.find(o => o.id === "okr-emissions");
            const alignedBens = state.benefits.filter(b => b.alignedOkrId === emissionsOkr.id);

            let resText = `<p>Here is the top-down alignment profile for the <b>${emissionsOkr.title}</b> objective:</p>
            <div style="background: hsla(0,0%,100%,0.02); border: 1px solid var(--glass-border); padding: 14px; border-radius: 8px; margin: 12px 0;">
                <h4 style="font-size: 13px; color: var(--accent-indigo);">${emissionsOkr.title}</h4>
                <p style="font-size: 12px; margin-top: 4px;">Metric Current Progress: <b>${emissionsOkr.current}% achieved</b> (Target: ${emissionsOkr.target}%)</p>
                <div style="height: 4px; background: hsla(0,0%,100%,0.05); border-radius: 4px; margin-top: 8px; overflow:hidden;">
                    <div style="height:100%; background: var(--color-success); width: ${(emissionsOkr.current/emissionsOkr.target)*100}%"></div>
                </div>
            </div>
            <p>This strategic objective is driven by the following benefit tracks:</p>
            <ul style="margin: 12px 0 0 20px; font-size: 12px; color: var(--color-text-secondary); line-height: 1.45;">`;

            alignedBens.forEach(b => {
                resText += `<li style="margin-bottom: 6px;"><b>Benefit:</b> "${b.name}" (Owner: ${b.owner.split(' ')[0]}, Metric: ${b.metric.current}/${b.metric.target}${b.metric.unit})</li>`;
            });

            resText += `</ul>`;

            return {
                text: resText,
                proposal: null
            };
        }

        // 5. INVESTIGATION: REPORT GENERATION
        if (p.includes("report") || p.includes("synthesize") || p.includes("brief")) {
            return {
                text: `<p>I have aggregated the active portfolio status indicators and prepared an executive strategic brief summary.</p>
                <p>The brief details overall strategy health at <b>${state.strategy.health}%</b>, details our two active OKRs, lists CapEx spend limits, and summarizes disbenefits latency.</p>
                <p>You can view this compiled presentation format and instantly trigger a high-fidelity PDF print layout by navigating to the <b>Executive Synthesizer</b> tab in the sidebar.</p>`,
                proposal: null
            };
        }

        // 6. DEFAULT FALLBACK CHAT RESPONSE
        return {
            text: `<p>I am reviewing your request: <i>"${prompt}"</i>.</p>
            <p>Based on our **DeliveryPro.AI** context, I recommend trying these specific directives:</p>
            <ul style="margin: 12px 0 0 20px; font-size: 13px; color: var(--color-text-secondary); line-height: 1.5;">
                <li style="margin-bottom: 4px;">Ask: <b>"Show OKR alignment for Logistics"</b> to inspect our strategy cascading trace paths.</li>
                <li style="margin-bottom: 4px;">Command: <b>"Create a project to replace all single-use plastics"</b> to test the dynamic AI smart intake and promotion funnel.</li>
                <li style="margin-bottom: 4px;">Command: <b>"Optimize portfolio budget for a 20% cut"</b> to trigger the SVG Efficient Frontier sandboxing solver.</li>
                <li style="margin-bottom: 4px;">Ask: <b>"What disbenefits are we risking?"</b> to evaluate our operational trade-offs ledger.</li>
            </ul>`,
            proposal: null
        };
    }
}

const aiEngine = new DeliveryProAIEngine();
export default aiEngine;
export { aiEngine };
