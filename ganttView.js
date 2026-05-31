/* ==========================================================================
   DELIVERYPRO.AI - AI GANTT CHART COMPONENT
   ========================================================================== */

import { store, isScopeInHierarchy } from './store.js';

class GanttView {
    constructor() {
        this.containerId = "view-content";
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const level = state.scenario.activeHierarchyLevel || "enterprise";
        const activeProjectIds = state.scenario.includedProjectIds;
        let activeScopes = state.scopes.filter(s =>
            !s.isArchived && activeProjectIds.includes(s.id) && isScopeInHierarchy(s.id, state)
        );

        // Render gantt layout
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 20px; height: 100%;">
                <!-- Simulation delay slider -->
                <div class="glass-panel realization-slider-panel" style="margin-top: 0; display: ${level === 'project' ? 'none' : 'flex'}">
                    <span class="material-symbols-outlined icon-btn" style="color: var(--color-warning)">warning</span>
                    <div class="r-slider-desc">
                        <h4>AI Dependency Bottleneck Simulator</h4>
                        <p>Simulate a schedule delay on "Fleet Procurement" to recalculate downstream impact cascades</p>
                    </div>
                    <div class="r-slider-control">
                        <input type="range" id="gantt-delay-simulator" min="0" max="6" value="${state.scenario.scheduleOffsets['scope-transport-fleet'] || 0}" style="accent-color: var(--color-warning);">
                        <div class="r-slider-label" id="gantt-delay-label" style="color: var(--color-warning)">+${state.scenario.scheduleOffsets['scope-transport-fleet'] || 0} months</div>
                    </div>
                </div>

                <!-- Gantt grid wrap -->
                <div class="gantt-chart-wrap glass-panel" style="padding: 0;">
                    <!-- Left Names pane -->
                    <div class="gantt-left-names">
                        <div class="gantt-left-header">Project Scope Execution Node</div>
                        <div class="gantt-left-list">
                            ${activeScopes.map(s => `
                                <div class="gantt-name-row"><b>${s.name.substring(0, 30)}...</b></div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Right Timeline pane -->
                    <div class="gantt-right-timeline">
                        <div class="gantt-timeline-header">
                            <!-- Render monthly timeline headers -->
                            ${Array.from({ length: 12 }, (_, i) => `
                                <div style="flex-grow: 1; border-right: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; font-family: Outfit; color: var(--color-text-secondary);">
                                    Month ${i + 1}
                                </div>
                            `).join('')}
                        </div>
                        <div class="gantt-timeline-grid">
                            ${activeScopes.map(s => {
                                const offset = state.scenario.scheduleOffsets[s.id] || 0;
                                const baseStart = s.id === 'scope-transport-fleet' ? 2 : (s.id === 'scope-safety-module' ? 6 : 0);
                                const start = baseStart + offset;
                                const duration = s.id === 'scope-transport-fleet' ? 8 : (s.id === 'scope-safety-module' ? 4 : 4);
                                
                                // Map width ratios
                                const pctLeft = (start / 12) * 100;
                                const pctWidth = (duration / 12) * 100;

                                return `
                                    <div class="gantt-row-line">
                                        <div class="gantt-bar" style="left: ${pctLeft}%; width: ${pctWidth}%;"></div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Dynamic Mitigation Suggestion Card -->
                <div class="glass-panel hidden" id="gantt-mitigation-card" style="border-color: var(--color-warning); background: hsla(15, 90%, 60%, 0.03); animation: fadeIn 0.4s ease;">
                    <h4 style="color: var(--color-warning); font-size:13px; font-weight:700; display:flex; align-items:center; gap:8px;">
                        <span class="material-symbols-outlined">warning</span>
                        AI Dependency Chain Warning
                    </h4>
                    <p style="font-size: 12px; margin-top: 6px; line-height: 1.45;" id="mitigation-recommendation-text"></p>
                </div>
            </div>
        `;

        this.bindEvents(state);
    }

    bindEvents(state) {
        const slider = document.getElementById("gantt-delay-simulator");
        const sliderVal = document.getElementById("gantt-delay-label");
        const mitigationCard = document.getElementById("gantt-mitigation-card");
        const recText = document.getElementById("mitigation-recommendation-text");

        const redrawBars = (localOffsets) => {
            let scopesToDraw = state.scopes.filter(s =>
                !s.isArchived && state.scenario.includedProjectIds.includes(s.id) && isScopeInHierarchy(s.id, state)
            );
            const ganttGrid = document.querySelector(".gantt-timeline-grid");
            if (ganttGrid) {
                ganttGrid.innerHTML = scopesToDraw.map(s => {
                    const offset = localOffsets[s.id] !== undefined ? localOffsets[s.id] : (state.scenario.scheduleOffsets[s.id] || 0);
                    const baseStart = s.id === 'scope-transport-fleet' ? 2 : (s.id === 'scope-safety-module' ? 6 : 0);
                    const start = baseStart + offset;
                    const duration = s.id === 'scope-transport-fleet' ? 8 : (s.id === 'scope-safety-module' ? 4 : 4);
                    const pctLeft = (start / 12) * 100;
                    const pctWidth = (duration / 12) * 100;
                    return `
                        <div class="gantt-row-line">
                            <div class="gantt-bar" style="left: ${pctLeft}%; width: ${pctWidth}%; background: ${offset > 0 ? 'var(--color-warning)' : 'var(--accent-indigo-gradient)'};"></div>
                        </div>
                    `;
                }).join('');
            }
        };

        if (slider) {
            slider.addEventListener("input", (e) => {
                const delay = parseInt(e.target.value);
                if (sliderVal) sliderVal.textContent = `+${delay} months`;

                // Compute cascading offsets locally for visual feedback — no store writes during drag
                const baseFleetStart = 2;
                const baseFleetDuration = 8;
                const baseSafetyStart = 6;
                const fleetEnd = baseFleetStart + delay + baseFleetDuration;
                const safetyDelay = fleetEnd > baseSafetyStart ? fleetEnd - baseSafetyStart : 0;
                const localOffsets = {
                    'scope-transport-fleet': delay,
                    'scope-safety-module': safetyDelay
                };

                if (delay > 0) {
                    if (mitigationCard) mitigationCard.classList.remove("hidden");
                    if (recText) {
                        recText.innerHTML = `Delaying **Fleet Procurement** by **${delay} months** pushes its completion past Month ${10 + delay}. This creates a critical path bottleneck for <b>Warehouse Safety Module</b> which depends on dock installations. <br><br><i>AI Recommendation:</i> Shift **2 FTEs** from <i>Route Optimization</i> to accelerate dock gates installation or click <b>"AI Run Frontier Optimization"</b> in the Portfolio Optimizer to recalculate resource limits.`;
                    }
                } else {
                    if (mitigationCard) mitigationCard.classList.add("hidden");
                }

                redrawBars(localOffsets);
            });

            // Commit the final offset value to the store with a full audit trail on slider release
            slider.addEventListener("change", (e) => {
                const delay = parseInt(e.target.value);
                const baseFleetStart = 2;
                const baseFleetDuration = 8;
                const baseSafetyStart = 6;
                const fleetEnd = baseFleetStart + delay + baseFleetDuration;
                const safetyDelay = fleetEnd > baseSafetyStart ? fleetEnd - baseSafetyStart : 0;

                store.commitTransaction(
                    `Gantt Delay Simulation: Fleet Procurement +${delay} month${delay !== 1 ? 's' : ''}`,
                    "Gantt Simulator",
                    (s) => {
                        s.scenario.scheduleOffsets['scope-transport-fleet'] = delay;
                        s.scenario.scheduleOffsets['scope-safety-module'] = safetyDelay;
                    }
                );
            });
        }
    }
}

export default GanttView;
