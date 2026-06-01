import SecurityChrome from "../../SecurityChrome";
import { requireAccessManager } from "@/lib/authz";

export default async function AccessAdminPage() {
    const result = await requireAccessManager();
    if (result.error) return result.error;

    return (
        <SecurityChrome>
            <main className="security-page">
                <h1>Access Review</h1>
                <p className="security-muted">Review effective access by user, role, hierarchy scope, delegation, and break-glass state.</p>
                <table className="security-table">
                    <thead><tr><th>User</th><th>Role</th><th>Scope</th><th>Source</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>Initial admin</td><td>System Admin</td><td>Enterprise</td><td>Seed/env</td><td>Active</td></tr>
                    </tbody>
                </table>
            </main>
        </SecurityChrome>
    );
}
