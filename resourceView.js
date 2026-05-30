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
                <div class="view-title-container" style="padding: 0;">
                    <h3>Resource Workload & Bandwidth Allocator</h3>
                    <p class="help-text">Track weekly work loads. Over-allocated resources (exceeding capacity limit) glow red.</p>
                </div>

                <div class="strategy-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-height: none;" id="resource-cards-container">
                    ${state.resources.map(r => {
                        const loadPercentage = Math.round((r.allocated / r.maxCapacity) * 100);
                        const isOverloaded = r.allocated > r.maxCapacity;
                        
                        // Get active tasks for this resource
                        const level = state.scenario.activeHierarchyLevel || "enterprise";
                        const activeProjectIds = state.scenario.includedProjectIds;
                        const resourceTasks = state.tasks.filter(t => {
                            if (t.assignee !== r.name || t.status === 'done' || !activeProjectIds.includes(t.scopeId)) return false;
                            if (level === "program" && !["scope-route-optimization", "scope-transport-fleet"].includes(t.scopeId)) return false;
                            if (level === "project" && !["scope-route-optimization"].includes(t.scopeId)) return false;
                            return true;
                        });

                        return `
                            <div class="glass-panel" style="display:flex; flex-direction:column; gap:16px; border-color: ${isOverloaded ? 'var(--color-danger)' : 'var(--glass-border)'}; background: ${isOverloaded ? 'hsla(350,85%,55%,0.02)' : 'var(--bg-glass)'};">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <div>
                                        <h4 style="font-size: 15px; color: var(--color-text-primary)">${r.name}</h4>
                                        <small style="color: var(--color-text-secondary); font-weight:600;">${r.role}</small>
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
    }
}

export default ResourceView;
