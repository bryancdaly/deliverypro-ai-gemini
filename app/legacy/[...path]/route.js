import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp"
};

export async function GET(_req, { params }) {
    const required = await requireUser();
    if (required.error) return required.error;

    const { path: requestedPath = [] } = await params;
    const relativePath = requestedPath.join("/");
    const legacyRoot = path.join(process.cwd(), "legacy");
    const filePath = path.normalize(path.join(legacyRoot, relativePath || "workspace.html"));

    if (!filePath.startsWith(legacyRoot)) {
        return Response.json({ error: "Invalid path" }, { status: 400 });
    }

    try {
        const body = await readFile(filePath);
        const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
        return new Response(body, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-store"
            }
        });
    } catch {
        return Response.json({ error: "Not found" }, { status: 404 });
    }
}
