/* ==========================================================================
   DELIVERYPRO.AI STATE MANAGER & REACTIVE DATA STORES
   ========================================================================== */

function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Predefined program groups — each groups one or more project scopes under a program node.
// Extend this object to add new programs; scopeIds lists the member project scope IDs.
const PROGRAM_GROUPS = {
    "prog-logistics-fleet": {
        name: "Logistics & Fleet",
        icon: "account_tree",
        scopeIds: ["scope-route-optimization", "scope-transport-fleet"]
    }
};

// Canonical hierarchy filter — use this instead of copy-pasting in every view.
function isScopeInHierarchy(scopeId, state) {
    const level = (state.scenario && state.scenario.activeHierarchyLevel) || "enterprise";
    const nodeId = state.scenario && state.scenario.activeNodeId;
    if (level === "enterprise" || level === "portfolio") return true;
    if (level === "program") {
        if (!nodeId) return true; // graceful fallback when no node selected
        const groups = (state && state.programGroups) || PROGRAM_GROUPS;
        const group = groups[nodeId];
        return group ? group.scopeIds.includes(scopeId) : true;
    }
    if (level === "project") {
        if (!nodeId) return true; // graceful fallback
        return scopeId === nodeId;
    }
    return true;
}

// A benefit is in scope if any of its dependent project scopes are visible at this level.
function isBenefitInHierarchy(benefit, state) {
    const level = (state.scenario && state.scenario.activeHierarchyLevel) || "enterprise";
    if (level === "enterprise" || level === "portfolio") return true;
    return (benefit.scopeDependencies || []).some(id => isScopeInHierarchy(id, state));
}

