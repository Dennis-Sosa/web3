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

function normalizeQuery(q: string) {
  return q
    .trim()
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .toLowerCase();
}

function expandQuery(q: string) {
  const n = normalizeQuery(q);
  const expansions: string[] = [];

  // Acronyms / common beginner queries
  if (/\bpow\b/.test(n) || n.includes("proof of work") || n.includes("工作量证明")) {
    expansions.push("工作量证明", "proof of work", "挖矿", "最长链", "区块", "共识");
  }
  if (/\bpoh\b/.test(n) || n.includes("proof of history") || n.includes("历史证明")) {
    expansions.push("历史证明", "proof of history", "时间", "顺序", "hash 序列");
  }
  if (n.includes("utxo")) {
    expansions.push("未花费输出", "utxo", "找零钱", "交易输入输出");
  }
  if (n.includes("spv")) {
    expansions.push("轻节点", "简化支付验证", "区块头", "merkle 证明");
  }

  return expansions.length ? `${q} ${expansions.join(" ")}` : q;
}

export async function retrieveChunks(query: string, topK = 6): Promise<RetrievedChunk[]> {
  const q = query.trim();
  if (!q) return [];

  const { mini, chunksById } = await getRagIndex();
  const expanded = expandQuery(q);
  const results = mini.search(expanded);

  const out: RetrievedChunk[] = [];
  for (const r of results) {
    const chunk = chunksById.get(r.id);
    if (!chunk) continue;
    // Light re-ranking: prefer tag/title matches for short acronym queries (e.g. "pow?")
    const nq = normalizeQuery(q);
    let bonus = 0;
    const hayTitle = chunk.title.toLowerCase();
    const hayTags = chunk.tags.join(" ").toLowerCase();
    const hay = `${hayTitle} ${hayTags} ${chunk.content.toLowerCase()}`;

    if (/\bpow\b/.test(nq) || nq.includes("工作量证明")) {
      if (hay.includes("pow") || hay.includes("proof-of-work") || hay.includes("proof of work") || hay.includes("工作量证明")) {
        bonus += 1.5;
      }
      if (hay.includes("bitcoin")) bonus += 0.3;
    }
    if (/\bpoh\b/.test(nq) || nq.includes("历史证明")) {
      if (hay.includes("poh") || hay.includes("proof of history") || hay.includes("历史证明")) {
        bonus += 1.5;
      }
      if (hay.includes("solana")) bonus += 0.3;
    }

    out.push({ ...chunk, score: r.score + bonus });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, topK);
}

