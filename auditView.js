/* ==========================================================================
   DELIVERYPRO.AI - STATE TRANSACTION AUDIT LOG TIMELINE VIEW
   ========================================================================== */

import { store } from './store.js';

class AuditView {
    constructor() {
        this.containerId = "view-content";
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const logs = state.auditLog;

        if (logs.length === 0) {
            container.innerHTML = `
                <div class="audit-workspace" style="text-align: center; padding: 60px 20px;">
                    <span class="material-symbols-outlined icon-btn" style="font-size: 48px; height: 80px; width: 80px; color: var(--color-text-muted); margin-bottom: 20px;">history</span>
                    <h3>State Transaction Audit Log is Empty</h3>
                    <p class="help-text" style="max-width: 420px; margin: 8px auto 0;">Perform actions like dragging Kanban cards, editing priority sandboxes, or approving AI proposals to build a robust chronological ledger.</p>
                </div>
            `;
            return;
        }

        // Render audit timeline layout
        container.innerHTML = `
            <div class="audit-workspace">
                <div class="view-title-container" style="padding: 0; margin-bottom: 24px;">
                    <h3>State-Level Audit Log Ledger</h3>
                    <p class="help-text">Review every single workspace modification. Click "Rollback" to reverse any transaction and recalculate downstream cascades in reverse.</p>
                </div>

                <div class="audit-timeline">
                    ${logs.map(tx => {
                        const isAi = tx.actor.includes("AI");
                        
                        return `
                            <div class="audit-card ${isAi ? 'ai-audit' : ''}">
                                <div class="audit-card-header">
                                    <span class="audit-actor-badge">${tx.actor}</span>
                                    <span class="audit-time">${tx.timestamp}</span>
                                </div>
                                <div class="audit-card-body">
                                    <h4>${tx.action}</h4>
                                    
                                    <div class="audit-diff-pane">
                                        ${tx.diff.map(d => `<div style="margin-bottom:4px; color: var(--color-text-secondary)">• ${d}</div>`).join('')}
                                    </div>
                                </div>
                                <div class="audit-card-footer">
                                    <button class="btn btn-secondary rollback-btn" data-id="${tx.id}" style="border-color: var(--color-warning); color: var(--color-warning);">
                                        <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; margin-right:4px;">restore</span>
                                        <span>Rollback Action</span>
                                    </button>
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
        const rollbackBtns = document.querySelectorAll(".rollback-btn");
        rollbackBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const txId = btn.dataset.id;
                
                // Trigger rollback transaction
                const success = store.rollbackTransaction(txId);
                
                if (success) {
                    // Re-render
                    this.render(store.state);
                    this.showNotification("Workspace restored to pre-snapshot state.", "success");
                } else {
                    this.showNotification("Failed to restore workspace snapshots.", "error");
                }
            });
        });
    }

    showNotification(msg, type = "success") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        let icon = "done";
        if (type === "warning") icon = "warning";
        else if (type === "error") icon = "gpp_maybe";

        toast.innerHTML = `
            <span class="material-symbols-outlined">${icon}</span>
            <span>${msg}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

export default AuditView;
