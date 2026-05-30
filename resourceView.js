/* ==========================================================================
   DELIVERYPRO.AI - RESOURCE ALLOCATION COMPONENT
   ========================================================================== */

import { store } from './store.js';

class ResourceView {
    constructor() {
        this.containerId = "view-content";
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Render resource allocation page
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 24px; height: 100%;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="view-title-container" style="padding: 0;">
                        <h3>Resource Workload & Bandwidth Allocator</h3>
                        <p class="help-text">Track weekly work loads. Over-allocated resources (exceeding capacity limit) glow red.</p>
                    </div>
                    <button class="btn btn-secondary" id="add-resource-btn" style="display:flex; align-items:center; gap:6px; font-family:'Inter'; font-weight:600; border-color:var(--accent-indigo); color:var(--accent-indigo); background:hsla(250,85%,58%,0.05); padding:8px 16px; border-radius:6px; cursor:pointer;">
                        <span class="material-symbols-outlined" style="font-size:18px;">add</span> Add Staff Resource
                    </button>
                </div>

                <div class="strategy-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-height: none;" id="resource-cards-container">
                    ${state.resources.filter(r => !r.isArchived).map(r => {
                        const loadPercentage = Math.round((r.allocated / r.maxCapacity) * 100);
                        const isOverloaded = r.allocated > r.maxCapacity;
                        
                        // Get active tasks for this resource
                        const level = state.scenario.activeHierarchyLevel || "enterprise";
                        const activeProjectIds = state.scenario.includedProjectIds;
                        const resourceTasks = state.tasks.filter(t => {
                            if (t.isArchived || t.assignee !== r.name || t.status === 'done' || !activeProjectIds.includes(t.scopeId)) return false;
                            if (level === "program" && !["scope-route-optimization", "scope-transport-fleet"].includes(t.scopeId)) return false;
                            if (level === "project" && !["scope-route-optimization"].includes(t.scopeId)) return false;
                            return true;
                        });

                        return `
                            <div class="glass-panel" style="display:flex; flex-direction:column; gap:16px; border-color: ${isOverloaded ? 'var(--color-danger)' : 'var(--glass-border)'}; background: ${isOverloaded ? 'hsla(350,85%,55%,0.02)' : 'var(--bg-glass)'};">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <div>
                                            <h4 style="font-size: 15px; color: var(--color-text-primary)">${r.name}</h4>
                                            <small style="color: var(--color-text-secondary); font-weight:600;">${r.role}</small>
                                        </div>
                                        <button class="edit-resource-btn icon-btn" data-id="${r.id}" style="padding:4px; opacity:0.6; display:inline-flex; border:none; background:transparent; cursor:pointer;" title="Edit Staff Details">
                                            <span class="material-symbols-outlined" style="font-size:16px; color:var(--color-text-secondary);">edit</span>
                                        </button>
                                    </div>
                                    <span class="score-badge" style="background: ${isOverloaded ? 'hsla(350,85%,55%,0.15)' : 'hsla(250,95%,68%,0.15)'}; color: ${isOverloaded ? 'var(--color-danger)' : 'var(--accent-indigo)'}">
                                        ${r.allocated} / ${r.maxCapacity} hrs
                                    </span>
                                </div>

                                <div>
                                    <div style="display:flex; justify-content:space-between; font-size: 10px; color: var(--color-text-muted); text-transform:uppercase; margin-bottom: 6px;">
                                        <span>Allocated Load</span>
                                        <span>${loadPercentage}%</span>
                                    </div>
                                    <div class="cons-card-bar ${isOverloaded ? 'overload' : ''}" style="margin-top:0; height:6px;">
                                        <div class="cons-card-bar-fill" style="width: ${Math.min(loadPercentage, 100)}%"></div>
                                    </div>
                                </div>

                                <div style="border-top: 1px solid var(--glass-border); padding-top:12px;">
                                    <h5 style="font-size:11px; text-transform:uppercase; color: var(--color-text-secondary); margin-bottom:8px;">Active Task Backlog</h5>
                                    <div style="display:flex; flex-direction:column; gap:6px;">
                                        ${resourceTasks.length === 0 ? `
                                            <p style="font-size:11px; color: var(--color-text-muted)">No active tasks assigned.</p>
                                        ` : resourceTasks.map(t => `
                                            <div class="suggested-pill" style="display:flex; justify-content:space-between; width:100%; border-radius:6px; padding:6px 10px; background:hsla(0,0%,100%,0.01);">
                                                <span>${t.title.substring(0, 36)}...</span>
                                                <span class="score-badge" style="background:hsla(0,0%,100%,0.04); color:var(--color-text-muted); font-size:8px;">${t.status.toUpperCase()}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const addBtn = document.getElementById("add-resource-btn");
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                this.openResourceForm(null, store.state);
            };
        }

        const editBtns = document.querySelectorAll(".edit-resource-btn");
        editBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const resId = btn.dataset.id;
                this.openResourceForm(resId, store.state);
            };
        });
    }

    openResourceForm(resourceId, state) {
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

        const isEdit = !!resourceId;
        const res = isEdit ? state.resources.find(r => r.id === resourceId) : null;

        modalTitle.textContent = isEdit ? "Edit Staff Resource" : "Add New Staff Resource";

        const formHtml = `
            <div class="contrib-form-group">
                <label>Resource Name</label>
                <input type="text" id="form-res-name" value="${res ? res.name : ''}" required placeholder="e.g. Linus Torvalds">
            </div>
            <div class="contrib-form-group">
                <label>Corporate Role</label>
                <input type="text" id="form-res-role" value="${res ? res.role : ''}" required placeholder="e.g. Senior Staff Engineer">
            </div>
            <div class="contrib-form-group">
                <label>Weekly Available Capacity (Hours)</label>
                <input type="number" id="form-res-capacity" value="${res ? res.maxCapacity : 40}" required min="0" max="80">
            </div>
        `;

        let actionButtons = "";
        if (isEdit) {
            actionButtons = `
                <div class="modal-action-bar">
                    <button class="btn btn-primary" id="res-save-btn">Save Changes</button>
                    <button class="btn btn-secondary" id="res-archive-btn" style="border-color:var(--color-warning); color:var(--color-warning); display:flex; align-items:center; gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:14px;">archive</span> Archive Resource
                    </button>
                    <button class="btn btn-secondary" id="res-delete-btn" style="border-color:var(--color-danger); color:var(--color-danger); margin-right:auto; display:flex; align-items:center; gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:14px;">delete_forever</span> Delete
                    </button>
                    <button class="btn btn-secondary" id="res-cancel-btn">Cancel</button>
                </div>
            `;
        } else {
            actionButtons = `
                <div class="modal-action-bar">
                    <button class="btn btn-primary" id="res-create-btn">Create Resource</button>
                    <button class="btn btn-secondary" id="res-cancel-btn">Cancel</button>
                </div>
            `;
        }

        modalBody.innerHTML = `<div style="display:flex; flex-direction:column; width:100%; gap:2px;">` + formHtml + actionButtons + `</div>`;

        const cancelBtn = document.getElementById("res-cancel-btn");
        if (cancelBtn) {
            cancelBtn.onclick = () => modal.classList.add("hidden");
        }

        if (isEdit) {
            const saveBtn = document.getElementById("res-save-btn");
            const archiveBtn = document.getElementById("res-archive-btn");
            const deleteBtn = document.getElementById("res-delete-btn");

            if (saveBtn) {
                saveBtn.onclick = () => {
                    store.commitTransaction(`Edit Resource: "${res.name}"`, "User Action", (s) => {
                        const r = s.resources.find(rs => rs.id === resourceId);
                        if (r) {
                            r.name = document.getElementById("form-res-name").value;
                            r.role = document.getElementById("form-res-role").value;
                            r.maxCapacity = Number(document.getElementById("form-res-capacity").value);
                        }
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }

            if (archiveBtn) {
                archiveBtn.onclick = () => {
                    store.commitTransaction(`Archive Resource: "${res.name}"`, "User Action", (s) => {
                        const r = s.resources.find(rs => rs.id === resourceId);
                        if (r) {
                            r.isArchived = true;
                        }
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }

            if (deleteBtn) {
                deleteBtn.onclick = () => {
                    store.commitTransaction(`Permanently Delete Resource: "${res.name}"`, "User Action", (s) => {
                        s.resources = s.resources.filter(rs => rs.id !== resourceId);
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }
        } else {
            const createBtn = document.getElementById("res-create-btn");
            if (createBtn) {
                createBtn.onclick = () => {
                    const name = document.getElementById("form-res-name").value;
                    const role = document.getElementById("form-res-role").value;
                    const capacity = Number(document.getElementById("form-res-capacity").value);
                    const newId = "res-" + Date.now();

                    store.commitTransaction(`Create New Resource: "${name}"`, "User Action", (s) => {
                        s.resources.push({
                            id: newId,
                            name: name,
                            role: role,
                            maxCapacity: capacity,
                            allocated: 0
                        });
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }
        }
    }
}

export default ResourceView;
