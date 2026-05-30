/* ==========================================================================
   DELIVERYPRO.AI - STRATEGY BOARD COMPONENT
   ========================================================================== */

import { store } from './store.js';

class StrategyView {
    constructor() {
        this.containerId = "view-content";
        this.expandedIds = new Set(); // Tracks expanded strategy card IDs
    }

    render(state) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const level = state.scenario.activeHierarchyLevel || "enterprise";
        
        // Define relevant node IDs for each hierarchy level to dim irrelevant items (line-of-sight tracking)
        const relevanceMap = {
            enterprise: null,
            portfolio: null,
            program: [
                "strat-pacific-lead",
                "okr-emissions", "okr-margin",
                "ben-transport-transition", "ben-ops-savings",
                "scope-route-optimization", "scope-transport-fleet"
            ],
            project: [
                "strat-pacific-lead",
                "okr-emissions", "okr-margin",
                "ben-transport-transition", "ben-ops-savings",
                "scope-route-optimization"
            ]
        };

        const activeNodes = relevanceMap[level];
        const isLowRelevance = (nodeId) => activeNodes !== null && activeNodes !== undefined && !activeNodes.includes(nodeId);

        // Render strategy page layout with tiers stacked from top to bottom
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

                <!-- Strategy Matrix Layout - Vertically Cascading Tiers -->
                
                <!-- Tier 1: Enterprise Strategy -->
                <div class="strategy-row full" style="margin-bottom: 24px;">
                    <div class="strategic-tier-box">
                        <div class="tier-title-bar">
                            <h3>Tier 1: Enterprise Strategy (The "Why")</h3>
                            <span class="tier-badge">Vision</span>
                        </div>
                        <div class="glass-panel strategy-node-card selected ${isLowRelevance('strat-pacific-lead') ? 'low-relevance' : ''}" id="strategy-root" data-node="strat" data-id="strat">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                                <div style="max-width: 80%">
                                    <h4>${state.strategy.title}</h4>
                                    <p>${state.strategy.description}</p>
                                </div>
                                <div style="display: flex; align-items: center; gap: 16px;">
                                    <div class="footer-stats" style="padding: 6px 12px; margin: 0; display: inline-flex; border: none; background: hsla(0,0%,100%,0.03);">
                                        <div class="f-stat" style="align-items: center; margin: 0; padding: 0;">
                                            <span class="stat-lbl" style="font-size: 9px; text-transform: uppercase;">Strategic Health</span>
                                            <span class="stat-val" style="color: var(--color-success); font-size: 15px; font-weight: 700;">${state.strategy.health}%</span>
                                        </div>
                                    </div>
                                    <button class="tile-expand-btn ${this.expandedIds.has('strat') ? 'expanded' : ''}" data-id="strat" data-type="strat" title="Toggle contributing projects">
                                        <span class="material-symbols-outlined">${this.expandedIds.has('strat') ? 'expand_less' : 'expand_more'}</span>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Inline Expanded Projects -->
                            ${this.renderInlineContributingProjects('strat', 'strat', state)}
                        </div>
                    </div>
                </div>

