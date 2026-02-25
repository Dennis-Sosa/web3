import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";

export const runtime = "nodejs";

export default async function LibraryIndexPage() {
  const p = path.join(process.cwd(), "library", "index.md");
  const md = await fs.readFile(p, "utf8").catch(() => "# 资料库\n\n未找到 `mvp/library/index.md`。");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6">
        <a href="/" className="text-sm text-sky-300 hover:underline">
          ← 返回问答
        </a>
      </div>
      <div className="prose prose-invert max-w-none prose-headings:tracking-tight prose-a:text-sky-300 prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown>{md}</ReactMarkdown>
      </div>
    </main>
  );
}

