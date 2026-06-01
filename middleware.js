import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const secretKey = process.env.CLERK_SECRET_KEY || "";
const hasClerkConfig =
    (publishableKey.startsWith("pk_live_") || publishableKey.startsWith("pk_test_")) &&
    (secretKey.startsWith("sk_live_") || secretKey.startsWith("sk_test_"));

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/favicon.ico"
]);

const securedMiddleware = clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export default function middleware(req, event) {
    if (!hasClerkConfig) return NextResponse.next();
    return securedMiddleware(req, event);
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/__clerk/(.*)",
        "/legacy(.*)",
        "/(api)(.*)"
    ]
};
