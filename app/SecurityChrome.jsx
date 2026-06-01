import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getEffectiveAccess } from "@/lib/authz";
import { hasClerkConfig } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export default async function SecurityChrome({ children }) {
    const access = await getEffectiveAccess();
    if (access.error) redirect("/sign-in");

    const roleSummary = access.roles.map((role) => role.name).join(", ");

    return (
        <div className="security-shell">
            <header className="security-topbar">
                <Link href="/workspace" className="security-brand">
                    <strong>DeliveryPro.AI</strong>
                    <span>{roleSummary || "Secured workspace"}</span>
                </Link>
                <nav className="security-nav" aria-label="Security navigation">
                    <Link className="security-link" href="/workspace">Workspace</Link>
                    <Link className="security-link" href="/profile">Profile</Link>
                    <Link className="security-link" href="/admin/users">Users</Link>
                    <Link className="security-link" href="/admin/access">Access</Link>
                    <Link className="security-link" href="/admin/governance">Governance</Link>
                    <Link className="security-link" href="/admin/audit">Audit</Link>
                </nav>
                <div className="security-actions">
                    <span className="security-badge">{access.source}</span>
                    {hasClerkConfig()
                        ? <UserButton afterSignOutUrl="/sign-in" />
                        : <span className="security-badge">Local admin</span>}
                </div>
            </header>
            {children}
        </div>
    );
}
