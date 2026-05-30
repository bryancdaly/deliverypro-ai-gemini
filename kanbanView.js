/* ==========================================================================
   DELIVERYPRO.AI - SMART KANBAN BOARD COMPONENT
   ========================================================================== */

import { store } from './store.js';

class KanbanView {
    constructor() {
        this.containerId = "view-content";
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Render board layout
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 20px; height: 100%;">
                <div style="display: flex; justify-content: flex-end; align-items: center;">
                    <button class="btn btn-secondary" id="add-task-btn" style="display:flex; align-items:center; gap:6px; font-family:'Inter'; font-weight:600; border-color:var(--accent-indigo); color:var(--accent-indigo); background:hsla(250,85%,58%,0.05); padding:8px 16px; border-radius:6px; cursor:pointer;">
                        <span class="material-symbols-outlined" style="font-size:18px;">add</span> Add Sprint Task
                    </button>
                </div>

                <div class="kanban-board">
                    <div class="kanban-column" data-status="todo" id="col-todo">
                        <h3>To Do</h3>
                        <!-- Tasks go here -->
                    </div>
                    <div class="kanban-column" data-status="in_progress" id="col-in-progress">
                        <h3>In Progress</h3>
                    </div>
                    <div class="kanban-column" data-status="review" id="col-review">
                        <h3>AI Review</h3>
                    </div>
                    <div class="kanban-column" data-status="done" id="col-done">
                        <h3>Completed</h3>
                    </div>
                </div>
            </div>
        `;

        this.renderTaskCards(state.tasks, state.scopes);
        this.bindEvents();
    }

    renderTaskCards(tasks, scopes) {
        const columns = {
            todo: document.getElementById("col-todo"),
            in_progress: document.getElementById("col-in-progress"),
            review: document.getElementById("col-review"),
            done: document.getElementById("col-done")
        };

        // Clear existing items in columns
        Object.values(columns).forEach(el => {
            if (el) {
                // Keep the column header (h3)
                const header = el.querySelector("h3");
                el.innerHTML = "";
                if (header) el.appendChild(header);
            }
        });

        // Filter and inject tasks based on included scope IDs & active hierarchy level
        const includedScopeIds = store.state.scenario.includedProjectIds;
        const level = store.state.scenario.activeHierarchyLevel || "enterprise";

        tasks.forEach(task => {
            if (task.isArchived) return; // Exclude archived tasks
            if (!includedScopeIds.includes(task.scopeId)) return; // Exclude non-active portfolio tasks

            // Active hierarchy level filtering
            if (level === "program" && !["scope-route-optimization", "scope-transport-fleet"].includes(task.scopeId)) return;
            if (level === "project" && !["scope-route-optimization"].includes(task.scopeId)) return;

            const container = columns[task.status];
            if (container) {
                const scope = scopes.find(s => s.id === task.scopeId);
                const hasHighRisk = scope ? scope.executionRisk > 50 : false;
                
                const card = document.createElement("div");
                card.className = `kanban-card ${hasHighRisk ? 'risk-high' : ''}`;
                card.id = `task-card-${task.id}`;
                card.draggable = true;
                card.dataset.id = task.id;

                card.innerHTML = `
                    <h4>${task.title}</h4>
                    <p style="font-size:10px; color: var(--accent-indigo); margin-top:6px; font-weight:700;">
                        ${scope ? scope.name : 'Unknown Project'}
                    </p>
                    <div class="kanban-card-footer">
                        <span class="assignee-avatar" title="${task.assignee}">
                            ${task.assignee.split(' ').map(n=>n[0]).join('')}
                        </span>
                        <span class="score-badge" style="background: hsla(0,0%,100%,0.04); color: var(--color-text-secondary);">
                            Wt: ${task.weight}
                        </span>
                    </div>
                `;
                container.appendChild(card);
            }
        });
    }

    bindEvents() {
        const cards = document.querySelectorAll(".kanban-card");
        const columns = document.querySelectorAll(".kanban-column");

        // Add task click
        const addTaskBtn = document.getElementById("add-task-btn");
        if (addTaskBtn) {
            addTaskBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.openTaskForm(null, store.state);
            });
        }

        cards.forEach(card => {
            card.addEventListener("click", (e) => {
                e.stopPropagation();
                const taskId = card.dataset.id;
                this.openTaskForm(taskId, store.state);
            });
        });

        cards.forEach(card => {
            card.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", card.id);
                e.dataTransfer.effectAllowed = "move";
                card.style.opacity = "0.5";
            });

            card.addEventListener("dragend", () => {
                card.style.opacity = "1";
            });
        });

        columns.forEach(col => {
            col.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                col.style.background = "hsla(0, 0%, 100%, 0.04)";
            });

            col.addEventListener("dragleave", () => {
                col.style.background = "hsla(0, 0%, 100%, 0.015)";
            });

            col.addEventListener("drop", (e) => {
                e.preventDefault();
                col.style.background = "hsla(0, 0%, 100%, 0.015)";

                const cardId = e.dataTransfer.getData("text/plain");
                const card = document.getElementById(cardId);
                
                if (card) {
                    const taskId = card.dataset.id;
                    const newStatus = col.dataset.status;

                    // Commit central state transaction
                    store.commitTransaction(`Drag task "${store.state.tasks.find(t=>t.id===taskId).title}" to ${newStatus.toUpperCase()}`, "User Drag-and-Drop", (state) => {
                        const task = state.tasks.find(t => t.id === taskId);
                        if (task) {
                            task.status = newStatus;
                        }
                    });

                    // Redraw views reactively
                    this.render(store.state);
                }
            });
        });
    }

    openTaskForm(taskId, state) {
        const modal = document.getElementById("contribution-modal");
        const modalTitle = document.getElementById("contrib-modal-title");
        const modalBody = document.getElementById("contrib-modal-body");
        const closeBtn = document.getElementById("contrib-modal-close");

        if (!modal || !modalBody || !modalTitle) return;

        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.add("hidden");
        }
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add("hidden");
            }
        };

        modal.classList.remove("hidden");

        const isEdit = !!taskId;
        const task = isEdit ? state.tasks.find(t => t.id === taskId) : null;

        modalTitle.textContent = isEdit ? "Edit Sprint Task" : "Add New Sprint Task";

        const formHtml = `
            <div class="contrib-form-group">
                <label>Task Title</label>
                <input type="text" id="form-task-title" value="${task ? task.title : ''}" required placeholder="e.g. Implement user authentication routes">
            </div>
            <div class="contrib-form-row">
                <div class="contrib-form-group">
                    <label>Aligned Project Scope</label>
                    <select id="form-task-scope">
                        ${state.scopes.filter(s => !s.isArchived).map(s => `
                            <option value="${s.id}" ${task && task.scopeId === s.id ? 'selected' : ''}>${s.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="contrib-form-group">
                    <label>Assignee</label>
                    <select id="form-task-assignee">
                        ${state.resources.filter(r => !r.isArchived).map(r => `
                            <option value="${r.name}" ${task && task.assignee === r.name ? 'selected' : ''}>${r.name} (${r.role})</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="contrib-form-row">
                <div class="contrib-form-group">
                    <label>Sprint Status</label>
                    <select id="form-task-status">
                        <option value="todo" ${task && task.status === 'todo' ? 'selected' : ''}>To Do</option>
                        <option value="in_progress" ${task && task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="review" ${task && task.status === 'review' ? 'selected' : ''}>AI Review</option>
                        <option value="done" ${task && task.status === 'done' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
                <div class="contrib-form-group">
                    <label>Task Story Points (Weight 1-5)</label>
                    <select id="form-task-weight">
                        <option value="1" ${task && task.weight === 1 ? 'selected' : ''}>1 Pt (XS)</option>
                        <option value="2" ${task && task.weight === 2 ? 'selected' : ''}>2 Pts (S)</option>
                        <option value="3" ${task && (task.weight === 3 || !task.weight) ? 'selected' : ''}>3 Pts (M)</option>
                        <option value="4" ${task && task.weight === 4 ? 'selected' : ''}>4 Pts (L)</option>
                        <option value="5" ${task && task.weight === 5 ? 'selected' : ''}>5 Pts (XL)</option>
                    </select>
                </div>
            </div>
        `;

        let actionButtons = "";
        if (isEdit) {
            actionButtons = `
                <div class="modal-action-bar">
                    <button class="btn btn-primary" id="task-save-btn">Save Changes</button>
                    <button class="btn btn-secondary" id="task-close-btn" style="border-color:var(--color-success); color:var(--color-success); display:flex; align-items:center; gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span> Close Task
                    </button>
                    <button class="btn btn-secondary" id="task-archive-btn" style="border-color:var(--color-warning); color:var(--color-warning); display:flex; align-items:center; gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:14px;">archive</span> Archive Task
                    </button>
                    <button class="btn btn-secondary" id="task-delete-btn" style="border-color:var(--color-danger); color:var(--color-danger); margin-right:auto; display:flex; align-items:center; gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:14px;">delete_forever</span> Delete
                    </button>
                    <button class="btn btn-secondary" id="task-cancel-btn">Cancel</button>
                </div>
            `;
        } else {
            actionButtons = `
                <div class="modal-action-bar">
                    <button class="btn btn-primary" id="task-create-btn">Create Task</button>
                    <button class="btn btn-secondary" id="task-cancel-btn">Cancel</button>
                </div>
            `;
        }

        modalBody.innerHTML = `<div style="display:flex; flex-direction:column; width:100%; gap:2px;">` + formHtml + actionButtons + `</div>`;

        const cancelBtn = document.getElementById("task-cancel-btn");
        if (cancelBtn) {
            cancelBtn.onclick = () => modal.classList.add("hidden");
        }

        if (isEdit) {
            const saveBtn = document.getElementById("task-save-btn");
            const closeBtnActions = document.getElementById("task-close-btn");
            const archiveBtn = document.getElementById("task-archive-btn");
            const deleteBtn = document.getElementById("task-delete-btn");

            if (saveBtn) {
                saveBtn.onclick = () => {
                    store.commitTransaction(`Edit Task: "${task.title}"`, "User Action", (s) => {
                        const t = s.tasks.find(tk => tk.id === taskId);
                        if (t) {
                            t.title = document.getElementById("form-task-title").value;
                            t.scopeId = document.getElementById("form-task-scope").value;
                            t.assignee = document.getElementById("form-task-assignee").value;
                            t.status = document.getElementById("form-task-status").value;
                            t.weight = Number(document.getElementById("form-task-weight").value);
                        }
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }

            if (closeBtnActions) {
                closeBtnActions.onclick = () => {
                    store.commitTransaction(`Complete Task: "${task.title}"`, "User Action", (s) => {
                        const t = s.tasks.find(tk => tk.id === taskId);
                        if (t) {
                            t.status = "done";
                        }
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }

            if (archiveBtn) {
                archiveBtn.onclick = () => {
                    store.commitTransaction(`Archive Task: "${task.title}"`, "User Action", (s) => {
                        const t = s.tasks.find(tk => tk.id === taskId);
                        if (t) {
                            t.isArchived = true;
                        }
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }

            if (deleteBtn) {
                deleteBtn.onclick = () => {
                    store.commitTransaction(`Permanently Delete Task: "${task.title}"`, "User Action", (s) => {
                        s.tasks = s.tasks.filter(tk => tk.id !== taskId);
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }
        } else {
            const createBtn = document.getElementById("task-create-btn");
            if (createBtn) {
                createBtn.onclick = () => {
                    const title = document.getElementById("form-task-title").value;
                    const scopeId = document.getElementById("form-task-scope").value;
                    const assignee = document.getElementById("form-task-assignee").value;
                    const status = document.getElementById("form-task-status").value;
                    const weight = Number(document.getElementById("form-task-weight").value);
                    const newId = "task-" + Date.now();

                    store.commitTransaction(`Create New Task: "${title}"`, "User Action", (s) => {
                        s.tasks.push({
                            id: newId,
                            scopeId: scopeId,
                            title: title,
                            assignee: assignee,
                            status: status,
                            weight: weight
                        });
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }
        }
    }
}

export default KanbanView;
