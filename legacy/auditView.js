/* ==========================================================================
   DELIVERYPRO.AI - STATE TRANSACTION AUDIT LOG TIMELINE VIEW
   ========================================================================== */

import { store, escapeHtml } from './store.js';

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
                <div class="audit-timeline">
                    ${[...logs].reverse().map(tx => {
                        const isAi = tx.actor.includes("AI");
                        const diffSummary = tx.diff.join(' · ');
                        return `
                            <div class="audit-row ${isAi ? 'ai-audit' : ''}">
                                <span class="audit-actor-badge">${escapeHtml(tx.actor)}</span>
                                <span class="audit-row-action">${escapeHtml(tx.action)}</span>
                                <span class="audit-row-diff">${escapeHtml(diffSummary)}</span>
                                <span class="audit-time">${escapeHtml(tx.timestamp)}</span>
                                <button class="audit-rollback-btn rollback-btn" data-id="${tx.id}" title="Rollback">
                                    <span class="material-symbols-outlined">restore</span>
                                </button>
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
                const txIndex = store.state.auditLog.findIndex(tx => tx.id === txId);
                // auditLog is stored newest-first, so entries at indices 0..txIndex-1 are newer
                const newerCount = txIndex > 0 ? txIndex : 0;
                const warnMsg = newerCount > 0
                    ? `Rolling back this action will also remove ${newerCount} newer transaction${newerCount !== 1 ? 's' : ''}. This cannot be undone. Continue?`
                    : "This will undo the most recent transaction. Continue?";

                if (!window.confirm(warnMsg)) return;

                const success = store.rollbackTransaction(txId);

                if (success) {
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