class DeliveryProStore {
    constructor() {
        // Initial core state
        this.state = {
            // Tier 1 & 2: Strategy & Objectives
            strategy: [
                {
                    id: "strat-pacific-lead",
                    title: "Become the leading sustainable agricultural exporter in the Pacific",
                    description: "Maximize regional trade footprint while reducing operational carbon intensity across our supply chains.",
                    sponsor: "Marcus Aurelius",
                    portfolioManager: "Sarah Connor",
                    health: 0, // Calculated dynamically
                    isArchived: false,
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
                }
            ],
            
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
                    name: "Save NZ$500,000 annually in warehouse operations and inventory carrying costs",
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
                    sponsor: "Marcus Aurelius",
                    projectManager: "Sarah Connor",
                    startDate: "2024-02-01",
                    endDate: "2024-10-31",
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
                    sponsor: "Marcus Aurelius",
                    projectManager: "Bryan Lee",
                    startDate: "2024-01-15",
                    endDate: "2025-03-31",
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
                    sponsor: "Sarah Connor",
                    projectManager: "John Doe",
                    startDate: "2024-07-01",
                    endDate: "2024-12-31",
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
                { id: "task-route-1", scopeId: "scope-route-optimization", title: "Establish API integrations with core ERP logistics software", assignee: "Sarah Connor", status: "done", weight: 2, startDate: "2024-02-01", endDate: "2024-03-15", isMilestone: false, dependencies: [] },
                { id: "task-route-2", scopeId: "scope-route-optimization", title: "Develop machine learning path-finding routing algorithms", assignee: "Bryan Lee", status: "review", weight: 3, startDate: "2024-03-15", endDate: "2024-06-15", isMilestone: false, dependencies: ["task-route-1"] },
                { id: "task-route-3", scopeId: "scope-route-optimization", title: "Validate routing safety maps with regional transportation rules", assignee: "Bryan Lee", status: "in_progress", weight: 2, startDate: "2024-06-01", endDate: "2024-08-31", isMilestone: false, dependencies: ["task-route-2"] },
                { id: "task-route-4", scopeId: "scope-route-optimization", title: "Conduct driver UI beta testing and collect application feedback", assignee: "John Doe", status: "todo", weight: 1, startDate: "2024-08-01", endDate: "2024-10-15", isMilestone: false, dependencies: ["task-route-3"] },
                { id: "milestone-route-golive", scopeId: "scope-route-optimization", title: "Route Optimization Platform Go-Live", assignee: "Sarah Connor", status: "todo", weight: 1, startDate: "2024-10-31", endDate: "2024-10-31", isMilestone: true, dependencies: ["task-route-4"] },

                // Tasks for Fleet Procurement
                { id: "task-fleet-1", scopeId: "scope-transport-fleet", title: "Finalize hybrid truck specs & contract terms with supplier", assignee: "Sarah Connor", status: "done", weight: 4, startDate: "2024-01-15", endDate: "2024-03-01", isMilestone: false, dependencies: [] },
                { id: "task-fleet-2", scopeId: "scope-transport-fleet", title: "Submit purchase orders for first batch of 5 hybrid vehicles", assignee: "Sarah Connor", status: "done", weight: 4, startDate: "2024-03-01", endDate: "2024-04-30", isMilestone: false, dependencies: ["task-fleet-1"] },
                { id: "task-fleet-3", scopeId: "scope-transport-fleet", title: "Install electric high-capacity charging docks in main warehouse", assignee: "John Doe", status: "in_progress", weight: 3, startDate: "2024-04-15", endDate: "2024-08-31", isMilestone: false, dependencies: ["task-fleet-1"] },
                { id: "task-fleet-4", scopeId: "scope-transport-fleet", title: "Procure and verify delivery of second batch of 5 commercial fleet vehicles", assignee: "Marcus Aurelius", status: "todo", weight: 5, startDate: "2024-09-01", endDate: "2025-03-01", isMilestone: false, dependencies: ["task-fleet-2"] },
                { id: "milestone-fleet-deployed", scopeId: "scope-transport-fleet", title: "Full Hybrid Fleet Deployed & Commissioned", assignee: "Sarah Connor", status: "todo", weight: 1, startDate: "2025-03-31", endDate: "2025-03-31", isMilestone: true, dependencies: ["task-fleet-4", "task-fleet-3"] },

                // Tasks for Warehouse Safety Module
                { id: "task-safety-1", scopeId: "scope-safety-module", title: "Draft automated compliance checklist workflows", assignee: "John Doe", status: "in_progress", weight: 2, startDate: "2024-07-01", endDate: "2024-10-31", isMilestone: false, dependencies: [] },
                { id: "task-safety-2", scopeId: "scope-safety-module", title: "Install electric locks and smart gates on warehouse bays", assignee: "John Doe", status: "todo", weight: 3, startDate: "2024-08-01", endDate: "2024-12-15", isMilestone: false, dependencies: ["task-safety-1"] },
                { id: "milestone-safety-cert", scopeId: "scope-safety-module", title: "Safety Compliance Certification Achieved", assignee: "John Doe", status: "todo", weight: 1, startDate: "2024-12-31", endDate: "2024-12-31", isMilestone: true, dependencies: ["task-safety-2"] }
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
                    startDate: "2024-06-01",
                    endDate: "2024-09-30",
                    capEx: 85000,
                    opEx: 8000,
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
                    description: "Develop agricultural satellite ML analysis pipelines to predict harvest yields, allowing sales teams to optimise export pricing agreements in advance.",
                    startDate: "2024-09-01",
                    endDate: "2025-04-30",
                    capEx: 160000,
                    opEx: 25000,
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
                    startDate: "2025-01-01",
                    endDate: "2026-06-30",
                    capEx: 950000,
                    opEx: 120000,
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
                activeHierarchyLevel: "enterprise", // "enterprise" | "portfolio" | "program" | "project"
                activeNodeId: null // program group key or scope ID when level is "program"/"project"
            },

            // Mutable program group registry — persisted in state so promotions survive refresh
            programGroups: JSON.parse(JSON.stringify(PROGRAM_GROUPS)),

            // Live Scrolling Pulse Activity Feed Logs
            pulseFeed: [
                { id: "log-1", time: "14:15", type: "system", msg: "AI Risk Mitigator analyzed OKR 1: Alignment status at 92% health." },
                { id: "log-2", time: "14:22", type: "user", msg: "Sarah Connor marked API integrations task as COMPLETED." },
                { id: "log-3", time: "14:31", type: "risk", msg: "AI Warning: Phoenix Scope resource allocations are approaching capacity limits." }
            ],

            // Central State Transaction Audit Logs
            auditLog: [],

            // RAID + Change Request Logs (keyed by scopeId)
            raidLogs: {
                "scope-route-optimization": {
                    risks: [
                        { id: "r-ro-1", title: "ERP Vendor API Delivery Delay", description: "External ERP vendor may not meet promised API delivery milestone, blocking core routing integrations.", category: "Technical", probability: "High", impact: "High", owner: "Bryan Lee", status: "Open", reviewDate: "2024-07-15", isArchived: false },
                        { id: "r-ro-2", title: "ML Model Accuracy Below Target Threshold", description: "Routing algorithm may fail to achieve the 20% efficiency gain required to realise transport emission benefits.", category: "Technical", probability: "Medium", impact: "High", owner: "Bryan Lee", status: "Mitigating", reviewDate: "2024-08-01", isArchived: false },
                        { id: "r-ro-3", title: "Driver Adoption Resistance", description: "Field drivers may reject the new routing UI, reducing uptake and negating efficiency gains.", category: "Operational", probability: "Medium", impact: "Medium", owner: "Sarah Connor", status: "Open", reviewDate: "2024-09-01", isArchived: false }
                    ],
                    issues: [
                        { id: "i-ro-1", title: "ERP Sandbox Environment Unstable", description: "Dev sandbox repeatedly times out, causing delays to API integration work and blocking sprint delivery.", category: "Technical", priority: "High", owner: "Bryan Lee", status: "In Progress", dateRaised: "2024-03-20", dateResolved: "", isArchived: false },
                        { id: "i-ro-2", title: "Missing Data Mapping Documentation", description: "Vendor has not provided field mapping specification for legacy shipment records. Integration cannot proceed.", category: "Technical", priority: "Medium", owner: "Sarah Connor", status: "Open", dateRaised: "2024-04-05", dateResolved: "", isArchived: false }
                    ],
                    assumptions: [
                        { id: "a-ro-1", title: "ERP API Available by End of Q2 2024", description: "Core assumption that the ERP vendor delivers authenticated API access by 30 June 2024 as contractually agreed.", category: "Business", impactIfWrong: "High", owner: "Sarah Connor", status: "Active", dateLogged: "2024-02-01", reviewDate: "2024-06-30", isArchived: false },
                        { id: "a-ro-2", title: "Driver Devices Meet Minimum OS Requirements", description: "Field driver mobile devices support iOS 16+ or Android 12+ required for the routing app.", category: "Technical", impactIfWrong: "Medium", owner: "Bryan Lee", status: "Validated", dateLogged: "2024-02-15", reviewDate: "2024-05-01", isArchived: false }
                    ],
                    decisions: [
                        { id: "d-ro-1", title: "Use REST API Over GraphQL for ERP Integration", description: "Selected REST due to vendor's limited GraphQL support. Reduces vendor negotiation risk at the cost of some flexibility.", category: "Technical", decisionMaker: "Bryan Lee", impact: "Medium", status: "Approved", dateRaised: "2024-02-10", dateDecided: "2024-02-20", isArchived: false },
                        { id: "d-ro-2", title: "Phased Regional Rollout — 3 Regions First", description: "Roll out to Auckland, Wellington, and Christchurch before national expansion to control go-live risk.", category: "Operational", decisionMaker: "Sarah Connor", impact: "High", status: "Approved", dateRaised: "2024-05-01", dateDecided: "2024-05-15", isArchived: false }
                    ],
                    changes: [
                        { id: "cr-ro-1", title: "Extend Routing Scope to Include Interisland Ferry Routes", description: "Operations team requests ferry route optimisation be included in scope to cover Pacific interisland freight.", changeType: "Scope", priority: "Medium", requestedBy: "Marcus Aurelius", scheduleDelta: 30, costDelta: 45000, status: "Under Review", dateSubmitted: "2024-06-15", isArchived: false },
                        { id: "cr-ro-2", title: "Accelerate UAT Phase by Two Weeks", description: "Board directive to bring forward go-live date. UAT compressed; additional testers required to maintain coverage.", changeType: "Schedule", priority: "High", requestedBy: "Marcus Aurelius", scheduleDelta: -14, costDelta: 25000, status: "Approved", dateSubmitted: "2024-07-20", isArchived: false }
                    ]
                },
                "scope-transport-fleet": {
                    risks: [
                        { id: "r-tf-1", title: "Supplier Manufacturing Backlog — Extended Lead Times", description: "Primary hybrid truck supplier has flagged an 8–12 week manufacturing backlog, threatening batch 2 delivery.", category: "External", probability: "High", impact: "High", owner: "Sarah Connor", status: "Open", reviewDate: "2024-08-30", isArchived: false },
                        { id: "r-tf-2", title: "Grid Capacity Insufficient for Charging Infrastructure", description: "Port Authority may refuse the 3-phase electrical upgrade application, preventing charging dock commissioning.", category: "Operational", probability: "Medium", impact: "High", owner: "John Doe", status: "Mitigating", reviewDate: "2024-09-15", isArchived: false },
                        { id: "r-tf-3", title: "Commercial EV Insurance Premium Escalation", description: "Insurer has indicated a potential 35% premium increase for commercial EV fleet renewal, impacting OpEx forecasts.", category: "Financial", probability: "Low", impact: "Medium", owner: "Marcus Aurelius", status: "Accepted", reviewDate: "2024-12-01", isArchived: false }
                    ],
                    issues: [
                        { id: "i-tf-1", title: "Batch 1 Delivery Short — One Vehicle Has Manufacturing Defect", description: "Supplier delivered 4 of 5 vehicles; fifth unit has a cab structural defect and has been recalled for rework.", category: "Operational", priority: "High", owner: "Sarah Connor", status: "In Progress", dateRaised: "2024-04-28", dateResolved: "", isArchived: false },
                        { id: "i-tf-2", title: "Charging Dock Building Permit Six Weeks Overdue", description: "Council building permit for charging dock installation is stalled. Contractor cannot commence electrical work.", category: "Operational", priority: "Critical", owner: "John Doe", status: "Open", dateRaised: "2024-05-10", dateResolved: "", isArchived: false }
                    ],
                    assumptions: [
                        { id: "a-tf-1", title: "NZ EV Charging Connector Standard Remains Stable", description: "Project assumes no regulatory change to the NZ Type 2 / CCS2 charging connector standard during the project lifecycle.", category: "Regulatory", impactIfWrong: "High", owner: "Sarah Connor", status: "Active", dateLogged: "2024-01-20", reviewDate: "2024-12-01", isArchived: false },
                        { id: "a-tf-2", title: "Warehouse Electrical Grid Supports 3-Phase Charging Load", description: "Assumes existing warehouse wiring and switchboards can handle the additional load from 8 simultaneous charging docks.", category: "Technical", impactIfWrong: "High", owner: "John Doe", status: "Invalid", dateLogged: "2024-03-01", reviewDate: "2024-06-01", isArchived: false }
                    ],
                    decisions: [
                        { id: "d-tf-1", title: "Single-Supplier Procurement for Volume Discount", description: "Opted for a single supplier over split tender to secure a 12% volume discount. Concentrates supplier risk.", category: "Commercial", decisionMaker: "Marcus Aurelius", impact: "High", status: "Approved", dateRaised: "2024-01-10", dateDecided: "2024-01-22", isArchived: false },
                        { id: "d-tf-2", title: "Install 8 Charging Docks Instead of 5", description: "Increased dock count to future-proof for fleet expansion beyond this project's 10 vehicles.", category: "Technical", decisionMaker: "John Doe", impact: "Medium", status: "Approved", dateRaised: "2024-04-01", dateDecided: "2024-04-14", isArchived: false }
                    ],
                    changes: [
                        { id: "cr-tf-1", title: "Add 2 Refrigerated Hybrid Units to Procurement", description: "Cold-chain logistics team has requested refrigerated variants be included to support perishable goods transport.", changeType: "Scope", priority: "High", requestedBy: "Sarah Connor", scheduleDelta: 60, costDelta: 185000, status: "Under Review", dateSubmitted: "2024-05-01", isArchived: false },
                        { id: "cr-tf-2", title: "Defer Second Batch Procurement by One Quarter", description: "Q3 CapEx ceiling reached. Board has directed second batch purchase be pushed to Q1 2025 to manage cash flow.", changeType: "Schedule", priority: "Medium", requestedBy: "Marcus Aurelius", scheduleDelta: 90, costDelta: 0, status: "Approved", dateSubmitted: "2024-07-15", isArchived: false }
                    ]
                },
                "scope-safety-module": {
                    risks: [
                        { id: "r-sm-1", title: "WorkSafe NZ Regulation Change Mid-Build", description: "NZ WorkSafe may update compliance standards during the build phase, requiring redesign of automated checklist workflows.", category: "External", probability: "Medium", impact: "High", owner: "John Doe", status: "Open", reviewDate: "2024-09-30", isArchived: false },
                        { id: "r-sm-2", title: "Single-Source Smart Gate Hardware Vendor Risk", description: "Sole-source lock hardware supplier showing signs of financial distress. Replacement sourcing would add 10+ weeks.", category: "External", probability: "Low", impact: "High", owner: "John Doe", status: "Mitigating", reviewDate: "2024-10-15", isArchived: false }
                    ],
                    issues: [
                        { id: "i-sm-1", title: "Checklist Workflows Rejected by External Safety Auditors", description: "External audit flagged 3 workflow steps as non-compliant with the current H&S Act. Rework required before certification.", category: "Technical", priority: "Critical", owner: "John Doe", status: "Open", dateRaised: "2024-08-12", dateResolved: "", isArchived: false },
                        { id: "i-sm-2", title: "Smart Gate Firmware Incompatible with Warehouse SCADA", description: "Vendor firmware v2.1 does not integrate with the existing SCADA system. Vendor is working on a patch; ETA unknown.", category: "Technical", priority: "High", owner: "John Doe", status: "Open", dateRaised: "2024-09-01", dateResolved: "", isArchived: false }
                    ],
                    assumptions: [
                        { id: "a-sm-1", title: "Staff Complete E-Learning Modules Within 4 Weeks of Go-Live", description: "Safety automation effectiveness depends on all warehouse staff completing mandatory digital safety training within 4 weeks.", category: "Resource", impactIfWrong: "High", owner: "John Doe", status: "Active", dateLogged: "2024-07-05", reviewDate: "2024-11-30", isArchived: false },
                        { id: "a-sm-2", title: "WorkSafe Certification Obtainable Within Project Timeline", description: "Assumes no backlog in WorkSafe NZ certification queue and certification can be granted by December 2024.", category: "Regulatory", impactIfWrong: "High", owner: "John Doe", status: "Active", dateLogged: "2024-07-10", reviewDate: "2024-10-01", isArchived: false }
                    ],
                    decisions: [
                        { id: "d-sm-1", title: "Fully Digital Compliance Checklists — No Paper Hybrid", description: "Rejected hybrid paper/digital approach in favour of fully automated digital checklists to ensure audit trail integrity.", category: "Technical", decisionMaker: "John Doe", impact: "High", status: "Approved", dateRaised: "2024-07-01", dateDecided: "2024-07-15", isArchived: false },
                        { id: "d-sm-2", title: "Pilot in Auckland Hub Before National Rollout", description: "Deploy and certify in the Auckland warehouse first; only proceed nationally after a 4-week clean pilot period.", category: "Operational", decisionMaker: "Sarah Connor", impact: "Medium", status: "Approved", dateRaised: "2024-08-01", dateDecided: "2024-08-20", isArchived: false }
                    ],
                    changes: [
                        { id: "cr-sm-1", title: "Extend Smart Gate Coverage to All Dispatch Bays", description: "Operations requests smart gate locks be extended from receiving docks to all 6 dispatch exit bays for full site coverage.", changeType: "Scope", priority: "Medium", requestedBy: "John Doe", scheduleDelta: 21, costDelta: 18000, status: "Submitted", dateSubmitted: "2024-09-05", isArchived: false },
                        { id: "cr-sm-2", title: "Reduce Compliance Check Frequency from Daily to Weekly", description: "Operations manager requests daily automated checks be reduced to weekly to reduce production line interruptions.", changeType: "Scope", priority: "Low", requestedBy: "Marcus Aurelius", scheduleDelta: 0, costDelta: -5000, status: "Rejected", dateSubmitted: "2024-09-15", isArchived: false }
                    ]
                }
            }
        };

