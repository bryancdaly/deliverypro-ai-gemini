/* ==========================================================================
   DELIVERYPRO.AI - AI GANTT CHART COMPONENT
   ========================================================================== */

import { store, isScopeInHierarchy } from './store.js';
import { openTaskModal } from './taskModal.js';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

class GanttView {
    constructor() {
        this.containerId = "view-content";
        // 1 = project groups only, 2 = groups + top-level tasks, 3 = all incl. sub-tasks
        this._wbsLevel = 2;
        this._milestonesOnly = false;
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const hierarchyLevel = state.scenario.activeHierarchyLevel || "enterprise";
        const activeProjectIds = state.scenario.includedProjectIds;

        // ── 1. Build scope groups (same filter as schedule view) ──────────────
        const groups = state.scopes
            .filter(s => !s.isArchived && activeProjectIds.includes(s.id) && isScopeInHierarchy(s.id, state))
            .map((scope, idx) => {
                const tasks = state.tasks.filter(t => !t.isArchived && t.scopeId === scope.id);
                return { scope, tasks, scopeNum: idx + 1 };
            });

        // ── 2. Build WBS map (identical algorithm to ScheduleView) ───────────
        const wbsMap = {}; // taskId → "1.2.1" string
        groups.forEach(({ tasks, scopeNum }) => {
            const scopeTaskIds = new Set(tasks.map(t => t.id));
            const rootTasks = tasks.filter(t => !t.parentTaskId || !scopeTaskIds.has(t.parentTaskId));
            const assignWbs = (list, prefix) => {
                list.forEach((t, i) => {
                    const wbs = `${prefix}.${i + 1}`;
                    wbsMap[t.id] = wbs;
                    const children = tasks.filter(c => c.parentTaskId === t.id);
                    if (children.length) assignWbs(children, wbs);
                });
            };
            assignWbs(rootTasks, String(scopeNum));
        });

        // ── 3. Build visible row list filtered by selected WBS level ─────────
        // row shapes: { type:'scope', scope, scopeNum }
        //             { type:'task',  task, wbs, depth }
        const rows = [];
        groups.forEach(({ scope, tasks, scopeNum }) => {
            rows.push({ type: 'scope', scope, scopeNum });
            if (this._wbsLevel >= 2 || this._milestonesOnly) {
                const scopeTaskIds = new Set(tasks.map(t => t.id));
                const rootTasks = tasks.filter(t => !t.parentTaskId || !scopeTaskIds.has(t.parentTaskId));
                const addTasks = (list, depth) => {
                    list.forEach(task => {
                        const wbs = wbsMap[task.id];
                        const wbsDepth = wbs ? wbs.split('.').length : 2;
                        const withinWbs = wbsDepth <= this._wbsLevel;
                        if (this._milestonesOnly ? task.isMilestone : withinWbs) {
                            rows.push({ type: 'task', task, wbs: wbs || '?', depth });
                        }
                        const children = tasks.filter(c => c.parentTaskId === task.id);
                        if (children.length && (this._wbsLevel >= 3 || this._milestonesOnly)) {
                            addTasks(children, depth + 1);
                        }
                    });
                };
                addTasks(rootTasks, 0);
            }
        });

        // ── 4. Compute date-aware timeline ───────────────────────────────────
        const allDates = rows
            .filter(r => r.type === 'task')
            .flatMap(r => [r.task.startDate, r.task.endDate].filter(Boolean))
            .map(d => new Date(d))
            .filter(d => !isNaN(d));

        let tlStart, tlEnd;
        if (allDates.length > 0) {
            tlStart = new Date(Math.min(...allDates));
            tlEnd   = new Date(Math.max(...allDates));
            // snap to month boundaries
            tlStart.setDate(1);
            tlEnd.setDate(1);
            tlEnd.setMonth(tlEnd.getMonth() + 1);
        } else {
            // fallback: 12-month rolling window starting this month
            tlStart = new Date(); tlStart.setDate(1);
            tlEnd = new Date(tlStart); tlEnd.setMonth(tlEnd.getMonth() + 12);
        }
        // Always show at least 3 months
        if ((tlEnd - tlStart) / 86400000 < 60) {
            tlEnd = new Date(tlStart); tlEnd.setMonth(tlEnd.getMonth() + 3);
        }

        const totalDays = Math.max(1, (tlEnd - tlStart) / 86400000);
        const taskCount = rows.filter(r => r.type === 'task').length;

        // Build month column headers
        const months = [];
        const cur = new Date(tlStart);
        while (cur < tlEnd) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }
        const minColPx = 56;
        const totalMinWidth = months.length * minColPx;

