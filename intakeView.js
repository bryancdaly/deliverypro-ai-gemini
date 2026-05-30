/* ==========================================================================
   DELIVERYPRO.AI - DEMAND & INTAKE FUNNEL COMPONENT
   ========================================================================== */

import { store } from './store.js';
import { aiEngine } from './aiEngine.js';

class IntakeView {
    constructor() {
        this.containerId = "view-content";
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="intake-workspace">
                <!-- Left Pane: Intake Form -->
                <div class="glass-panel form-card">
                    <h3>Intake Capture & AI Alignment</h3>
                    
                    <div class="form-group">
                        <label for="intake-title">Project Request Title</label>
                        <input type="text" id="intake-title" placeholder="e.g. Bio-Degradable Straws Packaging">
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
                        <div class="suggested-pills-row" id="ai-suggested-pills">
                            <!-- Suggestion pills injected here -->
                        </div>
                    </div>

                    <!-- AI Smart Estimate Card -->
                    <div class="ai-estimates-card hidden" id="intake-ai-estimates">
                        <h4>
                            <span class="material-symbols-outlined" style="font-size:16px;">query_stats</span>
                            AI Capacity & Cost Estimates
                        </h4>
                        <div class="est-details-grid">
                            <div class="est-cell">
                                <small>Suggested Budget</small>
                                <p id="est-budget">$0 USD</p>
                            </div>
                            <div class="est-cell">
                                <small>Timeline Duration</small>
                                <p id="est-duration">0 months</p>
                            </div>
                            <div class="est-cell">
                                <small>Strategic Value</small>
                                <p id="est-value">0 pts</p>
                            </div>
                            <div class="est-cell">
                                <small>FTE Requirements</small>
                                <p id="est-fte">0 FTEs</p>
                            </div>
                        </div>
                        <div class="est-action-row">
                            <button id="apply-ai-estimates-btn" class="btn btn-secondary">Apply Suggested Estimates</button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Cost Budget Slider (CapEx)</label>
                        <div class="priority-slider-header">
                            <span>$0</span>
                            <span id="cost-slider-val" style="color: var(--accent-indigo)">$250,000 USD</span>
                            <span>$1.0M</span>
                        </div>
                        <input type="range" id="intake-cost" min="10000" max="1000000" step="10000" value="250000" style="accent-color: var(--accent-indigo);">
                    </div>

                    <div class="form-group">
                        <label>Estimated Effort (Timeline)</label>
                        <div class="priority-slider-header">
                            <span>2 months</span>
                            <span id="effort-slider-val" style="color: var(--accent-indigo)">6 months</span>
                            <span>24 months</span>
                        </div>
                        <input type="range" id="intake-effort" min="2" max="24" step="1" value="6" style="accent-color: var(--accent-indigo);">
                    </div>

                    <button id="intake-submit-btn" class="btn btn-primary">
                        <span class="material-symbols-outlined">add</span>
                        <span>Submit Project to Sandbox</span>
                    </button>
                </div>

                <!-- Right Pane: Vetting Sandbox Board -->
                <div class="glass-panel" style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>Prioritization Vetting Sandbox</h3>
                        <span class="tier-badge" style="background: hsla(200,85%,55%,0.1); color: var(--color-info);">Idea Board</span>
                    </div>

                    <div class="sandbox-columns-grid">
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

            <!-- Prioritization Scoring Drawer / Modal Overlay -->
            <div id="vetting-modal" class="modal-overlay hidden">
                <div class="modal-card" style="width: 580px;">
                    <div class="modal-header">
                        <h2 id="vet-modal-title">Evaluate Request</h2>
                        <button id="vetting-modal-close" class="icon-btn">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="modal-body prioritization-card">
                        <p id="vet-modal-desc" style="font-size: 13px; color: var(--color-text-secondary); line-height: 1.45;"></p>
                        
                        <div class="prioritization-grid">
                            <div class="priority-slider-box">
                                <div class="priority-slider-header">
                                    <label>Strategic Fit</label>
                                    <span id="score-fit-val">5.0</span>
                                </div>
                                <input type="range" id="score-fit" min="1" max="10" step="0.5" value="5.0">
                            </div>
                            <div class="priority-slider-box">
                                <div class="priority-slider-header">
                                    <label>Financial ROI</label>
                                    <span id="score-roi-val">5.0</span>
                                </div>
                                <input type="range" id="score-roi" min="1" max="10" step="0.5" value="5.0">
                            </div>
                            <div class="priority-slider-box">
                                <div class="priority-slider-header">
                                    <label>Complexity Drag</label>
                                    <span id="score-complex-val">5.0</span>
                                </div>
                                <input type="range" id="score-complex" min="1" max="10" step="0.5" value="5.0">
                            </div>
                            <div class="priority-slider-box">
                                <div class="priority-slider-header">
                                    <label>WSJF Priority Score</label>
                                    <span id="score-wsjf-val" style="color: var(--color-success)">2.00</span>
                                </div>
                                <p class="help-text">(Strategic Fit + ROI) / Complexity</p>
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

        // Clear containers
        Object.values(cols).forEach(el => { if (el) el.innerHTML = ""; });

        requests.forEach(req => {
            const container = cols[req.status];
            if (container) {
                const card = document.createElement("div");
                card.className = "sandbox-card";
                card.dataset.id = req.id;
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h5>${req.title}</h5>
                        <span class="score-badge">WSJF: ${req.WSJF}</span>
                    </div>
                    <p>${req.description.substring(0, 100)}...</p>
                    <div class="sandbox-card-footer">
                        <span>$${req.cost.toLocaleString()}</span>
                        <span>${req.effort}m effort</span>
                    </div>
                `;
                container.appendChild(card);
            }
        });
    }

    bindEvents() {
        // Cost and Effort Sliders updating labels
        const costSlider = document.getElementById("intake-cost");
        const costLbl = document.getElementById("cost-slider-val");
        if (costSlider) {
            costSlider.addEventListener("input", (e) => {
                if (costLbl) costLbl.textContent = `$${parseInt(e.target.value).toLocaleString()} USD`;
            });
        }

        const effortSlider = document.getElementById("intake-effort");
        const effortLbl = document.getElementById("effort-slider-val");
        if (effortSlider) {
            effortSlider.addEventListener("input", (e) => {
                if (effortLbl) effortLbl.textContent = `${e.target.value} months`;
            });
        }

        // Description Input AI Live Alignment Listener
        const descInput = document.getElementById("intake-desc");
        const alignmentCard = document.getElementById("intake-ai-alignment");
        const estimatesCard = document.getElementById("intake-ai-estimates");
        const pillsContainer = document.getElementById("ai-suggested-pills");

        // UI Smart estimates fields
        const estBudget = document.getElementById("est-budget");
        const estDuration = document.getElementById("est-duration");
        const estValue = document.getElementById("est-value");
        const estFte = document.getElementById("est-fte");

        if (descInput) {
            descInput.addEventListener("input", async (e) => {
                const val = e.target.value;
                if (val.length < 12) {
                    if (alignmentCard) alignmentCard.classList.add("hidden");
                    if (estimatesCard) estimatesCard.classList.add("hidden");
                    return;
                }

                // Analyze using simulated NLP engine in real-time
                const analysis = await aiEngine.sendMessage(val);
                
                // If AI detects a create/add proposal
                if (analysis.proposal && analysis.proposal.actionType === "create_project") {
                    const payload = analysis.proposal.payload;
                    
                    // Render Suggested Alignment pills
                    if (alignmentCard && pillsContainer) {
                        alignmentCard.classList.remove("hidden");
                        
                        const okrMatch = store.state.strategy.objectives.find(o => o.id === (payload.alignedBenefitId === 'ben-transport-transition' ? 'okr-emissions' : 'okr-margin'));
                        const benefitMatch = store.state.benefits.find(b => b.id === payload.alignedBenefitId);
                        
                        pillsContainer.innerHTML = `
                            <span class="suggested-pill"><span class="material-symbols-outlined" style="font-size:10px;">track_changes</span>${okrMatch ? okrMatch.metric : 'Emissions'}</span>
                            <span class="suggested-pill benefit"><span class="material-symbols-outlined" style="font-size:10px;">done_all</span>${benefitMatch ? benefitMatch.name.substring(0, 30) : 'Outcome'}...</span>
                            <span class="suggested-pill disbenefit"><span class="material-symbols-outlined" style="font-size:10px;">warning</span>Dispatch friction disbenefit risk detected</span>
                        `;
                    }

                    // Render Suggested Smart Estimates
                    if (estimatesCard) {
                        estimatesCard.classList.remove("hidden");
                        if (estBudget) estBudget.textContent = `$${(payload.capEx + payload.opEx).toLocaleString()} USD`;
                        if (estDuration) estDuration.textContent = `${payload.capEx > 500000 ? 12 : 6} months`;
                        if (estValue) estValue.textContent = `${payload.capEx > 500000 ? 95 : 85} pts`;
                        if (estFte) estFte.textContent = `${payload.fte} FTEs`;

                        // Apply suggestions action
                        const applyBtn = document.getElementById("apply-ai-estimates-btn");
                        if (applyBtn) {
                            applyBtn.onclick = () => {
                                if (costSlider) {
                                    costSlider.value = payload.capEx;
                                    costSlider.dispatchEvent(new Event('input'));
                                }
                                if (effortSlider) {
                                    effortSlider.value = payload.capEx > 500000 ? 12 : 6;
                                    effortSlider.dispatchEvent(new Event('input'));
                                }
                                store.logPulseEvent("AI Assist", "Applied smart intake cost and schedule estimates.", "system");
                                estimatesCard.classList.add("hidden");
                            };
                        }
                    }
                }
            });
        }

        // Submission to sandbox pipeline
        const submitBtn = document.getElementById("intake-submit-btn");
        if (submitBtn) {
            submitBtn.addEventListener("click", () => {
                const title = document.getElementById("intake-title").value.trim();
                const sponsor = document.getElementById("intake-sponsor").value.trim();
                const desc = document.getElementById("intake-desc").value.trim();
                const cost = parseInt(costSlider.value);
                const effort = parseInt(effortSlider.value);

                if (!title || !desc) {
                    alert("Please fill out Title and Description fields.");
                    return;
                }

                // Append request inside intake store sandbox
                const newReq = {
                    id: "intake-" + Date.now(),
                    title: title,
                    sponsor: sponsor || "Unknown",
                    description: desc,
                    cost: cost,
                    effort: effort,
                    status: "Vetting",
                    priorityScore: 50,
                    WSJF: 2.00,
                    scores: { stratFit: 5, roi: 5, complexity: 5 }
                };

                store.commitTransaction(`Submit request: "${title}" to Intake Sandbox`, "User Form Intake", (state) => {
                    state.intakeRequests.push(newReq);
                });

                // Clear input fields
                document.getElementById("intake-title").value = "";
                document.getElementById("intake-sponsor").value = "";
                document.getElementById("intake-desc").value = "";
                if (alignmentCard) alignmentCard.classList.add("hidden");
                if (estimatesCard) estimatesCard.classList.add("hidden");

                // Redraw cards
                this.renderSandboxCards(store.state.intakeRequests);
            });
        }

        // Sandbox prioritization card details modal overlay
        const sandboxCards = document.querySelectorAll(".sandbox-card");
        const modal = document.getElementById("vetting-modal");
        const modalClose = document.getElementById("vetting-modal-close");
        const modalTitle = document.getElementById("vet-modal-title");
        const modalDesc = document.getElementById("vet-modal-desc");

        // Modal scoring elements
        const slideFit = document.getElementById("score-fit");
        const fitVal = document.getElementById("score-fit-val");
        const slideRoi = document.getElementById("score-roi");
        const roiVal = document.getElementById("score-roi-val");
        const slideComplex = document.getElementById("score-complex");
        const complexVal = document.getElementById("score-complex-val");
        const wsjfVal = document.getElementById("score-wsjf-val");
        const feasibilityText = document.getElementById("ai-feasibility-text");

        let activeVettingId = null;

        sandboxCards.forEach(card => {
            card.addEventListener("click", () => {
                const reqId = card.dataset.id;
                const req = store.state.intakeRequests.find(r => r.id === reqId);
                if (!req) return;

                activeVettingId = reqId;
                if (modalTitle) modalTitle.textContent = `Vetting Vitals: "${req.title}"`;
                if (modalDesc) modalDesc.textContent = req.description;

                // Load existing scores
                if (slideFit && fitVal) {
                    slideFit.value = req.scores.stratFit;
                    fitVal.textContent = req.scores.stratFit.toFixed(1);
                }
                if (slideRoi && roiVal) {
                    slideRoi.value = req.scores.roi;
                    roiVal.textContent = req.scores.roi.toFixed(1);
                }
                if (slideComplex && complexVal) {
                    slideComplex.value = req.scores.complexity;
                    complexVal.textContent = req.scores.complexity.toFixed(1);
                }
                if (wsjfVal) {
                    wsjfVal.textContent = req.WSJF.toFixed(2);
                }

                // AI Feasibility simulation checks
                if (feasibilityText) {
                    const capacityUsed = store.state.resources.reduce((acc, curr) => acc + curr.allocated, 0);
                    const costTotal = store.state.scopes.reduce((acc, curr) => acc + curr.financials.capEx.plan, 0);
                    
                    if (costTotal + req.cost > store.state.scenario.budgetCap) {
                        feasibilityText.innerHTML = `⚠️ <b>Budget Alert!</b> Adding this project exceeds portfolio budget limits by $${(costTotal + req.cost - store.state.scenario.budgetCap).toLocaleString()} USD. Solver recommends delaying execution sequence or optimizing constraints.`;
                        feasibilityText.style.color = "var(--color-warning)";
                    } else if (capacityUsed > 100) {
                        feasibilityText.innerHTML = `⚠️ <b>FTE Resource Constraint!</b> High team capacity loads detected. Recommends shifting Sarah Connor tasks before promotion.`;
                        feasibilityText.style.color = "var(--color-warning)";
                    } else {
                        feasibilityText.innerHTML = `✅ <b>Resource Ready!</b> Team allocations and financials fall strictly within bounds. Project is highly feasible for Q3 promotion.`;
                        feasibilityText.style.color = "var(--color-success)";
                    }
                }

                if (modal) modal.classList.remove("hidden");
            });
        });

        // Vetting Modal slider event listeners
        const updateWsjfResult = () => {
            const fit = parseFloat(slideFit.value);
            const roi = parseFloat(slideRoi.value);
            const comp = parseFloat(slideComplex.value);
            const wsjf = (fit + roi) / comp;
            if (wsjfVal) wsjfVal.textContent = wsjf.toFixed(2);

            // Temporarily update on active request node
            if (activeVettingId) {
                const req = store.state.intakeRequests.find(r => r.id === activeVettingId);
                if (req) {
                    req.scores.stratFit = fit;
                    req.scores.roi = roi;
                    req.scores.complexity = comp;
                    req.WSJF = parseFloat(wsjf.toFixed(2));
                }
            }
        };

        if (slideFit) {
            slideFit.addEventListener("input", (e) => {
                if (fitVal) fitVal.textContent = parseFloat(e.target.value).toFixed(1);
                updateWsjfResult();
            });
        }
        if (slideRoi) {
            slideRoi.addEventListener("input", (e) => {
                if (roiVal) roiVal.textContent = parseFloat(e.target.value).toFixed(1);
                updateWsjfResult();
            });
        }
        if (slideComplex) {
            slideComplex.addEventListener("input", (e) => {
                if (complexVal) complexVal.textContent = parseFloat(e.target.value).toFixed(1);
                updateWsjfResult();
            });
        }

        // Close Vetting Modal
        if (modalClose) {
            modalClose.addEventListener("click", () => {
                if (modal) modal.classList.add("hidden");
                this.renderSandboxCards(store.state.intakeRequests);
            });
        }

        // Vetting Voids Reject Button
        const rejectBtn = document.getElementById("vetting-reject-btn");
        if (rejectBtn) {
            rejectBtn.addEventListener("click", () => {
                if (activeVettingId) {
                    const req = store.state.intakeRequests.find(r => r.id === activeVettingId);
                    if (req) {
                        store.commitTransaction(`Reject Intake request: "${req.title}"`, "Vetting Voids Board", (state) => {
                            const index = state.intakeRequests.findIndex(r => r.id === activeVettingId);
                            if (index !== -1) {
                                state.intakeRequests[index].status = "Rejected"; // Or remove completely
                            }
                        });
                    }
                }
                if (modal) modal.classList.add("hidden");
                this.renderSandboxCards(store.state.intakeRequests);
            });
        }

        // ONE-CLICK EXECUTION PROMOTION
        const promoteBtn = document.getElementById("vetting-promote-btn");
        if (promoteBtn) {
            promoteBtn.addEventListener("click", () => {
                if (activeVettingId) {
                    const req = store.state.intakeRequests.find(r => r.id === activeVettingId);
                    if (req) {
                        store.commitTransaction(`Promote Intake request "${req.title}" to active portfolio`, "Vetting Board Executive", (state) => {
                            // 1. Remove from intake list
                            state.intakeRequests = state.intakeRequests.filter(r => r.id !== activeVettingId);
                            
                            // 2. Create new active Scope node
                            const newScopeId = "scope-" + Date.now();
                            const newScope = {
                                id: newScopeId,
                                name: req.title,
                                description: req.description,
                                methodology: req.scores.stratFit > 8 ? "Agile" : "Waterfall",
                                status: "In Flight",
                                expectedValue: Math.round(req.scores.stratFit * 10),
                                executionRisk: Math.round(req.scores.complexity * 8),
                                financials: {
                                    capEx: { plan: req.cost, actual: 0, etc: req.cost },
                                    opEx: { plan: Math.round(req.cost * 0.15), actual: 0, etc: Math.round(req.cost * 0.15) }
                                },
                                progress: 0,
                                fteAllocations: req.scores.complexity > 6 ? 6 : 3
                            };
                            state.scopes.push(newScope);

                            // 3. Inject standard default tasks
                            state.tasks.push(
                                { id: "task-" + Date.now() + "-1", scopeId: newScopeId, title: "Initialize technical architecture and designs", assignee: "Sarah Connor", status: "in_progress", weight: 3 },
                                { id: "task-" + Date.now() + "-2", scopeId: newScopeId, title: "Develop baseline release models and core APIs", assignee: "Bryan Lee", status: "todo", weight: 4 },
                                { id: "task-" + Date.now() + "-3", scopeId: newScopeId, title: "Execute user verification diagnostics tests", assignee: "John Doe", status: "todo", weight: 2 }
                            );

                            // 4. Align to Strategic Benefit dependencies
                            // If strategy alignment contains transport, map to transport benefit
                            const isTransport = req.description.toLowerCase().includes("freight") || req.description.toLowerCase().includes("fleet") || req.description.toLowerCase().includes("packag");
                            const alignedBen = state.benefits.find(b => b.id === (isTransport ? 'ben-transport-transition' : 'ben-ops-savings'));
                            if (alignedBen) {
                                alignedBen.scopeDependencies.push(newScopeId);
                            }

                            // 5. Add to active included Optimizer list
                            state.scenario.includedProjectIds.push(newScopeId);
                        });
                    }
                }
                if (modal) modal.classList.add("hidden");
                this.render(store.state); // Complete rerender
            });
        }
    }
}

export default IntakeView;
