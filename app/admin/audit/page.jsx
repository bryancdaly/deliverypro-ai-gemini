import SecurityChrome from "../../SecurityChrome";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/permissions";

export default async function AuditPage() {
    const result = await requirePermission(PERMISSIONS.AUDIT_READ);
    if (result.error) return result.error;

    return (
        <SecurityChrome>
            <main className="security-page">
                <h1>Security Audit</h1>
                <p className="security-muted">Immutable records for authentication-sensitive workflows, access changes, AI proposal application, exports, rollback, and break-glass events.</p>
                <table className="security-table">
                    <thead><tr><th>Time</th><th>Actor</th><th>Event</th><th>Permission</th><th>Scope</th></tr></thead>
                    <tbody>
                        <tr><td>Runtime</td><td>Authenticated user</td><td>Audit events available from `/api/audit/security`</td><td>audit.read</td><td>Authorized scopes</td></tr>
                    </tbody>
                </table>
            </main>
        </SecurityChrome>
    );
}