        const monthHeadersHtml = months.map(m => {
            const pctW = ((new Date(m.getFullYear(), m.getMonth() + 1, 1) - m) / (tlEnd - tlStart) * 100).toFixed(2);
            const yr = m.getFullYear() !== new Date().getFullYear() ? ` '${String(m.getFullYear()).slice(2)}` : '';
            return `<div class="gantt-month-col" style="min-width:${minColPx}px;width:${pctW}%;">
                ${MONTH_NAMES[m.getMonth()]}${yr}
            </div>`;
        }).join('');

        // ── 5. Build name + bar rows ─────────────────────────────────────────
        const nameRowsHtml = rows.map(r => {
            if (r.type === 'scope') {
                return `<div class="gantt-name-row gantt-scope-row" title="${r.scope.name}">
                    <span class="material-symbols-outlined" style="font-size:13px;color:var(--accent-indigo);flex-shrink:0;">folder_open</span>
                    <b style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.scope.name}</b>
                </div>`;
            }
            const indent = r.depth * 14;
            const isMil = !!r.task.isMilestone;
            return `<div class="gantt-name-row gantt-task-name-row gantt-clickable" data-task-id="${r.task.id}" style="padding-left:${14 + indent}px;cursor:pointer;" title="${r.task.title}">
                ${r.depth > 0 ? `<span class="wbs-indent-connector" style="flex-shrink:0;width:12px;height:12px;margin-right:3px;margin-bottom:-3px;"></span>` : ''}
                ${isMil
                    ? `<span class="milestone-diamond" style="font-size:10px;flex-shrink:0;margin-right:4px;">◆</span>`
                    : `<span class="material-symbols-outlined" style="font-size:12px;color:var(--color-text-muted);flex-shrink:0;margin-right:4px;">task_alt</span>`
                }
                <span class="gantt-wbs-num">${r.wbs}</span>
                <span class="gantt-task-label">${r.task.title}</span>
            </div>`;
        }).join('');

        const barRowsHtml = rows.map(r => {
            if (r.type === 'scope') {
                // Scope summary bar spans the earliest start → latest end of its tasks
                const sDates = r.scope ? state.tasks
                    .filter(t => !t.isArchived && t.scopeId === r.scope.id)
                    .flatMap(t => [t.startDate, t.endDate].filter(Boolean))
                    .map(d => new Date(d)).filter(d => !isNaN(d)) : [];
                if (sDates.length > 0) {
                    const sMin = new Date(Math.min(...sDates));
                    const sMax = new Date(Math.max(...sDates));
                    const left = Math.max(0, (sMin - tlStart) / 86400000 / totalDays * 100);
                    const width = Math.max(0.5, (sMax - sMin) / 86400000 / totalDays * 100);
                    return `<div class="gantt-row-line gantt-scope-bar-row">
                        <div class="gantt-bar gantt-scope-summary-bar" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%;"></div>
                    </div>`;
                }
                return `<div class="gantt-row-line gantt-scope-bar-row"></div>`;
            }

            const { startDate, endDate, isMilestone, title, status } = r.task;
            if (!startDate) {
                return `<div class="gantt-row-line">
                    <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:10px;color:var(--color-text-muted);white-space:nowrap;">No dates</span>
                </div>`;
            }

            const s = new Date(startDate);
            const e = endDate ? new Date(endDate) : new Date(startDate);
            const left = ((s - tlStart) / 86400000 / totalDays * 100).toFixed(2);
            const isLate = status !== 'done' && e < new Date();

            if (isMilestone) {
                return `<div class="gantt-row-line">
                    <div class="gantt-milestone-marker gantt-clickable" data-task-id="${r.task.id}" style="left:calc(${left}% - 7px);cursor:pointer;" title="${title}&#10;${startDate}">◆</div>
                </div>`;
            }

            const durDays = Math.max(1, (e - s) / 86400000);
            const width = Math.max(0.5, (durDays / totalDays * 100)).toFixed(2);
            const barColor = isLate ? 'background:var(--color-danger);' : '';
            return `<div class="gantt-row-line">
                <div class="gantt-bar gantt-clickable" data-task-id="${r.task.id}" style="left:${left}%;width:${width}%;${barColor};cursor:pointer;" title="${title}&#10;${startDate} → ${endDate || '?'}">
                    <span class="gantt-bar-label">${title}</span>
                </div>
            </div>`;
        }).join('');

