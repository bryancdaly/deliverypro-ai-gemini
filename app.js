/* ==========================================================================
   DELIVERYPRO.AI - CENTRAL APP CONTROLLER & MAIN ROUTER
   ========================================================================== */

import { store, escapeHtml, PROGRAM_GROUPS, isScopeInHierarchy, isBenefitInHierarchy } from './store.js';
import StrategyView from './strategyView.js';
import IntakeView from './intakeView.js';
import OptimizationView from './optimizationView.js';
import FinanceView from './financeView.js';
import KanbanView from './kanbanView.js';
import GanttView from './ganttView.js';
import ResourceView from './resourceView.js';
import CopilotView from './copilotView.js';
import AuditView from './auditView.js';

class DeliveryProApp {
    constructor() {
        this.activeView = "strategy";
        
        // Initialize view components
        this.views = {
            strategy: new StrategyView(),
            intake: new IntakeView(),
            optimizer: new OptimizationView(),
            finance: new FinanceView(),
            kanban: new KanbanView(),
            gantt: new GanttView(),
            resources: new ResourceView(),
            audit: new AuditView()
        };

        // Copilot drawer is persistent and self-initialized
        this.copilot = null;
        
        this.init();
    }

    init() {
        // Initialize Copilot View Controller
        this.copilot = new CopilotView();
        
        this.bindEvents();
        
        // Subscribe to Store updates
        store.subscribe("app-router", (state) => this.renderActiveView(state));
        
        // Listen for hash changes
        window.addEventListener("hashchange", () => this.handleHashRoute());

        // Recalculate metrics silently
        store.recalculateAllMetrics(false);
        
        // Parse and render target hash view
        this.handleHashRoute();
        
        // Populate initial Portfolio Pulse Feed items in UI
        this.populateInitialPulseEvents();
    }

