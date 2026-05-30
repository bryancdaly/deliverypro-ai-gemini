/* ==========================================================================
   DELIVERYPRO.AI STATE MANAGER & REACTIVE DATA STORES
   ========================================================================== */

class DeliveryProStore {
    constructor() {
        // Initial core state
        this.state = {
            // Tier 1 & 2: Strategy & Objectives
            strategy: {
                id: "strat-pacific-lead",
                title: "Become the leading sustainable agricultural exporter in the Pacific",
                description: "Maximize regional trade footprint while reducing operational carbon intensity across our supply chains.",
                health: 0, // Calculated dynamically
                objectives: [
                    {
                        id: "okr-emissions",
                        title: "Reduce corporate supply chain carbon emissions by 15% by Q4",
                        metric: "Carbon emissions reduction",
                        target: 15,
                        current: 0, // Calculated dynamically
                        unit: "%"
                    },
                    {
                        id: "okr-margin",
                        title: "Improve corporate operational margin by 3% this fiscal year",
                        metric: "Operational margin expansion",
                        target: 3,
                        current: 0, // Calculated dynamically
                        unit: "%"
                    }
                ]
            },
            
            // Tier 3: Business Outcomes / Benefits & Disbenefits ("Benefits Zone")
            benefits: [
                {
                    id: "ben-transport-transition",
                    name: "Transition 40% of regional distribution logistics to low-emission transport networks",
                    isDisbenefit: false,
                    alignedOkrId: "okr-emissions",
                    metric: {
                        name: "Low-Emission Fleet Transition Ratio",
                        baseline: 0,
                        target: 40,
                        current: 0, // Calculated dynamically from Scope 1 & 2
                        unit: "%"
                    },
                    owner: "Sarah Connor (Logistics Director)",
                    realizationTimeline: { startOffsetMonths: 3, durationMonths: 12, currentMonth: 0 },
                    scopeDependencies: ["scope-route-optimization", "scope-transport-fleet"],
                    contributionWeights: {
                        "scope-route-optimization": 40, // 40% contribution share
                        "scope-transport-fleet": 60  // 60% contribution share
                    }
                },
                {
                    id: "ben-ops-savings",
                    name: "Save $500,000 annually in warehouse operations and inventory carrying costs",
                    isDisbenefit: false,
                    alignedOkrId: "okr-margin",
                    metric: {
                        name: "Annual Warehouse Spend Reductions",
                        baseline: 0,
                        target: 500000,
                        current: 0, // Calculated dynamically from Scope 1
                        unit: "$"
                    },
                    owner: "Marcus Aurelius (Chief Ops Officer)",
                    realizationTimeline: { startOffsetMonths: 6, durationMonths: 18, currentMonth: 0 },
                    scopeDependencies: ["scope-route-optimization"],
                    contributionWeights: {
                        "scope-route-optimization": 100 // 100% contribution share
                    }
                },
                {
                    id: "disben-safety-friction",
                    name: "Increase warehouse dispatch latency due to strict compliance checkups",
                    isDisbenefit: true,
                    alignedOkrId: "okr-margin", // Negative strategic trade-off
                    metric: {
                        name: "Average Order Dispatch Latency Increase",
                        baseline: 0,
                        target: 5, // Target max friction increase in minutes
                        current: 0, // Calculated from Scope 3
                        unit: "mins"
                    },
                    owner: "John Doe (Warehouse Safety Manager)",
                    realizationTimeline: { startOffsetMonths: 0, durationMonths: 1, currentMonth: 0 },
                    scopeDependencies: ["scope-safety-module"],
                    contributionWeights: {
                        "scope-safety-module": 100 // 100% contribution share
                    }
                }
            ],
            
            // Tier 4: Project Scopes / Outputs
            scopes: [
                {
                    id: "scope-route-optimization",
                    name: "Route-Optimization AI Engine Integration",
                    description: "Deploy an advanced routing API to optimize deliveries and minimize empty miles.",
                    methodology: "Agile",
                    status: "In Flight",
                    expectedValue: 85,
                    executionRisk: 30, // 0 - 100
                    financials: {
                        capEx: { plan: 180000, actual: 165000, etc: 15000 },
                        opEx: { plan: 45000, actual: 40000, etc: 5000 }
                    },
                    progress: 0, // Calculated dynamically from tasks
                    fteAllocations: 4 // Required developers/analysts
                },
                {
                    id: "scope-transport-fleet",
                    name: "Procure fleet of 10 Hybrid/Electric Commercial Vehicles",
                    description: "Procure and onboard new hybrid-electric heavy commercial freight trucks.",
                    methodology: "Waterfall",
                    status: "In Flight",
                    expectedValue: 95,
                    executionRisk: 55,
                    financials: {
                        capEx: { plan: 720000, actual: 450000, etc: 270000 },
                        opEx: { plan: 80000, actual: 50000, etc: 30000 }
                    },
                    progress: 0, // Calculated dynamically
                    fteAllocations: 8
                },
                {
                    id: "scope-safety-module",
                    name: "Warehouse Compliance & Safety Automation Module",
                    description: "Integrate compliance checklist systems and automated safety gates in regional hubs.",
                    methodology: "Hybrid",
                    status: "Proposed",
                    expectedValue: 40,
                    executionRisk: 20,
                    financials: {
                        capEx: { plan: 95000, actual: 0, etc: 95000 },
                        opEx: { plan: 15000, actual: 0, etc: 15000 }
                    },
                    progress: 0,
                    fteAllocations: 2
                }
            ],
            
            // Tier 5: Project Activities / Tasks
            tasks: [
                // Tasks for Route Optimization
                { id: "task-route-1", scopeId: "scope-route-optimization", title: "Establish API integrations with core ERP logistics software", assignee: "Sarah Connor", status: "done", weight: 2 },
                { id: "task-route-2", scopeId: "scope-route-optimization", title: "Develop machine learning path-finding routing algorithms", assignee: "Bryan Lee", status: "review", weight: 3 },
                { id: "task-route-3", scopeId: "scope-route-optimization", title: "Validate routing safety maps with regional transportation rules", assignee: "Bryan Lee", status: "in_progress", weight: 2 },
                { id: "task-route-4", scopeId: "scope-route-optimization", title: "Conduct driver UI beta testing and collect application feedback", assignee: "John Doe", status: "todo", weight: 1 },
                
                // Tasks for Fleet Procurement
                { id: "task-fleet-1", scopeId: "scope-transport-fleet", title: "Finalize hybrid truck specs & contract terms with supplier", assignee: "Sarah Connor", status: "done", weight: 4 },
                { id: "task-fleet-2", scopeId: "scope-transport-fleet", title: "Submit purchase orders for first batch of 5 hybrid vehicles", assignee: "Sarah Connor", status: "done", weight: 4 },
                { id: "task-fleet-3", scopeId: "scope-transport-fleet", title: "Install electric high-capacity charging docks in main warehouse", assignee: "John Doe", status: "in_progress", weight: 3 },
                { id: "task-fleet-4", scopeId: "scope-transport-fleet", title: "Procure and verify delivery of second batch of 5 commercial fleet vehicles", assignee: "Marcus Aurelius", status: "todo", weight: 5 },
                
                // Tasks for Warehouse Safety Module
                { id: "task-safety-1", scopeId: "scope-safety-module", title: "Draft automated compliance checklist workflows", assignee: "John Doe", status: "in_progress", weight: 2 },
                { id: "task-safety-2", scopeId: "scope-safety-module", title: "Install electric locks and smart gates on warehouse bays", assignee: "John Doe", status: "todo", weight: 3 }
            ],

            // Resource Store
            resources: [
                { id: "res-sarah", name: "Sarah Connor", role: "Logistics Director", maxCapacity: 40, allocated: 0 },
                { id: "res-bryan", name: "Bryan Lee", role: "Lead Frontend Engineer", maxCapacity: 40, allocated: 0 },
                { id: "res-marcus", name: "Marcus Aurelius", role: "Chief Ops Officer", maxCapacity: 20, allocated: 0 },
                { id: "res-john", name: "John Doe", role: "Warehouse Safety Manager", maxCapacity: 40, allocated: 0 }
            ],

            // Intake Sandbox Funnel
            intakeRequests: [
                {
                    id: "intake-packaging",
                    title: "Decarbonize Pacific Fruit Packaging",
                    sponsor: "Marcus Aurelius",
                    description: "Replace all single-use plastic shipping shells with biodegradable bamboo fiber packaging. This shifts warehouse processes and eliminates environmental packaging waste.",
                    cost: 85000,
                    effort: 4, // months
                    status: "Vetting",
                    priorityScore: 78,
                    WSJF: 12.4,
                    scores: { stratFit: 9, roi: 8, complexity: 5 }
                },
                {
                    id: "intake-crop-predict",
                    title: "Predictive Crop-Yield Deep Learning",
                    sponsor: "Sarah Connor",
                    description: "Develop agricultural satellite ML analysis pipelines to predict harvest yields, allowing sales teams to optimize export pricing agreements in advance.",
                    cost: 160000,
                    effort: 8,
                    status: "Draft",
                    priorityScore: 84,
                    WSJF: 9.2,
                    scores: { stratFit: 9.5, roi: 9, complexity: 7 }
                },
                {
                    id: "intake-dock-automation",
                    title: "Pacific Shipping Port Automated Docks",
                    sponsor: "John Doe",
                    description: "Install robotic loading cranes in the main Pacific port shipping hub, decreasing bulk freight ship turnaround time.",
                    cost: 950000,
                    effort: 18,
                    status: "Under Review",
                    priorityScore: 62,
                    WSJF: 4.5,
                    scores: { stratFit: 8, roi: 7.5, complexity: 9 }
                }
            ],

            // Scenario Planning active values (Budget sandbox)
            scenario: {
                budgetCap: 1500000,
                fteCap: 15,
                includedProjectIds: ["scope-route-optimization", "scope-transport-fleet", "scope-safety-module"],
                scheduleOffsets: {
                    "scope-route-optimization": 0,
                    "scope-transport-fleet": 0,
                    "scope-safety-module": 0
                },
                realizationMonthSlider: 0, // Staggered timeline months (0 - 36)
                activeHierarchyLevel: "enterprise" // "enterprise" | "portfolio" | "program" | "project"
            },

            // Live Scrolling Pulse Activity Feed Logs
            pulseFeed: [
                { id: "log-1", time: "14:15", type: "system", msg: "AI Risk Mitigator analyzed OKR 1: Alignment status at 92% health." },
                { id: "log-2", time: "14:22", type: "user", msg: "Sarah Connor marked API integrations task as COMPLETED." },
                { id: "log-3", time: "14:31", type: "risk", msg: "AI Warning: Phoenix Scope resource allocations are approaching capacity limits." }
            ],

            // Central State Transaction Audit Logs
            auditLog: []
        };

        // Load persisted state from LocalStorage if available
        try {
            const savedState = localStorage.getItem("dp_portfolio_state");
            if (savedState) {
                const parsed = JSON.parse(savedState);
                // Ensure all vital arrays and scenario properties are present before restoring
                if (parsed && 
                    parsed.strategy && 
                    parsed.strategy.title &&
                    parsed.strategy.objectives && 
                    parsed.benefits && 
                    parsed.scopes && 
                    parsed.tasks && 
                    parsed.resources && 
                    parsed.scenario && 
                    parsed.scenario.includedProjectIds && 
                    parsed.scenario.realizationMonthSlider !== undefined) {
                    
                    this.state = parsed;
                } else {
                    console.warn("Saved portfolio state is incomplete or outdated. Discarding to load fresh defaults.");
                    localStorage.removeItem("dp_portfolio_state");
                }
            }
        } catch(e) {
            console.error("Failed to restore portfolio state from LocalStorage, using defaults:", e);
        }

        // UI subscribers
        this.subscribers = {};

        // Run initial calculations to configure tree rolling metrics
        this.recalculateAllMetrics(false);
        
        // Start live scrolling event loop
        this.startPulseSimulation();
    }