        // ── 6. Render ─────────────────────────────────────────────────────────
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:16px;height:100%;">

                <!-- Toolbar row: level selector + AI simulator -->
                <div style="display:flex;align-items:stretch;gap:12px;flex-wrap:wrap;">

                    <!-- WBS Level Selector -->
                    <div class="glass-panel" style="margin:0;padding:12px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;">
                        <span class="material-symbols-outlined" style="font-size:16px;color:var(--accent-indigo);">account_tree</span>
                        <span style="font-size:12px;font-weight:600;color:var(--color-text-secondary);white-space:nowrap;">WBS Level</span>
                        <div class="gantt-level-selector">
                            <button class="gantt-level-btn${this._wbsLevel === 1 ? ' active' : ''}" data-level="1" title="Project groups only">1</button>
                            <button class="gantt-level-btn${this._wbsLevel === 2 ? ' active' : ''}" data-level="2" title="Top-level tasks">1.1</button>
                            <button class="gantt-level-btn${this._wbsLevel === 3 ? ' active' : ''}" data-level="3" title="All including sub-tasks">1.1.1</button>
                        </div>
                        <div style="width:1px;height:18px;background:var(--glass-border);"></div>
                        <button id="gantt-milestone-toggle" class="gantt-level-btn${this._milestonesOnly ? ' active' : ''}" title="Show milestones only">◆ Milestones</button>
                        <span style="font-size:11px;color:var(--color-text-muted);white-space:nowrap;">${taskCount} task${taskCount !== 1 ? 's' : ''}</span>
                    </div>

                    <!-- AI Delay Simulator -->
                    <div class="glass-panel realization-slider-panel" style="margin:0;flex:1;${hierarchyLevel === 'project' ? 'display:none' : 'display:flex'}">
                        <span class="material-symbols-outlined icon-btn" style="color:var(--color-warning);">warning</span>
                        <div class="r-slider-desc">
                            <h4>AI Dependency Bottleneck Simulator</h4>
                            <p>Simulate a schedule delay on "Fleet Procurement" to recalculate downstream impact cascades</p>
                        </div>
                        <div class="r-slider-control">
                            <input type="range" id="gantt-delay-simulator" min="0" max="6" value="${state.scenario.scheduleOffsets['scope-transport-fleet'] || 0}" style="accent-color:var(--color-warning);">
                            <div class="r-slider-label" id="gantt-delay-label" style="color:var(--color-warning);">+${state.scenario.scheduleOffsets['scope-transport-fleet'] || 0} months</div>
                        </div>
                    </div>
                </div>

                <!-- AI Delay Warning (compact, only visible when simulator > 0) -->
                <div id="gantt-warning-banner" style="display:none;align-items:flex-start;gap:10px;padding:8px 14px;border-radius:8px;border:1px solid hsla(30,100%,55%,0.3);background:hsla(30,100%,55%,0.05);">
                    <span class="material-symbols-outlined" style="font-size:14px;color:var(--color-warning);flex-shrink:0;margin-top:2px;">warning</span>
                    <div style="flex:1;min-width:0;">
                        <span style="font-size:12px;font-weight:600;color:var(--color-warning);">AI Delay Impact — </span><span id="gantt-warning-summary" style="font-size:12px;color:var(--color-text-secondary);"></span>
                        <button id="gantt-warning-expand" style="margin-left:8px;font-size:11px;color:var(--accent-indigo);background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;">▾ Detail</button>
                        <div id="gantt-warning-detail" style="display:none;margin-top:6px;font-size:11.5px;color:var(--color-text-secondary);line-height:1.5;"></div>
                    </div>
                </div>

                <!-- Gantt grid -->
                <div class="gantt-chart-wrap glass-panel" style="padding:0;flex:1;min-height:300px;">

                    <!-- Left names pane -->
                    <div class="gantt-left-names">
                        <div class="gantt-left-header">Task / Milestone</div>
                        <div class="gantt-left-list" id="gantt-names-list">
                            ${nameRowsHtml || '<div class="gantt-name-row" style="color:var(--color-text-muted);font-size:11px;font-style:italic;">No projects selected</div>'}
                        </div>
                    </div>

