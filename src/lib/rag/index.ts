import MiniSearch from "minisearch";
import { loadSources } from "./loadSources";
import { chunkSources } from "./chunk";
import type { RagChunk, RetrievedChunk } from "./types";
import { cjkNgramTokenize } from "./tokenize";
import fs from "node:fs/promises";
import path from "node:path";
import { listFilesRecursive } from "@/lib/library/fs";

type RagIndex = {
  mini: MiniSearch<{ id: string; title: string; url: string; sourceId: string; tags: string[]; content: string }>;
  chunksById: Map<string, RagChunk>;
};

// Bump this whenever you change tokenization / fields / ranking logic that requires a rebuild.
const RAG_INDEX_SCHEMA_VERSION = "3-chunk-size-bounds";

declare global {
  var __web3_rag_index:
    | {
        version: string;
        promise: Promise<RagIndex>;
      }
    | undefined;
}

async function buildIndex(): Promise<RagIndex> {
  const sources = await loadSources();
  const chunks = chunkSources(sources);

  const mini = new MiniSearch({
    fields: ["title", "content", "tags", "sourceId"],
    storeFields: ["title", "url", "sourceId", "tags", "content"],
    tokenize: cjkNgramTokenize,
    searchOptions: {
      boost: { title: 4, tags: 2.5, sourceId: 1.2 },
      prefix: false,
      fuzzy: 0,
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

async function computeIndexVersion(): Promise<string> {
  // Any change to these files should trigger index rebuild
  const roots = [
    path.join(process.cwd(), "data", "sources.json"),
    path.join(process.cwd(), "library", "metadata.json"),
  ];
  const notesRoot = path.join(process.cwd(), "library", "notes");

  const files: string[] = [...roots];
  const noteFiles = (await listFilesRecursive(notesRoot)).filter((p) => p.toLowerCase().endsWith(".md"));
  files.push(...noteFiles);

  let maxMtime = 0;
  let count = 0;
  for (const f of files) {
    try {
      const st = await fs.stat(f);
      maxMtime = Math.max(maxMtime, st.mtimeMs);
      count++;
    } catch {
      // ignore missing
    }
  }

  return `${RAG_INDEX_SCHEMA_VERSION}:${count}:${Math.floor(maxMtime)}`;
}

export async function getRagIndex(): Promise<RagIndex> {
  const version = await computeIndexVersion();
  if (!globalThis.__web3_rag_index || globalThis.__web3_rag_index.version !== version) {
    globalThis.__web3_rag_index = { version, promise: buildIndex() };
  }
  return globalThis.__web3_rag_index.promise;
}

function normalizeQuery(q: string) {
  return q
    .trim()
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .toLowerCase();
}

function normalizeForMatch(s: string) {
  return normalizeQuery(s).replace(/\s+/g, " ");
}

function preprocessSearchText(raw: string) {
  // Reduce high-frequency “question scaffolding” tokens that hurt CJK n-gram retrieval.
  // (We still keep the original question for answer generation; this is search-only.)
  let s = normalizeQuery(raw);
  s = s.replace(/[?？！!。．,.，、;；:：()（）[\]【】{}<>《》"“”'‘’]/g, " ");

  // Common Chinese question patterns
  s = s.replace(/什么是|是什么|为什么|怎么|如何|请问|是不是|是否|有哪些|有什么|有何|能否|可以吗/g, " ");
  s = s.replace(/有什么区别|有何区别|区别是什么/g, " ");

  // Sentence particles / filler
  s = s.replace(/[吗呢啊呀嘛吧呗哇]+/g, " ");

  s = s.replace(/\s+/g, " ").trim();
  return s;
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

function looksLikeLatinQuery(q: string) {
  const n = normalizeQuery(q);
  const hasLatin = /[a-z]/.test(n);
  const hasCjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(n);
  return hasLatin && !hasCjk;
}

function fingerprintChunkContent(s: string) {
  // Simple stable fingerprint for exact / near-exact duplicates.
  return normalizeForMatch(s)
    .replace(/[“”‘’"']/g, "")
    .replace(/[，。！？、；：,.!?;:()[\]{}<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeAdjacent(chunks: RetrievedChunk[]) {
  const bySource = new Map<string, RetrievedChunk[]>();
  for (const c of chunks) {
    const arr = bySource.get(c.sourceId);
    if (arr) arr.push(c);
    else bySource.set(c.sourceId, [c]);
  }

  const merged: RetrievedChunk[] = [];
  for (const arr of bySource.values()) {
    arr.sort((a, b) => a.chunkIndex - b.chunkIndex);

    let runStart = arr[0];
    if (!runStart) continue;
    let runEnd = runStart;
    let runScore = runStart.score;
    let runContent = runStart.content;

    const flush = () => {
      merged.push({
        ...runStart,
        chunkId:
          runStart.chunkIndex === runEnd.chunkIndex
            ? runStart.chunkId
            : `${runStart.sourceId}::${runStart.chunkIndex}-${runEnd.chunkIndex}`,
        chunkIndex: runStart.chunkIndex,
        content: runContent,
        score: runScore,
      });
    };

    for (let i = 1; i < arr.length; i++) {
      const cur = arr[i]!;
      const isAdjacent = cur.chunkIndex === runEnd.chunkIndex + 1;
      if (isAdjacent) {
        runEnd = cur;
        runScore = Math.max(runScore, cur.score) + 0.05; // tiny bonus for added context
        runContent = `${runContent}\n\n${cur.content}`.trim();
        continue;
      }

      flush();
      runStart = cur;
      runEnd = cur;
      runScore = cur.score;
      runContent = cur.content;
    }

    flush();
  }

  merged.sort((a, b) => b.score - a.score);
  return merged;
}

function dedupChunks(chunks: RetrievedChunk[]) {
  const bestByFp = new Map<string, RetrievedChunk>();
  for (const c of chunks) {
    const fp = fingerprintChunkContent(`${c.title}\n${c.content}`);
    const prev = bestByFp.get(fp);
    if (!prev || c.score > prev.score) bestByFp.set(fp, c);
  }
  return [...bestByFp.values()].sort((a, b) => b.score - a.score);
}

type ContextWindowOptions = {
  before: number;
  after: number;
  maxWindowChars: number;
  maxTotalChars: number;
};

function parseChunkSpan(chunk: Pick<RetrievedChunk, "chunkId" | "chunkIndex">): { start: number; end: number } {
  const idx = chunk.chunkId.lastIndexOf("::");
  const tail = idx >= 0 ? chunk.chunkId.slice(idx + 2) : "";
  if (tail) {
    const mRange = tail.match(/^(\d+)-(\d+)$/);
    if (mRange) {
      const start = Number(mRange[1]);
      const end = Number(mRange[2]);
      if (Number.isFinite(start) && Number.isFinite(end)) return { start, end };
    }
    const mOne = tail.match(/^(\d+)$/);
    if (mOne) {
      const n = Number(mOne[1]);
      if (Number.isFinite(n)) return { start: n, end: n };
    }
  }
  return { start: chunk.chunkIndex, end: chunk.chunkIndex };
}

function buildContextWindows(
  seeds: RetrievedChunk[],
  chunksById: Map<string, RagChunk>,
  opts: ContextWindowOptions,
  contextTerms: string[],
): RetrievedChunk[] {
  const seedScoreBySourceIndex = new Map<string, Map<number, number>>();
  for (const s of seeds) {
    const span = parseChunkSpan(s);
    let m = seedScoreBySourceIndex.get(s.sourceId);
    if (!m) {
      m = new Map<number, number>();
      seedScoreBySourceIndex.set(s.sourceId, m);
    }
    for (let i = Math.max(0, span.start); i <= span.end; i++) {
      const prev = m.get(i) ?? 0;
      if (s.score > prev) m.set(i, s.score);
    }
  }

  const wantedBySource = new Map<string, Set<number>>();

  for (const s of seeds) {
    const span = parseChunkSpan(s);
    const start = Math.max(0, span.start - opts.before);
    const end = span.end + opts.after;
    let set = wantedBySource.get(s.sourceId);
    if (!set) {
      set = new Set<number>();
      wantedBySource.set(s.sourceId, set);
    }
    for (let i = start; i <= end; i++) set.add(i);
  }

  const windows: RetrievedChunk[] = [];

  for (const [sourceId, idxSet] of wantedBySource.entries()) {
    const idxs = [...idxSet].sort((a, b) => a - b);
    if (!idxs.length) continue;

    let rangeStart = idxs[0]!;
    let prev = idxs[0]!;

    const flushRange = (startIdx: number, endIdx: number) => {
      // Build content until we hit maxWindowChars or missing chunks.
      const pieces: string[] = [];
      let usedEnd = startIdx - 1;
      let base: RagChunk | null = null;
      let maxScore = 0;
      const scoreByIdx = seedScoreBySourceIndex.get(sourceId) ?? null;
      const haystackForMatch = (c: RagChunk) =>
        normalizeForMatch(`${c.title} ${c.tags.join(" ")} ${c.content}`);

      for (let i = startIdx; i <= endIdx; i++) {
        const c = chunksById.get(`${sourceId}::${i}`);
        if (!c) break;
        const isSeed = !!scoreByIdx?.has(i);

        // Only keep context (non-seed) chunks that still match at least one query term.
        if (!isSeed && contextTerms.length) {
          const hay = haystackForMatch(c);
          let ok = false;
          for (const t of contextTerms) {
            if (hay.includes(t)) {
              ok = true;
              break;
            }
          }
          if (!ok) continue;
        }

        if (!base) base = c;

        const next = (pieces.length ? "\n\n" : "") + c.content;
        const projected = (pieces.join("") + next).length;
        if (projected > opts.maxWindowChars) break;

        pieces.push(next);
        usedEnd = i;

        const seedScore = scoreByIdx?.get(i);
        if (typeof seedScore === "number") maxScore = Math.max(maxScore, seedScore);
      }

      if (!base || usedEnd < startIdx) return;

      const content = pieces.join("").trim();
      windows.push({
        chunkId: usedEnd === startIdx ? `${sourceId}::${startIdx}` : `${sourceId}::${startIdx}-${usedEnd}`,
        sourceId,
        chunkIndex: startIdx,
        title: base.title,
        url: base.url,
        tags: base.tags,
        content,
        score: maxScore + 0.15, // small bias: windowed chunks are more useful for generation
      });
    };

    for (let i = 1; i < idxs.length; i++) {
      const cur = idxs[i]!;
      if (cur === prev + 1) {
        prev = cur;
        continue;
      }
      flushRange(rangeStart, prev);
      rangeStart = cur;
      prev = cur;
    }
    flushRange(rangeStart, prev);
  }

  windows.sort((a, b) => b.score - a.score);

  // Enforce global budget to avoid flooding the prompt.
  const out: RetrievedChunk[] = [];
  let used = 0;
  for (const w of windows) {
    const len = w.content.length;
    if (used + len > opts.maxTotalChars) break;
    out.push(w);
    used += len;
  }
  return out;
}

function extractCoverageTerms(query: string) {
  const raw = cjkNgramTokenize(query);
  const stop = new Set([
    // Chinese question scaffolding
    "什么",
    "为什么",
    "怎么",
    "如何",
    "是否",
    "是不是",
    "有哪些",
    "意思",
    "区别",
    "作用",
    "原理",
    "风险",
    "优缺点",
    "是什么",
    // English scaffolding
    "what",
    "why",
    "how",
    "define",
  ]);

  const uniq = new Set<string>();
  for (const t of raw) {
    const tok = t.trim().toLowerCase();
    if (!tok) continue;
    if (tok.length <= 1) continue;
    if (stop.has(tok)) continue;
    uniq.add(tok);
  }
  return [...uniq];
}

function selectByCoverage(query: string, candidates: RetrievedChunk[], topK: number) {
  const terms = extractCoverageTerms(query);
  if (!terms.length) return candidates.slice(0, topK);

  const maxScore = Math.max(...candidates.map((c) => c.score), 0);
  const enriched = candidates.map((c) => {
    const hay = normalizeForMatch(`${c.title} ${c.tags.join(" ")} ${c.content}`);
    const hits = new Set<string>();
    for (const t of terms) if (hay.includes(t)) hits.add(t);
    return { c, hits };
  });

  const covered = new Set<string>();
  const picked: RetrievedChunk[] = [];
  const remaining = enriched.slice();

  const alpha = 0.65; // relevance
  const beta = 0.35; // coverage gain
  const perSourcePenalty = 0.08;

  while (picked.length < topK && remaining.length) {
    let bestIdx = 0;
    let bestVal = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const { c, hits } = remaining[i]!;
      let newHits = 0;
      for (const t of hits) if (!covered.has(t)) newHits++;

      const rel = maxScore > 0 ? c.score / maxScore : 0;
      const cov = newHits / terms.length;
      const alreadyUsedSource = picked.some((p) => p.sourceId === c.sourceId);
      const penalty = alreadyUsedSource ? perSourcePenalty : 0;

      const val = alpha * rel + beta * cov - penalty;
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    }

    const chosen = remaining.splice(bestIdx, 1)[0]!;
    picked.push(chosen.c);
    for (const t of chosen.hits) covered.add(t);
  }

  picked.sort((a, b) => b.score - a.score);
  return picked;
}

export async function retrieveChunks(query: string, topK = 6): Promise<RetrievedChunk[]> {
  const q = query.trim();
  if (!q) return [];

  const { mini, chunksById } = await getRagIndex();
  const expanded = expandQuery(q);
  const latinQuery = looksLikeLatinQuery(q);
  const results = mini.search(expanded, {
    boost: { title: 4, tags: 2.5, sourceId: 1.2 },
    combineWith: "OR",
    tokenize: (text: string) => cjkNgramTokenize(preprocessSearchText(text)),
    prefix: latinQuery,
    fuzzy: latinQuery ? 0.2 : 0,
  });

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

  // Pull a wider candidate pool, then post-process for better context & diversity.
  const candidateLimit = Math.max(topK * 10, 40);
  const candidates = out.slice(0, candidateLimit);

  const merged = mergeAdjacent(candidates);
  const deduped = dedupChunks(merged);
  const selected = selectByCoverage(q, deduped, topK);

  const contextTerms = [
    ...new Set(
      cjkNgramTokenize(preprocessSearchText(q))
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 1),
    ),
  ];

  const windowed = buildContextWindows(selected, chunksById, {
    before: 1,
    after: 1,
    maxWindowChars: 1400,
    maxTotalChars: 5200,
  }, contextTerms);

  // After windowing, re-dedup and keep topK.
  const finalDeduped = dedupChunks(windowed);
  return finalDeduped.slice(0, topK);
}

