import SecurityChrome from "../SecurityChrome";
import { getEffectiveAccess } from "@/lib/authz";

export default async function ProfilePage() {
    const access = await getEffectiveAccess();
    if (access.error) return access.error;

    return (
        <SecurityChrome>
            <main className="security-page">
                <h1>Profile Settings</h1>
                <p className="security-muted">Identity is sourced from Clerk. DeliveryPro-specific profile fields are stored in Postgres.</p>
                <section className="security-grid">
                    <div className="security-card">
                        <h2>{access.profile.displayName}</h2>
                        <p className="security-muted">{access.profile.email}</p>
                        <p className="security-muted">{access.profile.title || "No title set"} · {access.profile.department || "No department set"}</p>
                    </div>
                    <div className="security-card">
                        <h3>Effective Roles</h3>
                        {access.roles.map((role) => (
                            <p key={`${role.key}-${role.scope.id}`}>
                                <strong>{role.name}</strong><br />
                                <span className="security-muted">{role.scope.name}</span>
                            </p>
                        ))}
                    </div>
                </section>
                <form className="security-card security-form" action="/api/me/profile" method="post">
                    <input type="hidden" name="_method" value="PATCH" />
                    <label>
                        Display name
                        <input name="displayName" defaultValue={access.profile.displayName} />
                    </label>
                    <label>
                        Title
                        <input name="title" defaultValue={access.profile.title} />
                    </label>
                    <label>
                        Department
                        <input name="department" defaultValue={access.profile.department} />
                    </label>
                    <label>
                        Timezone
                        <input name="timezone" defaultValue={access.profile.timezone} />
                    </label>
                    <button className="security-button" type="submit">Save profile</button>
                </form>
            </main>
        </SecurityChrome>
    );
}
