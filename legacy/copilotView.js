/* ==========================================================================
   DELIVERYPRO.AI - AI COPILOT INTERFACE VIEW COMPONENT
   ========================================================================== */

import { store, escapeHtml } from './store.js';
import { aiEngine } from './aiEngine.js';

class CopilotView {
    constructor() {
        this.drawer = document.getElementById("copilot-drawer");
        this.chatBody = document.getElementById("copilot-chat-body");
        this.input = document.getElementById("copilot-input");
        this.sendBtn = document.getElementById("copilot-send");
        this.toggleBtn = document.getElementById("copilot-toggle");
        this.closeBtn = document.getElementById("copilot-close");
        
        // Settings elements
        this.settingsBtn = document.getElementById("copilot-settings-btn");
        this.settingsModal = document.getElementById("settings-modal");
        this.settingsClose = document.getElementById("settings-close");
        this.settingsSave = document.getElementById("settings-save");
        this.testConnBtn = document.getElementById("test-connection-btn");
        this.testStatus = document.getElementById("test-status");
        
        // Form elements
        this.modeSim = document.getElementById("mode-sim-btn");
        this.modeLive = document.getElementById("mode-live-btn");
        this.apiKeyInput = document.getElementById("openrouter-api-key");
        this.modelSelect = document.getElementById("openrouter-model");

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.loadAvailableModels();
    }

    loadSettings() {
        // Hydrate settings modal from localstorage config
        const mode = aiEngine.apiConfig.mode;
        const model = aiEngine.apiConfig.model;

        if (mode === "live") {
            this.setLiveModeActive();
        } else {
            this.setSimModeActive();
        }

        if (this.modelSelect) this.modelSelect.value = model;

        // Set status dot class
        aiEngine.updateSettings(mode, model);
    }

    async loadAvailableModels() {
        const select = this.modelSelect;
        if (!select) return;

        // Display Loading text
        select.innerHTML = '<option value="">Loading available models...</option>';

        try {
            let data = null;
            // 1. Try fetching from backend proxy first
            try {
                const response = await fetch("/api/models");
                if (response.ok) {
                    data = await response.json();
                } else {
                    console.warn(`Backend models proxy returned HTTP ${response.status}`);
                }
            } catch(e) {
                console.log("Backend models proxy failed (likely running locally), falling back to direct public fetch:", e);
            }

            // 2. Fallback to direct public models fetch if backend failed or is not available
            if (!data) {
                const response = await fetch("https://openrouter.ai/api/v1/models");
                if (response.ok) {
                    data = await response.json();
                } else {
                    throw new Error(`Public models API returned HTTP ${response.status}`);
                }
            }

            if (data && data.data && Array.isArray(data.data)) {
                // Populate the selector with models from OpenRouter
                select.innerHTML = data.data.map(model => `
                    <option value="${model.id}">${model.name || model.id}</option>
                `).join('');

                // Restore previous selection if it exists in the fetched list, otherwise default to Gemini 2.5 Pro or first
                const savedModel = aiEngine.apiConfig.model;
                if (savedModel && data.data.some(m => m.id === savedModel)) {
                    select.value = savedModel;
                } else if (data.data.some(m => m.id === "google/gemini-2.5-pro")) {
                    select.value = "google/gemini-2.5-pro";
                } else {
                    select.value = data.data[0].id;
                }
            } else {
                throw new Error("Invalid models data format");
            }
        } catch(e) {
            console.error("Failed to load available models:", e);
            // Fallback default list
            select.innerHTML = `
                <option value="google/gemini-2.5-pro">Google: Gemini 2.5 Pro</option>
                <option value="anthropic/claude-3.5-sonnet">Anthropic: Claude 3.5 Sonnet</option>
                <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B Instruct (Free)</option>
            `;
            const savedModel = aiEngine.apiConfig.model;
            if (savedModel) select.value = savedModel;
        }
    }

