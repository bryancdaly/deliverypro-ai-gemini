import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { hasClerkConfig } from "@/lib/runtime";

export default function SignUpPage() {
    if (!hasClerkConfig()) {
        return (
            <main className="security-page" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
                <section className="security-card">
                    <h1>Local Development Mode</h1>
                    <p className="security-muted">Configure Clerk environment variables to enable sign-up.</p>
                    <Link className="security-link" href="/workspace">Open workspace</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="security-page" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
            <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
        </main>
    );
}
