/* ==========================================================================
   DELIVERYPRO.AI - WBS SCHEDULE VIEW (TASKS & MILESTONES)
   Tasks and milestones share state.tasks with KanbanView — editing in
   either view is immediately reflected in the other.
   ========================================================================== */

import { store, isScopeInHierarchy, hasCyclicDependencies } from './store.js';
import { openTaskModal } from './taskModal.js';

class ScheduleView {
    constructor() {
        this.containerId = "view-content";
        this._dragSrcId = null;
        this._sort = { col: null, dir: 'asc' };
        this._filters = { status: '', type: '', assignee: '', name: '' };
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const includedScopeIds = state.scenario.includedProjectIds;

        const groups = state.scopes
            .filter(scope =>
                !scope.isArchived &&
                includedScopeIds.includes(scope.id) &&
                isScopeInHierarchy(scope.id, state)
            )
            .map((scope, idx) => {
                const tasks = state.tasks.filter(t => !t.isArchived && t.scopeId === scope.id);
                return { scope, tasks, scopeNum: idx + 1 };
            });

        const totalItems = groups.reduce((n, g) => n + g.tasks.length, 0);
        const milestoneCount = groups.reduce((n, g) => n + g.tasks.filter(t => t.isMilestone).length, 0);
        const uniqueAssignees = [...new Set(groups.flatMap(g => g.tasks).map(t => t.assignee).filter(Boolean))].sort();
        const _s = col => this._sort.col === col
            ? `<span style="color:var(--accent-indigo);font-size:9px;margin-left:2px;">${this._sort.dir === 'asc' ? '▲' : '▼'}</span>`
            : `<span style="opacity:0.25;font-size:9px;margin-left:2px;">▲</span>`;

        const hasCycles = hasCyclicDependencies(state.tasks);
        container.innerHTML = `
            <div class="schedule-container">
                ${hasCycles ? `<div class="cycle-warning-banner"><span class="material-symbols-outlined" style="font-size:15px;vertical-align:middle;margin-right:6px;">warning</span><strong>Circular task dependencies detected</strong> — schedule order may be inaccurate. Check dependency arrows below.</div>` : ''}
                <div class="schedule-toolbar">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:13px;color:var(--color-text-secondary);">
                            <b style="color:var(--color-text-primary);">${totalItems}</b> items
                            <span style="margin:0 6px;color:var(--glass-border);">|</span>
                            <span class="milestone-diamond">◆</span> <b>${milestoneCount}</b> milestones
                            <span style="margin:0 6px;color:var(--glass-border);">|</span>
                            ${groups.length} projects
                        </span>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button class="btn btn-secondary" id="sched-add-task-btn" style="display:flex;align-items:center;gap:6px;font-size:12px;padding:8px 14px;">
                            <span class="material-symbols-outlined" style="font-size:15px;">add</span>Add Task
                        </button>
                        <button class="btn btn-secondary" id="sched-add-milestone-btn" style="display:flex;align-items:center;gap:6px;font-size:12px;padding:8px 14px;border-color:var(--accent-indigo);color:var(--accent-indigo);">
                            <span class="material-symbols-outlined" style="font-size:15px;">diamond</span>Add Milestone
                        </button>
                    </div>
                </div>

                <div class="schedule-table-wrap">
                    <table class="schedule-table">
                        <colgroup>
                            <col style="width:28px">
                            <col style="width:52px">
                            <col style="width:28px">
                            <col>
                            <col style="width:98px">
                            <col style="width:98px">
                            <col style="width:60px">
                            <col style="width:140px">
                            <col style="width:110px">
                            <col style="width:90px">
                        </colgroup>
                        <thead>
                            <tr>
                                <th style="padding-left:8px;"></th>
                                <th class="sched-sort-th" data-sort="wbs">WBS ${_s('wbs')}</th>
                                <th class="sched-sort-th" data-sort="type">Type ${_s('type')}</th>
                                <th class="sched-sort-th" data-sort="name">Name ${_s('name')}</th>
                                <th class="sched-sort-th" data-sort="start">Start ${_s('start')}</th>
                                <th class="sched-sort-th" data-sort="finish">Finish ${_s('finish')}</th>
                                <th class="sched-sort-th" data-sort="dur" style="text-align:center;">Dur. ${_s('dur')}</th>
                                <th class="sched-sort-th" data-sort="assignee">Assigned To ${_s('assignee')}</th>
                                <th>Predecessors</th>
                                <th class="sched-sort-th" data-sort="status">Status ${_s('status')}</th>
                            </tr>
                            <tr class="sched-filter-row">
                                <th></th>
                                <th></th>
                                <th>
                                    <select class="sched-filter" data-filter="type">
                                        <option value="">All</option>
                                        <option value="task" ${this._filters.type==='task'?'selected':''}>Tasks</option>
                                        <option value="milestone" ${this._filters.type==='milestone'?'selected':''}>◆ Miles.</option>
                                    </select>
                                </th>
                                <th><input type="text" class="sched-filter" data-filter="name" placeholder="Filter name…" value="${this._filters.name}"></th>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th>
                                    <select class="sched-filter" data-filter="assignee">
                                        <option value="">All</option>
                                        ${uniqueAssignees.map(a => `<option value="${a}" ${this._filters.assignee===a?'selected':''}>${a.split(' ')[0]}</option>`).join('')}
                                    </select>
                                </th>
                                <th></th>
                                <th>
                                    <select class="sched-filter" data-filter="status">
                                        <option value="">All</option>
                                        <option value="todo" ${this._filters.status==='todo'?'selected':''}>To Do</option>
                                        <option value="in_progress" ${this._filters.status==='in_progress'?'selected':''}>In Progress</option>
                                        <option value="review" ${this._filters.status==='review'?'selected':''}>Review</option>
                                        <option value="done" ${this._filters.status==='done'?'selected':''}>Done</option>
                                    </select>
                                </th>
                            </tr>
                        </thead>
                        <tbody id="schedule-tbody">
                            ${this._buildRows(groups, state.tasks)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this._bindEvents(state);
    }

    // -------------------------------------------------------------------------
    // Table building — supports nested tasks via parentTaskId
    // -------------------------------------------------------------------------

    _buildRows(groups, allTasks) {
        if (groups.length === 0 || groups.every(g => g.tasks.length === 0)) {
            return `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--color-text-muted);">
                No items visible at the current hierarchy level.<br>
                <small>Include projects in the Portfolio Optimizer to show them here.</small>
            </td></tr>`;
        }

        // Build wbsMap with hierarchical numbers e.g. "1.2.1"
        const wbsMap = {};
        groups.forEach(({ tasks, scopeNum }) => {
            // Separate root tasks (no parent, or parent not in this scope) from children
            const scopeTaskIds = new Set(tasks.map(t => t.id));
            const rootTasks = tasks.filter(t => !t.parentTaskId || !scopeTaskIds.has(t.parentTaskId));

            const assignWbs = (taskList, prefix) => {
                taskList.forEach((t, i) => {
                    const wbs = `${prefix}.${i + 1}`;
                    wbsMap[t.id] = wbs;
                    const children = tasks.filter(c => c.parentTaskId === t.id);
                    if (children.length) assignWbs(children, wbs);
                });
            };
            assignWbs(rootTasks, String(scopeNum));
        });

        let html = '';
        groups.forEach(({ scope, tasks, scopeNum }) => {
            html += `
                <tr class="wbs-group-row" data-scope-id="${scope.id}">
                    <td style="padding-left:8px;"></td>
                    <td class="wbs-num">${scopeNum}</td>
                    <td><span class="material-symbols-outlined" style="font-size:14px;color:var(--accent-indigo);vertical-align:middle;">folder_open</span></td>
                    <td colspan="7">
                        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                            <span style="font-weight:700;font-size:12px;color:var(--color-text-primary);">${scope.name}</span>
                            <span style="font-size:10px;color:var(--color-text-muted);">${scope.status} · ${scope.progress}% complete</span>
                            <button class="wbs-inline-add-btn" data-scope="${scope.id}" data-type="task" title="Add task">
                                <span class="material-symbols-outlined" style="font-size:12px;">add</span>Task
                            </button>
                            <button class="wbs-inline-add-btn wbs-milestone-add-btn" data-scope="${scope.id}" data-type="milestone" title="Add milestone">
                                <span class="material-symbols-outlined" style="font-size:12px;">diamond</span>Milestone
                            </button>
                        </div>
                    </td>
                </tr>`;

            // Apply active filters
            let filteredTasks = tasks;
            if (this._filters.type === 'task') filteredTasks = filteredTasks.filter(t => !t.isMilestone);
            if (this._filters.type === 'milestone') filteredTasks = filteredTasks.filter(t => t.isMilestone);
            if (this._filters.status) filteredTasks = filteredTasks.filter(t => t.status === this._filters.status);
            if (this._filters.assignee) filteredTasks = filteredTasks.filter(t => t.assignee === this._filters.assignee);
            if (this._filters.name) filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(this._filters.name.toLowerCase()));

            if (filteredTasks.length === 0) {
                const msg = tasks.length === 0 ? 'No tasks yet — add one above.' : 'No tasks match the active filters.';
                html += `<tr><td colspan="10" style="padding:10px 12px 10px 48px;color:var(--color-text-muted);font-size:11px;font-style:italic;">${msg}</td></tr>`;
            } else {
                // Render tree depth-first with filtered + sorted root tasks
                const filteredIds = new Set(filteredTasks.map(t => t.id));
                const rootTasks = this._sortTasks(filteredTasks.filter(t => !t.parentTaskId || !filteredIds.has(t.parentTaskId)));
                html += this._renderTaskTree(rootTasks, filteredTasks, wbsMap, 0);
            }
        });

        return html;
    }

    _renderTaskTree(taskList, allScopeTasks, wbsMap, depth) {
        let html = '';
        taskList.forEach(task => {
            html += this._buildTaskRow(task, wbsMap[task.id] || '?', wbsMap, depth);
            // Insert hover-insert row between/after each task
            html += `<tr class="wbs-insert-row" data-after-id="${task.id}" data-scope-id="${task.scopeId}">
                <td colspan="10">
                    <div class="wbs-insert-row-inner">
                        <button class="wbs-insert-btn" data-after="${task.id}" data-scope="${task.scopeId}" data-type="task">
                            <span class="material-symbols-outlined" style="font-size:13px;">add</span> Task
                        </button>
                        <button class="wbs-insert-btn wbs-insert-milestone-btn" data-after="${task.id}" data-scope="${task.scopeId}" data-type="milestone">
                            <span class="material-symbols-outlined" style="font-size:13px;">diamond</span> Milestone
                        </button>
                        <button class="wbs-insert-btn wbs-insert-subtask-btn" data-after="${task.id}" data-scope="${task.scopeId}" data-type="task" data-parent="${task.id}">
                            <span class="material-symbols-outlined" style="font-size:13px;">subdirectory_arrow_right</span> Sub-task
                        </button>
                    </div>
                </td>
            </tr>`;
            // Render children (sorted)
            const children = this._sortTasks(allScopeTasks.filter(c => c.parentTaskId === task.id));
            if (children.length > 0) {
                html += this._renderTaskTree(children, allScopeTasks, wbsMap, depth + 1);
            }
        });
        return html;
    }

    _buildTaskRow(task, wbsNum, wbsMap, depth = 0) {
        const isMilestone = !!task.isMilestone;
        const start = task.startDate || '';
        const end = task.endDate || '';
        const startDisplay = start || '—';
        const endDisplay = isMilestone ? (start || '—') : (end || '—');

        const dur = this._getDuration(start, isMilestone ? start : end);
        const durDisplay = isMilestone
            ? `<span class="milestone-diamond" title="Milestone">◆</span>`
            : (dur !== null ? `${dur}d` : '—');

        const initials = task.assignee
            ? task.assignee.split(' ').map(n => n[0]).join('').substring(0, 3)
            : '?';
        const firstName = task.assignee ? task.assignee.split(' ')[0] : '—';

        const depBadges = (task.dependencies || [])
            .map(depId => {
                const wbs = wbsMap[depId];
                if (!wbs) return `<span class="dep-badge" title="${depId}">?</span>`;
                return `<span class="dep-badge" title="Predecessor">${wbs}</span>`;
            }).join('');

        const statusColors = {
            todo: 'var(--color-text-muted)',
            in_progress: 'var(--accent-indigo)',
            review: 'var(--color-warning)',
            done: 'var(--color-success)'
        };
        const statusLabels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
        const statusColor = statusColors[task.status] || 'var(--color-text-muted)';
        const statusLabel = statusLabels[task.status] || task.status;

        const rowClass = isMilestone ? 'wbs-milestone-row' : 'wbs-task-row';
        // Indentation: 12px per depth level, shown via padding-left on the name cell
        const indent = depth * 20;

        return `
            <tr class="${rowClass}" draggable="true" data-task-id="${task.id}" data-depth="${depth}">
                <td class="wbs-drag-handle" title="Drag to reorder">
                    <span class="material-symbols-outlined" style="font-size:15px;color:var(--color-text-muted);vertical-align:middle;">drag_indicator</span>
                </td>
                <td class="wbs-num">${wbsNum}</td>
                <td class="wbs-type-cell" style="text-align:center;">
                    ${isMilestone
                        ? `<span class="milestone-diamond" title="Milestone">◆</span>`
                        : `<span class="material-symbols-outlined" style="font-size:14px;color:var(--color-text-muted);vertical-align:middle;" title="Task">task_alt</span>`
                    }
                </td>
                <td style="padding-left:${12 + indent}px;">
                    <div class="wbs-name-cell">
                        ${depth > 0 ? `<span class="wbs-indent-connector" style="--depth:${depth}"></span>` : ''}
                        <span class="wbs-task-title${isMilestone ? ' wbs-milestone-title' : ''}">${task.title}</span>
                        ${task.weight ? `<span class="wbs-weight-badge">${task.weight}pt</span>` : ''}
                    </div>
                </td>
                <td class="wbs-date">${startDisplay}</td>
                <td class="wbs-date">${endDisplay}</td>
                <td class="wbs-dur" style="text-align:center;">${durDisplay}</td>
                <td class="wbs-assignee">
                    <span class="assignee-avatar" style="width:22px;height:22px;font-size:9px;flex-shrink:0;" title="${task.assignee || ''}">${initials}</span>
                    <span style="font-size:11px;margin-left:6px;color:var(--color-text-secondary);">${firstName}</span>
                </td>
                <td class="wbs-deps">
                    ${depBadges || '<span style="color:var(--color-text-muted);font-size:11px;">—</span>'}
                </td>
                <td class="wbs-status">
                    <span style="font-size:10px;font-weight:700;color:${statusColor};">${statusLabel}</span>
                </td>
            </tr>`;
    }

    _getDuration(startDate, endDate) {
        if (!startDate || !endDate) return null;
        const diff = Math.round((new Date(endDate) - new Date(startDate)) / 86400000);
        return diff >= 0 ? diff : null;
    }

    _sortTasks(tasks) {
        if (!this._sort.col) return tasks;
        return [...tasks].sort((a, b) => {
            let va, vb;
            switch (this._sort.col) {
                case 'name':     va = a.title;       vb = b.title;       break;
                case 'start':    va = a.startDate || '';  vb = b.startDate || '';  break;
                case 'finish':   va = (a.isMilestone ? a.startDate : a.endDate) || '';  vb = (b.isMilestone ? b.startDate : b.endDate) || '';  break;
                case 'dur':      va = this._getDuration(a.startDate, a.isMilestone ? a.startDate : a.endDate) ?? -1;
                                 vb = this._getDuration(b.startDate, b.isMilestone ? b.startDate : b.endDate) ?? -1; break;
                case 'assignee': va = a.assignee || '';  vb = b.assignee || '';  break;
                case 'status':   va = a.status || '';    vb = b.status || '';    break;
                case 'type':     va = a.isMilestone ? '1' : '0';  vb = b.isMilestone ? '1' : '0';  break;
                default: return 0;
            }
            const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
            return this._sort.dir === 'asc' ? cmp : -cmp;
        });
    }

    // -------------------------------------------------------------------------
    // Event binding
    // -------------------------------------------------------------------------

    _bindEvents(state) {
        document.getElementById('sched-add-task-btn')?.addEventListener('click', () => {
            openTaskModal(null, store.state, { prefillMilestone: false });
        });
        document.getElementById('sched-add-milestone-btn')?.addEventListener('click', () => {
            openTaskModal(null, store.state, { prefillMilestone: true });
        });

        // Per-scope inline add buttons (in group header)
        document.querySelectorAll('.wbs-inline-add-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                openTaskModal(null, store.state, {
                    prefillScopeId: btn.dataset.scope,
                    prefillMilestone: btn.dataset.type === 'milestone',
                });
            });
        });

        // Hover insert-row buttons
        document.querySelectorAll('.wbs-insert-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                openTaskModal(null, store.state, {
                    prefillScopeId:   btn.dataset.scope,
                    prefillMilestone: btn.dataset.type === 'milestone',
                    insertAfterId:    btn.dataset.after || null,
                    prefillParentId:  btn.dataset.parent || null,
                });
            });
        });

        // Row click → edit (ignore drag handle and insert buttons)
        document.querySelectorAll('.wbs-task-row, .wbs-milestone-row').forEach(row => {
            row.addEventListener('click', e => {
                if (e.target.closest('.wbs-drag-handle')) return;
                openTaskModal(row.dataset.taskId, store.state);
            });
        });

        // ── Sort header clicks ─────────────────────────────────────────────
        document.querySelectorAll('.sched-sort-th').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.sort;
                if (this._sort.col === col) {
                    this._sort.dir = this._sort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    this._sort.col = col;
                    this._sort.dir = 'asc';
                }
                this.render(store.state);
            });
        });

        // ── Filter controls ────────────────────────────────────────────────
        document.querySelectorAll('.sched-filter').forEach(el => {
            el.addEventListener('click', e => e.stopPropagation());
            el.addEventListener('change', () => {
                this._filters[el.dataset.filter] = el.value;
                this.render(store.state);
            });
        });

        this._bindDragReorder();
    }

    _bindDragReorder() {
        const rows = document.querySelectorAll('.wbs-task-row, .wbs-milestone-row');
        let dragSrcId = null;

        rows.forEach(row => {
            row.addEventListener('dragstart', e => {
                dragSrcId = row.dataset.taskId;
                row.classList.add('wbs-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', dragSrcId);
            });
            row.addEventListener('dragend', () => {
                row.classList.remove('wbs-dragging');
                document.querySelectorAll('.wbs-drag-over-top, .wbs-drag-over-bottom').forEach(el =>
                    el.classList.remove('wbs-drag-over-top', 'wbs-drag-over-bottom')
                );
            });
            row.addEventListener('dragover', e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const rect = row.getBoundingClientRect();
                row.classList.remove('wbs-drag-over-top', 'wbs-drag-over-bottom');
                row.classList.add(e.clientY < rect.top + rect.height / 2 ? 'wbs-drag-over-top' : 'wbs-drag-over-bottom');
            });
            row.addEventListener('dragleave', () => {
                row.classList.remove('wbs-drag-over-top', 'wbs-drag-over-bottom');
            });
            row.addEventListener('drop', e => {
                e.preventDefault();
                row.classList.remove('wbs-drag-over-top', 'wbs-drag-over-bottom');
                const targetId = row.dataset.taskId;
                if (!dragSrcId || dragSrcId === targetId) return;
                const rect = row.getBoundingClientRect();
                const insertBefore = e.clientY < rect.top + rect.height / 2;
                const capturedSrcId = dragSrcId;
                store.commitTransaction('Reorder WBS items', 'Schedule View', state => {
                    const srcIdx = state.tasks.findIndex(t => t.id === capturedSrcId);
                    const [removed] = state.tasks.splice(srcIdx, 1);
                    const newTgtIdx = state.tasks.findIndex(t => t.id === targetId);
                    state.tasks.splice(insertBefore ? newTgtIdx : newTgtIdx + 1, 0, removed);
                });
                dragSrcId = null;
            });
        });

        document.querySelectorAll('.wbs-group-row').forEach(row => {
            row.addEventListener('dragover', e => { e.preventDefault(); row.style.outline = '2px dashed var(--accent-indigo)'; });
            row.addEventListener('dragleave', () => { row.style.outline = ''; });
            row.addEventListener('drop', e => {
                e.preventDefault();
                row.style.outline = '';
                const targetScopeId = row.dataset.scopeId;
                if (!dragSrcId || !targetScopeId) return;
                const capturedSrcId = dragSrcId;
                store.commitTransaction('Move item to project group', 'Schedule View', state => {
                    const src = state.tasks.find(t => t.id === capturedSrcId);
                    if (src) src.scopeId = targetScopeId;
                    const srcIdx = state.tasks.findIndex(t => t.id === capturedSrcId);
                    const [removed] = state.tasks.splice(srcIdx, 1);
                    let insertIdx = state.tasks.length;
                    for (let i = state.tasks.length - 1; i >= 0; i--) {
                        if (state.tasks[i].scopeId === targetScopeId) { insertIdx = i + 1; break; }
                    }
                    state.tasks.splice(insertIdx, 0, removed);
                });
                dragSrcId = null;
            });
        });
    }
}

export default ScheduleView;
