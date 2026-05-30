/* ==========================================================================
   DELIVERYPRO.AI - CENTRAL APP CONTROLLER & MAIN ROUTER
   ========================================================================== */

import { store } from './store.js';
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
        
        // Initial render
        store.recalculateAllMetrics(true); // Recalculates and fires subscriber notifications
        
        // Populate initial Portfolio Pulse Feed items in UI
        this.populateInitialPulseEvents();
    }

    bindEvents() {
        // Navigation clicks
        const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
        
        navItems.forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                
                // Set active sidebar item styling
                navItems.forEach(ni => ni.classList.remove("active"));
                item.classList.add("active");
                
                const view = item.dataset.view;
                this.activeView = view;

                // Adjust Header text
                this.updateHeaderDetails(view);

                // Re-render
                this.renderActiveView(store.state);
            });
        });

        // Topbar Active Node details click triggers Strategy View
        const activeNodeBtn = document.getElementById("active-hierarchy-badge");
        if (activeNodeBtn) {
            activeNodeBtn.addEventListener("click", () => {
                const strategyNav = document.querySelector('[data-view="strategy"]');
                if (strategyNav) strategyNav.click();
            });
        }

        // --- STRUCTURAL HIERARCHY SELECTOR EVENTS ---
        const selectorBadge = document.getElementById("active-hierarchy-badge");
        const selectorContainer = document.getElementById("hierarchy-selector-container");
        const dropdownItems = document.querySelectorAll(".dropdown-item");

        if (selectorBadge && selectorContainer) {
            // Toggle dropdown open/closed
            selectorBadge.addEventListener("click", (e) => {
                e.stopPropagation();
                selectorContainer.classList.toggle("open");
            });

            // Handle dropdown item click
            dropdownItems.forEach(item => {
                item.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const selectedLevel = item.dataset.level;
                    const levelName = item.querySelector("h4").textContent;

                    // Commit central state transaction
                    store.commitTransaction(
                        `Switched active hierarchy to "${levelName}"`,
                        "Hierarchy Selector",
                        (state) => {
                            state.scenario.activeHierarchyLevel = selectedLevel;
                            
                            // Adjust Optimization budget sandbox caps to match hierarchy limits
                            const budgetCaps = { enterprise: 1500000, portfolio: 1000000, program: 500000, project: 250000 };
                            const fteCaps = { enterprise: 15, portfolio: 12, program: 8, project: 4 };
                            
                            state.scenario.budgetCap = budgetCaps[selectedLevel];
                            state.scenario.fteCap = fteCaps[selectedLevel];
                        }
                    );

                    selectorContainer.classList.remove("open");

                    // Trigger toast notification
                    if (this.copilot) {
                        this.copilot.showNotification(`Hierarchy Level: ${levelName} active`, "success");
                    }
                });
            });

            // Click outside to close dropdown
            document.addEventListener("click", () => {
                selectorContainer.classList.remove("open");
            });
        }
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
        const dropdownItems = document.querySelectorAll(".dropdown-item");

        const levelDetails = {
            enterprise: { name: "Enterprise (Global Corp)", icon: "business" },
            portfolio: { name: "Portfolio (Sustainable Agriculture)", icon: "donut_large" },
            program: { name: "Program (Logistics & Fleet)", icon: "account_tree" },
            project: { name: "Project (Route-Optimization AI)", icon: "article" }
        };

        const currentDetails = levelDetails[activeLevel];
        if (badgeNameEl && badgeIconEl && currentDetails) {
            badgeNameEl.textContent = currentDetails.name;
            badgeIconEl.textContent = currentDetails.icon;
        }

        dropdownItems.forEach(item => {
            if (item.dataset.level === activeLevel) {
                item.classList.add("active-item");
            } else {
                item.classList.remove("active-item");
            }
        });

        // Update sidebar relevance (dims irrelevant modules for active role)
        this.updateSidebarRelevance(activeLevel);

        // Update Copilot suggestions chips
        this.updateCopilotChips(activeLevel);

        const workspaceBody = document.getElementById("view-content");
        if (!workspaceBody) return;

        // Custom router logic for the non-component Synthesizer view
        if (this.activeView === "synthesizer") {
            this.renderExecutiveSynthesizer(state, workspaceBody);
            this.prependScopeBanner(state, workspaceBody);
            return;
        }

        const component = this.views[this.activeView];
        if (component) {
            component.render(state);
            this.prependScopeBanner(state, workspaceBody);
        }
    }

    updateSidebarFooterStats(state) {
        const activeProjEl = document.getElementById("sb-stat-projects");
        const valRealizedEl = document.getElementById("sb-stat-value");

        const level = state.scenario.activeHierarchyLevel || "enterprise";
        const isScopeInHierarchy = (scopeId) => {
            if (level === "enterprise" || level === "portfolio") return true;
            if (level === "program") return ["scope-route-optimization", "scope-transport-fleet"].includes(scopeId);
            if (level === "project") return ["scope-route-optimization"].includes(scopeId);
            return true;
        };

        const isBenefitInHierarchy = (benId) => {
            if (level === "enterprise" || level === "portfolio") return true;
            if (level === "program" || level === "project") {
                return ["ben-transport-transition", "ben-ops-savings"].includes(benId);
            }
            return true;
        };

        const activeCount = state.scopes.filter(s => state.scenario.includedProjectIds.includes(s.id) && isScopeInHierarchy(s.id)).length;
        if (activeProjEl) activeProjEl.textContent = activeCount;

        // Average value realized
        let sumPcts = 0;
        let countBens = 0;
        state.benefits.forEach(b => {
            if (!b.isDisbenefit && isBenefitInHierarchy(b.id)) {
                countBens++;
                sumPcts += ((b.metric.current - b.metric.baseline) / (b.metric.target - b.metric.baseline)) * 100;
            }
        });
        const avgPct = countBens > 0 ? Math.round(sumPcts / countBens) : 0;
        if (valRealizedEl) valRealizedEl.textContent = `${avgPct}%`;
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

    prependScopeBanner(state, container) {
        // Remove existing scope banners
        const oldBanners = container.querySelectorAll(".scope-banner");
        oldBanners.forEach(b => b.remove());

        const activeLevel = state.scenario.activeHierarchyLevel || "enterprise";
        const view = this.activeView;

        const bannerDetails = {
            strategy: {
                enterprise: { icon: "business", title: "Enterprise Strategy Board", desc: "Enterprise Strategy Cascades. Showing all objectives and OKRs aligned to Global Corp enterprise vision." },
                portfolio: { icon: "donut_large", title: "Portfolio Strategy Board", desc: "Sustainable Agriculture Portfolio. Displays aligned OKRs and benefits maturation tracks for this portfolio." },
                program: { icon: "account_tree", title: "Program Strategy Board", desc: "Logistics & Fleet Modernization Program. Showing outcomes and projects under this program's boundaries." },
                project: { icon: "article", title: "Project Strategic Line-of-Sight", desc: "Route-Optimization AI Integration Project. Zooms in on this specific scope and its strategic benefits paths." }
            },
            intake: {
                enterprise: { icon: "business", title: "Enterprise Demand Funnel", desc: "Global Demand Funnel. Capturing all incoming proposals across all business units." },
                portfolio: { icon: "donut_large", title: "Portfolio Demand Intake Vetting", desc: "Portfolio Demand Intake Vetting. Vetting crop yield and packaging proposals against portfolio budgets." },
                program: { icon: "account_tree", title: "Program Proposals Sandbox", desc: "Program-Relevant Demand Proposals. Reviewing logistics proposals aligned to program outcomes." },
                project: { icon: "article", title: "Project Scope Vetting", desc: "Project Scope Vetting. Scoping proposed deliverables, estimates, and tasks before active sprint launch." }
            },
            optimizer: {
                enterprise: { icon: "business", title: "Strategic Enterprise Optimization", desc: "Overall portfolios knapsack optimization sandboxes under corporate limits." },
                portfolio: { icon: "donut_large", title: "Portfolio Budget & FTE Sandbox", desc: "Portfolio Budget & FTE Sandbox. Running Efficient Frontier value-optimizations under a $1.0M cap." },
                program: { icon: "account_tree", title: "Program Capacity Sandbox", desc: "Program Capacity Sandbox. Slide budget and FTE bounds under a strict $500k Program Cap." },
                project: { icon: "article", title: "Project Sandbox Bounds", desc: "Project Sandbox bounds. Analyzing expected project ROI value vs risk points under a $250k Cap." }
            },
            finance: {
                enterprise: { icon: "business", title: "Corporate Capex & Opex Ledger", desc: "Corporate Capex & Opex. Comprehensive financial forecast aggregated across all portfolios." },
                portfolio: { icon: "donut_large", title: "Portfolio Spend Burndowns", desc: "Portfolio Spend Burndowns. Planned vs actual spend and value realizations for Sustainable Agriculture." },
                program: { icon: "account_tree", title: "Program Cost Sheet Burndowns", desc: "Program Cost Sheet burndowns. Granular actual spend ledgers for Logistics and Fleet vehicle projects." },
                project: { icon: "article", title: "Project Actual Costs vs ETC", desc: "Project Actual Costs vs ETC. Granular task-level CapEx and OpEx spend rolled up for the AI routing project." }
            },
            kanban: {
                enterprise: { icon: "business", title: "Enterprise Activity Flow", desc: "Enterprise Activity Flow. Monitor active sprint task streams across the entire corporation." },
                portfolio: { icon: "donut_large", title: "Portfolio Delivery Flow", desc: "Portfolio Delivery Flow. Tasks and sprints tracking for all projects under the active portfolio." },
                program: { icon: "account_tree", title: "Program Kanban Workspace", desc: "Program Kanban Workspace. Active sprint backlogs filtered for Logistics and Fleet procurement projects." },
                project: { icon: "article", title: "Project Sprint Kanban Board", desc: "Project Sprint Kanban Board. Sprints task board for Route-Optimization AI Integration developers." }
            },
            gantt: {
                enterprise: { icon: "business", title: "Corporate Milestones Gantt", desc: "Corporate Milestones. Tracking strategic high-level go-live paths for all organizational portfolios." },
                portfolio: { icon: "donut_large", title: "Portfolio Delivery Timelines", desc: "Portfolio Delivery Timelines. Tracking Gantt dates and delay-multiplier offsets for active portfolio projects." },
                program: { icon: "account_tree", title: "Program Gantt Timelines", desc: "Program Gantt Timelines. Tracking critical paths and schedule cascade shift bottlenecks for program delivery." },
                project: { icon: "article", title: "Project Zoom Gantt Timeline", desc: "Project Zoom Gantt. zoomed task-level Gantt tracking critical path schedules and task milestones." }
            },
            resources: {
                enterprise: { icon: "business", title: "Enterprise Capacity Ledger", desc: "Enterprise Capacity Ledger. Aggregated staff headcount utilization across all business streams." },
                portfolio: { icon: "donut_large", title: "Portfolio Resource Balancing", desc: "Portfolio Resource Balancing. Reviewing staff bandwidth allocated specifically to portfolio deliverables." },
                program: { icon: "account_tree", title: "Program FTE Workload Balancing", desc: "Program FTE Workload balancing. Balancing developer capacity and resource loading across program projects." },
                project: { icon: "article", title: "Project Allocation Matrices", desc: "Project Allocation matrices. granular FTE workload assignments for Route-Optimization team members." }
            },
            synthesizer: {
                enterprise: { icon: "business", title: "Enterprise Executive Presentation brief", desc: "Enterprise Executive Presentation brief. Boardroom slides ready for A4 PDF export." },
                portfolio: { icon: "donut_large", title: "Portfolio Executive summaries", desc: "Portfolio Executive performance summaries. Aggregated performance metrics for this portfolio." },
                program: { icon: "account_tree", title: "Program Performance briefings", desc: "Program Performance briefs. Value summaries and milestone completions for the Logistics program." },
                project: { icon: "article", title: "Project Performance briefings", desc: "Project Performance briefings. Detailed narrative and progress metrics for the AI Route-Optimization scope." }
            },
            audit: {
                enterprise: { icon: "business", title: "Global Governance Audit Log", desc: "Global Governance Audit. Master transactional history ledgers across all organizational adjustments." },
                portfolio: { icon: "donut_large", title: "Portfolio Audit logs", desc: "Portfolio Audit logs. Audits and rollbacks specific to the Sustainable Agriculture portfolio." },
                program: { icon: "account_tree", title: "Program Audit transaction logs", desc: "Program Audit transaction logs. Transactional logs filtered for Logistics and Fleet modifications." },
                project: { icon: "article", title: "Project Transaction Rollbacks", desc: "Project Transaction Rollbacks. Zoomed log of edits and task completions supporting instant rollbacks." }
            }
        };

        const details = bannerDetails[view] ? bannerDetails[view][activeLevel] : null;
        if (!details) return;

        const bannerDiv = document.createElement("div");
        bannerDiv.className = "scope-banner";
        bannerDiv.innerHTML = `
            <span class="material-symbols-outlined scope-banner-icon">${details.icon}</span>
            <div class="scope-banner-text">
                <h4>${details.title}</h4>
                <p>${details.desc}</p>
            </div>
        `;
        
        container.insertBefore(bannerDiv, container.firstChild);
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
                <div class="glass-panel" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3>Executive Strategic Handout Summary</h3>
                        <p class="help-text" style="margin-top: 4px;">Aggregated corporate brief for senior executives and Pacific board meetings.</p>
                    </div>
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
                            <div class="cons-card-val" style="color: var(--color-success); font-size:24px; margin-top:8px;">${state.strategy.health}%</div>
                            <p class="help-text" style="margin-top:4px;">Cascade indicators verified across 2 target OKRs.</p>
                        </div>
                        <div class="cons-card">
                            <span class="cons-card-lbl">Cumulative Financials Burndown</span>
                            <div class="cons-card-val" style="color: var(--accent-indigo); font-size:24px; margin-top:8px;">$${totalSpend.toLocaleString()} / $${totalBudget.toLocaleString()}</div>
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
                            ${state.strategy.objectives.map(o => `
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
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
    window.app = new DeliveryProApp();
});
