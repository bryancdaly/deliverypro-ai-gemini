/* ==========================================================================
   DELIVERYPRO.AI - STRATEGY BOARD COMPONENT
   ========================================================================== */

import { store } from './store.js';

class StrategyView {
    constructor() {
        this.containerId = "view-content";
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Render strategy page layout
        container.innerHTML = `
            <div class="strategy-workspace">
                <!-- Staggered timeline slider panel -->
                <div class="glass-panel realization-slider-panel">
                    <span class="material-symbols-outlined icon-btn" style="color: var(--accent-indigo)">schedule</span>
                    <div class="r-slider-desc">
                        <h4>Post-Launch Value Realization Timeline</h4>
                        <p>Simulate portfolio benefit maturation over a 1–36 month operational horizon</p>
                    </div>
                    <div class="r-slider-control">
                        <input type="range" id="realization-month-slider" min="0" max="36" value="${state.scenario.realizationMonthSlider}">
                        <div class="r-slider-label" id="slider-month-val">Month ${state.scenario.realizationMonthSlider}</div>
                    </div>
                </div>

                <!-- Strategy Matrix Layout -->
                <div class="strategy-row full">
                    <!-- Tier 1: Enterprise Strategy -->
                    <div class="strategic-tier-box">
                        <div class="tier-title-bar">
                            <h3>Tier 1: Enterprise Strategy (The "Why")</h3>
                            <span class="tier-badge">Vision</span>
                        </div>
                        <div class="glass-panel strategy-node-card selected" id="strategy-root" data-node="strat">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="max-width: 80%">
                                    <h4>${state.strategy.title}</h4>
                                    <p>${state.strategy.description}</p>
                                </div>
                                <div class="footer-stats" style="padding: 6px 12px;">
                                    <div class="f-stat" style="align-items: center;">
                                        <span class="stat-lbl">Strategic Health</span>
                                        <span class="stat-val" style="color: var(--color-success); font-size: 16px;">${state.strategy.health}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="strategy-row">
                    <!-- Tier 2: Strategic Objectives / OKRs -->
                    <div class="strategic-tier-box">
                        <div class="tier-title-bar">
                            <h3>Tier 2: Objectives & OKRs (The "What")</h3>
                            <span class="tier-badge">OKRs</span>
                        </div>
                        <div class="strategy-list" id="okr-list-container">
                            ${state.strategy.objectives.map(okr => `
                                <div class="strategy-node-card" id="node-${okr.id}" data-node="okr" data-id="${okr.id}">
                                    <h4>${okr.title}</h4>
                                    <div class="benefit-progress-row">
                                        <div class="benefit-progress-bar">
                                            <div class="benefit-progress-fill" style="width: ${(okr.current / okr.target) * 100}%"></div>
                                        </div>
                                        <span class="stat-val" style="font-size: 11px;">${okr.current}/${okr.target}${okr.unit}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Tier 3: Business Outcomes / Benefits Zone -->
                    <div class="strategic-tier-box">
                        <div class="tier-title-bar">
                            <h3>Tier 3: Business Outcomes & Benefits (The "Benefit")</h3>
                            <span class="tier-badge">Benefits</span>
                        </div>
                        <div class="strategy-list" id="benefit-list-container">
                            ${state.benefits.map(b => `
                                <div class="strategy-node-card benefit-profile-card ${b.isDisbenefit ? 'disbenefit' : ''}" 
                                     id="node-${b.id}" data-node="benefit" data-id="${b.id}">
                                    <span class="benefit-badge ${b.isDisbenefit ? 'disben' : 'ben'}">
                                        ${b.isDisbenefit ? 'Disbenefit' : 'Benefit'}
                                    </span>
                                    <h4>${b.name}</h4>
                                    
                                    <div class="benefit-meta-grid">
                                        <div class="benefit-meta-item">
                                            <small>Owner Accountable</small>
                                            <p>${b.owner.split(' ')[0]}</p>
                                        </div>
                                        <div class="benefit-meta-item">
                                            <small>Realization Lag</small>
                                            <p>${b.realizationTimeline.startOffsetMonths}m lag (${b.realizationTimeline.durationMonths}m run)</p>
                                        </div>
                                    </div>

                                    <div class="benefit-progress-row">
                                        <div class="benefit-progress-bar">
                                            <div class="benefit-progress-fill" style="width: ${((b.metric.current - b.metric.baseline) / (b.metric.target - b.metric.baseline)) * 100}%"></div>
                                        </div>
                                        <span class="stat-val" style="font-size: 11px;">
                                            ${b.metric.current.toLocaleString()}/${b.metric.target.toLocaleString()}${b.metric.unit}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="strategy-row full">
                    <!-- Tier 4 & 5: Project Scope / Execution -->
                    <div class="strategic-tier-box">
                        <div class="tier-title-bar">
                            <h3>Tier 4: Active Execution Scopes & Outputs (The "How")</h3>
                            <span class="tier-badge">Scopes</span>
                        </div>
                        <div class="strategy-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-height: none;" id="scope-list-container">
                            ${state.scopes.map(s => {
                                const isIncluded = state.scenario.includedProjectIds.includes(s.id);
                                return `
                                    <div class="strategy-node-card" style="opacity: ${isIncluded ? '1' : '0.4'}" id="node-${s.id}" data-node="scope" data-id="${s.id}">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                            <h4 style="max-width: 70%;">${s.name}</h4>
                                            <span class="benefit-badge" style="background: hsla(250,95%,68%,0.1); color: var(--accent-indigo); position: static;">
                                                ${s.methodology}
                                            </span>
                                        </div>
                                        <p>${s.description}</p>
                                        
                                        <div class="benefit-meta-grid" style="margin-top: 10px;">
                                            <div class="benefit-meta-item">
                                                <small>Strategic Value</small>
                                                <p>${s.expectedValue} pts</p>
                                            </div>
                                            <div class="benefit-meta-item">
                                                <small>FTE Allocations</small>
                                                <p>${s.fteAllocations} FTEs</p>
                                            </div>
                                        </div>

                                        <div class="benefit-progress-row" style="margin-top: 14px;">
                                            <div class="benefit-progress-bar">
                                                <div class="benefit-progress-fill" style="width: ${s.progress}%; background: var(--accent-indigo);"></div>
                                            </div>
                                            <span class="stat-val" style="font-size: 11px;">${s.progress}% Done</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dynamic Connector Overlays SVG Canvas -->
            <svg class="lo-svg-canvas" id="strategy-svg-canvas">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-muted)" />
                    </marker>
                </defs>
            </svg>
        `;

        this.bindEvents();
        
        // Wait a small frame for elements to be fully laid out in DOM before drawing SVG path lines
        setTimeout(() => this.drawAlignmentLines(state), 50);
    }

    bindEvents() {
        // Realization Month Slider input
        const slider = document.getElementById("realization-month-slider");
        const sliderVal = document.getElementById("slider-month-val");
        
        if (slider) {
            slider.addEventListener("input", (e) => {
                const month = parseInt(e.target.value);
                if (sliderVal) sliderVal.textContent = `Month ${month}`;
                
                // Alter state store via silent update and recount cascading OKRs
                store.state.scenario.realizationMonthSlider = month;
                store.recalculateAllMetrics(true); // Re-trigger reactive views update
            });
        }

        // Hover nodes to trigger visual line of sight tracing paths
        const cards = document.querySelectorAll(".strategy-node-card");
        cards.forEach(card => {
            card.addEventListener("mouseenter", (e) => {
                const type = card.dataset.node;
                const id = card.dataset.id;
                this.highlightConnections(type, id);
            });

            card.addEventListener("mouseleave", () => {
                this.clearHighlightConnections();
            });
        });
    }

    // Interactive SVG paths rendering
    drawAlignmentLines(state) {
        const svg = document.getElementById("strategy-svg-canvas");
        if (!svg) return;

        // Clear existing lines
        svg.innerHTML = svg.innerHTML.split('</defs>')[0] + '</defs>';

        const rootCard = document.getElementById("strategy-root");
        if (!rootCard) return;

        // 1. Link Tier 2 (OKRs) up to Tier 1 (Strategy Root)
        state.strategy.objectives.forEach(okr => {
            const okrCard = document.getElementById(`node-${okr.id}`);
            if (okrCard) {
                this.createSvgLine(svg, okrCard, rootCard, `path-okr-${okr.id}`, "lo-path");
            }
        });

        // 2. Link Tier 3 (Benefits) up to Tier 2 (OKRs)
        state.benefits.forEach(benefit => {
            const benCard = document.getElementById(`node-${benefit.id}`);
            const okrCard = document.getElementById(`node-${benefit.alignedOkrId}`);
            if (benCard && okrCard) {
                this.createSvgLine(svg, benCard, okrCard, `path-ben-${benefit.id}`, `lo-path ${benefit.isDisbenefit ? 'disben-link' : 'ben-link'}`);
            }
        });

        // 3. Link Tier 4 (Scopes) up to Tier 3 (Benefits)
        state.benefits.forEach(benefit => {
            const benCard = document.getElementById(`node-${benefit.id}`);
            if (benCard) {
                benefit.scopeDependencies.forEach(scopeId => {
                    const scopeCard = document.getElementById(`node-${scopeId}`);
                    if (scopeCard) {
                        this.createSvgLine(svg, scopeCard, benCard, `path-scope-${scopeId}-${benefit.id}`, `lo-path scope-link ${benefit.isDisbenefit ? 'disben-link' : 'ben-link'}`);
                    }
                });
            }
        });
    }

    createSvgLine(svg, elFrom, elTo, pathId, classNames) {
        const svgRect = svg.getBoundingClientRect();
        const rFrom = elFrom.getBoundingClientRect();
        const rTo = elTo.getBoundingClientRect();

        // Calculate anchors coordinates
        const xFrom = rFrom.left + rFrom.width / 2 - svgRect.left;
        const yFrom = rFrom.top - svgRect.top; // Connect to top
        const xTo = rTo.left + rTo.width / 2 - svgRect.left;
        const yTo = rTo.bottom - svgRect.top; // Connect to bottom

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("id", pathId);
        path.setAttribute("class", classNames);
        
        // Draw elegant cubic bezier curves connecting the elements
        const cpHeight = Math.abs(yTo - yFrom) * 0.5;
        const d = `M ${xFrom} ${yFrom} C ${xFrom} ${yFrom - cpHeight}, ${xTo} ${yTo + cpHeight}, ${xTo} ${yTo}`;
        
        path.setAttribute("d", d);
        path.setAttribute("marker-end", "url(#arrow)");
        svg.appendChild(path);
    }

    // Hover Highlight connections
    highlightConnections(type, id) {
        const svg = document.getElementById("strategy-svg-canvas");
        if (!svg) return;

        this.clearHighlightConnections();

        const activeClass = "active";
        
        if (type === "okr") {
            // Highlight this OKR and all dependency benefits & scopes
            const okrCard = document.getElementById(`node-${id}`);
            if (okrCard) okrCard.classList.add("selected");

            const paths = svg.querySelectorAll(`[id^="path-okr-${id}"], [id^="path-ben-"]`);
            paths.forEach(p => {
                // If path is for this OKR
                if (p.id === `path-okr-${id}`) {
                    p.classList.add(activeClass);
                }
            });

            // Find related benefits
            const state = store.state;
            const benefits = state.benefits.filter(b => b.alignedOkrId === id);
            benefits.forEach(b => {
                const benCard = document.getElementById(`node-${b.id}`);
                if (benCard) benCard.classList.add("selected");
                
                const bPath = document.getElementById(`path-ben-${b.id}`);
                if (bPath) bPath.classList.add(b.isDisbenefit ? "active-disbenefit" : activeClass);

                b.scopeDependencies.forEach(scopeId => {
                    const sCard = document.getElementById(`node-${scopeId}`);
                    if (sCard) sCard.classList.add("selected");
                    
                    const sPath = document.getElementById(`path-scope-${scopeId}-${b.id}`);
                    if (sPath) sPath.classList.add(b.isDisbenefit ? "active-disbenefit" : activeClass);
                });
            });
        } 
        
        else if (type === "benefit") {
            // Trace line of sight for this Benefit
            const benCard = document.getElementById(`node-${id}`);
            if (benCard) benCard.classList.add("selected");

            const benefit = store.state.benefits.find(b => b.id === id);
            if (!benefit) return;

            // Highlight path up to OKR
            const bPath = document.getElementById(`path-ben-${id}`);
            if (bPath) bPath.classList.add(benefit.isDisbenefit ? "active-disbenefit" : activeClass);

            const okrCard = document.getElementById(`node-${benefit.alignedOkrId}`);
            if (okrCard) okrCard.classList.add("selected");

            const okrPath = document.getElementById(`path-okr-${benefit.alignedOkrId}`);
            if (okrPath) okrPath.classList.add(activeClass);

            // Highlight down to scopes
            benefit.scopeDependencies.forEach(scopeId => {
                const sCard = document.getElementById(`node-${scopeId}`);
                if (sCard) sCard.classList.add("selected");
                
                const sPath = document.getElementById(`path-scope-${scopeId}-${id}`);
                if (sPath) sPath.classList.add(benefit.isDisbenefit ? "active-disbenefit" : activeClass);
            });
        }
        
        else if (type === "scope") {
            // Trace upwards from scope to OKR
            const sCard = document.getElementById(`node-${id}`);
            if (sCard) sCard.classList.add("selected");

            const state = store.state;
            state.benefits.forEach(b => {
                if (b.scopeDependencies.includes(id)) {
                    const benCard = document.getElementById(`node-${b.id}`);
                    if (benCard) benCard.classList.add("selected");

                    const sPath = document.getElementById(`path-scope-${id}-${b.id}`);
                    if (sPath) sPath.classList.add(b.isDisbenefit ? "active-disbenefit" : activeClass);

                    const bPath = document.getElementById(`path-ben-${b.id}`);
                    if (bPath) bPath.classList.add(b.isDisbenefit ? "active-disbenefit" : activeClass);

                    const okrCard = document.getElementById(`node-${b.alignedOkrId}`);
                    if (okrCard) okrCard.classList.add("selected");

                    const okrPath = document.getElementById(`path-okr-${b.alignedOkrId}`);
                    if (okrPath) okrPath.classList.add(activeClass);
                }
            });
        }
    }

    clearHighlightConnections() {
        const cards = document.querySelectorAll(".strategy-node-card");
        cards.forEach(c => {
            if (c.id !== "strategy-root") {
                c.classList.remove("selected");
            }
        });

        const paths = document.querySelectorAll(".lo-path");
        paths.forEach(p => {
            p.classList.remove("active", "active-disbenefit");
        });
    }
}

export default StrategyView;
