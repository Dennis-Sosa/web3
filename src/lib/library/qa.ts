import fs from "node:fs/promises";
import path from "node:path";
import { encodePathForUrl, listFilesRecursive, toPosixPath } from "./fs";

export type QaItem = {
  question: string;
  sourceTitle: string;
  sourceUrl: string;
  noteRelPath: string;
};

function extractTitleFromMarkdown(md: string, fallback: string) {
  const m = md.match(/^#\s+(.+)\s*$/m);
  return (m?.[1]?.trim() || fallback).trim();
}

function extractSelfTestSection(md: string) {
  // Capture any "复习自测/自测/Quiz" section at H2 level.
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const sections: string[] = [];

  const isStart = (line: string) =>
    /^##\s+/.test(line) &&
    (line.includes("复习自测") || line.includes("自测") || /\bquiz\b/i.test(line));

  for (let i = 0; i < lines.length; i++) {
    if (!isStart(lines[i]!)) continue;
    const start = i + 1;
    let end = lines.length;
    for (let j = start; j < lines.length; j++) {
      if (/^##\s+/.test(lines[j]!)) {
        end = j;
        break;
      }
    }
    sections.push(lines.slice(start, end).join("\n"));
    i = end - 1;
  }

  return sections.join("\n");
}

function normalizeQuestion(q: string) {
  return q
    .replace(/\s+/g, " ")
    .replace(/[。．]\s*$/g, "")
    .trim();
}

function extractQuestionsFromSection(section: string): string[] {
  const out: string[] = [];
  const lines = section.split("\n");
  for (const line of lines) {
    const n = line.match(/^\s*\d+\.\s*(.+?)\s*$/);
    if (n?.[1]) {
      out.push(normalizeQuestion(n[1]));
      continue;
    }
    const b = line.match(/^\s*-\s+(.+?)\s*$/);
    if (b?.[1]) {
      const v = normalizeQuestion(b[1]);
      // Filter out obvious non-question bullets
      if (v.length >= 8 && (v.includes("？") || v.includes("?"))) out.push(v);
    }
  }
  return out.filter(Boolean);
}

export async function loadQaFromLibraryNotes(): Promise<{
  updatedAt: string;
  total: number;
  items: QaItem[];
}> {
  const notesRoot = path.join(process.cwd(), "library", "notes");
  const files = (await listFilesRecursive(notesRoot)).filter((p) => p.toLowerCase().endsWith(".md"));

  const dedup = new Set<string>();
  const items: QaItem[] = [];

  for (const file of files) {
    const md = await fs.readFile(file, "utf8").catch(() => "");
    if (!md.trim()) continue;

    const rel = toPosixPath(path.relative(notesRoot, file));
    const url = `/library/notes/${encodePathForUrl(rel)}`;
    const title = extractTitleFromMarkdown(md, path.basename(file, ".md"));

    const section = extractSelfTestSection(md);
    const qs = section ? extractQuestionsFromSection(section) : [];

    for (const q of qs) {
      const key = q.toLowerCase();
      if (dedup.has(key)) continue;
      dedup.add(key);
      items.push({
        question: q,
        sourceTitle: title,
        sourceUrl: url,
        noteRelPath: rel,
      });
    }
  }

  // Stable-ish ordering: keep deterministic for UI
  items.sort((a, b) => a.question.localeCompare(b.question, "zh-Hans"));

  return {
    updatedAt: new Date().toISOString(),
    total: items.length,
    items,
  };
}