    // Subscribe Views to state changes
    subscribe(viewName, renderFunc) {
        this.subscribers[viewName] = renderFunc;
    }

    // Trigger reactive rerendering across all subscribed views
    notifySubscribers() {
        Object.keys(this.subscribers).forEach(viewName => {
            try {
                this.subscribers[viewName](this.state);
            } catch(e) {
                console.error(`Error notifying subscriber [${viewName}]:`, e);
            }
        });
    }

    // ==========================================================================
    // CASCADING AGGREGATOR MATHEMATICS ENGINE
    // ==========================================================================
    recalculateAllMetrics(notify = true) {
        const s = this.state;

        // 1. Recalculate Scope progress ratios from Tasks
        s.scopes.forEach(scope => {
            const scopeTasks = s.tasks.filter(t => t.scopeId === scope.id);
            if (scopeTasks.length === 0) {
                scope.progress = 0;
                return;
            }
            
            let totalWeight = 0;
            let completedWeight = 0;

            scopeTasks.forEach(task => {
                const w = task.weight || 1;
                totalWeight += w;
                if (task.status === "done") {
                    completedWeight += w;
                } else if (task.status === "review") {
                    completedWeight += w * 0.85; // Partial credit
                } else if (task.status === "in_progress") {
                    completedWeight += w * 0.4;
                }
            });

            scope.progress = Math.round((completedWeight / totalWeight) * 100);
        });

        // 2. Recalculate Resource allocations
        s.resources.forEach(r => {
            r.allocated = 0;
        });
        const level = s.scenario.activeHierarchyLevel || "enterprise";
        const isScopeInHierarchy = (scopeId) => {
            if (level === "enterprise" || level === "portfolio") return true;
            if (level === "program") return ["scope-route-optimization", "scope-transport-fleet"].includes(scopeId);
            if (level === "project") return ["scope-route-optimization"].includes(scopeId);
            return true;
        };
        s.scopes.forEach(scope => {
            // If project is active/included in current scenario and is in scope for active hierarchy level
            if (s.scenario.includedProjectIds.includes(scope.id) && scope.status !== "Proposed" && isScopeInHierarchy(scope.id)) {
                const scopeTasks = s.tasks.filter(t => t.scopeId === scope.id && t.status !== "done");
                scopeTasks.forEach(task => {
                    const resource = s.resources.find(res => res.name === task.assignee);
                    if (resource) {
                        // Dynamic allocation calculations
                        if (task.status === "in_progress") resource.allocated += 15;
                        else if (task.status === "review") resource.allocated += 10;
                        else if (task.status === "todo") resource.allocated += 5;
                    }
                });
            }
        });

        // 3. Recalculate Benefit outcomes based on dependent Scope completion & Realization Timelines
        s.benefits.forEach(benefit => {
            const dependencies = s.scopes.filter(sc => benefit.scopeDependencies.includes(sc.id));
            if (dependencies.length === 0) {
                benefit.metric.current = benefit.metric.baseline;
                return;
            }

            // Average dependency completion
            let totalCompletion = 0;
            dependencies.forEach(dep => {
                // If project is excluded, its completion does not contribute to value realization
                const isIncluded = s.scenario.includedProjectIds.includes(dep.id);
                if (isIncluded) {
                    totalCompletion += dep.progress;
                }
            });
            const avgProgress = totalCompletion / dependencies.length;

            // Factor in the post-launch lag timeline slider
            const sliderMonth = s.scenario.realizationMonthSlider;
            const startMonth = benefit.realizationTimeline.startOffsetMonths;
            const duration = benefit.realizationTimeline.durationMonths;

            let realizationFactor = 0;
            if (sliderMonth > startMonth) {
                const monthsActive = sliderMonth - startMonth;
                realizationFactor = Math.min(monthsActive / duration, 1.0);
            }

            // Target calculations
            const b = benefit.metric.baseline;
            const t = benefit.metric.target;
            const currentRealization = avgProgress / 100 * realizationFactor;

            if (benefit.isDisbenefit) {
                // Disbenefits scale up with project progress instantly without lag factors
                benefit.metric.current = Math.round(b + (t - b) * (avgProgress / 100));
            } else {
                benefit.metric.current = Math.round(b + (t - b) * currentRealization);
            }
        });

        // 4. Recalculate OKRs metrics by aggregating aligned Benefits
        s.strategy.objectives.forEach(okr => {
            const alignedBenefits = s.benefits.filter(b => b.alignedOkrId === okr.id);
            if (alignedBenefits.length === 0) {
                okr.current = 0;
                return;
            }

            let totalStrategicPull = 0;
            alignedBenefits.forEach(benefit => {
                const b = benefit.metric.baseline;
                const t = benefit.metric.target;
                const c = benefit.metric.current;
                
                let percentAchieved = 0;
                if (t !== b) {
                    percentAchieved = (c - b) / (t - b);
                }

                if (benefit.isDisbenefit) {
                    // Disbenefits drag down the corresponding objective index
                    totalStrategicPull -= percentAchieved * 0.3; // Subtracts strategic alignment
                } else {
                    totalStrategicPull += percentAchieved;
                }
            });

            // Convert to aggregate percentage
            const netAchievement = Math.max(0, Math.min(totalStrategicPull / alignedBenefits.filter(b => !b.isDisbenefit).length, 1.0));
            okr.current = Math.round(netAchievement * okr.target);
        });

        // 5. Recalculate Enterprise Strategy overall health rating
        let totalOkrAchievement = 0;
        s.strategy.objectives.forEach(okr => {
            totalOkrAchievement += (okr.current / okr.target);
        });
        s.strategy.health = Math.round((totalOkrAchievement / s.strategy.objectives.length) * 100);

        if (notify) {
            this.notifySubscribers();
        }

        // Persist state in LocalStorage after every recalculation or update
        this.saveStateToLocalStorage();
    }

