import fs from "node:fs/promises";
import path from "node:path";
import { SourceDoc } from "./types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isString(x: unknown): x is string {
  return typeof x === "string";
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

  return docs;
}

