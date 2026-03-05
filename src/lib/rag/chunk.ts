import { SourceDoc, RagChunk } from "./types";

const MIN_CHUNK_CHARS = 60;
const MAX_CHUNK_CHARS = 800;

function normalizeText(s: string) {
  return s.replace(/\r\n/g, "\n").trim();
}

/** A part is a "lone heading" if it's a single markdown heading line with no body. */
function isLoneHeading(text: string): boolean {
  return /^#{1,6}\s+\S/.test(text) && !text.includes("\n");
}

/**
 * Split a text that exceeds MAX_CHUNK_CHARS at sentence boundaries.
 * Prefers splitting after 。！？ or at newlines; falls back to hard-splitting
 * if a single sentence is itself too long.
 */
function splitAtSentenceBoundaries(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const result: string[] = [];
  // Split keeping delimiters attached to the preceding sentence.
  const segments = text.split(/(?<=[。！？\n])/);
  let current = "";

  for (const seg of segments) {
    if (!seg) continue;
    if ((current + seg).length <= maxChars) {
      current += seg;
    } else {
      if (current.trim()) result.push(current.trim());
      if (seg.length > maxChars) {
        // Single sentence too long: hard-split at maxChars boundaries.
        let rem = seg.trim();
        while (rem.length > maxChars) {
          result.push(rem.slice(0, maxChars));
          rem = rem.slice(maxChars).trimStart();
        }
        current = rem;
      } else {
        current = seg;
      }
    }
  }
  if (current.trim()) result.push(current.trim());
  return result.filter(Boolean);
}

export function chunkSources(docs: SourceDoc[]): RagChunk[] {
  const chunks: RagChunk[] = [];

  for (const doc of docs) {
    const normalized = normalizeText(doc.content);
    const rawParts = normalized
      .split(/\n{2,}/g)
      .map((p) => p.trim())
      .filter(Boolean);

    // Pass 1: attach lone heading lines to the following paragraph.
    // A heading like "## TL;DR" alone carries no retrieval signal —
    // merging it with the body gives the chunk a meaningful title prefix.
    const attached: string[] = [];
    for (let i = 0; i < rawParts.length; i++) {
      const part = rawParts[i]!;
      if (isLoneHeading(part) && i + 1 < rawParts.length) {
        // Prepend heading into next part so it won't be processed again.
        rawParts[i + 1] = `${part}\n${rawParts[i + 1]}`;
        continue;
      }
      attached.push(part);
    }

    // Pass 2: merge consecutive short parts into one chunk.
    // Rule: keep accumulating while current < MIN_CHUNK_CHARS.
    // Once current is substantial, only merge the next part if the combined
    // result stays within MAX_CHUNK_CHARS.
    const sized: string[] = [];
    let current = "";

    for (const part of attached) {
      if (!current) {
        current = part;
        continue;
      }
      const combined = `${current}\n\n${part}`;
      if (current.length < MIN_CHUNK_CHARS || combined.length <= MAX_CHUNK_CHARS) {
        current = combined;
      } else {
        sized.push(current);
        current = part;
      }
    }
    if (current.trim()) sized.push(current.trim());

    // Pass 3: split any chunk that still exceeds MAX_CHUNK_CHARS.
    const final: string[] = [];
    for (const s of sized) {
      final.push(...splitAtSentenceBoundaries(s, MAX_CHUNK_CHARS));
    }

    const tags = (doc.tags ?? []).filter((t) => typeof t === "string");
    for (let i = 0; i < final.length; i++) {
      const content = final[i]!;
      chunks.push({
        chunkId: `${doc.id}::${i}`,
        sourceId: doc.id,
        chunkIndex: i,
        title: doc.title,
        url: doc.url,
        tags,
        content,
      });
    }
  }

  return chunks;
}
