/* ==========================================================================
   DELIVERYPRO.AI - DEMAND & INTAKE FUNNEL COMPONENT
   ========================================================================== */

import { store } from './store.js';
import { aiEngine } from './aiEngine.js';

class IntakeView {
    constructor() {
        this.containerId = "view-content";
        this._activeVettingId = null;
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="intake-workspace">
                <!-- Left Pane: Intake Form -->
                <div class="glass-panel form-card" style="overflow-y: auto; max-height: calc(100vh - 120px);">
                    <h3>Intake Capture & AI Alignment</h3>

                    <div class="form-group">
                        <label for="intake-title">Project Request Title</label>
                        <input type="text" id="intake-title" placeholder="e.g. Bio-Degradable Packaging Initiative">
                    </div>

                    <div class="form-group">
                        <label for="intake-sponsor">Operational Executive Sponsor</label>
                        <input type="text" id="intake-sponsor" placeholder="e.g. Sarah Connor">
                    </div>

                    <div class="form-group">
                        <label for="intake-desc">Business Case Description (AI Live Analyzer)</label>
                        <textarea id="intake-desc" rows="4" placeholder="Describe the problem, the built output, and expected business benefits..."></textarea>
                    </div>

                    <!-- AI Suggested Alignment Card (Dynamic Overlay) -->
                    <div class="ai-suggested-card hidden" id="intake-ai-alignment">
                        <h4>
                            <span class="material-symbols-outlined" style="font-size:16px;">smart_toy</span>
                            AI Live Strategic Match
                        </h4>
                        <p class="help-text" style="margin-top: 4px;">Dynamic semantic mappings to active objective OKRs and benefits:</p>
                        <div class="suggested-pills-row" id="ai-suggested-pills"></div>
                    </div>

                    <!-- AI Smart Estimate Card -->
                    <div class="ai-estimates-card hidden" id="intake-ai-estimates">
                        <h4>
                            <span class="material-symbols-outlined" style="font-size:16px;">query_stats</span>
                            AI Capacity & Cost Estimates
                        </h4>
                        <div class="est-details-grid">
                            <div class="est-cell"><small>Suggested Budget</small><p id="est-budget">NZ$0</p></div>
                            <div class="est-cell"><small>Timeline Duration</small><p id="est-duration">0 months</p></div>
                            <div class="est-cell"><small>Strategic Value</small><p id="est-value">0 pts</p></div>
                            <div class="est-cell"><small>FTE Requirements</small><p id="est-fte">0 FTEs</p></div>
                        </div>
                        <div class="est-action-row">
                            <button id="apply-ai-estimates-btn" class="btn btn-secondary">Apply Suggested Estimates</button>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-group">
                            <label for="intake-start-date">Project Start Date</label>
                            <input type="date" id="intake-start-date">
                        </div>
                        <div class="form-group">
                            <label for="intake-end-date">Project End Date</label>
                            <input type="date" id="intake-end-date">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-group">
                            <label for="intake-capex">Capital Budget (CapEx, NZ$)</label>
                            <input type="number" id="intake-capex" min="0" step="1000" value="250000" placeholder="e.g. 250000">
                        </div>
                        <div class="form-group">
                            <label for="intake-opex">Annual Operating Cost (OpEx, NZ$)</label>
                            <input type="number" id="intake-opex" min="0" step="1000" value="30000" placeholder="e.g. 30000">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="intake-effort">Estimated Duration (months)</label>
                        <input type="number" id="intake-effort" min="1" max="60" step="1" value="6" placeholder="e.g. 6">
                    </div>

                    <button id="intake-submit-btn" class="btn btn-primary">
                        <span class="material-symbols-outlined">add</span>
                        <span>Submit Project to Sandbox</span>
                    </button>
                </div>

                <!-- Right Pane: Vetting Sandbox Board -->
                <div class="glass-panel" style="display: flex; flex-direction: column; gap: 16px; overflow: hidden;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>Prioritization Vetting Sandbox</h3>
                        <span class="tier-badge" style="background: hsla(200,85%,55%,0.1); color: var(--color-info);">Idea Board — click any card to score</span>
                    </div>

                    <div class="sandbox-columns-grid" id="sandbox-columns-grid">
                        <div class="sandbox-column" data-status="Draft">
                            <h4>Draft</h4>
                            <div class="sandbox-cards-container" id="col-draft"></div>
                        </div>
                        <div class="sandbox-column" data-status="Under Review">
                            <h4>Under Review</h4>
                            <div class="sandbox-cards-container" id="col-review"></div>
                        </div>
                        <div class="sandbox-column" data-status="Vetting">
                            <h4>Scoring & Vetting</h4>
                            <div class="sandbox-cards-container" id="col-vetting"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Prioritization Scoring Modal Overlay -->
            <div id="vetting-modal" class="modal-overlay hidden">
                <div class="modal-card" style="width: 620px; max-width: 95vw;">
                    <div class="modal-header">
                        <h2 id="vet-modal-title">Evaluate Request</h2>
                        <button id="vetting-modal-close" class="icon-btn">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="modal-body prioritization-card" style="gap: 16px; padding: 20px;">
                        <p id="vet-modal-desc" style="font-size: 13px; color: var(--color-text-secondary); line-height: 1.45;"></p>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: var(--color-text-muted);">
                            <span id="vet-modal-dates"></span>
                            <span id="vet-modal-cost" style="text-align: right;"></span>
                        </div>

                        <div class="prioritization-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px;">
                            <div class="priority-slider-box">
                                <label style="font-size:11px; color: var(--color-text-secondary);">Strategic Fit (1–10)</label>
                                <input type="number" id="score-fit" min="1" max="10" step="0.5" value="5.0"
                                    style="width:100%; margin-top:6px; padding:6px 8px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 6px; color: var(--color-text-primary); font-size:14px;">
                            </div>
                            <div class="priority-slider-box">
                                <label style="font-size:11px; color: var(--color-text-secondary);">Financial ROI (1–10)</label>
                                <input type="number" id="score-roi" min="1" max="10" step="0.5" value="5.0"
                                    style="width:100%; margin-top:6px; padding:6px 8px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 6px; color: var(--color-text-primary); font-size:14px;">
                            </div>
                            <div class="priority-slider-box">
                                <label style="font-size:11px; color: var(--color-text-secondary);">Complexity Drag (1–10)</label>
                                <input type="number" id="score-complex" min="1" max="10" step="0.5" value="5.0"
                                    style="width:100%; margin-top:6px; padding:6px 8px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 6px; color: var(--color-text-primary); font-size:14px;">
                            </div>
                            <div class="priority-slider-box" style="background: hsla(165,80%,45%,0.06); border-radius:8px; padding:8px; text-align:center;">
                                <label style="font-size:11px; color: var(--color-text-secondary);">WSJF Score</label>
                                <div id="score-wsjf-val" style="font-size: 22px; font-weight: 700; color: var(--color-success); margin-top:6px;">2.00</div>
                                <p class="help-text" style="margin:0; font-size:9px;">(Fit + ROI) / Complexity</p>
                            </div>
                        </div>

                        <!-- AI Feasibility Analysis Panel -->
                        <div class="ai-prediction-panel">
                            <h4>
                                <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; margin-right:4px;">smart_toy</span>
                                AI Feasibility & Bottleneck Check
                            </h4>
                            <p id="ai-feasibility-text">Analyzing capacity limits...</p>
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <button id="vetting-reject-btn" class="btn btn-secondary" style="border-color: var(--color-warning); color: var(--color-warning);">Reject Proposal</button>
                        <button id="vetting-promote-btn" class="btn btn-primary" style="background: var(--color-success); border-color: var(--color-success);">
                            <span class="material-symbols-outlined">rocket_launch</span>
                            <span>Promote to Active Portfolio</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.renderSandboxCards(state.intakeRequests);
        this.bindEvents();
    }