    saveStateToLocalStorage() {
        try {
            localStorage.setItem("dp_portfolio_state", JSON.stringify(this.state));
        } catch(e) {
            console.error("Failed to persist portfolio state in LocalStorage:", e);
        }
    }

    // ==========================================================================
    // STATE TRANSACTIONAL LEDGER & AUDIT LOG CONTROLLERS
    // ==========================================================================
    commitTransaction(actionLabel, actor, updateFunc) {
        // 1. Take snapshot of state before the transaction
        const preSnapshot = JSON.stringify(this.state);

        try {
            // 2. Perform state alteration
            updateFunc(this.state);

            // 3. Recalculate all strategic upward cascading metrics
            this.recalculateAllMetrics(false);

            // 4. Take snapshot of state after the transaction
            const postSnapshot = JSON.stringify(this.state);

            // Calculate diff descriptions
            const diffDesc = this.calculateDiffDetails(JSON.parse(preSnapshot), JSON.parse(postSnapshot));

            // 5. Create transaction record
            const transaction = {
                id: "tx-" + Date.now() + "-" + Math.floor(Math.random()*1000),
                timestamp: new Date().toLocaleTimeString(),
                actor: actor, // e.g., 'User Manual Update', 'AI Copilot Approved'
                action: actionLabel,
                preSnapshot: preSnapshot,
                postSnapshot: postSnapshot,
                diff: diffDesc
            };

            // Push to audit logs
            this.state.auditLog.unshift(transaction);

            // Inject success toast details in activity feeds
            this.logPulseEvent(actor, `${actionLabel} - successfully applied.`, "system");

            // 6. Notify reactive subscribers
            this.notifySubscribers();
            return true;
        } catch(e) {
            console.error("State transaction aborted due to execution error:", e);
            return false;
        }
    }

