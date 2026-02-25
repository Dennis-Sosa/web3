import fs from "node:fs/promises";
import path from "node:path";
import { SourceDoc } from "./types";
import { encodePathForUrl, listFilesRecursive, toPosixPath } from "@/lib/library/fs";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isString(x: unknown): x is string {
  return typeof x === "string";
}

function extractTitleFromMarkdown(md: string, fallback: string) {
  const m = md.match(/^#\s+(.+)\s*$/m);
  return (m?.[1]?.trim() || fallback).trim();
}

export async function loadSources(): Promise<SourceDoc[]> {
  const sourcesPath = path.join(process.cwd(), "data", "sources.json");
  const raw = await fs.readFile(sourcesPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("data/sources.json 必须是数组");
  }

  const docs: SourceDoc[] = parsed.map((x) => {
    if (!isRecord(x)) {
      throw new Error("data/sources.json 中存在不合法的条目");
    }
    const id = x.id;
    const title = x.title;
    const url = x.url;
    const content = x.content;
    if (!isString(id) || !isString(title) || !isString(url) || !isString(content)) {
      throw new Error("data/sources.json 中存在不合法的条目");
    }

    const tagsRaw = x.tags;
    const tags = Array.isArray(tagsRaw) ? tagsRaw.filter(isString) : [];
    return {
      id,
      title,
      url,
      tags,
      content,
    };
  });

  // Auto-include local library notes (e.g., uploaded PPT-derived notes)
  const notesRoot = path.join(process.cwd(), "library", "notes");
  const mdFiles = (await listFilesRecursive(notesRoot)).filter((p) => p.toLowerCase().endsWith(".md"));

  for (const file of mdFiles) {
    const md = await fs.readFile(file, "utf8").catch(() => "");
    if (!md.trim()) continue;

    const rel = toPosixPath(path.relative(notesRoot, file));
    const url = `/library/notes/${encodePathForUrl(rel)}`;
    const title = extractTitleFromMarkdown(md, path.basename(file, ".md"));

    // Lightweight tags: folder names + filename hints
    const folderTags = rel
      .split("/")
      .slice(0, -1)
      .filter(Boolean)
      .slice(-3);
    const fileTag = path.basename(file, ".md");
    const tags = ["library", ...folderTags, fileTag].filter(Boolean);

    docs.push({
      id: `library-note:${rel}`,
      title,
      url,
      tags,
      content: md,
    });
  }

  return docs;
}