                    <!-- Right timeline pane -->
                    <div class="gantt-right-timeline">
                        <div class="gantt-timeline-header" id="gantt-timeline-header" style="min-width:${totalMinWidth}px;">
                            ${monthHeadersHtml}
                        </div>
                        <div class="gantt-timeline-grid" id="gantt-timeline-grid" style="min-width:${totalMinWidth}px;">
                            ${rows.length === 0
                                ? `<div style="padding:40px;text-align:center;color:var(--color-text-muted);font-size:12px;">No projects included. Select projects in the Portfolio Optimizer.</div>`
                                : barRowsHtml
                            }
                        </div>
                    </div>
                </div>


            </div>
        `;

        this._bindEvents(state);
    }

    _bindEvents(state) {
        // ── Task / bar click → open edit modal ────────────────────────────────
        document.querySelectorAll('.gantt-clickable[data-task-id]').forEach(el => {
            el.addEventListener('click', e => {
                e.stopPropagation();
                openTaskModal(el.dataset.taskId, store.state);
            });
        });

        // ── Level selector ────────────────────────────────────────────────────
        document.querySelectorAll('.gantt-level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._wbsLevel = parseInt(btn.dataset.level);
                this.render(store.state);
            });
        });

        // ── Sync vertical scroll between names pane and bar grid ──────────────
        const namesList = document.getElementById('gantt-names-list');
        const grid      = document.getElementById('gantt-timeline-grid');
        const hdr       = document.getElementById('gantt-timeline-header');

        if (namesList && grid) {
            namesList.addEventListener('scroll', () => { grid.scrollTop = namesList.scrollTop; });
            grid.addEventListener('scroll', () => {
                namesList.scrollTop = grid.scrollTop;
                if (hdr) hdr.scrollLeft = grid.scrollLeft;
            });
            if (hdr) {
                hdr.addEventListener('scroll', () => { grid.scrollLeft = hdr.scrollLeft; });
            }
        }

        // ── Milestone filter toggle ───────────────────────────────────────────
        const milestoneToggle = document.getElementById('gantt-milestone-toggle');
        if (milestoneToggle) {
            milestoneToggle.addEventListener('click', () => {
                this._milestonesOnly = !this._milestonesOnly;
                this.render(store.state);
            });
        }

        // ── AI Delay Simulator ────────────────────────────────────────────────
        const slider    = document.getElementById('gantt-delay-simulator');
        const sliderVal = document.getElementById('gantt-delay-label');

        if (slider) {
            slider.addEventListener('input', e => {
                const delay = parseInt(e.target.value);
                if (sliderVal) sliderVal.textContent = `+${delay} months`;
                const banner  = document.getElementById('gantt-warning-banner');
                const summary = document.getElementById('gantt-warning-summary');
                const detail  = document.getElementById('gantt-warning-detail');
                if (banner) banner.style.display = delay > 0 ? 'flex' : 'none';
                if (summary) summary.textContent = `Fleet Procurement +${delay}mo → Warehouse Safety Module pushed back.`;
                if (detail) detail.innerHTML = `Delaying <b>Fleet Procurement</b> by <b>${delay} months</b> pushes completion past Month ${10 + delay}, creating a critical path bottleneck for <b>Warehouse Safety Module</b> (depends on dock installations).<br><br><i>AI Recommendation:</i> Shift 2 FTEs from <i>Route Optimization</i> to accelerate dock gate installation, or run <b>AI Frontier Optimization</b> in Portfolio Optimizer.`;
            });

            slider.addEventListener('change', e => {
                const delay = parseInt(e.target.value);
                const fleetEnd = 2 + delay + 8;
                const safetyDelay = fleetEnd > 6 ? fleetEnd - 6 : 0;
                store.commitTransaction(
                    `Gantt Delay Simulation: Fleet Procurement +${delay} month${delay !== 1 ? 's' : ''}`,
                    'Gantt Simulator',
                    s => {
                        s.scenario.scheduleOffsets['scope-transport-fleet'] = delay;
                        s.scenario.scheduleOffsets['scope-safety-module'] = safetyDelay;
                    }
                );
            });
        }

        // ── Warning banner expand/collapse ───────────────────────────────────
        const warnExpand = document.getElementById('gantt-warning-expand');
        if (warnExpand) {
            warnExpand.addEventListener('click', () => {
                const detail = document.getElementById('gantt-warning-detail');
                if (!detail) return;
                const open = detail.style.display !== 'none';
                detail.style.display = open ? 'none' : 'block';
                warnExpand.textContent = open ? '▾ Detail' : '▴ Hide';
            });
        }
    }
}


export default GanttView;