    // Rollback a transaction, reverting to pre-snapshot state
    rollbackTransaction(transactionId) {
        const txIndex = this.state.auditLog.findIndex(tx => tx.id === transactionId);
        if (txIndex === -1) {
            console.error(`Rollback aborted: Transaction [${transactionId}] not found.`);
            return false;
        }

        const transaction = this.state.auditLog[txIndex];
        
        try {
            // Parse pre-snapshot and restore central state
            const restoredState = JSON.parse(transaction.preSnapshot);
            
            // Re-apply core values (preserving auditLog and subscriber bindings)
            this.state.strategy = restoredState.strategy;
            this.state.benefits = restoredState.benefits;
            this.state.scopes = restoredState.scopes;
            this.state.tasks = restoredState.tasks;
            this.state.resources = restoredState.resources;
            this.state.intakeRequests = restoredState.intakeRequests;
            this.state.scenario = restoredState.scenario;

            // Remove the transaction and all younger transactions to preserve sequential integrity
            this.state.auditLog.splice(0, txIndex + 1);

            // Log rollback in pulse feed
            this.logPulseEvent("System Rollback", `Reverted workspace action: "${transaction.action}"`, "risk");

            // Recalculate cascades
            this.recalculateAllMetrics(true);
            return true;
        } catch(e) {
            console.error("Rollback failed due to state restoration error:", e);
            return false;
        }
    }

