/* ==========================================================================
   DELIVERYPRO.AI - FINANCIALS & BENEFITS VIEW
   ========================================================================== */

import { store } from './store.js';

class FinanceView {
    constructor() {
        this.containerId = "view-content";
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const level = state.scenario.activeHierarchyLevel || "enterprise";
        
        const isScopeInHierarchy = (scopeId) => {
            if (level === "enterprise" || level === "portfolio") return true;
            if (level === "program") return ["scope-route-optimization", "scope-transport-fleet"].includes(scopeId);
            if (level === "project") return ["scope-route-optimization"].includes(scopeId);
            return true;
        };

        const isBenefitInHierarchy = (benId) => {
            if (level === "enterprise" || level === "portfolio") return true;
            if (level === "program" || level === "project") {
                return ["ben-transport-transition", "ben-ops-savings"].includes(benId);
            }
            return true;
        };

        // Sum aggregates across active included scopes
        let totalCapExPlan = 0;
        let totalCapExActual = 0;
        let totalCapExEtc = 0;

        let totalOpExPlan = 0;
        let totalOpExActual = 0;
        let totalOpExEtc = 0;

        state.scopes.forEach(scope => {
            const isIncluded = state.scenario.includedProjectIds.includes(scope.id);
            if (isIncluded && isScopeInHierarchy(scope.id)) {
                totalCapExPlan += scope.financials.capEx.plan;
                totalCapExActual += scope.financials.capEx.actual;
                totalCapExEtc += scope.financials.capEx.etc;

                totalOpExPlan += scope.financials.opEx.plan;
                totalOpExActual += scope.financials.opEx.actual;
                totalOpExEtc += scope.financials.opEx.etc;
            }
        });

        const totalBudget = totalCapExPlan + totalOpExPlan;
        const totalActual = totalCapExActual + totalOpExActual;
        const totalForecast = totalActual + (totalCapExEtc + totalOpExEtc);

        container.innerHTML = `
            <div class="finance-workspace">
                <!-- KPI financial row -->
                <div class="finance-metrics-row">
                    <div class="glass-panel cons-card">
                        <span class="cons-card-lbl">Total Planned Budget</span>
                        <div class="cons-card-val" style="color: var(--color-text-primary)">$${totalBudget.toLocaleString()} USD</div>
                        <p class="help-text" style="margin-top: 4px;">CapEx: $${totalCapExPlan.toLocaleString()} | OpEx: $${totalOpExPlan.toLocaleString()}</p>
                    </div>
                    <div class="glass-panel cons-card">
                        <span class="cons-card-lbl">Actual Spend (YTD)</span>
                        <div class="cons-card-val" style="color: var(--color-success)">$${totalActual.toLocaleString()} USD</div>
                        <p class="help-text" style="margin-top: 4px;">Budget Burn-rate: ${totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0}% consumed</p>
                    </div>
                    <div class="glass-panel cons-card">
                        <span class="cons-card-lbl">Forecast-At-Completion (FAC)</span>
                        <div class="cons-card-val" style="color: var(--accent-indigo)">$${totalForecast.toLocaleString()} USD</div>
                        <p class="help-text" style="margin-top: 4px;">ETC: $${(totalCapExEtc + totalOpExEtc).toLocaleString()} | Variance: $${(totalBudget - totalForecast).toLocaleString()} ${totalBudget - totalForecast >= 0 ? 'Under' : 'Over'}</p>
                    </div>
                </div>

                <!-- Financial Ledger and Forecast curves -->
                <div class="ledger-grid">
                    <!-- CapEx Costs breakdown table -->
                    <div class="glass-panel ledger-table-box">
                        <h4>Capital Expenditure (CapEx) Cost Ledger</h4>
                        <div class="ledger-list">
                            ${state.scopes.map(s => {
                                const isIncluded = state.scenario.includedProjectIds.includes(s.id);
                                if (!isIncluded || !isScopeInHierarchy(s.id)) return '';
                                return `
                                    <div class="ledger-item">
                                        <div class="cost-lbl">
                                            <b>${s.name}</b>
                                            <small>Status: ${s.status} | Plan: $${s.financials.capEx.plan.toLocaleString()}</small>
                                        </div>
                                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                            <span class="cost-val" style="color: var(--color-success)">Actual: $${s.financials.capEx.actual.toLocaleString()}</span>
                                            <span class="cost-val" style="font-size:10px; color: var(--color-text-muted)">ETC: $${s.financials.capEx.etc.toLocaleString()}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- OpEx Costs breakdown table -->
                    <div class="glass-panel ledger-table-box">
                        <h4>Operational Expenditure (OpEx) Cost Ledger</h4>
                        <div class="ledger-list">
                            ${state.scopes.map(s => {
                                const isIncluded = state.scenario.includedProjectIds.includes(s.id);
                                if (!isIncluded || !isScopeInHierarchy(s.id)) return '';
                                return `
                                    <div class="ledger-item">
                                        <div class="cost-lbl">
                                            <b>${s.name}</b>
                                            <small>Status: ${s.status} | Plan: $${s.financials.opEx.plan.toLocaleString()}</small>
                                        </div>
                                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                            <span class="cost-val" style="color: var(--color-success)">Actual: $${s.financials.opEx.actual.toLocaleString()}</span>
                                            <span class="cost-val" style="font-size:10px; color: var(--color-text-muted)">ETC: $${s.financials.opEx.etc.toLocaleString()}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- 1-3 Year Post-Project Value Realization Tracker -->
                <div class="glass-panel" style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>1–3 Year Post-Project Value Realization Log</h3>
                        <span class="tier-badge" style="background: hsla(165,80%,45%,0.1); color: var(--color-success);">Value Track</span>
                    </div>
                    <p class="help-text">Review real-time strategic benefit realization curves. Staggered benefit curves lag 3–18 months behind project launch.</p>
                    
                    <div class="strategy-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-height: none;">
                        ${state.benefits.map(b => {
                            if (!isBenefitInHierarchy(b.id)) return '';
                            const realizedPct = Math.round(((b.metric.current - b.metric.baseline) / (b.metric.target - b.metric.baseline)) * 100);
                            return `
                                <div class="benefit-profile-card ${b.isDisbenefit ? 'disbenefit' : ''}">
                                    <span class="benefit-badge ${b.isDisbenefit ? 'disben' : 'ben'}">
                                        ${b.isDisbenefit ? 'Disbenefit' : 'Benefit'}
                                    </span>
                                    <h4>${b.name}</h4>
                                    <div style="margin-top: 14px; display: flex; justify-content: space-between; font-size:12px;">
                                        <span>Owner: <b>${b.owner}</b></span>
                                        <span>Target Metric: <b>${b.metric.target.toLocaleString()}${b.metric.unit}</b></span>
                                    </div>
                                    
                                    <div class="benefit-progress-row" style="margin-top: 14px;">
                                        <div class="benefit-progress-bar">
                                            <div class="benefit-progress-fill" style="width: ${realizedPct}%; background: ${b.isDisbenefit ? 'var(--color-warning)' : 'var(--color-success)'};"></div>
                                        </div>
                                        <span class="stat-val" style="font-size: 11px;">${realizedPct}% Realized</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

export default FinanceView;
