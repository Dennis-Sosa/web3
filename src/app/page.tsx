"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

type AskResult = {
  answerMarkdown: string;
  sources: { title: string; url: string }[];
  mode: "llm" | "fallback";
  usedModel: string | null;
  retrievedCount: number;
  retrieved?: { score: number; title: string; url: string; content: string }[];
};

const SAMPLE_QUESTIONS = [
  "什么是钱包？助记词和私钥有什么区别？",
  "Gas Fee 是什么？为什么有时候很贵？",
  "DeFi 是什么？和传统金融有什么不一样？",
  "NFT 是什么？买 NFT 等于买版权吗？",
  "什么是智能合约？为什么会有合约风险？",
  "授权（approve）是什么意思？为什么说有风险？",
  "Layer 2 是什么？为什么能更便宜？",
  "稳定币是什么？真的“稳定”吗？",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResult | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const canAsk = useMemo(() => question.trim().length > 0 && !loading, [question, loading]);

  async function onAsk(q?: string) {
    const finalQ = (q ?? question).trim();
    if (!finalQ) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(showDebug ? "/api/ask?debug=1" : "/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQ }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as AskResult;
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Web3 小白问答 MVP
          </h1>
          <div className="rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-xs text-zinc-300">
            学习助手 · 非投资建议
          </div>
        </div>
        <p className="text-sm leading-6 text-zinc-300">
          输入一个 Web3 概念问题（如钱包/Gas/DeFi/NFT）。系统会先从本地可信资料库检索，再生成通俗、结构化的解释，并附上参考来源链接。
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
        <label className="mb-2 block text-sm font-medium text-zinc-200">
          你的问题
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例如：什么是钱包？助记词丢了会怎样？"
          className="h-28 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-sm leading-6 outline-none ring-0 placeholder:text-zinc-500 focus:border-zinc-600"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onAsk()}
            disabled={!canAsk}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "正在检索并生成…" : "提问"}
          </button>

          <button
            onClick={() => {
              setQuestion("");
              setResult(null);
              setError(null);
            }}
            className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900/40"
          >
            清空
          </button>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/20 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/40">
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
              className="h-4 w-4 accent-white"
            />
            查看检索片段（debug）
          </label>

          <div className="ml-auto text-xs text-zinc-400">
            {result
              ? `检索到 ${result.retrievedCount} 条片段 · 模式：${result.mode}${result.usedModel ? ` · 模型：${result.usedModel}` : ""}`
              : `提示：未配置 OPENAI_API_KEY 时会降级为“检索摘要”${showDebug ? " · debug 已开启" : ""}`}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-zinc-400">示例问题</div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  void onAsk(q);
                }}
                className="rounded-full border border-zinc-800 bg-zinc-900/20 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900/40"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200">
          {error}
        </section>
      ) : null}

      {result ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-a:text-sky-300 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-100">
            <ReactMarkdown>{result.answerMarkdown}</ReactMarkdown>
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-4">
            <div className="mb-2 text-sm font-semibold text-zinc-100">
              参考来源（便于你继续学习）
            </div>
            {result.sources?.length ? (
              <ul className="space-y-1 text-sm text-zinc-300">
                {result.sources.map((s, idx) => (
                  <li key={`${s.url}::${s.title}::${idx}`} className="truncate">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-300 hover:underline"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-zinc-400">
                本次没有检索到可引用来源（你可以换个问法试试）。
              </div>
            )}
          </div>

          {showDebug ? (
            <div className="mt-6 border-t border-zinc-800 pt-4">
              <div className="mb-2 text-sm font-semibold text-zinc-100">
                本次命中的检索片段（debug）
              </div>
              {result.retrieved?.length ? (
                <div className="space-y-3">
                  {result.retrieved.map((c, idx) => (
                    <div
                      key={`${c.url}::${c.title}::${idx}`}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-sky-300 hover:underline"
                        >
                          {c.title}
                        </a>
                        <div className="text-xs text-zinc-400">
                          score: {Number.isFinite(c.score) ? c.score.toFixed(3) : String(c.score)}
                        </div>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-200">
                        {c.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-zinc-400">
                  debug 已开启，但本次没有返回检索片段（你可以再点一次“提问”）。
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-3 text-xs leading-5 text-zinc-300">
            本应用仅用于教育与概念学习，不构成任何投资/交易建议；Web3 存在资产风险与安全风险，请对助记词/私钥/授权操作保持谨慎。
          </div>
        </section>
      ) : null}
    </main>
  );
}

