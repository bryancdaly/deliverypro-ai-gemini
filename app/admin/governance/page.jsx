import SecurityChrome from "../../SecurityChrome";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";

export default async function GovernancePage() {
    const result = await requirePermission(PERMISSIONS.GOVERNANCE_MANAGE);
    if (result.error) return result.error;

    return (
        <SecurityChrome>
            <main className="security-page">
                <h1>Governance Workflows</h1>
                <section className="security-grid">
                    <div className="security-card">
                        <h3>Access Requests</h3>
                        <p className="security-muted">Approve, reject, and time-box requested access elevations.</p>
                    </div>
                    <div className="security-card">
                        <h3>Delegations</h3>
                        <p className="security-muted">Grant temporary role coverage across hierarchy scopes.</p>
                    </div>
                    <div className="security-card">
                        <h3>Break-Glass</h3>
                        <p className="security-muted">Emergency elevation requires reason capture, expiry, and review.</p>
                    </div>
                </section>
            </main>
        </SecurityChrome>
    );
}
