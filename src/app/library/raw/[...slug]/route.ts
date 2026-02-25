import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

function safeResolveRawPath(slug: string[]) {
  const rawRoot = path.resolve(process.cwd(), "library", "raw");
  const filePath = path.resolve(rawRoot, ...slug);
  if (!filePath.startsWith(rawRoot + path.sep)) return null;
  if (!filePath.toLowerCase().endsWith(".pdf")) return null;
  return { rawRoot, filePath };
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const resolved = safeResolveRawPath(slug);
  if (!resolved) return new Response("Not found", { status: 404 });

  const buf = await fs.readFile(resolved.filePath).catch(() => null);
  if (!buf) return new Response("Not found", { status: 404 });

  const filename = path.basename(resolved.filePath);
  return new Response(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

