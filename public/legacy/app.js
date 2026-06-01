/* ==========================================================================
   DELIVERYPRO.AI - CENTRAL APP CONTROLLER & MAIN ROUTER
   ========================================================================== */

import { store, escapeHtml, PROGRAM_GROUPS, isScopeInHierarchy, isBenefitInHierarchy } from './store.js';
import StrategyView from './strategyView.js';
import IntakeView from './intakeView.js';
import OptimizationView from './optimizationView.js';
import FinanceView from './financeView.js';
import KanbanView from './kanbanView.js';
import ScheduleView from './scheduleView.js';
import GanttView from './ganttView.js';
import ResourceView from './resourceView.js';
import CopilotView from './copilotView.js';
import AuditView from './auditView.js';
import RaidView from './raidView.js';

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
            schedule: new ScheduleView(),
            gantt: new GanttView(),
            resources: new ResourceView(),
            audit: new AuditView(),
            raid: new RaidView()
        };

        // Copilot drawer is persistent and self-initialized
        this.copilot = null;
        
        this.init();
    }

    init() {
        // Initialize Copilot View Controller
        this.copilot = new CopilotView();

        // Restore persisted nav order before binding click events
        this._restoreNavOrder();
        
        this.bindEvents();
        this._initNavDragReorder();
        
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

    // ── Nav drag-reorder ─────────────────────────────────────────────────────

    _restoreNavOrder() {
        try {
            const saved = JSON.parse(localStorage.getItem('dp_nav_order') || 'null');
            if (!Array.isArray(saved) || saved.length < 2) return;
            const nav = document.querySelector('.sidebar-nav');
            if (!nav) return;
            saved.forEach(view => {
                const el = nav.querySelector(`.nav-item[data-view="${view}"]`);
                if (el) nav.appendChild(el);
            });
        } catch (_) {}
    }

    _initNavDragReorder() {
        const nav = document.querySelector('.sidebar-nav');
        if (!nav) return;

        // Inject drag handles and make items draggable
        nav.querySelectorAll('.nav-item').forEach(item => {
            if (item.querySelector('.nav-drag-handle')) return; // already injected
            item.setAttribute('draggable', 'true');
            const handle = document.createElement('span');
            handle.className = 'nav-drag-handle material-symbols-outlined';
            handle.textContent = 'drag_indicator';
            handle.setAttribute('aria-hidden', 'true');
            item.appendChild(handle);
        });

        let dragSrc = null;

        nav.addEventListener('dragstart', e => {
            const item = e.target.closest('.nav-item');
            if (!item) return;
            dragSrc = item;
            item.classList.add('nav-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.dataset.view);
        });

        nav.addEventListener('dragend', () => {
            nav.querySelectorAll('.nav-item').forEach(i => {
                i.classList.remove('nav-dragging', 'nav-drag-over-top', 'nav-drag-over-bot');
            });
            dragSrc = null;
        });

        nav.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const item = e.target.closest('.nav-item');
            if (!item || item === dragSrc) return;
            nav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('nav-drag-over-top', 'nav-drag-over-bot'));
            const rect   = item.getBoundingClientRect();
            const midY   = rect.top + rect.height / 2;
            item.classList.add(e.clientY < midY ? 'nav-drag-over-top' : 'nav-drag-over-bot');
        });

        nav.addEventListener('dragleave', e => {
            const item = e.target.closest('.nav-item');
            if (item) item.classList.remove('nav-drag-over-top', 'nav-drag-over-bot');
        });

        nav.addEventListener('drop', e => {
            e.preventDefault();
            if (!dragSrc) return;
            const target = e.target.closest('.nav-item');
            if (!target || target === dragSrc) return;
            const rect  = target.getBoundingClientRect();
            const after = e.clientY >= rect.top + rect.height / 2;
            nav.insertBefore(dragSrc, after ? target.nextSibling : target);

            // Persist
            const order = [...nav.querySelectorAll('.nav-item')].map(i => i.dataset.view);
            localStorage.setItem('dp_nav_order', JSON.stringify(order));
        });
    }

    // ── Navigation binding ───────────────────────────────────────────────────

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
        const validViews = ["strategy", "intake", "optimizer", "finance", "kanban", "schedule", "gantt", "resources", "synthesizer", "audit", "raid"];
        
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
            kanban: { title: "Sprint Kanban Board", desc: "Agile sprint execution and task-level state tracking boards" },            schedule: { title: "WBS Schedule", desc: "Work breakdown structure with tasks, milestones, dates, and dependencies" },            gantt: { title: "AI Gantt Timeline", desc: "Horizontal schedule delivery timelines, milestone phase gates, and critical path analysis" },
            resources: { title: "Resource Allocator", desc: "Weekly workload bandwidth matrices and allocations tracking" },
            synthesizer: { title: "Executive Synthesizer", desc: "One-click executive briefs and print-ready presentation briefs" },
            audit: { title: "Audit Log Ledger", desc: "Chronological transaction snapshots log and rollback controllers" },
            raid: { title: "RAID & Change Log", desc: "Risks, Issues, Assumptions, Decisions and Change Requests per project" }
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
                const group = nodeId && (state.programGroups || PROGRAM_GROUPS)[nodeId];
                return { name: group ? `Program: ${group.name}` : "Program", icon: "account_tree" };
            }
            if (activeLevel === "project") {
                const scope = nodeId && state.scopes.find(s => s.id === nodeId);
                return { name: scope ? `Project: ${scope.name}` : "Project", icon: "article" };
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
                const denom = b.metric.target - b.metric.baseline;
                if (denom !== 0) sumPcts += ((b.metric.current - b.metric.baseline) / denom) * 100;
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
            programContainer.innerHTML = Object.entries(state.programGroups || PROGRAM_GROUPS).map(([id, g]) => {
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

        // ── Derive report title + sponsor/PM from active hierarchy ──
        const level  = state.scenario.activeHierarchyLevel || 'enterprise';
        const nodeId = state.scenario.activeNodeId;
        let reportTitle, reportSponsor, reportManager, reportSubtitle;

        if (level === 'project' && nodeId) {
            const scope      = state.scopes.find(s => s.id === nodeId);
            reportTitle      = scope ? scope.name : 'Project Report';
            reportSubtitle   = 'Project Health Report';
            reportSponsor    = scope?.sponsor || '—';
            reportManager    = scope?.projectManager || '—';
        } else if (level === 'program' && nodeId) {
            const group      = (state.programGroups || PROGRAM_GROUPS)[nodeId];
            reportTitle      = group ? `${group.name} Program` : 'Program Report';
            reportSubtitle   = 'Program Health Report';
            // Derive from member scopes — use first scope's sponsor/PM
            const memberScope = group ? state.scopes.find(s => group.scopeIds.includes(s.id)) : null;
            reportSponsor    = memberScope?.sponsor || '—';
            reportManager    = memberScope?.projectManager || '—';
        } else if (level === 'portfolio') {
            reportTitle      = state.strategy[0]?.title || 'Portfolio';
            reportSubtitle   = 'Portfolio Health Report';
            reportSponsor    = state.strategy[0]?.sponsor || '—';
            reportManager    = state.strategy[0]?.portfolioManager || '—';
        } else {
            // enterprise
            reportTitle      = 'Enterprise Portfolio';
            reportSubtitle   = 'Enterprise Portfolio Health Report';
            reportSponsor    = state.strategy[0]?.sponsor || '—';
            reportManager    = state.strategy[0]?.portfolioManager || '—';
        }
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 24px; max-width: 900px; margin: 0 auto; padding-top: 10px;">
                <div class="glass-panel" style="display:flex; justify-content:flex-end; align-items:center;">
                    <button id="export-brief-pdf-btn" class="btn btn-primary">
                        <span class="material-symbols-outlined">print</span>
                        <span>Export Presentation Brief (PDF)</span>
                    </button>
                </div>

                <div class="glass-panel" style="display:flex; flex-direction:column; gap:20px;">
                    <div style="border-bottom: 2px solid var(--glass-border); padding-bottom: 12px; display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin-bottom:4px;">${escapeHtml(reportSubtitle)}</div>
                            <h4 style="font-size:17px;line-height:1.25;max-width:540px;">${escapeHtml(reportTitle)}</h4>
                            <div style="display:flex;gap:20px;margin-top:8px;">
                                <span style="font-size:11px;color:var(--color-text-muted);"><span style="font-weight:600;color:var(--color-text-secondary);">Sponsor:</span> ${escapeHtml(reportSponsor)}</span>
                                <span style="font-size:11px;color:var(--color-text-muted);"><span style="font-weight:600;color:var(--color-text-secondary);">Manager:</span> ${escapeHtml(reportManager)}</span>
                                <span style="font-size:11px;color:var(--color-text-muted);"><span style="font-weight:600;color:var(--color-text-secondary);">Date:</span> ${new Date().toLocaleDateString('en-NZ',{day:'numeric',month:'long',year:'numeric'})}</span>
                            </div>
                        </div>
                        <span class="tier-badge" style="background: hsla(165,80%,45%,0.1); color: var(--color-success);flex-shrink:0;">Q3 High-Confidence</span>
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

                    <!-- Key Milestones -->
                    <div style="border-top:1px solid var(--glass-border); padding-top:16px;">
                        <h5 style="text-transform:uppercase; font-size:11px; color:var(--color-text-secondary); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                            <span class="material-symbols-outlined" style="font-size:14px;">flag</span>Key Project Milestones
                        </h5>
                        ${(() => {
                            const milestones = state.tasks
                                .filter(t => t.isMilestone && !t.isArchived)
                                .sort((a, b) => (a.startDate || '') < (b.startDate || '') ? -1 : 1);
                            if (!milestones.length) return `<p style="font-size:12px;color:var(--color-text-muted);font-style:italic;padding:8px 0;">No milestones defined.</p>`;
                            const scopeMap = Object.fromEntries(state.scopes.map(s => [s.id, s.name]));
                            const statusColor = { 'done': 'var(--color-success)', 'in-progress': 'var(--accent-indigo)', 'to-do': 'var(--color-text-muted)', 'review': 'var(--color-warning)' };
                            return milestones.map(m => `
                                <div class="ledger-item" style="padding:10px 16px;">
                                    <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
                                        <span style="font-size:11px;color:var(--accent-indigo);flex-shrink:0;">◆</span>
                                        <div style="min-width:0;">
                                            <b style="font-size:12px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.title}</b>
                                            <small style="color:var(--color-text-muted);font-size:10px;">${scopeMap[m.scopeId] || 'Unknown project'}</small>
                                        </div>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
                                        <span style="font-size:11px;color:var(--color-text-secondary);">${m.startDate || '—'}</span>
                                        <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;background:hsla(0,0%,100%,0.05);color:${statusColor[m.status] || 'var(--color-text-muted)'};">${(m.status || 'to-do').replace(/-/g, ' ').toUpperCase()}</span>
                                    </div>
                                </div>
                            `).join('');
                        })()}
                    </div>

                    <!-- RAID Summary -->
                    <div style="border-top:1px solid var(--glass-border); padding-top:16px;">
                        <h5 style="text-transform:uppercase; font-size:11px; color:var(--color-text-secondary); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                            <span class="material-symbols-outlined" style="font-size:14px;">shield_with_heart</span>RAID &amp; Change Request Summary
                        </h5>
                        ${(() => {
                            const raid = state.raidLogs || {};
                            const scopeMap = Object.fromEntries(state.scopes.map(s => [s.id, s.name]));
                            const activeStatuses = {
                                risks:       e => e.status === 'Open' || e.status === 'Mitigating',
                                issues:      e => e.status === 'Open' || e.status === 'In Progress',
                                assumptions: e => e.status === 'Active',
                                decisions:   e => e.status === 'Pending',
                                changes:     e => ['Submitted','Under Review','Draft'].includes(e.status)
                            };
                            const LEVEL_COLOR = { Critical:'var(--color-danger)', High:'var(--color-warning)', Medium:'var(--accent-indigo)', Low:'var(--color-success)' };
                            const STS_COLOR   = { Open:'var(--color-warning)', 'In Progress':'var(--accent-indigo)', Mitigating:'var(--accent-indigo)', Active:'var(--accent-indigo)', Pending:'var(--color-warning)', Submitted:'var(--accent-indigo)', 'Under Review':'var(--color-warning)', Draft:'var(--color-text-muted)' };
                            const ICONS       = { risks:'warning', issues:'bug_report', assumptions:'lightbulb', decisions:'gavel', changes:'change_circle' };
                            const COLORS      = { risks:'var(--color-warning)', issues:'var(--color-danger)', assumptions:'var(--accent-indigo)', decisions:'var(--color-success)', changes:'#a78bfa' };
                            const LABELS      = { risks:'Risks', issues:'Issues', assumptions:'Assumptions', decisions:'Decisions', changes:'Change Requests' };

                            // Build aggregate counts per type
                            let totals = { risks:0, issues:0, assumptions:0, decisions:0, changes:0 };
                            Object.values(raid).forEach(scopeLog => {
                                Object.keys(totals).forEach(type => {
                                    totals[type] += ((scopeLog[type] || []).filter(e => !e.isArchived && activeStatuses[type](e))).length;
                                });
                            });

                            // Collect open high-severity items across all scopes
                            const hotItems = [];
                            Object.entries(raid).forEach(([scopeId, scopeLog]) => {
                                const sName = scopeMap[scopeId] || scopeId;
                                (scopeLog.risks || []).filter(e => !e.isArchived && e.status === 'Open' && (e.probability === 'High' || e.impact === 'High')).forEach(e => {
                                    hotItems.push({ type: 'risks', label: e.title, sub: `${e.probability}×${e.impact} · ${sName}`, color: 'var(--color-warning)' });
                                });
                                (scopeLog.issues || []).filter(e => !e.isArchived && ['Critical','High'].includes(e.priority) && e.status !== 'Resolved' && e.status !== 'Closed').forEach(e => {
                                    hotItems.push({ type: 'issues', label: e.title, sub: `${e.priority} · ${sName}`, color: 'var(--color-danger)' });
                                });
                                (scopeLog.changes || []).filter(e => !e.isArchived && e.status === 'Under Review' && ['Critical','High'].includes(e.priority)).forEach(e => {
                                    const cd = Number(e.costDelta)||0;
                                    const sd = Number(e.scheduleDelta)||0;
                                    hotItems.push({ type: 'changes', label: e.title, sub: `${e.changeType}${cd ? ` · ${cd>=0?'+':''}$${Math.abs(cd).toLocaleString()}` : ''}${sd ? ` · ${sd>=0?'+':''}${sd}d` : ''} · ${sName}`, color: '#a78bfa' });
                                });
                            });

                            const totalActive = Object.values(totals).reduce((a,b)=>a+b,0);

                            return `
                                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px;">
                                    ${Object.keys(totals).map(type => `
                                        <div style="background:var(--bg-card);border:1px solid var(--glass-border);border-radius:8px;padding:10px 12px;text-align:center;">
                                            <span class="material-symbols-outlined" style="font-size:16px;color:${COLORS[type]};display:block;margin-bottom:4px;">${ICONS[type]}</span>
                                            <div style="font-size:20px;font-weight:700;font-family:'Outfit',sans-serif;color:${totals[type]>0?COLORS[type]:'var(--color-text-muted)'};">${totals[type]}</div>
                                            <div style="font-size:9px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.04em;margin-top:2px;">${LABELS[type]}</div>
                                        </div>
                                    `).join('')}
                                </div>
                                ${totalActive === 0
                                    ? `<p style="font-size:11px;color:var(--color-text-muted);font-style:italic;padding:4px 0;">No active RAID items or pending change requests.</p>`
                                    : hotItems.length === 0
                                        ? `<p style="font-size:11px;color:var(--color-text-muted);padding:4px 0;">No high-severity items requiring immediate attention.</p>`
                                        : `<div style="display:flex;flex-direction:column;gap:4px;">
                                            <div style="font-size:10px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;padding:0 0 4px;">Needs Attention</div>
                                            ${hotItems.slice(0,5).map(item => `
                                                <div class="ledger-item" style="padding:8px 12px;">
                                                    <span class="material-symbols-outlined" style="font-size:14px;color:${item.color};flex-shrink:0;">${ICONS[item.type]}</span>
                                                    <div style="flex:1;min-width:0;">
                                                        <div style="font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.label}</div>
                                                        <div style="font-size:10px;color:var(--color-text-muted);">${item.sub}</div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                            ${hotItems.length > 5 ? `<div style="font-size:10px;color:var(--color-text-muted);padding:4px 12px;">+${hotItems.length-5} more items — see RAID & Change Log for full details.</div>` : ''}
                                        </div>`
                                }
                            `;
                        })()}
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