    renderSandboxCards(requests) {
        const cols = {
            Draft: document.getElementById("col-draft"),
            "Under Review": document.getElementById("col-review"),
            Vetting: document.getElementById("col-vetting")
        };

        Object.values(cols).forEach(el => { if (el) el.innerHTML = ""; });

        requests.forEach(req => {
            if (req.status === "Rejected") return;
            const container = cols[req.status];
            if (container) {
                const capEx = req.capEx || req.cost || 0;
                const opEx = req.opEx || 0;
                const dateRange = (req.startDate && req.endDate)
                    ? `${req.startDate} → ${req.endDate}`
                    : (req.effort ? `${req.effort}m duration` : "No dates set");

                const card = document.createElement("div");
                card.className = "sandbox-card";
                card.dataset.id = req.id;
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                        <h5 style="margin:0; font-size:13px;">${req.title}</h5>
                        <span class="score-badge" style="white-space:nowrap;">WSJF: ${Number(req.WSJF).toFixed(1)}</span>
                    </div>
                    <p style="font-size:11px; color: var(--color-text-muted); margin: 6px 0;">${req.description.substring(0, 90)}${req.description.length > 90 ? '…' : ''}</p>
                    <div class="sandbox-card-footer" style="font-size:11px;">
                        <span>NZ$${(capEx + opEx).toLocaleString()}</span>
                        <span style="color: var(--color-text-muted);">${dateRange}</span>
                    </div>
                `;
                container.appendChild(card);
            }
        });
    }

    _openVettingModal(reqId) {
        const req = store.state.intakeRequests.find(r => r.id === reqId);
        if (!req) return;

        this._activeVettingId = reqId;

        const modal = document.getElementById("vetting-modal");
        const modalTitle = document.getElementById("vet-modal-title");
        const modalDesc = document.getElementById("vet-modal-desc");
        const modalDates = document.getElementById("vet-modal-dates");
        const modalCost = document.getElementById("vet-modal-cost");
        const fitInput = document.getElementById("score-fit");
        const roiInput = document.getElementById("score-roi");
        const complexInput = document.getElementById("score-complex");
        const wsjfVal = document.getElementById("score-wsjf-val");
        const feasibilityText = document.getElementById("ai-feasibility-text");

        if (modalTitle) modalTitle.textContent = `Score & Vet: "${req.title}"`;
        if (modalDesc) modalDesc.textContent = req.description;

        const capEx = req.capEx || req.cost || 0;
        const opEx = req.opEx || 0;
        if (modalDates) {
            modalDates.textContent = (req.startDate && req.endDate)
                ? `📅 ${req.startDate} → ${req.endDate}`
                : (req.effort ? `⏱ ${req.effort} months estimated` : "No dates set");
        }
        if (modalCost) {
            modalCost.textContent = `NZ$${capEx.toLocaleString()} CapEx + NZ$${opEx.toLocaleString()} OpEx/yr`;
        }

        if (fitInput) fitInput.value = req.scores.stratFit;
        if (roiInput) roiInput.value = req.scores.roi;
        if (complexInput) complexInput.value = req.scores.complexity;
        if (wsjfVal) wsjfVal.textContent = Number(req.WSJF).toFixed(2);

        if (feasibilityText) {
            const costTotal = store.state.scopes.reduce((acc, s) => acc + s.financials.capEx.plan, 0);
            const reqCost = capEx + opEx;
            if (costTotal + reqCost > store.state.scenario.budgetCap) {
                feasibilityText.innerHTML = `⚠️ <b>Budget Alert!</b> Adding this project exceeds portfolio budget limits by NZ$${(costTotal + reqCost - store.state.scenario.budgetCap).toLocaleString()}. Solver recommends optimising constraints.`;
                feasibilityText.style.color = "var(--color-warning)";
            } else {
                feasibilityText.innerHTML = `✅ <b>Resource Ready!</b> Team allocations and financials fall within bounds. Project is feasible for promotion.`;
                feasibilityText.style.color = "var(--color-success)";
            }
        }

        if (modal) modal.classList.remove("hidden");
    }

    _updateWsjf() {
        const fit = parseFloat(document.getElementById("score-fit")?.value) || 1;
        const roi = parseFloat(document.getElementById("score-roi")?.value) || 1;
        const comp = Math.max(parseFloat(document.getElementById("score-complex")?.value) || 1, 0.1);
        const wsjf = (fit + roi) / comp;
        const wsjfEl = document.getElementById("score-wsjf-val");
        if (wsjfEl) wsjfEl.textContent = wsjf.toFixed(2);
        // Scores are committed to store inside the promote/reject handlers — no direct mutation here
    }

    bindEvents() {
        // --- AI live alignment on description typing ---
        const descInput = document.getElementById("intake-desc");
        const alignmentCard = document.getElementById("intake-ai-alignment");
        const estimatesCard = document.getElementById("intake-ai-estimates");
        const pillsContainer = document.getElementById("ai-suggested-pills");
        const estBudget = document.getElementById("est-budget");
        const estDuration = document.getElementById("est-duration");
        const estValue = document.getElementById("est-value");
        const estFte = document.getElementById("est-fte");

        if (descInput) {
            descInput.addEventListener("input", async (e) => {
                const val = e.target.value;
                if (val.length < 12) {
                    alignmentCard?.classList.add("hidden");
                    estimatesCard?.classList.add("hidden");
                    return;
                }

                const analysis = await aiEngine.sendMessage(val);
                if (analysis.proposal && analysis.proposal.actionType === "create_project") {
                    const payload = analysis.proposal.payload;

                    if (alignmentCard && pillsContainer) {
                        alignmentCard.classList.remove("hidden");
                        const okrMatch = store.state.strategy.flatMap(s => s.objectives).find(o =>
                            o.id === (payload.alignedBenefitId === 'ben-transport-transition' ? 'okr-emissions' : 'okr-margin'));
                        const benefitMatch = store.state.benefits.find(b => b.id === payload.alignedBenefitId);
                        pillsContainer.innerHTML = `
                            <span class="suggested-pill"><span class="material-symbols-outlined" style="font-size:10px;">track_changes</span>${okrMatch ? okrMatch.metric : 'Emissions'}</span>
                            <span class="suggested-pill benefit"><span class="material-symbols-outlined" style="font-size:10px;">done_all</span>${benefitMatch ? benefitMatch.name.substring(0, 30) : 'Outcome'}…</span>
                            <span class="suggested-pill disbenefit"><span class="material-symbols-outlined" style="font-size:10px;">warning</span>Dispatch friction disbenefit risk detected</span>
                        `;
                    }

                    if (estimatesCard) {
                        estimatesCard.classList.remove("hidden");
                        const totalEst = payload.capEx + payload.opEx;
                        if (estBudget) estBudget.textContent = `NZ$${totalEst.toLocaleString()}`;
                        if (estDuration) estDuration.textContent = `${payload.capEx > 500000 ? 12 : 6} months`;
                        if (estValue) estValue.textContent = `${payload.capEx > 500000 ? 95 : 85} pts`;
                        if (estFte) estFte.textContent = `${payload.fte} FTEs`;

                        const applyBtn = document.getElementById("apply-ai-estimates-btn");
                        if (applyBtn) {
                            applyBtn.onclick = () => {
                                const capexEl = document.getElementById("intake-capex");
                                const opexEl = document.getElementById("intake-opex");
                                const effortEl = document.getElementById("intake-effort");
                                if (capexEl) capexEl.value = payload.capEx;
                                if (opexEl) opexEl.value = payload.opEx;
                                if (effortEl) effortEl.value = payload.capEx > 500000 ? 12 : 6;
                                store.logPulseEvent("AI Assist", "Applied smart intake cost and schedule estimates.", "system");
                                estimatesCard.classList.add("hidden");
                            };
                        }
                    }
                }
            });
        }

        // --- Submit new intake request ---
        const submitBtn = document.getElementById("intake-submit-btn");
        if (submitBtn) {
            submitBtn.addEventListener("click", () => {
                const title = document.getElementById("intake-title")?.value.trim();
                const sponsor = document.getElementById("intake-sponsor")?.value.trim();
                const desc = document.getElementById("intake-desc")?.value.trim();
                const startDate = document.getElementById("intake-start-date")?.value;
                const endDate = document.getElementById("intake-end-date")?.value;
                const capEx = parseInt(document.getElementById("intake-capex")?.value) || 0;
                const opEx = parseInt(document.getElementById("intake-opex")?.value) || 0;
                const effort = parseInt(document.getElementById("intake-effort")?.value) || 6;

                if (!title || !desc) {
                    alert("Please fill out Title and Description fields.");
                    return;
                }

                const newReq = {
                    id: "intake-" + Date.now(),
                    title,
                    sponsor: sponsor || "Unknown",
                    description: desc,
                    startDate: startDate || "",
                    endDate: endDate || "",
                    capEx,
                    opEx,
                    cost: capEx, // backward compat alias
                    effort,
                    status: "Vetting",
                    priorityScore: 50,
                    WSJF: 2.00,
                    scores: { stratFit: 5, roi: 5, complexity: 5 }
                };

                store.commitTransaction(`Submit request: "${title}" to Intake Sandbox`, "User Form Intake", (state) => {
                    state.intakeRequests.push(newReq);
                });

                document.getElementById("intake-title").value = "";
                document.getElementById("intake-sponsor").value = "";
                document.getElementById("intake-desc").value = "";
                document.getElementById("intake-start-date").value = "";
                document.getElementById("intake-end-date").value = "";
                document.getElementById("intake-capex").value = "250000";
                document.getElementById("intake-opex").value = "30000";
                document.getElementById("intake-effort").value = "6";
                alignmentCard?.classList.add("hidden");
                estimatesCard?.classList.add("hidden");

                this.renderSandboxCards(store.state.intakeRequests);
            });
        }

        // --- Event delegation for sandbox card clicks ---
        const sandboxGrid = document.getElementById("sandbox-columns-grid");
        if (sandboxGrid) {
            sandboxGrid.addEventListener("click", (e) => {
                const card = e.target.closest(".sandbox-card");
                if (!card) return;
                this._openVettingModal(card.dataset.id);
            });
        }

        // --- Vetting modal score inputs → live WSJF recalc ---
        ["score-fit", "score-roi", "score-complex"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener("input", () => this._updateWsjf());
        });

        // --- Close vetting modal ---
        const modal = document.getElementById("vetting-modal");
        document.getElementById("vetting-modal-close")?.addEventListener("click", () => {
            modal?.classList.add("hidden");
            this._activeVettingId = null;
        });
        modal?.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.add("hidden");
                this._activeVettingId = null;
            }
        });

        // --- Reject button ---
        document.getElementById("vetting-reject-btn")?.addEventListener("click", () => {
            if (this._activeVettingId) {
                const req = store.state.intakeRequests.find(r => r.id === this._activeVettingId);
                if (req) {
                    store.commitTransaction(`Reject Intake request: "${req.title}"`, "Vetting Board", (state) => {
                        const idx = state.intakeRequests.findIndex(r => r.id === this._activeVettingId);
                        if (idx !== -1) state.intakeRequests.splice(idx, 1);
                    });
                }
            }
            modal?.classList.add("hidden");
            this._activeVettingId = null;
            this.renderSandboxCards(store.state.intakeRequests);
        });

        // --- Promote to active portfolio ---
        document.getElementById("vetting-promote-btn")?.addEventListener("click", () => {
            if (!this._activeVettingId) return;
            const req = store.state.intakeRequests.find(r => r.id === this._activeVettingId);
            if (!req) return;

            // Read final scores from DOM inputs so they're captured in the transaction
            const finalFit = parseFloat(document.getElementById("score-fit")?.value) || req.scores.stratFit;
            const finalRoi = parseFloat(document.getElementById("score-roi")?.value) || req.scores.roi;
            const finalComp = Math.max(parseFloat(document.getElementById("score-complex")?.value) || req.scores.complexity, 0.1);
            const finalWsjf = parseFloat(((finalFit + finalRoi) / finalComp).toFixed(2));

            store.commitTransaction(`Promote "${req.title}" to active portfolio`, "Vetting Board", (state) => {
                // 1. Remove from intake
                state.intakeRequests = state.intakeRequests.filter(r => r.id !== this._activeVettingId);

                // 2. Create new Scope node
                const newScopeId = "scope-" + Date.now();
                const capEx = req.capEx || req.cost || 0;
                const opEx = req.opEx || Math.round(capEx * 0.15);

                const newScope = {
                    id: newScopeId,
                    name: req.title,
                    description: req.description,
                    startDate: req.startDate || "",
                    endDate: req.endDate || "",
                    methodology: finalFit > 8 ? "Agile" : "Waterfall",
                    status: "In Flight",
                    expectedValue: Math.round(finalFit * 10),
                    executionRisk: Math.round(finalComp * 8),
                    financials: {
                        capEx: { plan: capEx, actual: 0, etc: capEx },
                        opEx: { plan: opEx, actual: 0, etc: opEx }
                    },
                    progress: 0,
                    fteAllocations: finalComp > 6 ? 6 : 3
                };
                state.scopes.push(newScope);

                // 3. Default tasks
                const ts = Date.now();
                state.tasks.push(
                    { id: `task-${ts}-1`, scopeId: newScopeId, title: "Initialise technical architecture and designs", assignee: "Sarah Connor", status: "in_progress", weight: 3 },
                    { id: `task-${ts}-2`, scopeId: newScopeId, title: "Develop baseline release models and core APIs", assignee: "Bryan Lee", status: "todo", weight: 4 },
                    { id: `task-${ts}-3`, scopeId: newScopeId, title: "Execute user verification and UAT testing", assignee: "John Doe", status: "todo", weight: 2 }
                );

                // 4. Align to matching benefit
                const isTransport = req.description.toLowerCase().match(/freight|fleet|packag|logistics/);
                const alignedBen = state.benefits.find(b => b.id === (isTransport ? 'ben-transport-transition' : 'ben-ops-savings'));
                if (alignedBen && !alignedBen.scopeDependencies.includes(newScopeId)) {
                    alignedBen.scopeDependencies.push(newScopeId);
                }

                // 5. Include in optimizer
                if (!state.scenario.includedProjectIds.includes(newScopeId)) {
                    state.scenario.includedProjectIds.push(newScopeId);
                }
            });

            modal?.classList.add("hidden");
            this._activeVettingId = null;
            this.render(store.state);
        });
    }
}

export default IntakeView;
