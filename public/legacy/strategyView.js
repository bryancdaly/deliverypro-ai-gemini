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
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h3>Tier 1: Enterprise Strategy (The "Why")</h3>
                                <button class="add-node-btn" data-type="strat" style="display:flex; align-items:center; gap:4px; font-family:'Inter'; border-radius:20px; font-weight:700;">
                                    <span class="material-symbols-outlined" style="font-size:12px;">add</span> Add Strategy
                                </button>
                            </div>
                            <span class="tier-badge">Vision</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 16px;" id="strategy-list-container">
                            ${state.strategy.filter(strat => !strat.isArchived).map(strat => {
                                const isExpanded = this.expandedIds.has(strat.id);
                                return `
                                    <div class="glass-panel strategy-node-card selected ${isLowRelevance(strat.id) ? 'low-relevance' : ''}" id="node-${strat.id}" data-node="strat" data-id="${strat.id}">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                                            <div style="max-width: 80%">
                                                <h4>${strat.title}</h4>
                                                <p>${strat.description}</p>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 16px;">
                                                <div class="footer-stats" style="padding: 6px 12px; margin: 0; display: inline-flex; border: none; background: hsla(0,0%,100%,0.03);">
                                                    <div class="f-stat" style="align-items: center; margin: 0; padding: 0;">
                                                        <span class="stat-lbl" style="font-size: 9px; text-transform: uppercase;">Strategic Health</span>
                                                        <span class="stat-val" style="color: var(--color-success); font-size: 15px; font-weight: 700;">${strat.health}%</span>
                                                    </div>
                                                </div>
                                                <button class="tile-expand-btn ${isExpanded ? 'expanded' : ''}" data-id="${strat.id}" data-type="strat" title="Toggle contributing projects">
                                                    <span class="material-symbols-outlined">${isExpanded ? 'expand_less' : 'expand_more'}</span>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <!-- Inline Expanded Projects -->
                                        ${this.renderInlineContributingProjects(strat.id, 'strat', state)}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Tier 2: Strategic Objectives / OKRs -->
                <div class="strategy-row full" style="margin-bottom: 24px;">
                    <div class="strategic-tier-box">
                        <div class="tier-title-bar">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h3>Tier 2: Objectives & OKRs (The "What")</h3>
                                <button class="add-node-btn" data-type="okr" style="display:flex; align-items:center; gap:4px; font-family:'Inter'; border-radius:20px; font-weight:700;">
                                    <span class="material-symbols-outlined" style="font-size:12px;">add</span> Add OKR
                                </button>
                            </div>
                            <span class="tier-badge">OKRs</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;" id="okr-list-container">
                            ${state.strategy.flatMap(s=>s.objectives).filter(okr => !okr.isArchived).map(okr => {
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
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h3>Tier 3: Business Outcomes & Benefits (The "Benefit")</h3>
                                <button class="add-node-btn" data-type="benefit" style="display:flex; align-items:center; gap:4px; font-family:'Inter'; border-radius:20px; font-weight:700;">
                                    <span class="material-symbols-outlined" style="font-size:12px;">add</span> Add Benefit
                                </button>
                            </div>
                            <span class="tier-badge">Benefits</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;" id="benefit-list-container">
                            ${state.benefits.filter(b => !b.isArchived).map(b => {
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
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h3>Tier 4: Active Execution Scopes & Outputs (The "How")</h3>
                                <button class="add-node-btn" data-type="scope" style="display:flex; align-items:center; gap:4px; font-family:'Inter'; border-radius:20px; font-weight:700;">
                                    <span class="material-symbols-outlined" style="font-size:12px;">add</span> Add Scope
                                </button>
                            </div>
                            <span class="tier-badge">Scopes</span>
                        </div>
                        <div class="strategy-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-height: none;" id="scope-list-container">
                            ${state.scopes.filter(s => !s.isArchived).map(s => {
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
            contributingScopes = state.scopes.filter(s => !s.isArchived);
        } else if (type === "okr") {
            const alignedBens = state.benefits.filter(b => !b.isArchived && b.alignedOkrId === id);
            const scopeIds = [];
            alignedBens.forEach(b => b.scopeDependencies.forEach(sid => {
                if (!scopeIds.includes(sid)) scopeIds.push(sid);
            }));
            contributingScopes = scopeIds.map(sid => state.scopes.find(s => s.id === sid)).filter(s => s && !s.isArchived);
        } else if (type === "benefit") {
            const ben = state.benefits.find(b => b.id === id);
            if (ben) {
                contributingScopes = ben.scopeDependencies.map(sid => state.scopes.find(s => s.id === sid)).filter(s => s && !s.isArchived);
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
        // Add buttons clicking
        const addBtns = document.querySelectorAll(".add-node-btn");
        addBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const type = btn.dataset.type;
                this.openContributionInspector(type, null, store.state, "add");
            });
        });

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

        // 1. Link Tier 2 (OKRs) up to Tier 1 (Strategy Scopes)
        state.strategy.filter(strat => !strat.isArchived).forEach(strat => {
            const rootCard = document.getElementById(`node-${strat.id}`);
            if (rootCard) {
                strat.objectives.filter(okr => !okr.isArchived).forEach(okr => {
                    const okrCard = document.getElementById(`node-${okr.id}`);
                    if (okrCard) {
                        this.createSvgLine(svg, okrCard, rootCard, `path-okr-${okr.id}`, "lo-path");
                    }
                });
            }
        });

        // 2. Link Tier 3 (Benefits) up to Tier 2 (OKRs)
        state.benefits.filter(b => !b.isArchived).forEach(benefit => {
            const benCard = document.getElementById(`node-${benefit.id}`);
            const okrCard = document.getElementById(`node-${benefit.alignedOkrId}`);
            if (benCard && okrCard) {
                this.createSvgLine(svg, benCard, okrCard, `path-ben-${benefit.id}`, `lo-path ${benefit.isDisbenefit ? 'disben-link' : 'ben-link'}`);
            }
        });

        // 3. Link Tier 4 (Scopes) up to Tier 3 (Benefits)
        state.benefits.filter(b => !b.isArchived).forEach(benefit => {
            const benCard = document.getElementById(`node-${benefit.id}`);
            if (benCard) {
                benefit.scopeDependencies.forEach(scopeId => {
                    const scopeCard = document.getElementById(`node-${scopeId}`);
                    const scope = state.scopes.find(sc => sc.id === scopeId);
                    if (scopeCard && scope && !scope.isArchived) {
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
        const svg = document.getElementById("strategy-svg-canvas");
        if (svg) {
            const paths = svg.querySelectorAll("path");
            paths.forEach(p => {
                p.classList.remove("active");
                p.classList.remove("active-disbenefit");
            });
        }
        document.querySelectorAll(".strategy-node-card.selected").forEach(card => {
            // Enterprise Strategy is normally always selected anyway but they can all be reset or just OKR / Benefit / Scopes
            if (card.id !== "strategy-root") {
                card.classList.remove("selected");
            }
        });
    }

    openContributionInspector(type, id, state, mode = "inspect") {
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

        if (mode === "inspect") {
            if (type === "strat") {
                const strat = state.strategy.find(s => s.id === id);
                modalTitle.textContent = "Enterprise Strategy Inspector";
                headerHtml = `
                    <div class="contrib-header-info">
                        <span class="contrib-badge strat">Enterprise Strategy</span>
                        <h3>${strat.title}</h3>
                        <p class="help-text">${strat.description}</p>
                    </div>
                `;

                // List OKRs
                const okrsHtml = `
                    <div class="contrib-section-title">Supporting Strategic OKRs & Targets</div>
                    <div class="contrib-project-list" style="margin-bottom: 16px;">
                        ${strat.objectives.filter(okr => !okr.isArchived).map(okr => {
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
                state.scopes.filter(scope => !scope.isArchived).forEach(scope => {
                    const isIncluded = state.scenario.includedProjectIds.includes(scope.id);
                    const alignedBens = state.benefits.filter(b => !b.isArchived && b.scopeDependencies.includes(scope.id));
                    if (alignedBens.length === 0) return;

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
                        const isMaturing = alignedBens.every(ben => state.scenario.realizationMonthSlider < ben.realizationTimeline.startOffsetMonths);
                        if (isMaturing) {
                            statusBadge = "maturing-amber";
                            statusText = "In Flight - Maturing";
                        }
                    }

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
                const okr = state.strategy.flatMap(s=>s.objectives).find(o => o.id === id);
                if (!okr) return;

                modalTitle.textContent = "Strategic OKR Contribution Inspector";
                headerHtml = `
                    <div class="contrib-header-info">
                        <span class="contrib-badge okr">Strategic Objective / OKR</span>
                        <h3>${okr.title}</h3>
                        <p class="help-text">Target Metric: <b>${okr.metric}</b> | Current Realization: <b>${okr.current}/${okr.target}${okr.unit}</b></p>
                    </div>
                `;

                const alignedBens = state.benefits.filter(b => !b.isArchived && b.alignedOkrId === id);
                let projectsHtml = "";
                let foundProjects = [];

                alignedBens.forEach(ben => {
                    ben.scopeDependencies.forEach(scopeId => {
                        const scope = state.scopes.find(s => s.id === scopeId);
                        if (scope && !scope.isArchived && !foundProjects.includes(scopeId)) {
                            foundProjects.push(scopeId);
                            
                            const isIncluded = state.scenario.includedProjectIds.includes(scopeId);
                            const weight = ben.contributionWeights ? (ben.contributionWeights[scopeId] || 100) : 100;
                            
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

                const scopesListHtml = ben.scopeDependencies.map(scopeId => {
                    const scope = state.scopes.find(s => s.id === scopeId);
                    if (!scope || scope.isArchived) return "";

                    const weight = ben.contributionWeights ? (ben.contributionWeights[scopeId] || 100) : 100;
                    const isIncluded = state.scenario.includedProjectIds.includes(scopeId);
                    const cost = scope.financials.capEx.plan + scope.financials.opEx.plan;
                    
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

                    let contributionVolume = "";
                    if (ben.metric.unit === "$") {
                        const shareVal = (weight / 100 * ben.metric.target);
                        const currentShareVal = (scope.progress / 100 * shareVal);
                        contributionVolume = `Estimated Contribution: <b>NZ$${currentShareVal.toLocaleString()}</b> / NZ$${shareVal.toLocaleString()}`;
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
                                <span>Planned cost: <b>NZ$${cost.toLocaleString()}</b></span>
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
                            Methodology: <b>${scope.methodology}</b> | Expected Value: <b>${scope.expectedValue} pts</b> | Allocations: <b>${scope.fteAllocations} FTEs</b>${scope.startDate ? ` | Timeline: <b>${scope.startDate} → ${scope.endDate || 'TBD'}</b>` : ''}
                        </p>
                    </div>
                `;

                const parents = state.benefits.filter(b => !b.isArchived && b.scopeDependencies.includes(id));
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
                            <div class="cons-card-val" style="font-size: 16px; margin-top: 4px; color: var(--color-success);">NZ$${spend.toLocaleString()} / NZ$${cost.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="contrib-section-title">Enables Aligned Benefits</div>
                    <div class="contrib-project-list">
                        ${parentsHtml || `<div class="help-text">This project scope is not mapped to any business benefits.</div>`}
                    </div>
                `;
            }

            let bottomActionBar = `
                    <div class="modal-action-bar">
                        <button class="btn btn-secondary" id="inspect-edit-btn" style="border-color:var(--accent-indigo); color:var(--accent-indigo); display:flex; align-items:center; gap:4px;">
                            <span class="material-symbols-outlined" style="font-size:14px;">edit</span> Edit ${type === 'strat' ? 'Strategy' : 'Details'}
                        </button>
                        <button class="btn btn-secondary" id="inspect-close-btn" style="border-color:var(--color-success); color:var(--color-success); display:flex; align-items:center; gap:4px;">
                            <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span> Close/Complete
                        </button>
                        <button class="btn btn-secondary" id="inspect-archive-btn" style="border-color:var(--color-warning); color:var(--color-warning); display:flex; align-items:center; gap:4px;">
                            <span class="material-symbols-outlined" style="font-size:14px;">archive</span> Archive Record
                        </button>
                    </div>
                `;

            modalBody.innerHTML = headerHtml + bodyHtml + bottomActionBar;

            const editBtn = document.getElementById("inspect-edit-btn");
            if (editBtn) editBtn.onclick = () => this.openContributionInspector(type, id, state, "edit");

            const closeBtnActions = document.getElementById("inspect-close-btn");
            const archiveBtn = document.getElementById("inspect-archive-btn");

            const recordName = type === 'strat' ? (state.strategy.find(s => s.id === id) || {}).title || 'Strategy' :
                               type === 'okr' ? (state.strategy.flatMap(s => s.objectives).find(o => o.id === id) || {}).title || 'OKR' :
                               type === 'benefit' ? (state.benefits.find(b => b.id === id) || {}).name || 'Benefit' :
                               (state.scopes.find(s => s.id === id) || {}).name || 'Scope';

            if (closeBtnActions) {
                closeBtnActions.onclick = () => {
                    store.commitTransaction(`Complete ${type.toUpperCase()}: "${recordName}"`, "User Action", (s) => {
                        if (type === 'strat') {
                            const strat = s.strategy.find(st => st.id === id);
                            if (strat) {
                                strat.objectives.forEach(okr => okr.current = okr.target);
                                strat.health = 100;
                            }
                        } else if (type === 'okr') {
                            const okr = s.strategy.flatMap(st => st.objectives).find(o => o.id === id);
                            if (okr) okr.current = okr.target;
                        } else if (type === 'benefit') {
                            const ben = s.benefits.find(b => b.id === id);
                            if (ben) ben.metric.current = ben.metric.target;
                        } else if (type === 'scope') {
                            const scope = s.scopes.find(sc => sc.id === id);
                            if (scope) {
                                scope.status = "Completed";
                                scope.progress = 100;
                                s.tasks.filter(t => t.scopeId === id).forEach(t => t.status = "done");
                            }
                        }
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }

            if (archiveBtn) {
                archiveBtn.onclick = () => {
                    store.commitTransaction(`Archive ${type.toUpperCase()}: "${recordName}"`, "User Action", (s) => {
                        if (type === 'strat') {
                            const strat = s.strategy.find(st => st.id === id);
                            if (strat) strat.isArchived = true;
                        } else if (type === 'okr') {
                            const okr = s.strategy.flatMap(st => st.objectives).find(o => o.id === id);
                            if (okr) okr.isArchived = true;
                        } else if (type === 'benefit') {
                            const ben = s.benefits.find(b => b.id === id);
                            if (ben) ben.isArchived = true;
                        } else if (type === 'scope') {
                            const scope = s.scopes.find(sc => sc.id === id);
                            if (scope) scope.isArchived = true;
                        }
                    });
                    modal.classList.add("hidden");
                    this.render(store.state);
                };
            }
        } 
        
        else if (mode === "edit" || mode === "add") {
            const isEdit = mode === "edit";
            modalTitle.textContent = isEdit ? `Edit ${type.toUpperCase()}` : `Add New ${type.toUpperCase()}`;

            let formHtml = "";

            if (type === "strat") {
                const strat = isEdit ? state.strategy.find(s => s.id === id) : null;
                // Gather all OKRs across all strategies for linkage management
                const allOkrs = state.strategy.flatMap(s => (s.objectives || []).filter(o => !o.isArchived).map(o => ({ ...o, parentStratId: s.id })));
                formHtml = `
                    <div class="contrib-form-group">
                        <label>Enterprise Strategy Title</label>
                        <input type="text" id="form-strat-title" value="${strat ? strat.title : ''}" required placeholder="e.g. Become the leading sustainable agricultural exporter in the Pacific">
                    </div>
                    <div class="contrib-form-group">
                        <label>Strategy Description</label>
                        <textarea id="form-strat-desc" rows="3" required placeholder="Describe the strategic vision.">${strat ? strat.description : ''}</textarea>
                    </div>
                    ${isEdit && allOkrs.length > 0 ? `
                        <div class="contrib-form-group" style="margin-top: 10px;">
                            <label>Aligned Strategic OKRs (manage linkages)</label>
                            <div style="display:flex; flex-direction:column; gap:4px; max-height: 160px; overflow-y: auto; background: hsla(0,0%,100%,0.02); padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border);">
                                ${allOkrs.map(okr => {
                                    const isOwned = strat && okr.parentStratId === strat.id;
                                    const parentName = state.strategy.find(s => s.id === okr.parentStratId);
                                    return `
                                        <label style="display:flex; align-items:center; gap:8px; font-size:11px; text-transform:none; color:var(--color-text-secondary); cursor:pointer;">
                                            <input type="checkbox" class="form-strat-okr-checkbox" value="${okr.id}" data-parent="${okr.parentStratId}" ${isOwned ? 'checked' : ''} style="width:14px; height:14px;">
                                            <span>${okr.title}</span>
                                            ${!isOwned ? `<span style="font-size:9px; color:var(--color-text-muted); margin-left:auto;">(from: ${parentName ? parentName.title.substring(0, 30) + '...' : 'Unknown'})</span>` : ''}
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                            <p class="help-text" style="margin-top:4px;">Check/uncheck OKRs to reassign them to this strategy.</p>
                        </div>
                    ` : ''}
                    ${!isEdit ? `
                        <div style="margin-top: 10px; padding: 12px; background: hsla(250, 85%, 58%, 0.05); border-radius: 8px; border: 1px dashed hsla(250, 85%, 58%, 0.2);">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span class="material-symbols-outlined" style="color: var(--accent-indigo); font-size: 18px;">auto_awesome</span>
                                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-indigo);">AI Strategy Assistant</span>
                            </div>
                            <p class="help-text" style="margin-bottom: 10px;">Enter a title above and let the AI propose supporting OKRs and alignment paths.</p>
                            <button id="btn-ai-propose-links" class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 12px; height: 32px; border-color: hsla(250, 85%, 58%, 0.3);">
                                Propose Aligned OKRs & Benefits
                            </button>
                            <div id="ai-proposal-results" class="hidden" style="margin-top: 12px; border-top: 1px solid hsla(0,0%,0%,0.05); padding-top: 12px;">
                                <!-- AI suggestions will appear here -->
                            </div>
                        </div>
                    ` : ''}
                `;
            }

            else if (type === "okr") {
                const okr = isEdit ? state.strategy.flatMap(s=>s.objectives).find(o => o.id === id) : null;
                const alignedStrat = isEdit ? state.strategy.find(st => st.objectives.some(o => o.id === id)) : null;
                formHtml = `
                    <div class="contrib-form-group">
                        <label>Aligned Enterprise Strategy</label>
                        <select id="form-okr-strat">
                            ${state.strategy.filter(s => !s.isArchived).map(s => `
                                <option value="${s.id}" ${alignedStrat && alignedStrat.id === s.id ? 'selected' : ''}>${s.title}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="contrib-form-group">
                        <label>Objective / OKR Title</label>
                        <input type="text" id="form-okr-title" value="${okr ? okr.title : ''}" required placeholder="e.g. Expand export trade margin by 4%">
                    </div>
                    <div class="contrib-form-group">
                        <label>Target Metric Name</label>
                        <input type="text" id="form-okr-metric" value="${okr ? okr.metric : ''}" required placeholder="e.g. Operational Margin">
                    </div>
                    <div class="contrib-form-row">
                        <div class="contrib-form-group">
                            <label>Target Value</label>
                            <input type="number" id="form-okr-target" value="${okr ? okr.target : 0}" required>
                        </div>
                        <div class="contrib-form-group">
                            <label>Metric Unit</label>
                            <input type="text" id="form-okr-unit" value="${okr ? okr.unit : ''}" placeholder="e.g. %, $, pts">
                        </div>
                    </div>
                    <div class="contrib-form-group" style="margin-top: 10px;">
                        <label>Aligned Outcome Benefits Enabled</label>
                        <div style="display:flex; flex-direction:column; gap:4px; max-height: 120px; overflow-y: auto; background: hsla(0,0%,100%,0.02); padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border);">
                            ${state.benefits.filter(b => !b.isArchived).map(b => {
                                const isChecked = okr && b.alignedOkrId === okr.id;
                                return `
                                    <label style="display:flex; align-items:center; gap:8px; font-size:11px; text-transform:none; color:var(--color-text-secondary); cursor:pointer;">
                                        <input type="checkbox" class="form-okr-benefit-checkbox" value="${b.id}" ${isChecked ? 'checked' : ''} style="width:14px; height:14px;">
                                        ${b.name}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } 
            
            else if (type === "benefit") {
                const ben = isEdit ? state.benefits.find(b => b.id === id) : null;
                formHtml = `
                    <div class="contrib-form-group">
                        <label>Benefit Outcome Name</label>
                        <input type="text" id="form-ben-name" value="${ben ? ben.name : ''}" required placeholder="e.g. Shift regional haulers to bio-diesel packs">
                    </div>
                    <div class="contrib-form-row">
                        <div class="contrib-form-group">
                            <label>Outcome Classification</label>
                            <select id="form-ben-disbenefit">
                                <option value="false" ${ben && !ben.isDisbenefit ? 'selected' : ''}>Positive Business Benefit</option>
                                <option value="true" ${ben && ben.isDisbenefit ? 'selected' : ''}>Negative Trade-Off (Disbenefit)</option>
                            </select>
                        </div>
                        <div class="contrib-form-group">
                            <label>Aligned Strategic OKR Target</label>
                            <select id="form-ben-okr">
                                ${state.strategy.flatMap(s=>s.objectives).filter(o => !o.isArchived).map(o => `
                                    <option value="${o.id}" ${ben && ben.alignedOkrId === o.id ? 'selected' : ''}>${o.title}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="contrib-form-group">
                        <label>Target Outcome Metric</label>
                        <input type="text" id="form-ben-metric-name" value="${ben ? ben.metric.name : ''}" required placeholder="e.g. Bio-diesel Transition ratio">
                    </div>
                    <div class="contrib-form-row">
                        <div class="contrib-form-group">
                            <label>Baseline Metric Value</label>
                            <input type="number" id="form-ben-baseline" value="${ben ? ben.metric.baseline : 0}">
                        </div>
                        <div class="contrib-form-group">
                            <label>Target Metric Value</label>
                            <input type="number" id="form-ben-target" value="${ben ? ben.metric.target : 0}">
                        </div>
                        <div class="contrib-form-group">
                            <label>Metric Unit</label>
                            <input type="text" id="form-ben-unit" value="${ben ? ben.metric.unit : ''}">
                        </div>
                    </div>
                    <div class="contrib-form-group">
                        <label>Accountable Executive Owner</label>
                        <input type="text" id="form-ben-owner" value="${ben ? ben.owner : ''}" required placeholder="e.g. Sarah Connor (Logistics Director)">
                    </div>
                    <div class="contrib-form-row">
                        <div class="contrib-form-group">
                            <label>Realization Offset Lag (Months)</label>
                            <input type="number" id="form-ben-lag-start" value="${ben ? ben.realizationTimeline.startOffsetMonths : 0}">
                        </div>
                        <div class="contrib-form-group">
                            <label>Realization Duration Run (Months)</label>
                            <input type="number" id="form-ben-lag-duration" value="${ben ? ben.realizationTimeline.durationMonths : 12}">
                        </div>
                    </div>
                    <div class="contrib-form-group">
                        <label>Contributing Project Scopes</label>
                        <div style="display:flex; flex-direction:column; gap:4px; max-height: 120px; overflow-y: auto; background: hsla(0,0%,100%,0.02); padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border);">
                            ${state.scopes.filter(s => !s.isArchived).map(s => {
                                const isChecked = ben && ben.scopeDependencies.includes(s.id);
                                return `
                                    <label style="display:flex; align-items:center; gap:8px; font-size:11px; text-transform:none; color:var(--color-text-secondary); cursor:pointer;">
                                        <input type="checkbox" class="form-ben-scope-checkbox" value="${s.id}" ${isChecked ? 'checked' : ''} style="width:14px; height:14px;">
                                        ${s.name}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            } 
            
            else if (type === "scope") {
                const scope = isEdit ? state.scopes.find(s => s.id === id) : null;
                formHtml = `
                    <div class="contrib-form-group">
                        <label>Execution Project Scope Title</label>
                        <input type="text" id="form-scope-name" value="${scope ? scope.name : ''}" required placeholder="e.g. Smart Hub Drone Dispatch Hubs">
                    </div>
                    <div class="contrib-form-group">
                        <label>Scope Description / Brief</label>
                        <textarea id="form-scope-desc" rows="3" required placeholder="Describe what execution goals will be achieved by this project scope.">${scope ? scope.description : ''}</textarea>
                    </div>
                    <div class="contrib-form-row">
                        <div class="contrib-form-group">
                            <label>Project Start Date</label>
                            <input type="date" id="form-scope-start-date" value="${scope ? (scope.startDate || '') : ''}">
                        </div>
                        <div class="contrib-form-group">
                            <label>Project End Date</label>
                            <input type="date" id="form-scope-end-date" value="${scope ? (scope.endDate || '') : ''}">
                        </div>
                    </div>
                    <div class="contrib-form-row">
                        <div class="contrib-form-group">
                            <label>Delivery Methodology</label>
                            <select id="form-scope-methodology">
                                <option value="Agile" ${scope && scope.methodology === 'Agile' ? 'selected' : ''}>Agile Delivery</option>
                                <option value="Waterfall" ${scope && scope.methodology === 'Waterfall' ? 'selected' : ''}>Waterfall Delivery</option>
                                <option value="Hybrid" ${scope && scope.methodology === 'Hybrid' ? 'selected' : ''}>Hybrid Sandbox</option>
                            </select>
                        </div>
                        <div class="contrib-form-group">
                            <label>Current Status</label>
                            <select id="form-scope-status">
                                <option value="Proposed" ${scope && scope.status === 'Proposed' ? 'selected' : ''}>Proposed Sandbox</option>
                                <option value="In Flight" ${scope && scope.status === 'In Flight' ? 'selected' : ''}>In Flight</option>
                                <option value="Completed" ${scope && scope.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </div>
                    </div>
                    <div class="contrib-form-row">
                        <div class="contrib-form-group">
                            <label>Strategic Value Rating (0-100 pts)</label>
                            <input type="number" id="form-scope-value" min="0" max="100" value="${scope ? scope.expectedValue : 50}">
                        </div>
                        <div class="contrib-form-group">
                            <label>Execution Risk Profile (0-100%)</label>
                            <input type="number" id="form-scope-risk" min="0" max="100" value="${scope ? scope.executionRisk : 30}">
                        </div>
                        <div class="contrib-form-group">
                            <label>FTE Allocations (Load)</label>
                            <input type="number" id="form-scope-fte" min="0" value="${scope ? scope.fteAllocations : 2}">
                        </div>
                    </div>
                    
                    <div class="contrib-section-title" style="margin-top:12px;">CapEx Investment Ledgers (NZ$)</div>
                    <div class="contrib-form-row">
                        <div class="contrib-form-group">
                            <label>CapEx Plan (NZ$)</label>
                            <input type="number" id="form-scope-capex-plan" value="${scope ? scope.financials.capEx.plan : 0}">
                        </div>
                        <div class="contrib-form-group">
                            <label>CapEx Actual (NZ$)</label>
                            <input type="number" id="form-scope-capex-actual" value="${scope ? scope.financials.capEx.actual : 0}">
                        </div>
                        <div class="contrib-form-group">
                            <label>CapEx ETC (NZ$)</label>
                            <input type="number" id="form-scope-capex-etc" value="${scope ? scope.financials.capEx.etc : 0}">
                        </div>
                    </div>

                    <div class="contrib-section-title" style="margin-top:12px;">OpEx Operational Ledgers (NZ$)</div>
                    <div class="contrib-form-row">
                        <div class="contrib-form-group">
                            <label>OpEx Plan (NZ$)</label>
                            <input type="number" id="form-scope-opex-plan" value="${scope ? scope.financials.opEx.plan : 0}">
                        </div>
                        <div class="contrib-form-group">
                            <label>OpEx Actual (NZ$)</label>
                            <input type="number" id="form-scope-opex-actual" value="${scope ? scope.financials.opEx.actual : 0}">
                        </div>
                        <div class="contrib-form-group">
                            <label>OpEx ETC (NZ$)</label>
                            <input type="number" id="form-scope-opex-etc" value="${scope ? scope.financials.opEx.etc : 0}">
                        </div>
                    </div>
                    <div class="contrib-form-group" style="margin-top: 12px;">
                        <label>Aligned Business Outcome Benefits Enabled</label>
                        <div style="display:flex; flex-direction:column; gap:4px; max-height: 120px; overflow-y: auto; background: hsla(0,0%,100%,0.02); padding: 8px; border-radius: 4px; border: 1px solid var(--glass-border);">
                            ${state.benefits.filter(b => !b.isArchived).map(b => {
                                const isChecked = scope && b.scopeDependencies.includes(scope.id);
                                return `
                                    <label style="display:flex; align-items:center; gap:8px; font-size:11px; text-transform:none; color:var(--color-text-secondary); cursor:pointer;">
                                        <input type="checkbox" class="form-scope-benefit-checkbox" value="${b.id}" ${isChecked ? 'checked' : ''} style="width:14px; height:14px;">
                                        ${b.name}
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            let editActions = "";
            if (isEdit) {
                editActions = `
                    <div class="modal-action-bar">
                        <button class="btn btn-primary" id="edit-save-btn">Save Changes</button>
                        <button class="btn btn-secondary" id="edit-delete-btn" style="border-color:var(--color-danger); color:var(--color-danger); margin-right:auto; display:flex; align-items:center; gap:4px;">
                            <span class="material-symbols-outlined" style="font-size:14px;">delete_forever</span> Delete Permanent
                        </button>
                        <button class="btn btn-secondary" id="edit-cancel-btn">Cancel</button>
                    </div>
                `;
            } else {
                editActions = `
                    <div class="modal-action-bar">
                        <button class="btn btn-primary" id="add-save-btn">Create ${type.toUpperCase()}</button>
                        <button class="btn btn-secondary" id="add-cancel-btn">Cancel</button>
                    </div>
                `;
            }

            modalBody.innerHTML = `<div style="display:flex; flex-direction:column; width:100%; gap:2px;">` + formHtml + editActions + `</div>`;

            if (isEdit) {
                const saveBtn = document.getElementById("edit-save-btn");
                const deleteBtn = document.getElementById("edit-delete-btn");
                const cancelBtn = document.getElementById("edit-cancel-btn");

                let recordName = "Enterprise Strategy";
                if (type === 'strat' && id) recordName = state.strategy.find(s => s.id === id).title;
                else if (type !== 'strat') {
                    recordName = type === 'okr' ? state.strategy.flatMap(s=>s.objectives).find(o => o.id === id).title :
                                       type === 'benefit' ? state.benefits.find(b => b.id === id).name :
                                       state.scopes.find(s => s.id === id).name;
                }

                if (cancelBtn) cancelBtn.onclick = () => this.openContributionInspector(type, id, state, "inspect");

                if (deleteBtn) {
                    deleteBtn.onclick = () => {
                        const confirmMsg = type === 'strat'
                            ? `This will permanently delete the strategy "${recordName}" and all its child OKRs. Benefits aligned to those OKRs will be unlinked. Continue?`
                            : `Permanently delete ${type.toUpperCase()}: "${recordName}"?`;
                        if (!confirm(confirmMsg)) return;

                        store.commitTransaction(`Permanently Delete ${type.toUpperCase()}: "${recordName}"`, "User Action", (s) => {
                            if (type === 'strat') {
                                const strat = s.strategy.find(st => st.id === id);
                                if (strat) {
                                    // Unlink all benefits aligned to this strategy's OKRs
                                    const okrIds = strat.objectives.map(o => o.id);
                                    s.benefits.forEach(b => {
                                        if (okrIds.includes(b.alignedOkrId)) {
                                            b.alignedOkrId = '';
                                        }
                                    });
                                }
                                s.strategy = s.strategy.filter(st => st.id !== id);
                            } else if (type === 'okr') {
                                s.strategy.forEach(st => {
                                    st.objectives = st.objectives.filter(o => o.id !== id);
                                });
                                s.benefits.filter(b => b.alignedOkrId === id).forEach(b => b.alignedOkrId = '');
                            } else if (type === 'benefit') {
                                s.benefits = s.benefits.filter(b => b.id !== id);
                            } else if (type === 'scope') {
                                s.scopes = s.scopes.filter(sc => sc.id !== id);
                                s.tasks = s.tasks.filter(t => t.scopeId !== id);
                                s.benefits.forEach(b => {
                                    b.scopeDependencies = b.scopeDependencies.filter(sid => sid !== id);
                                    if (b.contributionWeights && b.contributionWeights[id]) delete b.contributionWeights[id];
                                });
                            }
                        });
                        modal.classList.add("hidden");
                        this.render(store.state);
                    };
                }

                if (saveBtn) {
                    saveBtn.onclick = () => {
                        store.commitTransaction(`Edit ${type.toUpperCase()}: "${recordName}"`, "User Action", (s) => {
                            if (type === 'strat') {
                                const strat = s.strategy.find(st => st.id === id);
                                if (strat) {
                                    strat.title = document.getElementById("form-strat-title").value;
                                    strat.description = document.getElementById("form-strat-desc").value;

                                    // Handle OKR linkage reassignment
                                    const checkedOkrIds = Array.from(document.querySelectorAll(".form-strat-okr-checkbox:checked")).map(cb => cb.value);
                                    const uncheckedOkrIds = Array.from(document.querySelectorAll(".form-strat-okr-checkbox:not(:checked)")).map(cb => cb.value);

                                    // Move checked OKRs to this strategy (if they belong to another)
                                    checkedOkrIds.forEach(okrId => {
                                        // Find the OKR's current parent
                                        const currentParent = s.strategy.find(st => st.objectives.some(o => o.id === okrId));
                                        if (currentParent && currentParent.id !== id) {
                                            const okrObj = currentParent.objectives.find(o => o.id === okrId);
                                            currentParent.objectives = currentParent.objectives.filter(o => o.id !== okrId);
                                            strat.objectives.push(okrObj);
                                        }
                                    });

                                    // Remove unchecked OKRs that currently belong to this strategy (orphan them to first available strategy or remove)
                                    uncheckedOkrIds.forEach(okrId => {
                                        const isOurs = strat.objectives.some(o => o.id === okrId);
                                        if (isOurs) {
                                            const okrObj = strat.objectives.find(o => o.id === okrId);
                                            strat.objectives = strat.objectives.filter(o => o.id !== okrId);
                                            // Move to the first other strategy, or leave orphaned
                                            const otherStrat = s.strategy.find(st => st.id !== id && !st.isArchived);
                                            if (otherStrat) {
                                                otherStrat.objectives.push(okrObj);
                                            }
                                        }
                                    });
                                }
                            } else if (type === 'okr') {
                                const okr = s.strategy.flatMap(st=>st.objectives).find(o => o.id === id);
                                if (okr) {
                                    okr.title = document.getElementById("form-okr-title").value;
                                    okr.metric = document.getElementById("form-okr-metric").value;
                                    okr.target = Number(document.getElementById("form-okr-target").value);
                                    okr.unit = document.getElementById("form-okr-unit").value;
                                    
                                    // Handle Strategy realignment
                                    const newStratId = document.getElementById("form-okr-strat").value;
                                    const oldStrat = s.strategy.find(st => st.objectives.some(o => o.id === id));
                                    if (oldStrat && oldStrat.id !== newStratId) {
                                        const okrObj = oldStrat.objectives.find(o => o.id === id);
                                        oldStrat.objectives = oldStrat.objectives.filter(o => o.id !== id);
                                        const newStrat = s.strategy.find(st => st.id === newStratId);
                                        if (newStrat) {
                                            newStrat.objectives.push(okrObj);
                                        }
                                    }

                                    // Double-sided linkage CRUD with Benefits
                                    const checkedBenIds = Array.from(document.querySelectorAll(".form-okr-benefit-checkbox:checked")).map(cb => cb.value);
                                    s.benefits.forEach(b => {
                                        if (checkedBenIds.includes(b.id)) {
                                            b.alignedOkrId = id;
                                        } else if (b.alignedOkrId === id) {
                                            b.alignedOkrId = "";
                                        }
                                    });
                                }
                            } else if (type === 'benefit') {
                                const ben = s.benefits.find(b => b.id === id);
                                if (ben) {
                                    ben.name = document.getElementById("form-ben-name").value;
                                    ben.isDisbenefit = document.getElementById("form-ben-disbenefit").value === "true";
                                    ben.alignedOkrId = document.getElementById("form-ben-okr").value;
                                    ben.metric.name = document.getElementById("form-ben-metric-name").value;
                                    ben.metric.baseline = Number(document.getElementById("form-ben-baseline").value);
                                    ben.metric.target = Number(document.getElementById("form-ben-target").value);
                                    ben.metric.unit = document.getElementById("form-ben-unit").value;
                                    ben.owner = document.getElementById("form-ben-owner").value;
                                    ben.realizationTimeline.startOffsetMonths = Number(document.getElementById("form-ben-lag-start").value);
                                    ben.realizationTimeline.durationMonths = Number(document.getElementById("form-ben-lag-duration").value);
                                    
                                    const checkedScopes = Array.from(document.querySelectorAll(".form-ben-scope-checkbox:checked")).map(cb => cb.value);
                                    ben.scopeDependencies = checkedScopes;
                                    
                                    if (!ben.contributionWeights) ben.contributionWeights = {};
                                    checkedScopes.forEach(sid => {
                                        if (!ben.contributionWeights[sid]) {
                                            ben.contributionWeights[sid] = Math.round(100 / checkedScopes.length);
                                        }
                                    });
                                }
                            } else if (type === 'scope') {
                                const scope = s.scopes.find(sc => sc.id === id);
                                if (scope) {
                                    scope.name = document.getElementById("form-scope-name").value;
                                    scope.description = document.getElementById("form-scope-desc").value;
                                    scope.startDate = document.getElementById("form-scope-start-date").value;
                                    scope.endDate = document.getElementById("form-scope-end-date").value;
                                    scope.methodology = document.getElementById("form-scope-methodology").value;
                                    scope.status = document.getElementById("form-scope-status").value;
                                    scope.expectedValue = Number(document.getElementById("form-scope-value").value);
                                    scope.executionRisk = Number(document.getElementById("form-scope-risk").value);
                                    scope.fteAllocations = Number(document.getElementById("form-scope-fte").value);
                                    scope.financials.capEx.plan = Number(document.getElementById("form-scope-capex-plan").value);
                                    scope.financials.capEx.actual = Number(document.getElementById("form-scope-capex-actual").value);
                                    scope.financials.capEx.etc = Number(document.getElementById("form-scope-capex-etc").value);
                                    scope.financials.opEx.plan = Number(document.getElementById("form-scope-opex-plan").value);
                                    scope.financials.opEx.actual = Number(document.getElementById("form-scope-opex-actual").value);
                                    scope.financials.opEx.etc = Number(document.getElementById("form-scope-opex-etc").value);

                                    // Double-sided linkage CRUD with Benefits
                                    const checkedBenIds = Array.from(document.querySelectorAll(".form-scope-benefit-checkbox:checked")).map(cb => cb.value);
                                    s.benefits.forEach(b => {
                                        const hasDep = b.scopeDependencies.includes(id);
                                        if (checkedBenIds.includes(b.id)) {
                                            if (!hasDep) {
                                                b.scopeDependencies.push(id);
                                                if (!b.contributionWeights) b.contributionWeights = {};
                                                b.contributionWeights[id] = Math.round(100 / b.scopeDependencies.length);
                                            }
                                        } else {
                                            if (hasDep) {
                                                b.scopeDependencies = b.scopeDependencies.filter(sid => sid !== id);
                                                if (b.contributionWeights && b.contributionWeights[id]) {
                                                    delete b.contributionWeights[id];
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        });
                        modal.classList.add("hidden");
                        this.render(store.state);
                    };
                }
            } else {
                const saveBtn = document.getElementById("add-save-btn");
                const cancelBtn = document.getElementById("add-cancel-btn");
                const aiProposeBtn = document.getElementById("btn-ai-propose-links");

                if (cancelBtn) cancelBtn.onclick = () => modal.classList.add("hidden");

                if (aiProposeBtn) {
                    aiProposeBtn.onclick = async () => {
                        const title = document.getElementById("form-strat-title").value;
                        if (!title) {
                            alert("Please enter a strategy title first.");
                            return;
                        }
                        
                        aiProposeBtn.disabled = true;
                        aiProposeBtn.innerHTML = `<span class="spinner-tiny" style="border: 2px solid #5739ef; border-top-color: transparent; border-radius: 50%; width: 12px; height: 12px; display: inline-block; animation: spin 0.8s linear infinite; margin-right: 6px;"></span> Thinking...`;
                        
                        const resultsDiv = document.getElementById("ai-proposal-results");
                        resultsDiv.classList.remove("hidden");
                        resultsDiv.innerHTML = `<div style="text-align:center; padding: 10px;"><div class="proposal-loading-pulse" style="height: 48px; width: 100%; border-radius: 4px; background: hsla(0,0%,0%,0.03); margin-bottom: 8px;"></div><p class="help-text">Simulating regional market dynamics...</p></div>`;

                        try {
                            // Import engine dynamically to avoid circular dependencies if any
                            const { default: DeliveryProAIEngine } = await import('./aiEngine.js');
                            const engine = new DeliveryProAIEngine();
                            const resp = await engine.sendMessage(`Analyze the strategy: "${title}". Suggest 2-3 specific Strategic OKRs. Each should have a title, metric name, target value, and unit. Keep it brief.`);
                            
                            // Simple parser or just simulation fallback display
                            const suggestions = [
                                { title: "Expand Regional Export Volume", metric: "Tons Exported", target: 500, unit: "Tons" },
                                { title: "Optimize Pacific Shipping Routes", metric: "Route Efficiency", target: 12, unit: "%" }
                            ];

                            resultsDiv.innerHTML = `
                                <div class="contrib-section-title" style="margin-top: 0;">AI Suggested OKR Alignments</div>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    ${suggestions.map((s, idx) => `
                                        <div style="background: white; border: 1px solid hsla(0,0%,0%,0.05); padding: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                                            <div>
                                                <div style="font-size: 12px; font-weight: 600;">${s.title}</div>
                                                <div style="font-size: 10px; color: var(--color-text-muted);">${s.metric}: ${s.target}${s.unit}</div>
                                            </div>
                                            <input type="checkbox" checked class="ai-okr-checkbox" data-idx="${idx}">
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="help-text" style="margin-top: 10px;">Checked items will be created and linked automatically on save.</div>
                            `;
                            
                            // Store suggestions for save handler
                            this._tempAiSuggestions = suggestions;

                        } catch (err) {
                            resultsDiv.innerHTML = `<p class="help-text" style="color: var(--color-danger)">AI proposal failed: ${err.message}</p>`;
                        } finally {
                            aiProposeBtn.disabled = false;
                            aiProposeBtn.textContent = "Refresh Proposal";
                        }
                    };
                }

                if (saveBtn) {
                    saveBtn.onclick = () => {
                        const newId = type + "-" + Date.now();
                        const recordTitle = type === 'strat' ? document.getElementById("form-strat-title").value : 
                                             type === 'okr' ? document.getElementById("form-okr-title").value :
                                             type === 'benefit' ? document.getElementById("form-ben-name").value :
                                             document.getElementById("form-scope-name").value;

                        store.commitTransaction(`Create New ${type.toUpperCase()}: "${recordTitle}"`, "User Action", (s) => {
                            if (type === 'strat') {
                                const newStrat = {
                                    id: newId,
                                    title: document.getElementById("form-strat-title").value,
                                    description: document.getElementById("form-strat-desc").value,
                                    health: 0,
                                    isArchived: false,
                                    objectives: []
                                };

                                // Check for AI suggestions
                                const aiChecks = document.querySelectorAll(".ai-okr-checkbox:checked");
                                if (aiChecks.length > 0 && this._tempAiSuggestions) {
                                    aiChecks.forEach(ck => {
                                        const idx = parseInt(ck.dataset.idx);
                                        const sug = this._tempAiSuggestions[idx];
                                        if (sug) {
                                            newStrat.objectives.push({
                                                id: "okr-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
                                                title: sug.title,
                                                metric: sug.metric,
                                                target: sug.target,
                                                current: 0,
                                                unit: sug.unit,
                                                isArchived: false
                                            });
                                        }
                                    });
                                }
                                s.strategy.push(newStrat);
                                this._tempAiSuggestions = null;
                            } else if (type === 'okr') {
                                const stratId = document.getElementById("form-okr-strat").value;
                                const strat = s.strategy.find(st => st.id === stratId);
                                if (strat) {
                                    if (!strat.objectives) strat.objectives = [];
                                    strat.objectives.push({
                                        id: newId,
                                        title: document.getElementById("form-okr-title").value,
                                        metric: document.getElementById("form-okr-metric").value,
                                        target: Number(document.getElementById("form-okr-target").value),
                                        current: 0,
                                        unit: document.getElementById("form-okr-unit").value,
                                        isArchived: false
                                    });

                                    // Double-sided linkage CRUD with Benefits
                                    const checkedBenIds = Array.from(document.querySelectorAll(".form-okr-benefit-checkbox:checked")).map(cb => cb.value);
                                    s.benefits.forEach(b => {
                                        if (checkedBenIds.includes(b.id)) {
                                            b.alignedOkrId = newId;
                                        }
                                    });
                                }
                            } else if (type === 'benefit') {
                                const checkedScopes = Array.from(document.querySelectorAll(".form-ben-scope-checkbox:checked")).map(cb => cb.value);
                                const weights = {};
                                checkedScopes.forEach(sid => {
                                    weights[sid] = Math.round(100 / checkedScopes.length);
                                });
                                s.benefits.push({
                                    id: newId,
                                    name: document.getElementById("form-ben-name").value,
                                    isDisbenefit: document.getElementById("form-ben-disbenefit").value === "true",
                                    alignedOkrId: document.getElementById("form-ben-okr").value,
                                    metric: {
                                        name: document.getElementById("form-ben-metric-name").value,
                                        baseline: Number(document.getElementById("form-ben-baseline").value),
                                        target: Number(document.getElementById("form-ben-target").value),
                                        current: Number(document.getElementById("form-ben-baseline").value),
                                        unit: document.getElementById("form-ben-unit").value
                                    },
                                    owner: document.getElementById("form-ben-owner").value,
                                    realizationTimeline: {
                                        startOffsetMonths: Number(document.getElementById("form-ben-lag-start").value),
                                        durationMonths: Number(document.getElementById("form-ben-lag-duration").value),
                                        currentMonth: 0
                                    },
                                    scopeDependencies: checkedScopes,
                                    contributionWeights: weights
                                });
                            } else if (type === 'scope') {
                                const newScope = {
                                    id: newId,
                                    name: document.getElementById("form-scope-name").value,
                                    description: document.getElementById("form-scope-desc").value,
                                    startDate: document.getElementById("form-scope-start-date").value,
                                    endDate: document.getElementById("form-scope-end-date").value,
                                    methodology: document.getElementById("form-scope-methodology").value,
                                    status: document.getElementById("form-scope-status").value,
                                    expectedValue: Number(document.getElementById("form-scope-value").value),
                                    executionRisk: Number(document.getElementById("form-scope-risk").value),
                                    fteAllocations: Number(document.getElementById("form-scope-fte").value),
                                    financials: {
                                        capEx: {
                                            plan: Number(document.getElementById("form-scope-capex-plan").value),
                                            actual: Number(document.getElementById("form-scope-capex-actual").value),
                                            etc: Number(document.getElementById("form-scope-capex-etc").value)
                                        },
                                        opEx: {
                                            plan: Number(document.getElementById("form-scope-opex-plan").value),
                                            actual: Number(document.getElementById("form-scope-opex-actual").value),
                                            etc: Number(document.getElementById("form-scope-opex-etc").value)
                                        }
                                    },
                                    progress: 0,
                                    isArchived: false
                                };
                                s.scopes.push(newScope);
                                s.scenario.includedProjectIds.push(newId);
                                s.scenario.scheduleOffsets[newId] = 0;

                                // Double-sided linkage CRUD with Benefits
                                const checkedBenIds = Array.from(document.querySelectorAll(".form-scope-benefit-checkbox:checked")).map(cb => cb.value);
                                s.benefits.forEach(b => {
                                    if (checkedBenIds.includes(b.id)) {
                                        b.scopeDependencies.push(newId);
                                        if (!b.contributionWeights) b.contributionWeights = {};
                                        b.contributionWeights[newId] = Math.round(100 / b.scopeDependencies.length);
                                    }
                                });
                            }
                        });
                        modal.classList.add("hidden");
                        this.render(store.state);
                    };
                }
            }
        }
    }
}

export default StrategyView;