                <!-- Tier 2: Strategic Objectives / OKRs -->
                <div class="strategy-row full" style="margin-bottom: 24px;">
                    <div class="strategic-tier-box">
                        <div class="tier-title-bar">
                            <h3>Tier 2: Objectives & OKRs (The "What")</h3>
                            <span class="tier-badge">OKRs</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;" id="okr-list-container">
                            ${state.strategy.objectives.map(okr => {
                                const isExpanded = this.expandedIds.has(okr.id);
                                return `
                                    <div class="strategy-node-card ${isLowRelevance(okr.id) ? 'low-relevance' : ''}" id="node-${okr.id}" data-node="okr" data-id="${okr.id}">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                                            <h4 style="margin: 0; font-size: 14px; font-weight: 700;">${okr.title}</h4>
                                            <button class="tile-expand-btn ${isExpanded ? 'expanded' : ''}" data-id="${okr.id}" data-type="okr" title="Toggle contributing projects">
                                                <span class="material-symbols-outlined">${isExpanded ? 'expand_less' : 'expand_more'}</span>
                                            </button>
                                        </div>
                                        <div class="benefit-progress-row" style="margin-top: 12px;">
                                            <div class="benefit-progress-bar">
                                                <div class="benefit-progress-fill" style="width: ${(okr.current / okr.target) * 100}%"></div>
                                            </div>
                                            <span class="stat-val" style="font-size: 11px;">${okr.current}/${okr.target}${okr.unit}</span>
                                        </div>
                                        
                                        <!-- Inline Expanded Projects -->
                                        ${this.renderInlineContributingProjects(okr.id, 'okr', state)}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Tier 3: Business Outcomes / Benefits Zone -->
                <div class="strategy-row full" style="margin-bottom: 24px;">
                    <div class="strategic-tier-box">
                        <div class="tier-title-bar">
                            <h3>Tier 3: Business Outcomes & Benefits (The "Benefit")</h3>
                            <span class="tier-badge">Benefits</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;" id="benefit-list-container">
                            ${state.benefits.map(b => {
                                const isExpanded = this.expandedIds.has(b.id);
                                return `
                                    <div class="strategy-node-card benefit-profile-card ${b.isDisbenefit ? 'disbenefit' : ''} ${isLowRelevance(b.id) ? 'low-relevance' : ''}" 
                                         id="node-${b.id}" data-node="benefit" data-id="${b.id}">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                                            <span class="benefit-badge ${b.isDisbenefit ? 'disben' : 'ben'}" style="position: static; margin-bottom: 0;">
                                                ${b.isDisbenefit ? 'Disbenefit' : 'Benefit'}
                                            </span>
                                            <button class="tile-expand-btn ${isExpanded ? 'expanded' : ''}" data-id="${b.id}" data-type="benefit" title="Toggle contributing projects">
                                                <span class="material-symbols-outlined">${isExpanded ? 'expand_less' : 'expand_more'}</span>
                                            </button>
                                        </div>
                                        <h4 style="margin-top: 8px; margin-bottom: 0; font-size: 14px; font-weight: 700; text-align: left;">${b.name}</h4>
                                        
                                        <div class="benefit-meta-grid" style="margin-top: 10px;">
                                            <div class="benefit-meta-item">
                                                <small>Owner Accountable</small>
                                                <p>${b.owner.split(' ')[0]}</p>
                                            </div>
                                            <div class="benefit-meta-item">
                                                <small>Realization Lag</small>
                                                <p>${b.realizationTimeline.startOffsetMonths}m lag (${b.realizationTimeline.durationMonths}m run)</p>
                                            </div>
                                        </div>

                                        <div class="benefit-progress-row" style="margin-top: 14px;">
                                            <div class="benefit-progress-bar">
                                                <div class="benefit-progress-fill" style="width: ${((b.metric.current - b.metric.baseline) / (b.metric.target - b.metric.baseline)) * 100}%"></div>
                                            </div>
                                            <span class="stat-val" style="font-size: 11px;">
                                                ${b.metric.current.toLocaleString()}/${b.metric.target.toLocaleString()}${b.metric.unit}
                                            </span>
                                        </div>
                                        
                                        <!-- Inline Expanded Projects -->
                                        ${this.renderInlineContributingProjects(b.id, 'benefit', state)}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Tier 4 & 5: Project Scope / Execution -->
                <div class="strategy-row full">
                    <div class="strategic-tier-box">
                        <div class="tier-title-bar">
                            <h3>Tier 4: Active Execution Scopes & Outputs (The "How")</h3>
                            <span class="tier-badge">Scopes</span>
                        </div>
                        <div class="strategy-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-height: none;" id="scope-list-container">
                            ${state.scopes.map(s => {
                                const isIncluded = state.scenario.includedProjectIds.includes(s.id);
                                return `
                                    <div class="strategy-node-card ${isLowRelevance(s.id) ? 'low-relevance' : ''}" style="opacity: ${isIncluded ? (isLowRelevance(s.id) ? '0.22' : '1') : '0.4'}; cursor: pointer;" id="node-${s.id}" data-node="scope" data-id="${s.id}">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                            <h4 style="max-width: 70%; text-align: left;">${s.name}</h4>
                                            <span class="benefit-badge" style="background: hsla(250,95%,68%,0.1); color: var(--accent-indigo); position: static;">
                                                ${s.methodology}
                                            </span>
                                        </div>
                                        <p style="text-align: left;">${s.description}</p>
                                        
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

    renderInlineContributingProjects(id, type, state) {
        const isExpanded = this.expandedIds.has(id);
        
        let contributingScopes = [];
        if (type === "strat") {
            contributingScopes = state.scopes;
        } else if (type === "okr") {
            const alignedBens = state.benefits.filter(b => b.alignedOkrId === id);
            const scopeIds = [];
            alignedBens.forEach(b => b.scopeDependencies.forEach(sid => {
                if (!scopeIds.includes(sid)) scopeIds.push(sid);
            }));
            contributingScopes = scopeIds.map(sid => state.scopes.find(s => s.id === sid)).filter(Boolean);
        } else if (type === "benefit") {
            const ben = state.benefits.find(b => b.id === id);
            if (ben) {
                contributingScopes = ben.scopeDependencies.map(sid => state.scopes.find(s => s.id === sid)).filter(Boolean);
            }
        }

        if (contributingScopes.length === 0) return "";

        return `
            <div class="contributing-projects-inline ${isExpanded ? '' : 'hidden'}" id="expand-container-${id}">
                <div class="expanded-projects-header">Contributing Deliverables</div>
                <div class="expanded-projects-list">
                    ${contributingScopes.map(scope => {
                        const isIncluded = state.scenario.includedProjectIds.includes(scope.id);
                        
                        let statusClass = "realizing";
                        let statusText = "Realizing";
                        
                        const isDelayed = state.scenario.scheduleOffsets[scope.id] > 0;
                        if (!isIncluded || scope.status === "Proposed") {
                            statusClass = "proposed";
                            statusText = "Proposed";
                        } else if (isDelayed) {
                            statusClass = "delayed";
                            statusText = "Delayed";
                        } else {
                            const alignedBens = state.benefits.filter(b => b.scopeDependencies.includes(scope.id));
                            const isMaturing = alignedBens.every(ben => state.scenario.realizationMonthSlider < ben.realizationTimeline.startOffsetMonths);
                            if (isMaturing) {
                                statusClass = "maturing";
                                statusText = "Maturing";
                            }
                        }
                        
                        let weightText = "";
                        if (type === "benefit") {
                            const b = state.benefits.find(ben => ben.id === id);
                            const weight = b.contributionWeights ? (b.contributionWeights[scope.id] || 100) : 100;
                            weightText = `<span class="proj-weight-badge">${weight}% share</span>`;
                        } else if (type === "okr") {
                            const bens = state.benefits.filter(ben => ben.alignedOkrId === id && ben.scopeDependencies.includes(scope.id));
                            let avgW = 0;
                            bens.forEach(ben => {
                                avgW += ben.contributionWeights ? (ben.contributionWeights[scope.id] || 100) : 100;
                            });
                            avgW = bens.length ? Math.round(avgW / bens.length) : 100;
                            weightText = `<span class="proj-weight-badge">${avgW}% avg</span>`;
                        } else if (type === "strat") {
                            const bens = state.benefits.filter(ben => ben.scopeDependencies.includes(scope.id));
                            let avgW = 0;
                            bens.forEach(ben => {
                                avgW += ben.contributionWeights ? (ben.contributionWeights[scope.id] || 100) : 100;
                            });
                            avgW = bens.length ? Math.round(avgW / bens.length) : 100;
                            weightText = `<span class="proj-weight-badge">${avgW}% avg</span>`;
                        }

                        return `
                            <div class="expanded-project-row">
                                <span class="proj-name" title="${scope.name}">${scope.name}</span>
                                <div class="proj-info">
                                    ${weightText}
                                    <span class="proj-status-badge ${statusClass}">${statusText}</span>
                                    <span style="font-weight:700; color:var(--color-text-primary); font-size:10px;">${scope.progress}%</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
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

        // Hover nodes to trigger visual line of sight tracing paths & Clicks to trigger modal inspector
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

            card.addEventListener("click", (e) => {
                e.stopPropagation();
                const type = card.dataset.node;
                const id = card.dataset.id || "strat";
                this.openContributionInspector(type, id, store.state);
            });
        });

        // Expand/Collapse card triggers
        const expandBtns = document.querySelectorAll(".tile-expand-btn");
        expandBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation(); // Stop click from opening modal
                const id = btn.dataset.id;
                const container = document.getElementById(`expand-container-${id}`);
                
                if (container) {
                    const isExpanded = this.expandedIds.has(id);
                    if (isExpanded) {
                        this.expandedIds.delete(id);
                        btn.classList.remove("expanded");
                        btn.querySelector(".material-symbols-outlined").textContent = "expand_more";
                        container.classList.add("hidden");
                    } else {
                        this.expandedIds.add(id);
                        btn.classList.add("expanded");
                        btn.querySelector(".material-symbols-outlined").textContent = "expand_less";
                        container.classList.remove("hidden");
                    }
                    
                    // Immediately recalculate lines because element heights shifted!
                    this.drawAlignmentLines(store.state);
                }
            });
        });

        // Prevent modal click inside expanded projects container
        const inlineContainers = document.querySelectorAll(".contributing-projects-inline");
        inlineContainers.forEach(container => {
            container.addEventListener("click", (e) => {
                e.stopPropagation(); // Stop click from bubbling up to the card, preventing the modal from popping up!
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

    openContributionInspector(type, id, state) {
        const modal = document.getElementById("contribution-modal");
        const modalTitle = document.getElementById("contrib-modal-title");
        const modalBody = document.getElementById("contrib-modal-body");
        const closeBtn = document.getElementById("contrib-modal-close");

        if (!modal || !modalBody || !modalTitle) return;

        // Wire up close button & backdrop clicking
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.add("hidden");
        }
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add("hidden");
            }
        };

        modal.classList.remove("hidden");

        let headerHtml = "";
        let bodyHtml = "";

        if (type === "strat") {
            modalTitle.textContent = "Enterprise Strategy Inspector";
            headerHtml = `
                <div class="contrib-header-info">
                    <span class="contrib-badge strat">Enterprise Strategy</span>
                    <h3>${state.strategy.title}</h3>
                    <p class="help-text">${state.strategy.description}</p>
                </div>
            `;

            // List OKRs
            const okrsHtml = `
                <div class="contrib-section-title">Supporting Strategic OKRs & Targets</div>
                <div class="contrib-project-list" style="margin-bottom: 16px;">
                    ${state.strategy.objectives.map(okr => {
                        const score = Math.round((okr.current / okr.target) * 100);
                        return `
                            <div class="contrib-project-card" style="padding: 10px 14px;">
                                <div class="contrib-card-header">
                                    <span class="contrib-card-title" style="font-size: 12px; font-weight: 700;">${okr.title}</span>
                                    <span class="contrib-status-badge realizing-green">${score}% Met</span>
                                </div>
                                <p class="help-text" style="font-size: 10px;">Target Metric: ${okr.metric} (${okr.target}${okr.unit})</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            // Find all contributing projects (scopes) across all benefits
            let projectsHtml = "";
            state.scopes.forEach(scope => {
                const isIncluded = state.scenario.includedProjectIds.includes(scope.id);
                
                // Find all benefits enabled by this project
                const alignedBens = state.benefits.filter(b => b.scopeDependencies.includes(scope.id));
                if (alignedBens.length === 0) return;

                // Calculate health badge status
                let statusBadge = "realizing-green";
                let statusText = "Value Realizing";
                
                const isDelayed = state.scenario.scheduleOffsets[scope.id] > 0;
                if (!isIncluded || scope.status === "Proposed") {
                    statusBadge = "proposed-grey";
                    statusText = "Proposed / Excluded";
                } else if (isDelayed) {
                    statusBadge = "delayed-red";
                    statusText = "Schedule Delayed";
                } else {
                    // Check if any enabling benefit is still in its lag maturation offset period
                    const isMaturing = alignedBens.every(ben => state.scenario.realizationMonthSlider < ben.realizationTimeline.startOffsetMonths);
                    if (isMaturing) {
                        statusBadge = "maturing-amber";
                        statusText = "In Flight - Maturing";
                    }
                }

                // Calculate average weight contribution
                let avgWeight = 0;
                alignedBens.forEach(ben => {
                    const w = ben.contributionWeights ? (ben.contributionWeights[scope.id] || 100) : 100;
                    avgWeight += w;
                });
                avgWeight = Math.round(avgWeight / alignedBens.length);

                const alignedBensNames = alignedBens.map(b => b.name.substring(0, 30) + "...").join(", ");

                projectsHtml += `
                    <div class="contrib-project-card">
                        <div class="contrib-card-header">
                            <span class="contrib-card-title">${scope.name}</span>
                            <span class="contrib-status-badge ${statusBadge}">${statusText}</span>
                        </div>
                        <p class="help-text" style="font-size:11px; margin-top:2px;">
                            Enables: <i>${alignedBensNames}</i>
                        </p>
                        <div class="contrib-progress-label" style="margin-top: 8px;">
                            <span>Avg strategic weight: <b>${avgWeight}%</b></span>
                            <span>Project progress: <b>${scope.progress}%</b></span>
                        </div>
                        <div class="benefit-progress-bar" style="height: 6px; margin-top: 4px;">
                            <div class="benefit-progress-fill" style="width: ${scope.progress}%; background: var(--accent-indigo);"></div>
                        </div>
                    </div>
                `;
            });

            const corpProjectsHtml = `
                <div class="contrib-section-title">Contributing Corporate Deliverables</div>
                <div class="contrib-project-list">
                    ${projectsHtml || `<div class="help-text">No active corporate projects map to this strategy.</div>`}
                </div>
            `;

            bodyHtml = okrsHtml + corpProjectsHtml;
        }

        else if (type === "okr") {
            const okr = state.strategy.objectives.find(o => o.id === id);
            if (!okr) return;

            modalTitle.textContent = "Strategic OKR Contribution Inspector";
            headerHtml = `
                <div class="contrib-header-info">
                    <span class="contrib-badge okr">Strategic Objective / OKR</span>
                    <h3>${okr.title}</h3>
                    <p class="help-text">Target Metric: <b>${okr.metric}</b> | Current Realization: <b>${okr.current}/${okr.target}${okr.unit}</b></p>
                </div>
            `;

            // Find contributing benefits and their active projects
            const alignedBens = state.benefits.filter(b => b.alignedOkrId === id);
            
            let projectsHtml = "";
            let foundProjects = [];

            alignedBens.forEach(ben => {
                ben.scopeDependencies.forEach(scopeId => {
                    const scope = state.scopes.find(s => s.id === scopeId);
                    if (scope && !foundProjects.includes(scopeId)) {
                        foundProjects.push(scopeId);
                        
                        const isIncluded = state.scenario.includedProjectIds.includes(scopeId);
                        const weight = ben.contributionWeights ? (ben.contributionWeights[scopeId] || 100) : 100;
                        
                        // Calculate health badge status
                        let statusBadge = "realizing-green";
                        let statusText = "Value Realizing";
                        
                        const isDelayed = state.scenario.scheduleOffsets[scopeId] > 0;
                        if (!isIncluded || scope.status === "Proposed") {
                            statusBadge = "proposed-grey";
                            statusText = "Proposed / Not Included";
                        } else if (isDelayed) {
                            statusBadge = "delayed-red";
                            statusText = "Schedule Delayed";
                        } else if (state.scenario.realizationMonthSlider < ben.realizationTimeline.startOffsetMonths) {
                            statusBadge = "maturing-amber";
                            statusText = "In Flight - Maturing";
                        }

                        projectsHtml += `
                            <div class="contrib-project-card">
                                <div class="contrib-card-header">
                                    <span class="contrib-card-title">${scope.name}</span>
                                    <span class="contrib-status-badge ${statusBadge}">${statusText}</span>
                                </div>
                                <p class="help-text" style="font-size:11px; margin-top:2px;">
                                    Via Outcome: <i>${ben.name.substring(0, 50)}...</i>
                                </p>
                                <div class="contrib-progress-label" style="margin-top: 8px;">
                                    <span>Strategic contribution weight: <b>${weight}%</b> of enabling benefit</span>
                                    <span>Project progress: <b>${scope.progress}%</b></span>
                                </div>
                                <div class="benefit-progress-bar" style="height: 6px; margin-top: 4px;">
                                    <div class="benefit-progress-fill" style="width: ${scope.progress}%; background: var(--accent-indigo);"></div>
                                </div>
                            </div>
                        `;
                    }
                });
            });

            bodyHtml = `
                <div class="contrib-section-title">Contributing Execution Projects</div>
                <div class="contrib-project-list">
                    ${projectsHtml || `<div class="help-text">No active project scopes contribute directly to this OKR.</div>`}
                </div>
            `;
        }

        else if (type === "benefit") {
            const ben = state.benefits.find(b => b.id === id);
            if (!ben) return;

            modalTitle.textContent = "Business Outcome & Benefit Inspector";
            const realizedPct = Math.round(((ben.metric.current - ben.metric.baseline) / (ben.metric.target - ben.metric.baseline)) * 100);
            
            headerHtml = `
                <div class="contrib-header-info">
                    <span class="contrib-badge ${ben.isDisbenefit ? 'disben' : 'ben'}">${ben.isDisbenefit ? 'Disbenefit trade-off' : 'Business Benefit Outcome'}</span>
                    <h3>${ben.name}</h3>
                    <p class="help-text">
                        Target Metric: <b>${ben.metric.target.toLocaleString()}${ben.metric.unit}</b> | 
                        Current Maturation: <b>${ben.metric.current.toLocaleString()}/${ben.metric.target.toLocaleString()}${ben.metric.unit} (${realizedPct}% realized)</b>
                    </p>
                    <p class="help-text" style="margin-top: 4px; font-size:11px;">
                        Accountable Owner: <b>${ben.owner}</b> | Realization Lag: <b>${ben.realizationTimeline.startOffsetMonths}m lag</b>
                    </p>
                </div>
            `;

            // List direct scope dependencies and their weights
            const scopesListHtml = ben.scopeDependencies.map(scopeId => {
                const scope = state.scopes.find(s => s.id === scopeId);
                if (!scope) return "";

                const weight = ben.contributionWeights ? (ben.contributionWeights[scopeId] || 100) : 100;
                const isIncluded = state.scenario.includedProjectIds.includes(scopeId);
                const cost = scope.financials.capEx.plan + scope.financials.opEx.plan;
                
                // Calculate health badge status
                let statusBadge = "realizing-green";
                let statusText = "Value Realizing";
                
                const isDelayed = state.scenario.scheduleOffsets[scopeId] > 0;
                if (!isIncluded || scope.status === "Proposed") {
                    statusBadge = "proposed-grey";
                    statusText = "Proposed / Excluded";
                } else if (isDelayed) {
                    statusBadge = "delayed-red";
                    statusText = "Schedule Delayed";
                } else if (state.scenario.realizationMonthSlider < ben.realizationTimeline.startOffsetMonths) {
                    statusBadge = "maturing-amber";
                    statusText = "In Flight - Maturing";
                }

                // Contribution volume
                let contributionVolume = "";
                if (ben.metric.unit === "$") {
                    const shareVal = (weight / 100 * ben.metric.target);
                    const currentShareVal = (scope.progress / 100 * shareVal);
                    contributionVolume = `Estimated Contribution: <b>$${currentShareVal.toLocaleString()}</b> / $${shareVal.toLocaleString()}`;
                } else {
                    const shareVal = (weight / 100 * ben.metric.target);
                    const currentShareVal = (scope.progress / 100 * shareVal);
                    contributionVolume = `Estimated Contribution: <b>${currentShareVal.toFixed(1)}${ben.metric.unit}</b> / ${shareVal.toFixed(1)}${ben.metric.unit}`;
                }

                return `
                    <div class="contrib-project-card">
                        <div class="contrib-card-header">
                            <span class="contrib-card-title">${scope.name}</span>
                            <span class="contrib-status-badge ${statusBadge}">${statusText}</span>
                        </div>
                        <p class="help-text" style="font-size:11px; margin-top:2px;">
                            ${contributionVolume} (${weight}% share of target outcome)
                        </p>
                        <div class="contrib-progress-label" style="margin-top: 8px;">
                            <span>Project execution: <b>${scope.progress}%</b> complete</span>
                            <span>Planned cost: <b>$${cost.toLocaleString()}</b></span>
                        </div>
                        <div class="benefit-progress-bar" style="height: 6px; margin-top: 4px;">
                            <div class="benefit-progress-fill" style="width: ${scope.progress}%; background: var(--accent-indigo);"></div>
                        </div>
                    </div>
                `;
            }).join('');

            bodyHtml = `
                <div class="contrib-section-title">Enabling Project Outputs</div>
                <div class="contrib-project-list">
                    ${scopesListHtml || `<div class="help-text">No active project scopes enable this benefit.</div>`}
                </div>
            `;
        }

        else if (type === "scope") {
            const scope = state.scopes.find(s => s.id === id);
            if (!scope) return;

            modalTitle.textContent = "Execution Project Scope Inspector";
            const cost = scope.financials.capEx.plan + scope.financials.opEx.plan;
            const spend = scope.financials.capEx.actual + scope.financials.opEx.actual;

            headerHtml = `
                <div class="contrib-header-info">
                    <span class="contrib-badge strat">Project Execution Scope</span>
                    <h3>${scope.name}</h3>
                    <p class="help-text">${scope.description}</p>
                    <p class="help-text" style="margin-top: 4px; font-size:11px;">
                        Methodology: <b>${scope.methodology}</b> | Expected Value: <b>${scope.expectedValue} pts</b> | Allocations: <b>${scope.fteAllocations} FTEs</b>
                    </p>
                </div>
            `;

            // List parent benefits
            const parents = state.benefits.filter(b => b.scopeDependencies.includes(id));
            const parentsHtml = parents.map(b => {
                const weight = b.contributionWeights ? (b.contributionWeights[id] || 100) : 100;
                return `
                    <div class="contrib-project-card">
                        <div class="contrib-card-header">
                            <span class="contrib-card-title">${b.name}</span>
                            <span class="contrib-status-badge realizing-green">${b.isDisbenefit ? 'Disbenefit' : 'Benefit'}</span>
                        </div>
                        <p class="help-text" style="font-size:11px; margin-top:4px;">
                            Project contributes a **${weight}% weight share** directly to this outcome.
                        </p>
                    </div>
                `;
            }).join('');

            bodyHtml = `
                <div class="contrib-section-title">Financial & Value Rolldowns</div>
                <div class="est-details-grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div class="cons-card" style="padding: 10px;">
                        <span class="cons-card-lbl">Execution Progress</span>
                        <div class="cons-card-val" style="font-size: 16px; margin-top: 4px; color: var(--accent-indigo);">${scope.progress}% Complete</div>
                    </div>
                    <div class="cons-card" style="padding: 10px;">
                        <span class="cons-card-lbl">Financial Burndown</span>
                        <div class="cons-card-val" style="font-size: 16px; margin-top: 4px; color: var(--color-success);">$${spend.toLocaleString()} / $${cost.toLocaleString()}</div>
                    </div>
                </div>
                <div class="contrib-section-title">Enables Aligned Benefits</div>
                <div class="contrib-project-list">
                    ${parentsHtml || `<div class="help-text">This project scope is not mapped to any business benefits.</div>`}
                </div>
            `;
        }

        modalBody.innerHTML = headerHtml + bodyHtml;
    }
}

export default StrategyView;
