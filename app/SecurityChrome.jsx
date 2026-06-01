import { redirect } from "next/navigation";
import { getEffectiveAccess } from "@/lib/authz";
import { hasClerkConfig } from "@/lib/runtime";
import AdminBar from "./AdminBar";

export const dynamic = "force-dynamic";

export default async function SecurityChrome({ children }) {
    const access = await getEffectiveAccess();
    if (access.error) redirect("/sign-in");

    const roleSummary = access.roles.map((role) => role.name).join(", ");

    return (
        <div className="security-shell">
            <AdminBar
                roleSummary={roleSummary}
                source={access.source}
                hasClerk={hasClerkConfig()}
            />
            {children}
        </div>
    );
}