    bindEvents() {
        // Toggle drawer
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener("click", () => {
                this.drawer.classList.toggle("collapsed");
                this.scrollChatToBottom();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener("click", () => {
                this.drawer.classList.add("collapsed");
            });
        }

        // Send message event
        if (this.sendBtn) {
            this.sendBtn.addEventListener("click", () => this.handleSendMessage());
        }

        if (this.input) {
            this.input.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        }

        // Suggested chips clicks
        const chips = document.querySelectorAll(".chat-chips-container .chip");
        chips.forEach(chip => {
            chip.addEventListener("click", () => {
                const prompt = chip.dataset.prompt;
                if (this.input) {
                    this.input.value = prompt;
                    this.handleSendMessage();
                }
            });
        });

        // Settings Modal controls
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener("click", () => {
                this.settingsModal.classList.remove("hidden");
                this.loadSettings(); // re-sync
            });
        }

        if (this.settingsClose) {
            this.settingsClose.addEventListener("click", () => {
                this.settingsModal.classList.add("hidden");
            });
        }

        // Toggle buttons inside settings modal
        if (this.modeSim) {
            this.modeSim.addEventListener("click", () => this.setSimModeActive());
        }
        if (this.modeLive) {
            this.modeLive.addEventListener("click", () => this.setLiveModeActive());
        }

        // Save settings action
        if (this.settingsSave) {
            this.settingsSave.addEventListener("click", () => {
                const mode = this.modeLive.classList.contains("active-toggle") ? "live" : "sim";
                const model = this.modelSelect.value;

                aiEngine.updateSettings(mode, model);
                this.settingsModal.classList.add("hidden");
                this.showNotification("AI Configuration saved successfully.", "success");
            });
        }

        // Test API Connection
        if (this.testConnBtn) {
            this.testConnBtn.addEventListener("click", async () => {
                const model = this.modelSelect.value;

                this.testStatus.textContent = "Testing Backend Proxy Connection...";
                this.testStatus.className = "test-result";

                try {
                    const response = await fetch("/api/copilot", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            prompt: "Respond with only: Connection test successful.",
                            state: store.state,
                            model: model
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.choices && data.choices.length > 0) {
                            this.testStatus.textContent = `Connection Successful! Model: ${model.split('/').pop()}`;
                            this.testStatus.className = "test-result success";
                        } else {
                            throw new Error("API returned empty response");
                        }
                    } else {
                        const errData = await response.json().catch(() => ({}));
                        const errMsg = errData.error || `HTTP ${response.status}`;
                        throw new Error(errMsg);
                    }
                } catch(e) {
                    this.testStatus.textContent = `Connection failed: ${e.message}`;
                    this.testStatus.className = "test-result error";
                }
            });
        }
        // Reset Portfolio Sandbox Data
        const resetBtn = document.getElementById("reset-portfolio-btn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to reset all portfolio adjustments, custom projects, task completions, and audit logs back to demo defaults? This action cannot be undone.")) {
                    localStorage.removeItem("dp_portfolio_state");
                    window.location.reload();
                }
            });
        }
    }

    setSimModeActive() {
        this.modeSim.classList.add("active-toggle");
        this.modeLive.classList.remove("active-toggle");
        document.getElementById("apikey-group").style.display = "none";
        document.getElementById("model-group").style.display = "none";
    }

    setLiveModeActive() {
        this.modeLive.classList.add("active-toggle");
        this.modeSim.classList.remove("active-toggle");
        document.getElementById("apikey-group").style.display = "flex";
        document.getElementById("model-group").style.display = "flex";
    }

    async handleSendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        // Clear input
        this.input.value = "";

        // 1. Render User Message bubble
        this.appendMessage(text, "user");

        // 2. Render Thinking shimmer bubble
        const shimmerId = this.appendShimmerBubble();
        this.scrollChatToBottom();

        try {
            // 3. Query AI Engine (Simulation or OpenRouter.ai API)
            const response = await aiEngine.sendMessage(text);

            // Remove thinking shimmer
            this.removeShimmerBubble(shimmerId);

            // 4. Render AI Message response bubble
            this.appendMessage(response.text, "ai");

            // 5. Render Actionable Proposal Card if returned, or synthesize one for known edit requests.
            const proposal = response.proposal || this.createFallbackProposal(text);
            if (proposal) {
                this.appendProposalCard(proposal);
            }
        } catch(e) {
            this.removeShimmerBubble(shimmerId);
            this.appendMessage(`<p style="color:var(--color-warning);">⚠️ <b>AI Copilot Error:</b> Failed to compile message response. Ref: ${e.message}. Please test your settings configuration.</p>`, "ai");
        }

        this.scrollChatToBottom();
    }

    createFallbackProposal(prompt) {
        const p = prompt.toLowerCase();
        const asksForTaskDates = (
            (p.includes("date") || p.includes("timeline") || p.includes("schedule")) &&
            (p.includes("task") || p.includes("tasks")) &&
            (p.includes("add") || p.includes("set") || p.includes("update") || p.includes("finish"))
        );

        if (!asksForTaskDates) return null;

        const candidateTasks = store.state.tasks.filter(task =>
            !task.isArchived &&
            ["todo", "in_progress"].includes(task.status)
        );

        if (!candidateTasks.length) return null;

        const updates = this.buildNextMonthTaskDateUpdates(candidateTasks);
        if (!updates.length) return null;

        return {
            actionLabel: `Set start and finish dates for ${updates.length} active tasks`,
            actionType: "update_tasks",
            diffs: updates.map(update =>
                `Set "${update.title}" from ${update.previousStartDate || "no start"}-${update.previousEndDate || "no finish"} to ${update.startDate}-${update.endDate}`
            ),
            payload: { updates }
        };
    }

    buildNextMonthTaskDateUpdates(tasks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfNextWeek = new Date(today);
        const daysUntilMonday = (8 - startOfNextWeek.getDay()) % 7 || 7;
        startOfNextWeek.setDate(startOfNextWeek.getDate() + daysUntilMonday);

        return tasks.map((task, index) => {
            const start = new Date(startOfNextWeek);
            start.setDate(start.getDate() + (index * 3));

            const end = new Date(start);
            end.setDate(end.getDate() + (task.isMilestone ? 0 : 4));

            return {
                taskId: task.id,
                title: task.title,
                previousStartDate: task.startDate || "",
                previousEndDate: task.endDate || "",
                startDate: this.formatDate(start),
                endDate: this.formatDate(end)
            };
        });
    }

    formatDate(date) {
        return date.toISOString().slice(0, 10);
    }

    appendMessage(htmlText, type) {
        const bubble = document.createElement("div");
        bubble.className = `message ${type === 'user' ? 'user-msg' : 'ai-msg'}`;
        if (type === 'user') {
            bubble.textContent = htmlText;
        } else {
            // Parse markdown to HTML (handles **bold**, * bullets, `code`, etc.)
            // Falls back to raw HTML for our own template strings that are already HTML
            const rendered = window.marked ? window.marked.parse(htmlText) : htmlText;
            bubble.innerHTML = rendered;
        }
        this.chatBody.appendChild(bubble);
    }

    appendShimmerBubble() {
        const shimmerId = "shimmer-" + Date.now();
        const bubble = document.createElement("div");
        bubble.className = "message ai-msg ai-shimmer";
        bubble.id = shimmerId;
        bubble.style.height = "52px";
        bubble.style.width = "180px";
        bubble.style.borderRadius = "16px 16px 16px 2px";
        
        this.chatBody.appendChild(bubble);
        return shimmerId;
    }

    removeShimmerBubble(shimmerId) {
        const shimmer = document.getElementById(shimmerId);
        if (shimmer) shimmer.remove();
    }

    appendProposalCard(proposal) {
        const card = document.createElement("div");
        card.className = "proposal-card";
        
        const diffs = Array.isArray(proposal.diffs) ? proposal.diffs : [];
        let diffsHtml = diffs.map(d => {
            const isAdd = d.startsWith("[NEW]") || d.startsWith("Include");
            const isDel = d.startsWith("[DELETE]") || d.startsWith("Exclude") || d.startsWith("Adjust");
            return `<div class="proposal-diff-item ${isAdd ? 'add' : (isDel ? 'del' : '')}">${escapeHtml(d)}</div>`;
        }).join('');

        if (proposal.actionType === "update_tasks") {
            const updates = proposal.payload?.updates || [];
            diffsHtml = updates.map(update => `
                <div class="proposal-task-update">
                    <div class="proposal-task-title">${escapeHtml(update.title || update.taskId)}</div>
                    <div class="proposal-date-row">
                        <span>${escapeHtml(update.previousStartDate || "No start")} - ${escapeHtml(update.previousEndDate || "No finish")}</span>
                        <span class="material-symbols-outlined">arrow_forward</span>
                        <strong>${escapeHtml(update.startDate)} - ${escapeHtml(update.endDate)}</strong>
                    </div>
                </div>
            `).join('');
        }

        card.innerHTML = `
            <h4>
                <span class="material-symbols-outlined" style="font-size:16px;">verified_user</span>
                AI Execution Change Proposal
            </h4>
            <p class="proposal-summary">${escapeHtml(proposal.actionLabel || "Review proposed changes before applying.")}</p>
            <div class="proposal-diff-list">
                ${diffsHtml}
            </div>
            <div class="proposal-actions">
                <button class="btn btn-secondary reject-proposal-btn">Discard</button>
                <button class="btn btn-primary approve-proposal-btn">Approve</button>
            </div>
        `;

        this.chatBody.appendChild(card);

        // Bind Action buttons
        const rejectBtn = card.querySelector(".reject-proposal-btn");
        const approveBtn = card.querySelector(".approve-proposal-btn");

        if (rejectBtn) {
            rejectBtn.onclick = () => {
                card.remove();
                this.appendMessage("<p>Proposal discarded.</p>", "ai");
                this.scrollChatToBottom();
            };
        }

        if (approveBtn) {
            approveBtn.onclick = () => {
                const payload = proposal.payload;
                
                // Commit to central store transaction
                const commitSuccess = store.commitTransaction(
                    proposal.actionLabel, 
                    "AI Copilot Approved", 
                    (state) => {
                        if (proposal.actionType === "create_project") {
                            const newScopeId = "scope-" + Date.now();
                            const newScope = {
                                id: newScopeId,
                                name: payload.name,
                                description: payload.description,
                                methodology: payload.methodology,
                                status: "In Flight",
                                expectedValue: 90,
                                executionRisk: 40,
                                financials: {
                                    capEx: { plan: payload.capEx, actual: 0, etc: payload.capEx },
                                    opEx: { plan: payload.opEx, actual: 0, etc: payload.opEx }
                                },
                                progress: 0,
                                fteAllocations: payload.fte
                            };
                            state.scopes.push(newScope);

                            // Insert default tasks
                            state.tasks.push(
                                { id: "task-" + Date.now() + "-1", scopeId: newScopeId, title: "Draft high-level functional architectures", assignee: "Sarah Connor", status: "in_progress", weight: 2 },
                                { id: "task-" + Date.now() + "-2", scopeId: newScopeId, title: "Develop baseline release code modules", assignee: "Bryan Lee", status: "todo", weight: 4 }
                            );

                            // Map to Strategic Benefit enablers
                            const alignedBen = state.benefits.find(b => b.id === payload.alignedBenefitId);
                            if (alignedBen) {
                                alignedBen.scopeDependencies.push(newScopeId);
                            }

                            // Add to active included Optimizer list
                            state.scenario.includedProjectIds.push(newScopeId);
                        } 
                        
                        else if (proposal.actionType === "balance_resources") {
                            state.scenario.budgetCap = payload.budgetCap;
                            state.scenario.fteCap = payload.fteCap;
                            state.scenario.includedProjectIds = payload.includedProjectIds;
                        }

                        else if (proposal.actionType === "update_task") {
                            const task = state.tasks.find(t => t.id === payload.taskId);
                            if (task) {
                                if (payload.status) task.status = payload.status;
                                if (payload.startDate) task.startDate = payload.startDate;
                                if (payload.endDate) task.endDate = payload.endDate;
                            }
                        }

                        else if (proposal.actionType === "update_tasks") {
                            (payload.updates || []).forEach(update => {
                                const task = state.tasks.find(t => t.id === update.taskId);
                                if (!task) return;
                                if (update.status) task.status = update.status;
                                if (update.startDate) task.startDate = update.startDate;
                                if (update.endDate) task.endDate = update.endDate;
                            });
                        }
                    }
                );

                if (commitSuccess) {
                    card.remove();
                    this.appendMessage("<p style='color:var(--color-success);'><b>✓ Proposal approved and executed.</b> State transactions saved to Audit Log ledger.</p>", "ai");
                    this.showNotification("Change Proposal committed reactively.", "success");
                    this.scrollChatToBottom();
                } else {
                    this.appendMessage("<p style='color:var(--color-danger);'>Failed to execute proposal due to cascading transaction faults.</p>", "ai");
                }
            };
        }
    }

    scrollChatToBottom() {
        this.chatBody.scrollTop = this.chatBody.scrollHeight;
    }

    showNotification(msg, type = "success") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        let icon = "done";
        if (type === "warning") icon = "warning";
        else if (type === "error") icon = "gpp_maybe";

        toast.innerHTML = `
            <span class="material-symbols-outlined">${icon}</span>
            <span>${msg}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

export default CopilotView;
export { CopilotView };
