import SecurityChrome from "../../SecurityChrome";
import { requireAccessManager } from "@/lib/authz";

export default async function UsersAdminPage() {
    const result = await requireAccessManager();
    if (result.error) return result.error;

    return (
        <SecurityChrome>
            <main className="security-page">
                <h1>User Administration</h1>
                <p className="security-muted">Invite, suspend, and assign governed roles. Clerk owns authentication; DeliveryPro owns authorization.</p>
                <section className="security-grid">
                    <div className="security-card">
                        <h3>Invite User</h3>
                        <form className="security-form">
                            <label>Email<input placeholder="name@company.com" /></label>
                            <label>Initial role<select defaultValue="viewer"><option value="viewer">Viewer</option><option value="project-manager">Project Manager</option><option value="portfolio-manager">Portfolio Manager</option></select></label>
                            <button className="security-button" type="button">Create invitation</button>
                        </form>
                    </div>
                    <div className="security-card">
                        <h3>Lifecycle Controls</h3>
                        <p className="security-muted">Suspend and reactivate users through Clerk, while preserving audit history and DeliveryPro memberships.</p>
                    </div>
                </section>
            </main>
        </SecurityChrome>
    );
}
