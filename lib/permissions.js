export const PERMISSIONS = {
    PORTFOLIO_READ: "portfolio.read",
    PROJECT_UPDATE: "project.update",
    FINANCE_READ: "finance.read",
    FINANCE_UPDATE: "finance.update",
    AUDIT_READ: "audit.read",
    AUDIT_ROLLBACK: "audit.rollback",
    AI_PROPOSE: "ai.propose",
    AI_APPLY: "ai.apply",
    ACCESS_MANAGE: "access.manage",
    GOVERNANCE_MANAGE: "governance.manage"
};

export const ROLE_PERMISSIONS = {
    "system-admin": Object.values(PERMISSIONS),
    "portfolio-executive": [
        PERMISSIONS.PORTFOLIO_READ,
        PERMISSIONS.FINANCE_READ,
        PERMISSIONS.AUDIT_READ,
        PERMISSIONS.AI_PROPOSE
    ],
    "portfolio-manager": [
        PERMISSIONS.PORTFOLIO_READ,
        PERMISSIONS.PROJECT_UPDATE,
        PERMISSIONS.FINANCE_READ,
        PERMISSIONS.AI_PROPOSE,
        PERMISSIONS.AI_APPLY
    ],
    "project-manager": [
        PERMISSIONS.PORTFOLIO_READ,
        PERMISSIONS.PROJECT_UPDATE,
        PERMISSIONS.AI_PROPOSE
    ],
    contributor: [
        PERMISSIONS.PORTFOLIO_READ,
        PERMISSIONS.PROJECT_UPDATE,
        PERMISSIONS.AI_PROPOSE
    ],
    viewer: [PERMISSIONS.PORTFOLIO_READ],
    auditor: [PERMISSIONS.PORTFOLIO_READ, PERMISSIONS.AUDIT_READ]
};

export const ROLE_LABELS = {
    "system-admin": "System Admin",
    "portfolio-executive": "Portfolio Executive",
    "portfolio-manager": "Portfolio Manager",
    "project-manager": "Project Manager",
    contributor: "Contributor",
    viewer: "Viewer",
    auditor: "Auditor"
};

export function uniquePermissions(roleKeys = []) {
    return [...new Set(roleKeys.flatMap((role) => ROLE_PERMISSIONS[role] || []))].sort();
}
