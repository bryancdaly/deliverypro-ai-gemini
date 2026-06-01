import SecurityChrome from "../../SecurityChrome";
import { requireAccessManager } from "@/lib/authz";
import { ROLE_PERMISSIONS, ROLE_LABELS } from "@/lib/permissions";

export default async function RolesPage() {
    const result = await requireAccessManager();
    if (result.error) return result.error;

    return (
        <SecurityChrome>
            <main className="security-page">
                <h1>Role Editor</h1>
                <p className="security-muted">Canonical permission bundles used by server-side authorization.</p>
                <section className="security-grid">
                    {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
                        <article className="security-card" key={role}>
                            <h3>{ROLE_LABELS[role] || role}</h3>
                            {permissions.map((permission) => <span className="security-badge" key={permission} style={{ margin: "3px" }}>{permission}</span>)}
                        </article>
                    ))}
                </section>
            </main>
        </SecurityChrome>
    );
}
