import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { hasClerkConfig } from "@/lib/runtime";

export default function SignInPage() {
    if (!hasClerkConfig()) {
        return (
            <main className="security-page" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
                <section className="security-card">
                    <h1>Local Development Mode</h1>
                    <p className="security-muted">Configure Clerk environment variables to enable real sign-in. Until then, the app runs as a seeded local admin.</p>
                    <Link className="security-link" href="/workspace">Open workspace</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="security-page" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
            <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
        </main>
    );
}