    // Auto-calculates detailed diff summaries for the audit card view
    calculateDiffDetails(pre, post) {
        let diffs = [];

        // Check task status changes
        post.tasks.forEach(tPost => {
            const tPre = pre.tasks.find(t => t.id === tPost.id);
            if (tPre && tPre.status !== tPost.status) {
                diffs.push(`Task status: "${tPost.title}" changed from [${tPre.status}] to [${tPost.status}]`);
            }
        });

        // Check new tasks
        if (post.tasks.length > pre.tasks.length) {
            const newTasksCount = post.tasks.length - pre.tasks.length;
            diffs.push(`Created ${newTasksCount} new project tasks.`);
        }

        // Check scope toggles in Optimizer
        post.scenario.includedProjectIds.forEach(id => {
            if (!pre.scenario.includedProjectIds.includes(id)) {
                const scope = post.scopes.find(s => s.id === id);
                diffs.push(`Included Project in Portfolio Mix: "${scope ? scope.name : id}"`);
            }
        });
        pre.scenario.includedProjectIds.forEach(id => {
            if (!post.scenario.includedProjectIds.includes(id)) {
                const scope = post.scopes.find(s => s.id === id);
                diffs.push(`Excluded Project from Portfolio Mix: "${scope ? scope.name : id}"`);
            }
        });

        // Check new intake promotions
        if (post.scopes.length > pre.scopes.length) {
            const newScope = post.scopes.find(s => !pre.scopes.some(sp => sp.id === s.id));
            diffs.push(`Promoted Vetted Request to active portfolio: "${newScope ? newScope.name : 'New Scope'}"`);
        }

        // Fallback generic label
        if (diffs.length === 0) {
            diffs.push("General workspace parameter modification.");
        }

        return diffs;
    }

