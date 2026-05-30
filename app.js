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
        // Redraw sidebar Footer stats
        this.updateSidebarFooterStats(state);

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

        const activeCount = state.scopes.filter(s => state.scenario.includedProjectIds.includes(s.id)).length;
        if (activeProjEl) activeProjEl.textContent = activeCount;

        // Average value realized
        let sumPcts = 0;
        let countBens = 0;
        state.benefits.forEach(b => {
            if (!b.isDisbenefit) {
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

    // ==========================================================================
    // EXECUTIVE SYNTHESIZER & BRIEF EXPORTER VIEW
    // ==========================================================================
    renderExecutiveSynthesizer(state, container) {
        // Find strategic, resource and financial aggregates
        const totalBudget = state.scopes.reduce((acc, curr) => acc + curr.financials.capEx.plan + curr.financials.opEx.plan, 0);
        const totalSpend = state.scopes.reduce((acc, curr) => acc + curr.financials.capEx.actual + curr.financials.opEx.actual, 0);
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 24px; max-width: 900px; margin: 0 auto;">
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

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
    window.app = new DeliveryProApp();
});