    bindEvents() {
        // Navigation clicks
        const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
        
        navItems.forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                window.location.hash = view;
            });
        });

        // Topbar Active Node details click triggers Strategy View
        const activeNodeBtn = document.getElementById("active-hierarchy-badge");
        if (activeNodeBtn) {
            activeNodeBtn.addEventListener("click", () => {
                window.location.hash = "strategy";
            });
        }

        // --- STRUCTURAL HIERARCHY SELECTOR EVENTS ---
        const selectorBadge = document.getElementById("active-hierarchy-badge");
        const selectorContainer = document.getElementById("hierarchy-selector-container");
        const hierarchyDropdown = document.getElementById("hierarchy-dropdown");

        if (selectorBadge && selectorContainer) {
            // Toggle dropdown open/closed
            selectorBadge.addEventListener("click", (e) => {
                e.stopPropagation();
                selectorContainer.classList.toggle("open");
            });

            // Event delegation — handles both static and dynamically generated items
            if (hierarchyDropdown) {
                hierarchyDropdown.addEventListener("click", (e) => {
                    const item = e.target.closest(".dropdown-item");
                    if (!item) return;
                    e.stopPropagation();

                    const selectedLevel = item.dataset.level;
                    const selectedNodeId = item.dataset.nodeId || null;
                    const levelName = item.querySelector("h4")?.textContent || selectedLevel;

                    const budgetCaps = { enterprise: 1500000, portfolio: 1000000, program: 500000, project: 250000 };
                    const fteCaps = { enterprise: 15, portfolio: 12, program: 8, project: 4 };

                    store.commitTransaction(
                        `Switched hierarchy view to "${levelName}"`,
                        "Hierarchy Selector",
                        (state) => {
                            state.scenario.activeHierarchyLevel = selectedLevel;
                            state.scenario.activeNodeId = selectedNodeId;
                            state.scenario.budgetCap = budgetCaps[selectedLevel] || 1500000;
                            state.scenario.fteCap = fteCaps[selectedLevel] || 15;
                        }
                    );

                    selectorContainer.classList.remove("open");
                    if (this.copilot) {
                        this.copilot.showNotification(`Hierarchy: ${levelName} active`, "success");
                    }
                });
            }

            // Click outside to close dropdown
            document.addEventListener("click", () => {
                selectorContainer.classList.remove("open");
            });
        }
    }

    handleHashRoute() {
        const hash = window.location.hash.replace("#", "");
        const validViews = ["strategy", "intake", "optimizer", "finance", "kanban", "gantt", "resources", "synthesizer", "audit"];
        
        let targetView = "strategy";
        if (hash && validViews.includes(hash)) {
            targetView = hash;
        }

        // Set active sidebar item styling in UI
        const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
        navItems.forEach(item => {
            if (item.dataset.view === targetView) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        this.activeView = targetView;
        this.updateHeaderDetails(targetView);
        this.renderActiveView(store.state);
    }

    updateHeaderDetails(view) {
        const titleEl = document.getElementById("current-view-title");
        const descEl = document.getElementById("current-view-desc");
        
        const details = {
            strategy: { title: "Strategy Board", desc: "Top-down strategic cascading alignment and line-of-sight tracking" },
            intake: { title: "Demand & Intake Funnel", desc: "Intelligent front-door capturing, scoring, and vetting project proposals" },
            optimizer: { title: "Portfolio Optimizer", desc: "Strategic 'What-If' scenario sandboxing and Efficient Frontier solvers" },
            finance: { title: "Financial & Value Board", desc: "CapEx & OpEx ledger tracking, financial forecasting, and post-launch value realizations" },
            kanban: { title: "Sprint Kanban Board", desc: "Agile sprint execution and task-level state tracking boards" },
            gantt: { title: "AI Gantt Timeline", desc: "Horizontal schedule delivery timelines, milestone phase gates, and critical path analysis" },
            resources: { title: "Resource Allocator", desc: "Weekly workload bandwidth matrices and allocations tracking" },
            synthesizer: { title: "Executive Synthesizer", desc: "One-click executive briefs and print-ready presentation briefs" },
            audit: { title: "Audit Log Ledger", desc: "Chronological transaction snapshots log and rollback controllers" }
        };

        if (titleEl && descEl && details[view]) {
            titleEl.textContent = details[view].title;
            descEl.textContent = details[view].desc;
        }
    }

    renderActiveView(state) {
        const activeLevel = state.scenario.activeHierarchyLevel || "enterprise";

        // Redraw sidebar Footer stats
        this.updateSidebarFooterStats(state);

        // Sync Hierarchy Selector Badge UI from store state
        const badgeNameEl = document.getElementById("active-node-name");
        const badgeIconEl = document.getElementById("active-hierarchy-icon");
        const nodeId = state.scenario.activeNodeId;

        const getBadgeDetails = () => {
            if (activeLevel === "enterprise") return { name: "Enterprise (Global Corp)", icon: "business" };
            if (activeLevel === "portfolio") return { name: "Portfolio (Sustainable Agriculture)", icon: "donut_large" };
            if (activeLevel === "program") {
                const group = nodeId && PROGRAM_GROUPS[nodeId];
                return { name: group ? `Program: ${group.name}` : "Program", icon: "account_tree" };
            }
            if (activeLevel === "project") {
                const scope = nodeId && state.scopes.find(s => s.id === nodeId);
                return { name: scope ? scope.name : "Project", icon: "article" };
            }
            return { name: "Enterprise (Global Corp)", icon: "business" };
        };

        const currentDetails = getBadgeDetails();
        if (badgeNameEl && badgeIconEl) {
            badgeNameEl.textContent = currentDetails.name;
            badgeIconEl.textContent = currentDetails.icon;
        }

        // Populate dynamic program and project items in the dropdown
        this.updateHierarchyDropdown(state);

        // Update sidebar relevance (dims irrelevant modules for active role)
        this.updateSidebarRelevance(activeLevel);

        // Update Copilot suggestions chips
        this.updateCopilotChips(activeLevel);

        const workspaceBody = document.getElementById("view-content");
        if (!workspaceBody) return;

        // Custom router logic for the non-component Synthesizer view
        if (this.activeView === "synthesizer") {
            this.renderExecutiveSynthesizer(state, workspaceBody);
            return;
        }

        const component = this.views[this.activeView];
        if (component) {
            component.render(state);
        }
    }

    updateSidebarFooterStats(state) {
        const activeProjEl = document.getElementById("sb-stat-projects");
        const valRealizedEl = document.getElementById("sb-stat-value");

        const activeCount = state.scopes.filter(s =>
            state.scenario.includedProjectIds.includes(s.id) && isScopeInHierarchy(s.id, state)
        ).length;
        if (activeProjEl) activeProjEl.textContent = activeCount;

        let sumPcts = 0;
        let countBens = 0;
        state.benefits.forEach(b => {
            if (!b.isDisbenefit && isBenefitInHierarchy(b, state)) {
                countBens++;
                sumPcts += ((b.metric.current - b.metric.baseline) / (b.metric.target - b.metric.baseline)) * 100;
            }
        });
        const avgPct = countBens > 0 ? Math.round(sumPcts / countBens) : 0;
        if (valRealizedEl) valRealizedEl.textContent = `${avgPct}%`;
    }

    updateHierarchyDropdown(state) {
        const level = state.scenario.activeHierarchyLevel || "enterprise";
        const nodeId = state.scenario.activeNodeId;

        // Mark the two static items (enterprise, portfolio)
        document.querySelectorAll(".dropdown-item[data-level='enterprise'], .dropdown-item[data-level='portfolio']").forEach(el => {
            el.classList.toggle("active-item", el.dataset.level === level && !nodeId);
        });

        // Populate program items dynamically
        const programContainer = document.getElementById("program-dynamic-items");
        if (programContainer) {
            programContainer.innerHTML = Object.entries(PROGRAM_GROUPS).map(([id, g]) => {
                const isActive = level === "program" && nodeId === id;
                return `
                    <div class="dropdown-item dropdown-sub-item ${isActive ? 'active-item' : ''}" data-level="program" data-node-id="${id}">
                        <span class="material-symbols-outlined" style="font-size:16px;">${g.icon}</span>
                        <div class="item-text">
                            <h4>${escapeHtml(g.name)}</h4>
                            <small>${g.scopeIds.length} projects</small>
                        </div>
                    </div>`;
            }).join('');
        }

        // Populate project (scope) items dynamically from state
        const projectContainer = document.getElementById("project-dynamic-items");
        if (projectContainer) {
            const scopes = state.scopes.filter(s => !s.isArchived);
            projectContainer.innerHTML = scopes.map(s => {
                const isActive = level === "project" && nodeId === s.id;
                return `
                    <div class="dropdown-item dropdown-sub-item ${isActive ? 'active-item' : ''}" data-level="project" data-node-id="${s.id}">
                        <span class="material-symbols-outlined" style="font-size:16px;">article</span>
                        <div class="item-text">
                            <h4>${escapeHtml(s.name)}</h4>
                            <small>${escapeHtml(s.status)} · ${s.progress}% complete</small>
                        </div>
                    </div>`;
            }).join('');
        }
    }

    populateInitialPulseEvents() {
        const pulseStream = document.getElementById("pulse-stream");
        if (!pulseStream) return;

        pulseStream.innerHTML = store.state.pulseFeed.map(log => `
            <div class="pulse-card ${log.type}">
                <span class="pulse-time">${log.time}</span>
                ${log.msg}
            </div>
        `).join('');
    }

    // --- SCOPE & RELEVANCE RENDERING HELPERS ---
    updateSidebarRelevance(level) {
        const relevanceMap = {
            enterprise: ["strategy", "optimizer", "resources", "synthesizer", "audit"],
            portfolio: ["strategy", "intake", "optimizer", "finance", "resources", "synthesizer", "audit"],
            program: ["strategy", "finance", "kanban", "gantt", "resources", "audit"],
            project: ["kanban", "gantt", "resources", "audit"]
        };

        const relevantViews = relevanceMap[level] || [];
        const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
        
        navItems.forEach(item => {
            const view = item.dataset.view;
            if (relevantViews.includes(view)) {
                item.classList.remove("low-relevance");
            } else {
                item.classList.add("low-relevance");
            }
        });
    }

    updateCopilotChips(level) {
        const chipsScroller = document.querySelector(".chips-scroller");
        if (!chipsScroller) return;

        const chipsData = {
            enterprise: [
                { prompt: "What disbenefits are we risking?", label: "What disbenefits?" },
                { prompt: "Show OKR alignment for Logistics Benefit", label: "Logistics OKR Alignment" },
                { prompt: "Optimize portfolio budget sandbox", label: "Optimize Budget Mix" },
                { prompt: "Synthesize executive value report", label: "Generate Exec Report" }
            ],
            portfolio: [
                { prompt: "Optimize portfolio budget sandbox", label: "Optimize Budget Mix" },
                { prompt: "What is our current CapEx vs OpEx burn?", label: "CapEx vs OpEx burn?" },
                { prompt: "Analyze demand intake pipeline", label: "Analyze Demand Funnel" },
                { prompt: "Synthesize executive value report", label: "Generate Exec Report" }
            ],
            program: [
                { prompt: "Assess 1-3 year benefit realizations", label: "Assess 1-3yr Realizations" },
                { prompt: "Report on carbon footprint outcome status", label: "Carbon Footprint Outcome" },
                { prompt: "Check Gantt schedule cascade delay warning", label: "Gantt Delay Warnings" }
            ],
            project: [
                { prompt: "Auto-balance resource workloads", label: "Auto-balance Workloads" },
                { prompt: "Check Gantt schedule cascade delay warning", label: "Gantt Delay Warnings" },
                { prompt: "Review recent database schema change rollback", label: "Review Recent Rollbacks" }
            ]
        };

        const chips = chipsData[level] || chipsData.enterprise;
        chipsScroller.innerHTML = chips.map(c => `
            <button class="chip" data-prompt="${c.prompt}">${c.label}</button>
        `).join('');

        // Re-bind chip click handlers
        const chipButtons = chipsScroller.querySelectorAll(".chip");
        chipButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const prompt = btn.dataset.prompt;
                const inputEl = document.getElementById("copilot-input");
                if (inputEl) {
                    inputEl.value = prompt;
                    const sendBtn = document.getElementById("copilot-send");
                    if (sendBtn) sendBtn.click();
                }
            });
        });
    }

    // ==========================================================================
    // EXECUTIVE SYNTHESIZER & BRIEF EXPORTER VIEW
    // ==========================================================================
    renderExecutiveSynthesizer(state, container) {
        // Find strategic, resource and financial aggregates
        const totalBudget = state.scopes.reduce((acc, curr) => acc + curr.financials.capEx.plan + curr.financials.opEx.plan, 0);
        const totalSpend = state.scopes.reduce((acc, curr) => acc + curr.financials.capEx.actual + curr.financials.opEx.actual, 0);
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 24px; max-width: 900px; margin: 0 auto; padding-top: 10px;">
                <div class="glass-panel" style="display:flex; justify-content:flex-end; align-items:center;">
                    <button id="export-brief-pdf-btn" class="btn btn-primary">
                        <span class="material-symbols-outlined">print</span>
                        <span>Export Presentation Brief (PDF)</span>
                    </button>
                </div>

                <div class="glass-panel" style="display:flex; flex-direction:column; gap:20px;">
                    <div style="border-bottom: 2px solid var(--glass-border); padding-bottom: 12px; display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="font-size:16px;">DeliveryPro.AI Portfolio Health Report</h4>
                        <span class="tier-badge" style="background: hsla(165,80%,45%,0.1); color: var(--color-success);">Q3 High-Confidence</span>
                    </div>

                    <!-- Details grid -->
                    <div class="est-details-grid" style="grid-template-columns:1fr 1fr 1fr; gap:20px;">
                        <div class="cons-card">
                            <span class="cons-card-lbl">Global Strategy Health</span>
                            <div class="cons-card-val" style="color: var(--color-success); font-size:24px; margin-top:8px;">${Math.round(state.strategy.reduce((acc, s) => acc + s.health, 0) / Math.max(state.strategy.length, 1))}%</div>
                            <p class="help-text" style="margin-top:4px;">Cascade indicators verified across ${state.strategy.flatMap(s=>s.objectives).length} target OKRs.</p>
                        </div>
                        <div class="cons-card">
                            <span class="cons-card-lbl">Cumulative Financials Burndown</span>
                            <div class="cons-card-val" style="color: var(--accent-indigo); font-size:24px; margin-top:8px;">NZ$${totalSpend.toLocaleString()} / NZ$${totalBudget.toLocaleString()}</div>
                            <p class="help-text" style="margin-top:4px;">YTD Burn-rate: ${Math.round((totalSpend / totalBudget) * 100)}% CapEx limit.</p>
                        </div>
                        <div class="cons-card">
                            <span class="cons-card-lbl">Active Risks & Roads</span>
                            <div class="cons-card-val" style="color: var(--color-warning); font-size:24px; margin-top:8px;">
                                ${state.scopes.filter(sc=>sc.executionRisk > 40).length} Projects Flagged
                            </div>
                            <p class="help-text" style="margin-top:4px;">1 disbenefit compliance check friction active.</p>
                        </div>
                    </div>

                    <!-- Aligned Objectives list -->
                    <div style="border-top:1px solid var(--glass-border); padding-top:16px;">
                        <h5 style="text-transform:uppercase; font-size:11px; color:var(--color-text-secondary); margin-bottom:12px;">Cascading Strategic OKRs Achievements</h5>
                        <div class="strategy-list" style="max-height:none; display:flex; flex-direction:column; gap:12px;">
                            ${state.strategy.flatMap(s=>s.objectives).map(o => `
                                <div class="ledger-item" style="padding:16px;">
                                    <div style="width:60%">
                                        <b style="font-size:13px;">${o.title}</b>
                                        <small style="display:block; color:var(--color-text-muted); font-size:10px; margin-top:4px;">Target Metric: ${o.metric}</small>
                                    </div>
                                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                                        <span class="cost-val" style="color: var(--color-success)">${o.current} / ${o.target}${o.unit}</span>
                                        <span class="cost-val" style="font-size:10px; color: var(--color-text-muted)">${Math.round((o.current/o.target)*100)}% OKR target met</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Bullet insights -->
                    <div style="border-top:1px solid var(--glass-border); padding-top:16px; background:hsla(0,0%,100%,0.015); padding:16px; border-radius:8px;">
                        <h5 style="text-transform:uppercase; font-size:11px; color:var(--accent-indigo); margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                            <span class="material-symbols-outlined" style="font-size:14px;">smart_toy</span>
                            AI Synthesized Narrative Summary
                        </h5>
                        <p style="font-size:12.5px; line-height:1.5; color:var(--color-text-secondary);">
                            DeliveryPro.AI has compiled and cross-referenced all active execution nodes. Our top-performing initiative remains <b>Route-Optimization AI Integration</b> (Phase 2), contributing a projected <b>$500k Operations Benefit</b> with a low execution risk (30%). Downstream freight carbon footprints are currently simulated to achieve a 15% net supply chain contraction, matching our regional Pacific sustainability pillars. The solver flags resource overload bottlenecks on Sarah Connor, recommending a schedule re-leveling shift.
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Bind PDF print trigger
        const exportBtn = document.getElementById("export-brief-pdf-btn");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                store.logPulseEvent("PDF Export", "Triggered executive PDF print layout brief.", "system");
                window.print(); // Triggers the standard system print menu with our index.css @media print layout styles!
            });
        }
    }
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
    window.app = new DeliveryProApp();
});
