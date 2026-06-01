/* ==========================================================================
   DELIVERYPRO.AI - SMART KANBAN BOARD COMPONENT
   ========================================================================== */

import { store, isScopeInHierarchy } from './store.js';
import { openTaskModal } from './taskModal.js';

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

        tasks.forEach(task => {
            if (task.isArchived) return;
            if (!includedScopeIds.includes(task.scopeId)) return;
            if (!isScopeInHierarchy(task.scopeId, store.state)) return;

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
                    <h4>${task.isMilestone ? '<span class="milestone-diamond" style="margin-right:5px;">◆</span>' : ''}${task.title}</h4>
                    <p style="font-size:10px; color: var(--accent-indigo); margin-top:6px; font-weight:700;">
                        ${scope ? scope.name : 'Unknown Project'}
                    </p>
                    ${(task.startDate || task.endDate) ? `<p style="font-size:10px;color:var(--color-text-muted);margin-top:3px;">${task.startDate || '?'} → ${task.isMilestone ? task.startDate : (task.endDate || '?')}</p>` : ''}
                    <div class="kanban-card-footer">
                        <span class="assignee-avatar" title="${task.assignee}">
                            ${task.assignee.split(' ').map(n=>n[0]).join('')}
                        </span>
                        <div style="display:flex;gap:5px;align-items:center;">
                            ${task.isMilestone ? '<span class="score-badge" style="background:hsla(250,85%,58%,0.1);color:var(--accent-indigo);border:1px solid hsla(250,85%,58%,0.2);">Milestone</span>' : ''}
                            <span class="score-badge" style="background: hsla(0,0%,100%,0.04); color: var(--color-text-secondary);">
                                Wt: ${task.weight}
                            </span>
                        </div>
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
                openTaskModal(null, store.state);
            });
        }

        cards.forEach(card => {
            card.addEventListener("click", (e) => {
                e.stopPropagation();
                const taskId = card.dataset.id;
                openTaskModal(taskId, store.state);
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
}

export default KanbanView;
