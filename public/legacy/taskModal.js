/* ==========================================================================
   DELIVERYPRO.AI - SHARED TASK / MILESTONE EDIT MODAL
   Used by both KanbanView and ScheduleView so the experience is identical
   regardless of where a task is opened.
   ========================================================================== */

import { store } from './store.js';

/**
 * Open the shared task modal for create or edit.
 *
 * @param {string|null} taskId       - Task ID to edit, or null to create new
 * @param {object}      state        - Current store.state snapshot
 * @param {object}      [opts]
 * @param {string}      opts.prefillScopeId    - Default scope when creating
 * @param {boolean}     opts.prefillMilestone  - Default to milestone type
 * @param {string}      opts.insertAfterId     - Insert new task after this ID
 * @param {string}      opts.prefillParentId   - Default parentTaskId
 */
export function openTaskModal(taskId, state, opts = {}) {
    const {
        prefillScopeId  = null,
        prefillMilestone = false,
        insertAfterId   = null,
        prefillParentId = null,
    } = opts;

    const modal     = document.getElementById('contribution-modal');
    const titleEl   = document.getElementById('contrib-modal-title');
    const bodyEl    = document.getElementById('contrib-modal-body');
    const closeBtn  = document.getElementById('contrib-modal-close');
    if (!modal || !bodyEl || !titleEl) return;

    closeBtn.onclick = () => modal.classList.add('hidden');
    modal.onclick    = e => { if (e.target === modal) modal.classList.add('hidden'); };
    modal.classList.remove('hidden');

    const isEdit   = !!taskId;
    const task     = isEdit ? state.tasks.find(t => t.id === taskId) : null;
    const isMilDef = isEdit ? !!task?.isMilestone : prefillMilestone;

    titleEl.textContent = isEdit
        ? `Edit ${task?.isMilestone ? 'Milestone' : 'Task'}: "${task?.title}"`
        : `New ${prefillMilestone ? 'Milestone' : 'Task'}`;

    // ---- Build select options ----
    const scopeOpts = state.scopes.filter(s => !s.isArchived).map(s =>
        `<option value="${s.id}" ${(task?.scopeId ?? prefillScopeId) === s.id ? 'selected' : ''}>${s.name}</option>`
    ).join('');

    const resourceOpts = state.resources.filter(r => !r.isArchived).map(r =>
        `<option value="${r.name}" ${task?.assignee === r.name ? 'selected' : ''}>${r.name} (${r.role})</option>`
    ).join('');

    const parentOpts = state.tasks
        .filter(t => !t.isArchived && !t.isMilestone && (!isEdit || t.id !== taskId))
        .map(t => {
            const sc = state.scopes.find(s => s.id === t.scopeId);
            const sel = (task?.parentTaskId ?? prefillParentId) === t.id ? 'selected' : '';
            return `<option value="${t.id}" ${sel}>[${sc?.name.substring(0,18) ?? '?'}] ${t.title.substring(0,50)}</option>`;
        }).join('');

    const existingDeps = task?.dependencies ?? [];

    // ---- Render modal HTML ----
    bodyEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:4px;width:100%;">

            <div class="contrib-form-group">
                <label>Title</label>
                <input type="text" id="task-modal-title"
                    value="${task ? task.title.replace(/"/g, '&quot;') : ''}"
                    placeholder="${isMilDef ? 'e.g. Fleet Procurement Go-Live' : 'e.g. Integrate payment gateway API'}" autofocus>
            </div>

            <div class="contrib-form-row">
                <div class="contrib-form-group">
                    <label>Project Scope</label>
                    <select id="task-modal-scope">${scopeOpts}</select>
                </div>
                <div class="contrib-form-group">
                    <label>Assigned To</label>
                    <select id="task-modal-assignee">${resourceOpts}</select>
                </div>
            </div>

            <div class="contrib-form-group">
                <label>Parent Task <span style="font-size:10px;color:var(--color-text-muted);font-weight:400;">(optional — nests this item as a sub-task)</span></label>
                <select id="task-modal-parent">
                    <option value="">— None (top-level) —</option>
                    ${parentOpts}
                </select>
            </div>

            <div class="contrib-form-row" style="align-items:end;">
                <div class="contrib-form-group" style="flex-direction:row;align-items:center;gap:10px;padding:10px 0 6px;flex:0 0 auto;">
                    <input type="checkbox" id="task-modal-milestone" ${isMilDef ? 'checked' : ''}
                        style="width:16px;height:16px;accent-color:var(--accent-indigo);cursor:pointer;flex-shrink:0;">
                    <div>
                        <label for="task-modal-milestone" style="cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
                            <span class="milestone-diamond">◆</span> Milestone
                        </label>
                        <p style="font-size:10px;color:var(--color-text-muted);margin-top:2px;">Start = Finish, no duration</p>
                    </div>
                </div>
                <div class="contrib-form-group">
                    <label>Status</label>
                    <select id="task-modal-status">
                        <option value="todo"        ${(!task || task.status === 'todo')        ? 'selected' : ''}>To Do</option>
                        <option value="in_progress" ${task?.status === 'in_progress'           ? 'selected' : ''}>In Progress</option>
                        <option value="review"      ${task?.status === 'review'                ? 'selected' : ''}>AI Review</option>
                        <option value="done"        ${task?.status === 'done'                  ? 'selected' : ''}>Done</option>
                    </select>
                </div>
            </div>

            <div class="contrib-form-row">
                <div class="contrib-form-group">
                    <label>Start Date</label>
                    <input type="date" id="task-modal-start" value="${task?.startDate ?? ''}">
                </div>
                <div class="contrib-form-group">
                    <label>Finish Date</label>
                    <input type="date" id="task-modal-end" value="${task?.endDate ?? ''}" ${isMilDef ? 'disabled' : ''}>
                </div>
            </div>

            <div class="contrib-form-row">
                <div class="contrib-form-group">
                    <label>Story Points (Weight)</label>
                    <select id="task-modal-weight">
                        <option value="1" ${task?.weight === 1 ? 'selected' : ''}>1 pt (XS)</option>
                        <option value="2" ${task?.weight === 2 ? 'selected' : ''}>2 pts (S)</option>
                        <option value="3" ${(!task || !task.weight || task.weight === 3) ? 'selected' : ''}>3 pts (M)</option>
                        <option value="4" ${task?.weight === 4 ? 'selected' : ''}>4 pts (L)</option>
                        <option value="5" ${task?.weight === 5 ? 'selected' : ''}>5 pts (XL)</option>
                    </select>
                </div>
                <div class="contrib-form-group">
                    <label>Duration (auto)</label>
                    <input type="text" id="task-modal-duration" readonly
                        style="color:var(--color-text-muted);background:hsla(0,0%,100%,0.01);"
                        placeholder="Calculated from dates">
                </div>
            </div>

            <!-- Predecessors / Dependencies — typeahead -->
            <div class="contrib-form-group" style="margin-bottom:4px;">
                <label>Predecessors / Dependencies</label>
                <div class="deps-typeahead" id="task-modal-deps-wrap">
                    <div class="deps-tags" id="task-modal-deps-tags"></div>
                    <input type="text" class="deps-search-input" id="task-modal-deps-input"
                        placeholder="Type to search and link tasks…" autocomplete="off">
                    <div class="deps-dropdown hidden" id="task-modal-deps-dropdown"></div>
                </div>
            </div>

            <div class="modal-action-bar">
                ${isEdit ? `
                    <button class="btn btn-primary" id="task-modal-save-btn">Save Changes</button>
                    <button class="btn btn-secondary" id="task-modal-done-btn"
                        style="border-color:var(--color-success);color:var(--color-success);display:flex;align-items:center;gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span> Close Task
                    </button>
                    <button class="btn btn-secondary" id="task-modal-archive-btn"
                        style="border-color:var(--color-warning);color:var(--color-warning);display:flex;align-items:center;gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:14px;">archive</span> Archive
                    </button>
                    <button class="btn btn-secondary" id="task-modal-delete-btn"
                        style="border-color:var(--color-danger);color:var(--color-danger);margin-right:auto;display:flex;align-items:center;gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:14px;">delete_forever</span> Delete
                    </button>
                ` : `
                    <button class="btn btn-primary" id="task-modal-create-btn">
                        <span class="material-symbols-outlined" style="font-size:15px;">${prefillMilestone ? 'diamond' : 'add_task'}</span>
                        Create ${prefillMilestone ? 'Milestone' : 'Task'}
                    </button>
                `}
                <button class="btn btn-secondary" id="task-modal-cancel-btn">Cancel</button>
            </div>
        </div>
    `;

    // ---- Reactive wiring ----
    const milCheck  = document.getElementById('task-modal-milestone');
    const startIn   = document.getElementById('task-modal-start');
    const endIn     = document.getElementById('task-modal-end');
    const durIn     = document.getElementById('task-modal-duration');

    const calcDur = () => {
        const s = startIn.value;
        const e = milCheck.checked ? s : endIn.value;
        if (!s || !e) { durIn.value = ''; return; }
        const d = Math.round((new Date(e) - new Date(s)) / 86400000);
        durIn.value = d >= 0 ? `${d} day${d !== 1 ? 's' : ''}` : '';
    };
    calcDur();
    startIn.addEventListener('change', () => { if (milCheck.checked) endIn.value = startIn.value; calcDur(); });
    endIn.addEventListener('change', calcDur);
    milCheck.addEventListener('change', () => {
        endIn.disabled = milCheck.checked;
        if (milCheck.checked) endIn.value = startIn.value;
        calcDur();
    });

    // ---- Typeahead deps ----
    let selectedDeps = [...existingDeps];
    const candidateTasks = state.tasks.filter(t => !t.isArchived && (!isEdit || t.id !== taskId));

    const renderTags = () => {
        const tagsEl = document.getElementById('task-modal-deps-tags');
        if (!tagsEl) return;
        tagsEl.innerHTML = selectedDeps.map(id => {
            const t = candidateTasks.find(x => x.id === id);
            if (!t) return '';
            const lbl = (t.isMilestone ? '◆ ' : '') + t.title.substring(0, 36) + (t.title.length > 36 ? '…' : '');
            return `<span class="dep-tag" data-id="${id}">${lbl}<button class="dep-tag-remove" data-id="${id}" tabindex="-1">×</button></span>`;
        }).join('');
        tagsEl.querySelectorAll('.dep-tag-remove').forEach(btn => {
            btn.onclick = e => { e.stopPropagation(); selectedDeps = selectedDeps.filter(i => i !== btn.dataset.id); renderTags(); };
        });
    };
    renderTags();

    const searchIn  = document.getElementById('task-modal-deps-input');
    const dropdown  = document.getElementById('task-modal-deps-dropdown');

    const renderDropdown = q => {
        const lq = (q || '').toLowerCase().trim();
        const hits = candidateTasks
            .filter(t => !selectedDeps.includes(t.id) && (!lq || t.title.toLowerCase().includes(lq)))
            .slice(0, 12);
        if (!hits.length) { dropdown.classList.add('hidden'); return; }
        dropdown.innerHTML = hits.map(t => {
            const sc = state.scopes.find(s => s.id === t.scopeId);
            return `<div class="deps-dropdown-item" data-id="${t.id}">
                <span class="deps-dropdown-scope">[${sc?.name.substring(0,16) ?? '?'}]</span>
                ${t.isMilestone ? '<span class="milestone-diamond" style="margin:0 3px;font-size:11px;">◆</span>' : ''}
                ${t.title.substring(0,60)}${t.title.length > 60 ? '…' : ''}
            </div>`;
        }).join('');
        dropdown.classList.remove('hidden');
        dropdown.querySelectorAll('.deps-dropdown-item').forEach(item => {
            item.onmousedown = e => {
                e.preventDefault();
                selectedDeps.push(item.dataset.id);
                renderTags();
                searchIn.value = '';
                dropdown.classList.add('hidden');
                searchIn.focus();
            };
        });
    };

    searchIn.addEventListener('focus', () => renderDropdown(searchIn.value));
    searchIn.addEventListener('input', () => renderDropdown(searchIn.value));
    searchIn.addEventListener('blur',  () => setTimeout(() => dropdown.classList.add('hidden'), 150));
    searchIn.addEventListener('keydown', e => {
        if (e.key === 'Escape')    { dropdown.classList.add('hidden'); searchIn.blur(); }
        if (e.key === 'Backspace' && !searchIn.value && selectedDeps.length > 0) {
            selectedDeps.pop();
            renderTags();
        }
    });

    // ---- Collect form values ----
    const getVals = () => {
        const isMil = document.getElementById('task-modal-milestone').checked;
        const s     = document.getElementById('task-modal-start').value;
        return {
            title:        document.getElementById('task-modal-title').value.trim(),
            scopeId:      document.getElementById('task-modal-scope').value,
            assignee:     document.getElementById('task-modal-assignee').value,
            status:       document.getElementById('task-modal-status').value,
            weight:       Number(document.getElementById('task-modal-weight').value),
            isMilestone:  isMil,
            startDate:    s,
            endDate:      isMil ? s : document.getElementById('task-modal-end').value,
            dependencies: [...selectedDeps],
            parentTaskId: document.getElementById('task-modal-parent').value || null,
        };
    };

    // ---- Handlers ----
    document.getElementById('task-modal-cancel-btn').onclick = () => modal.classList.add('hidden');

    if (isEdit) {
        document.getElementById('task-modal-save-btn').onclick = () => {
            const v = getVals();
            if (!v.title) { document.getElementById('task-modal-title').focus(); return; }
            store.commitTransaction(`Edit task: "${v.title}"`, 'Task Modal', s => {
                const t = s.tasks.find(tk => tk.id === taskId);
                if (t) Object.assign(t, v);
            });
            modal.classList.add('hidden');
        };

        document.getElementById('task-modal-done-btn').onclick = () => {
            store.commitTransaction(`Complete task: "${task.title}"`, 'Task Modal', s => {
                const t = s.tasks.find(tk => tk.id === taskId);
                if (t) t.status = 'done';
            });
            modal.classList.add('hidden');
        };

        document.getElementById('task-modal-archive-btn').onclick = () => {
            store.commitTransaction(`Archive task: "${task.title}"`, 'Task Modal', s => {
                const t = s.tasks.find(tk => tk.id === taskId);
                if (t) t.isArchived = true;
            });
            modal.classList.add('hidden');
        };

        document.getElementById('task-modal-delete-btn').onclick = () => {
            store.commitTransaction(`Delete task: "${task.title}"`, 'Task Modal', s => {
                s.tasks = s.tasks.filter(tk => tk.id !== taskId);
            });
            modal.classList.add('hidden');
        };

    } else {
        document.getElementById('task-modal-create-btn').onclick = () => {
            const v = getVals();
            if (!v.title) { document.getElementById('task-modal-title').focus(); return; }
            const newId = 'task-' + Date.now();
            store.commitTransaction(`Create task: "${v.title}"`, 'Task Modal', s => {
                const newTask = { id: newId, isArchived: false, ...v };
                if (insertAfterId) {
                    const idx = s.tasks.findIndex(t => t.id === insertAfterId);
                    if (idx >= 0) { s.tasks.splice(idx + 1, 0, newTask); return; }
                }
                s.tasks.push(newTask);
            });
            modal.classList.add('hidden');
        };
    }
}
