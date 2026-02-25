import MiniSearch from "minisearch";
import { loadSources } from "./loadSources";
import { chunkSources } from "./chunk";
import type { RagChunk, RetrievedChunk } from "./types";

type RagIndex = {
  mini: MiniSearch<{ id: string; title: string; url: string; sourceId: string; tags: string[]; content: string }>;
  chunksById: Map<string, RagChunk>;
};

declare global {
  var __web3_rag_index: Promise<RagIndex> | undefined;
}

async function buildIndex(): Promise<RagIndex> {
  const sources = await loadSources();
  const chunks = chunkSources(sources);

  const mini = new MiniSearch({
    fields: ["title", "content", "tags"],
    storeFields: ["title", "url", "sourceId", "tags", "content"],
    searchOptions: {
      boost: { title: 3, tags: 2 },
      prefix: true,
      fuzzy: 0.2,
    },
  });

  const docs = chunks.map((c) => ({
    id: c.chunkId,
    title: c.title,
    url: c.url,
    sourceId: c.sourceId,
    tags: c.tags,
    content: c.content,
  }));

  mini.addAll(docs);

  const chunksById = new Map<string, RagChunk>();
  for (const c of chunks) chunksById.set(c.chunkId, c);

  return { mini, chunksById };
}

export async function getRagIndex(): Promise<RagIndex> {
  if (!globalThis.__web3_rag_index) {
    globalThis.__web3_rag_index = buildIndex();
  }
  return globalThis.__web3_rag_index;
}

export async function retrieveChunks(query: string, topK = 6): Promise<RetrievedChunk[]> {
  const q = query.trim();
  if (!q) return [];

  const { mini, chunksById } = await getRagIndex();
  const results = mini.search(q);

  const out: RetrievedChunk[] = [];
  for (const r of results) {
    const chunk = chunksById.get(r.id);
    if (!chunk) continue;
    out.push({ ...chunk, score: r.score });
  }
  return out.slice(0, topK);
}

