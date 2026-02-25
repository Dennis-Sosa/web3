import { SourceDoc, RagChunk } from "./types";

function normalizeText(s: string) {
  return s.replace(/\r\n/g, "\n").trim();
}

export function chunkSources(docs: SourceDoc[]): RagChunk[] {
  const chunks: RagChunk[] = [];

  for (const doc of docs) {
    const normalized = normalizeText(doc.content);
    const parts = normalized
      .split(/\n{2,}/g)
      .map((p) => p.trim())
      .filter(Boolean);

    const tags = (doc.tags ?? []).filter((t) => typeof t === "string");

    for (let i = 0; i < parts.length; i++) {
      const content = parts[i]!;
      const chunkId = `${doc.id}::${i}`;
      chunks.push({
        chunkId,
        sourceId: doc.id,
        title: doc.title,
        url: doc.url,
        tags,
        content,
      });
    }
  }

  return chunks;
}

