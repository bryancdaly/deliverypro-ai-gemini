export function hasClerkConfig() {
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
    const secret = process.env.CLERK_SECRET_KEY || "";
    const hasPublishableKey = key.startsWith("pk_live_") || key.startsWith("pk_test_");
    const hasSecretKey = secret.startsWith("sk_live_") || secret.startsWith("sk_test_");
    return hasPublishableKey && hasSecretKey;
}
