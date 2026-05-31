/* ==========================================================================
   DELIVERYPRO.AI - PORTFOLIO OPTIMIZER COMPONENT
   ========================================================================== */

import { store, isScopeInHierarchy } from './store.js';

class OptimizationView {
    constructor() {
        this.containerId = "view-content";
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const scopeInHierarchy = (scopeId) => isScopeInHierarchy(scopeId, state);

        // Calculate active budget commitments
        let totalActiveCost = 0;
        let totalActiveFte = 0;

        state.scopes.forEach(scope => {
            if (scope.isArchived) return;
            if (!scopeInHierarchy(scope.id)) return;
            const isIncluded = state.scenario.includedProjectIds.includes(scope.id);
            if (isIncluded && scope.status !== "Proposed") {
                totalActiveCost += scope.financials.capEx.plan + scope.financials.opEx.plan;
                totalActiveFte += scope.fteAllocations;
            }
        });

        const budgetOverload = totalActiveCost > state.scenario.budgetCap;
        const fteOverload = totalActiveFte > state.scenario.fteCap;

        // Define slider bounds dynamically based on active hierarchy level
        const bounds = {
            enterprise: {
                budgetMin: 500000, budgetMax: 2500000, budgetLabelMin: "$500k", budgetLabelMax: "$2.5M", budgetStep: 50000,
                fteMin: 5, fteMax: 25, fteLabelMin: "5 FTEs", fteLabelMax: "25 FTEs"
            },
            portfolio: {
                budgetMin: 250000, budgetMax: 1500000, budgetLabelMin: "$250k", budgetLabelMax: "$1.5M", budgetStep: 50000,
                fteMin: 3, fteMax: 18, fteLabelMin: "3 FTEs", fteLabelMax: "18 FTEs"
            },
            program: {
                budgetMin: 100000, budgetMax: 750000, budgetLabelMin: "$100k", budgetLabelMax: "$750k", budgetStep: 25000,
                fteMin: 2, fteMax: 12, fteLabelMin: "2 FTEs", fteLabelMax: "12 FTEs"
            },
            project: {
                budgetMin: 50000, budgetMax: 400000, budgetLabelMin: "$50k", budgetLabelMax: "$400k", budgetStep: 10000,
                fteMin: 1, fteMax: 6, fteLabelMin: "1 FTE", fteLabelMax: "6 FTEs"
            }
        };

        const currentBounds = bounds[level] || bounds.enterprise;

        container.innerHTML = `
            <div class="optimizer-workspace">
                <!-- Left Pane: Parameters & Checklist Matrix -->
                <div class="optim-settings-column">
                    <!-- Scenario indicators panel -->
                    <div class="glass-panel form-card">
                        <h3>"What-If" Portfolio Parameters</h3>
                        
                        <div class="form-group">
                            <label>Scenario Budget Limit Cap</label>
                            <div class="priority-slider-header">
                                <span>${currentBounds.budgetLabelMin}</span>
                                <span id="opt-budget-cap-val" style="color: var(--accent-indigo)">NZ$${state.scenario.budgetCap.toLocaleString()}</span>
                                <span>${currentBounds.budgetLabelMax}</span>
                            </div>
                            <input type="range" id="opt-budget-cap" min="${currentBounds.budgetMin}" max="${currentBounds.budgetMax}" step="${currentBounds.budgetStep}" value="${state.scenario.budgetCap}" style="accent-color: var(--accent-indigo);">
                        </div>

                        <div class="form-group">
                            <label>Scenario FTE Team Cap</label>
                            <div class="priority-slider-header">
                                <span>${currentBounds.fteLabelMin}</span>
                                <span id="opt-fte-cap-val" style="color: var(--accent-indigo)">${state.scenario.fteCap} FTEs</span>
                                <span>${currentBounds.fteLabelMax}</span>
                            </div>
                            <input type="range" id="opt-fte-cap" min="${currentBounds.fteMin}" max="${currentBounds.fteMax}" step="1" value="${state.scenario.fteCap}" style="accent-color: var(--accent-indigo);">
                        </div>

                        <div class="cons-indicators">
                            <div class="cons-card">
                                <span class="cons-card-lbl">Portfolio Budget Cost</span>
                                <div class="cons-card-val">NZ$${totalActiveCost.toLocaleString()}</div>
                                <div class="cons-card-bar ${budgetOverload ? 'overload' : ''}">
                                    <div class="cons-card-bar-fill" style="width: ${Math.min((totalActiveCost / state.scenario.budgetCap) * 100, 100)}%"></div>
                                </div>
                            </div>
                            <div class="cons-card">
                                <span class="cons-card-lbl">Resource Allocation Load</span>
                                <div class="cons-card-val">${totalActiveFte} / ${state.scenario.fteCap} FTEs</div>
                                <div class="cons-card-bar ${fteOverload ? 'overload' : ''}">
                                    <div class="cons-card-bar-fill" style="width: ${Math.min((totalActiveFte / state.scenario.fteCap) * 100, 100)}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Checklist Project Matrix -->
                    <div class="glass-panel" style="display: flex; flex-direction: column; gap: 16px;">
                        <h3>Active Investment Mix Scopes</h3>
                        <div class="strategy-list" style="max-height: 380px;">
                            ${state.scopes.map(scope => {
                                if (scope.isArchived || !isScopeInHierarchy(scope.id)) return '';
                                const isIncluded = state.scenario.includedProjectIds.includes(scope.id);
                                const cost = scope.financials.capEx.plan + scope.financials.opEx.plan;
                                return `
                                    <div class="ledger-item" style="border-color: ${isIncluded ? 'var(--accent-indigo-glow)' : 'var(--glass-border)'}; background: ${isIncluded ? 'hsla(250,95%,68%,0.02)' : 'transparent'};">
                                        <div style="display: flex; align-items: center; gap: 12px; width: 65%;">
                                            <input type="checkbox" class="project-mix-check" data-id="${scope.id}" ${isIncluded ? 'checked' : ''} style="accent-color: var(--accent-indigo); cursor: pointer; height: 16px; width: 16px;">
                                            <div class="cost-lbl">
                                                <b>${scope.name}</b>
                                                <small>ROI: ${(scope.expectedValue / 10).toFixed(1)} | Risk: ${scope.executionRisk}% | ${scope.fteAllocations} FTEs</small>
                                            </div>
                                        </div>
                                        
                                        <!-- Delay Timeline offset sliders -->
                                        <div style="display: flex; flex-direction: column; gap: 2px; align-items: flex-end;">
                                            <span class="cost-val">NZ$${cost.toLocaleString()}</span>
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <small style="font-size: 8px; color: var(--color-text-muted);">Delay Offset:</small>
                                                <input type="range" class="project-delay-slider" data-id="${scope.id}" min="0" max="12" value="${state.scenario.scheduleOffsets[scope.id] || 0}" style="width: 60px; accent-color: var(--accent-indigo); height: 4px;">
                                                <span style="font-size: 9px; font-weight:700; color:var(--accent-indigo); min-width: 18px; text-align:right;">${state.scenario.scheduleOffsets[scope.id] || 0}m</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Right Pane: Frontier Plot Overlay & AI Solver -->
                <div class="optim-chart-column">
                    <div class="frontier-plot-container glass-panel">
                        <h3>Efficient Frontier Optimization Analytics</h3>
                        
                        <div class="frontier-svg-wrap">
                            <svg class="frontier-scatterplot" id="frontier-svg">
                                <!-- Grid boundaries -->
                                <line x1="40" y1="280" x2="480" y2="280" stroke="var(--glass-border)" stroke-width="1" />
                                <line x1="40" y1="20" x2="40" y2="280" stroke="var(--glass-border)" stroke-width="1" />
                                
                                <text x="260" y="310" fill="var(--color-text-secondary)" font-size="10" text-anchor="middle" font-family="Outfit">EXECUTION RISK % (CONSTRAINTS)</text>
                                <text x="12" y="150" fill="var(--color-text-secondary)" font-size="10" text-anchor="middle" transform="rotate(-90 12 150)" font-family="Outfit">EXPECTED PORTFOLIO VALUE</text>
                                
                                <!-- Dynamic frontier overlays and coordinate dots -->
                            </svg>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px; font-size: 11px; color: var(--color-text-secondary);">
                            <span style="display: inline-flex; align-items: center; gap: 6px;"><span style="height:8px; width:8px; border-radius:50%; background:var(--color-success);"></span>Included</span>
                            <span style="display: inline-flex; align-items: center; gap: 6px;"><span style="height:8px; width:8px; border-radius:50%; background:var(--color-text-muted);"></span>Excluded</span>
                            <span style="display: inline-flex; align-items: center; gap: 6px;"><span style="height:8px; width:8px; border-radius:50%; background:var(--accent-indigo);"></span>Optimum Range</span>
                        </div>
                    </div>

                    <!-- Strategic ROI summary -->
                    <div class="glass-panel" style="display: flex; flex-direction: column; gap: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3>AI Frontier Allocation Solver</h3>
                            <button id="run-ai-optimizer-btn" class="btn btn-primary">
                                <span class="material-symbols-outlined">network_intelligence</span>
                                <span>AI Run Frontier Optimization</span>
                            </button>
                        </div>
                        <p class="help-text">Click the optimizer to let the AI balance constraints and select the highest strategic value project matrix automatically.</p>
                    </div>
                </div>
            </div>
        `;

        this.drawFrontierCurve(state);
        this.bindEvents();
    }

    drawFrontierCurve(state) {
        const svg = document.getElementById("frontier-svg");
        if (!svg) return;

        // Clear existing points and paths (preserving grids)
        const itemsToClear = svg.querySelectorAll(".frontier-point, .curve-path, .optimal-fill");
        itemsToClear.forEach(el => el.remove());

        const w = 480;
        const h = 280;
        const padding = 40;

        // Coordinates mapping calculations
        // Map Risk (X-axis: 0 - 100) and Value (Y-axis: 0 - 100)
        const getX = (val) => padding + ((val / 100) * (w - padding * 2));
        const getY = (val) => h - padding - ((val / 100) * (h - padding * 2));

        // Draw simulated Efficient Frontier path (Cubic Curve)
        const curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const pathData = `M ${getX(15)} ${getY(35)} C ${getX(30)} ${getY(70)}, ${getX(60)} ${getY(90)}, ${getX(90)} ${getY(96)}`;
        curve.setAttribute("d", pathData);
        curve.setAttribute("class", "curve-path");
        svg.appendChild(curve);

        // Plot dots for each scope project
        state.scopes.forEach(scope => {
            if (scope.isArchived) return;
            if (!scopeInHierarchy(scope.id)) return;
            const isIncluded = state.scenario.includedProjectIds.includes(scope.id);
            const x = getX(scope.executionRisk);
            const y = getY(scope.expectedValue);

            const dotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            dotGroup.setAttribute("class", `frontier-point ${isIncluded ? 'included' : 'excluded'}`);
            dotGroup.setAttribute("data-id", scope.id);

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", "6");
            dotGroup.appendChild(circle);

            // Text tag label
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", x + 10);
            text.setAttribute("y", y + 4);
            text.setAttribute("fill", "var(--color-text-secondary)");
            text.setAttribute("font-size", "8");
            text.setAttribute("font-family", "Inter");
            text.textContent = scope.name.split(' ').slice(0,2).join(' ') + "...";
            dotGroup.appendChild(text);

            svg.appendChild(dotGroup);
        });
    }

    bindEvents() {
        // Slider controls
        const budgetSlider = document.getElementById("opt-budget-cap");
        const budgetVal = document.getElementById("opt-budget-cap-val");
        if (budgetSlider) {
            budgetSlider.addEventListener("input", (e) => {
                const cap = parseInt(e.target.value);
                if (budgetVal) budgetVal.textContent = `NZ$${cap.toLocaleString()}`;
                
                // Silent state updates
                store.state.scenario.budgetCap = cap;
                store.recalculateAllMetrics(true);
            });
        }

        const fteSlider = document.getElementById("opt-fte-cap");
        const fteVal = document.getElementById("opt-fte-cap-val");
        if (fteSlider) {
            fteSlider.addEventListener("input", (e) => {
                const cap = parseInt(e.target.value);
                if (fteVal) fteVal.textContent = `${cap} FTEs`;
                
                store.state.scenario.fteCap = cap;
                store.recalculateAllMetrics(true);
            });
        }

        // Checklist check event listeners
        const checks = document.querySelectorAll(".project-mix-check");
        checks.forEach(check => {
            check.addEventListener("change", (e) => {
                const scopeId = check.dataset.id;
                const activeChecked = check.checked;

                store.commitTransaction(`${activeChecked ? 'Include' : 'Exclude'} Project: "${scopeId}"`, "User Optimization Sandbox", (state) => {
                    if (activeChecked) {
                        if (!state.scenario.includedProjectIds.includes(scopeId)) {
                            state.scenario.includedProjectIds.push(scopeId);
                        }
                    } else {
                        state.scenario.includedProjectIds = state.scenario.includedProjectIds.filter(id => id !== scopeId);
                    }
                });
                
                // Complete redraw
                this.render(store.state);
            });
        });

        // Delay Timeline schedule sliders
        const delaySliders = document.querySelectorAll(".project-delay-slider");
        delaySliders.forEach(slider => {
            slider.addEventListener("input", (e) => {
                const scopeId = slider.dataset.id;
                const delay = parseInt(e.target.value);

                store.state.scenario.scheduleOffsets[scopeId] = delay;
                store.recalculateAllMetrics(true); // Cascade updates
            });
        });

        // AUTOMATED AI OPTIMIZATION FRONTIER SOLVER
        const runSolverBtn = document.getElementById("run-ai-optimizer-btn");
        if (runSolverBtn) {
            runSolverBtn.addEventListener("click", () => {
                store.commitTransaction("AI Run Portfolio Frontier Optimization", "AI Portfolio Solver", (state) => {
                    const budgetLimit = state.scenario.budgetCap;
                    const fteLimit = state.scenario.fteCap;

                    // Simulated Knapsack Solver maximizing Expected Strategic Value under cost & FTE constraints
                    let availableScopes = [...state.scopes].filter(s => !s.isArchived && s.status !== "Proposed" && scopeInHierarchy(s.id));
                    
                    // Sort by expected value efficiency (expectedValue / CapEx Cost)
                    availableScopes.sort((a,b) => {
                        const scoreA = a.expectedValue / (a.financials.capEx.plan + a.financials.opEx.plan);
                        const scoreB = b.expectedValue / (b.financials.capEx.plan + b.financials.opEx.plan);
                        return scoreB - scoreA;
                    });

                    let includedIds = [];
                    let accumulatedCost = 0;
                    let accumulatedFte = 0;

                    availableScopes.forEach(s => {
                        const cost = s.financials.capEx.plan + s.financials.opEx.plan;
                        if (accumulatedCost + cost <= budgetLimit && accumulatedFte + s.fteAllocations <= fteLimit) {
                            includedIds.push(s.id);
                            accumulatedCost += cost;
                            accumulatedFte += s.fteAllocations;
                        }
                    });

                    state.scenario.includedProjectIds = includedIds;
                });

                // Complete redraw
                this.render(store.state);
            });
        }
    }
}

export default OptimizationView;
