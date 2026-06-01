import { ClerkProvider } from "@clerk/nextjs";
import { hasClerkConfig } from "@/lib/runtime";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "DeliveryPro.AI",
    description: "Strategic portfolio management with governed AI assistance"
};

export default function RootLayout({ children }) {
    if (!hasClerkConfig()) {
        return (
            <html lang="en">
                <body>{children}</body>
            </html>
        );
    }

    return (
        <html lang="en">
            <body>
                <ClerkProvider>{children}</ClerkProvider>
            </body>
        </html>
    );
}