    // ==========================================================================
    // PULSE SIMULATION EVENT LOOP (MULTI-USER FEED)
    // ==========================================================================
    logPulseEvent(actor, msg, type = "user") {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const event = {
            id: "pulse-" + Date.now(),
            time: time,
            type: type,
            msg: `<b>${actor}:</b> ${msg}`
        };
        this.state.pulseFeed.unshift(event);
        if (this.state.pulseFeed.length > 20) {
            this.state.pulseFeed.pop();
        }
        
        // Notify pulse render element if view rendering app is ready
        const pulseStream = document.getElementById("pulse-stream");
        if (pulseStream) {
            const card = document.createElement("div");
            card.className = `pulse-card ${type}`;
            card.innerHTML = `<span class="pulse-time">${time}</span><span class="pulse-meta">${actor}</span> ${msg}`;
            pulseStream.insertBefore(card, pulseStream.firstChild);
            if (pulseStream.childNodes.length > 20) {
                pulseStream.removeChild(pulseStream.lastChild);
            }
        }
    }

    startPulseSimulation() {
        const mockUsers = ["Sarah Connor", "Bryan Lee", "Marcus Aurelius", "John Doe", "AI Auditor"];
        const mockActions = [
            { type: "user", user: "Sarah Connor", msg: "reviewed warehouse CapEx allocations." },
            { type: "user", user: "Bryan Lee", msg: "pushed a commit to main branch on deliverypro-ai-gemini repo." },
            { type: "user", user: "John Doe", msg: "updated charging docks installation timeline." },
            { type: "system", user: "AI Engine", msg: "completed Q3 strategic outcome forecasts." },
            { type: "risk", user: "AI Warning", msg: "Identified disbenefit risk threshold expansion on safety modules." }
        ];

        setInterval(() => {
            // 15% chance of spawning mock activities
            if (Math.random() < 0.15) {
                const action = mockActions[Math.floor(Math.random() * mockActions.length)];
                this.logPulseEvent(action.user, action.msg, action.type);
            }
        }, 15000);
    }
}

// Global initialization
const store = new DeliveryProStore();
export default store;
export { store };