        // Load persisted state from LocalStorage if available
        try {
            const savedState = localStorage.getItem("dp_portfolio_state");
            if (savedState) {
                const parsed = JSON.parse(savedState);
                // Ensure all vital arrays and scenario properties are present before restoring
                if (parsed && 
                    parsed.strategy && 
                    Array.isArray(parsed.strategy) &&
                    parsed.benefits && 
                    parsed.scopes && 
                    parsed.tasks && 
                    parsed.resources && 
                    parsed.scenario && 
                    parsed.scenario.includedProjectIds && 
                    parsed.scenario.realizationMonthSlider !== undefined) {
                    
                    // Migrate older saves that may lack these arrays
                    if (!Array.isArray(parsed.pulseFeed)) parsed.pulseFeed = this.state.pulseFeed;
                    if (!Array.isArray(parsed.auditLog)) parsed.auditLog = [];
                    if (!Array.isArray(parsed.intakeRequests)) parsed.intakeRequests = this.state.intakeRequests;
                    if (!parsed.programGroups || typeof parsed.programGroups !== 'object') parsed.programGroups = JSON.parse(JSON.stringify(PROGRAM_GROUPS));
                    if (!parsed.raidLogs || typeof parsed.raidLogs !== 'object') parsed.raidLogs = {};
                    // Migrate scopes to add sponsor/projectManager if missing
                    const defaultSponsorPM = {
                        "scope-route-optimization": { sponsor: "Marcus Aurelius", projectManager: "Sarah Connor" },
                        "scope-transport-fleet":    { sponsor: "Marcus Aurelius", projectManager: "Bryan Lee" },
                        "scope-safety-module":      { sponsor: "Sarah Connor",    projectManager: "John Doe" }
                    };
                    if (Array.isArray(parsed.scopes)) {
                        parsed.scopes.forEach(s => {
                            if (!s.sponsor)        s.sponsor        = defaultSponsorPM[s.id]?.sponsor        || '';
                            if (!s.projectManager) s.projectManager = defaultSponsorPM[s.id]?.projectManager || '';
                        });
                    }
                    // Migrate strategy to add sponsor/portfolioManager if missing
                    if (Array.isArray(parsed.strategy)) {
                        parsed.strategy.forEach(s => {
                            if (!s.sponsor)           s.sponsor           = 'Marcus Aurelius';
                            if (!s.portfolioManager)  s.portfolioManager  = 'Sarah Connor';
                        });
                    }
                    // Migrate tasks to add new schedule fields
                    if (Array.isArray(parsed.tasks)) {
                        parsed.tasks.forEach(t => {
                            if (t.startDate === undefined) t.startDate = "";
                            if (t.endDate === undefined) t.endDate = "";
                            if (t.isMilestone === undefined) t.isMilestone = false;
                            if (!Array.isArray(t.dependencies)) t.dependencies = [];
                            if (t.parentTaskId === undefined) t.parentTaskId = null;
                        });
                    }
                    // Backfill RAID seed data for the 3 core scopes if raidLogs is empty
                    if (!parsed.raidLogs || Object.keys(parsed.raidLogs).length === 0) {
                        parsed.raidLogs = this.state.raidLogs;
                    }
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
        s.scopes.forEach(scope => {
            // If project is active/included in current scenario and is in scope for active hierarchy level
            if (s.scenario.includedProjectIds.includes(scope.id) && scope.status !== "Proposed" && isScopeInHierarchy(scope.id, s)) {
                const scopeTasks = s.tasks.filter(t => t.scopeId === scope.id && t.status !== "done");
                scopeTasks.forEach(task => {
                    const resource = s.resources.find(res => res.name === task.assignee);
                    if (resource) {
                        const w = task.weight || 1;
                        if (task.status === "in_progress") resource.allocated += 5 * w;
                        else if (task.status === "review")  resource.allocated += 3 * w;
                        else if (task.status === "todo")    resource.allocated += 1 * w;
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
        s.strategy.forEach(strat => {
            if (!strat.objectives) strat.objectives = [];
            strat.objectives.forEach(okr => {
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

                // Convert to aggregate percentage; guard against divide-by-zero when all benefits are disbenefits
                const positiveBenCount = alignedBenefits.filter(b => !b.isDisbenefit).length;
                const netAchievement = positiveBenCount > 0
                    ? Math.max(0, Math.min(totalStrategicPull / positiveBenCount, 1.0))
                    : 0;
                okr.current = Math.round(netAchievement * okr.target);
            });
        });

        // 5. Recalculate Enterprise Strategy overall health rating
        s.strategy.forEach(strat => {
            let totalOkrAchievement = 0;
            strat.objectives.forEach(okr => {
                totalOkrAchievement += (okr.current / okr.target);
            });
            strat.health = strat.objectives.length > 0 ? Math.round((totalOkrAchievement / strat.objectives.length) * 100) : 0;
        });

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
            // Restore pre-snapshot to undo any partial mutations
            try { this.state = JSON.parse(preSnapshot); } catch(_) {}
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
            this.state.intakeRequests = restoredState.intakeRequests || [];
            this.state.scenario = restoredState.scenario;
            if (restoredState.programGroups) this.state.programGroups = restoredState.programGroups;
            if (restoredState.raidLogs) this.state.raidLogs = restoredState.raidLogs;

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
        const safeActor = escapeHtml(actor);
        const safeMsg = escapeHtml(msg);
        const event = {
            id: "pulse-" + Date.now(),
            time: time,
            type: type,
            msg: `<b>${safeActor}:</b> ${safeMsg}`
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
            card.innerHTML = `<span class="pulse-time">${time}</span><span class="pulse-meta">${safeActor}</span> ${safeMsg}`;
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

        this._pulseIntervalId = setInterval(() => {
            // 15% chance of spawning mock activities
            if (Math.random() < 0.15) {
                const action = mockActions[Math.floor(Math.random() * mockActions.length)];
                this.logPulseEvent(action.user, action.msg, action.type);
            }
        }, 15000);
    }

    destroy() {
        if (this._pulseIntervalId) clearInterval(this._pulseIntervalId);
    }
}

// Detects circular dependency chains in a task list using DFS.
function hasCyclicDependencies(tasks) {
    const map = Object.fromEntries(tasks.map(t => [t.id, t.dependencies || []]));
    const visited = {}, recStack = {};
    function dfs(id) {
        visited[id] = recStack[id] = true;
        for (const dep of (map[id] || [])) {
            if (!visited[dep] && dfs(dep)) return true;
            if (recStack[dep]) return true;
        }
        recStack[id] = false;
        return false;
    }
    return tasks.some(t => !visited[t.id] && dfs(t.id));
}

// Global initialization
const store = new DeliveryProStore();
if (typeof window !== 'undefined') window.__store = store;
export default store;
export { store, escapeHtml, PROGRAM_GROUPS, isScopeInHierarchy, isBenefitInHierarchy, hasCyclicDependencies };
