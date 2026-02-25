import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

export const runtime = "nodejs";

function safeResolveNotePath(slug: string[]) {
  const notesRoot = path.resolve(process.cwd(), "library", "notes");
  const filePath = path.resolve(notesRoot, ...slug);
  if (!filePath.startsWith(notesRoot + path.sep)) return null;
  if (!filePath.toLowerCase().endsWith(".md")) return null;
  return { notesRoot, filePath };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const resolved = safeResolveNotePath(slug);
  if (!resolved) return notFound();

  const md = await fs.readFile(resolved.filePath, "utf8").catch(() => null);
  if (!md) return notFound();

  const rel = path.relative(resolved.notesRoot, resolved.filePath).split(path.sep).join("/");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <a href="/library" className="text-sm text-sky-300 hover:underline">
          ← 返回资料库
        </a>
        <div className="text-xs text-zinc-400">notes/{rel}</div>
      </div>
      <div className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-a:text-sky-300 prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown>{md}</ReactMarkdown>
      </div>
    </main>
  );
}

