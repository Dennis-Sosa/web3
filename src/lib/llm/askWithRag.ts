import OpenAI from "openai";
import { SYSTEM_PROMPT, SYSTEM_PROMPT_NO_SOURCES, buildUserPrompt } from "@/lib/prompts";
import type { RetrievedChunk } from "@/lib/rag/types";

export type StreamEvent =
  | {
      type: "meta";
      sources: { title: string; url: string }[];
      mode: "llm" | "fallback";
      usedModel: string | null;
      retrievedCount: number;
      retrieved?: { score: number; title: string; url: string; content: string }[];
    }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type AskResponse = {
  answerMarkdown: string;
  sources: { title: string; url: string }[];
  usedModel: string | null;
  mode: "llm" | "fallback";
  llmError?: string;
};

function uniqueSources(chunks: RetrievedChunk[]) {
  const seen = new Set<string>();
  const out: { title: string; url: string; content: string }[] = [];
  for (const c of chunks) {
    const key = `${c.title}||${c.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title: c.title, url: c.url, content: c.content });
  }
  return out;
}

function buildFallbackAnswer(
  question: string,
  retrieved: { title: string; url: string; content: string }[],
  meta?: { reason?: "no_api_key" | "llm_error"; detail?: string },
) {
  const reasonLine =
    meta?.reason === "llm_error"
      ? `大模型调用失败，已自动降级为检索摘要。${meta.detail ? `（${meta.detail}）` : ""}`
      : "当前未启用大模型生成（未配置 OPENAI_API_KEY），已自动降级为检索摘要。";

  const refs = retrieved
    .map((s, i) => `- [${i + 1}] ${s.title} — ${s.url}`)
    .join("\n");
  const excerpts = retrieved.slice(0, 5);
  const excerptBullets = excerpts.map((s, i) => `- [${i + 1}] ${s.content}`).join("\n");

  const top = excerpts[0]?.content?.trim();
  const oneLiner = top
    ? top.split(/\n+/)[0]?.trim()
    : "我在资料库里没有检索到足够信息来直接回答这个问题。";

  return `## 一句话结论
${oneLiner}

> 注：${reasonLine}

## 概念定义（一句话 + 关键词）
（当前为“检索摘要模式”：请先看下方摘录来建立定义与关键词。）

## 核心机制 / 怎么运作（分步骤）
（当前为“检索摘要模式”：请先看下方摘录来还原机制/步骤。）

## 核心要点（记住这几条就够）
你问的是：**${question}**。\n\n下面是资料库里最相关的摘录（你可以先对照理解关键词）：\n${excerptBullets || "- （未检索到相关资料片段）"}

## 为什么重要（解决什么问题 / 影响什么）
从资料片段能确认：这类概念通常和“交易如何被授权/确认、系统如何达成一致、以及链上安全边界”相关。理解它们能帮助你看懂钱包提示、交易页面与常见风险。

## 常见误区 / 风险提醒
- 不要把“概念理解”当作“收益承诺”。Web3 有真实风险。
- 不要向任何人/网站透露助记词、私钥或导出密钥。
- 连接 dApp 或签名/授权前，先确认域名与操作内容。

## 参考来源
${refs || "- （本次没有可引用来源）"}
`;
}

function buildNoHitApiUserPrompt(question: string) {
  return `用户问题：${question}

资料库检索未命中。请按要求输出结构化解释，并在“一句话结论”里明确说明本次未引用资料库来源。`;
}

function extractStatus(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const anyErr = err as { status?: unknown; response?: unknown };
  if (typeof anyErr.status === "number") return anyErr.status;
  const resp = anyErr.response as { status?: unknown } | undefined;
  if (resp && typeof resp.status === "number") return resp.status;
  return null;
}

function extractMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export async function askWithRag(question: string, retrievedChunks: RetrievedChunk[]): Promise<AskResponse> {
  const retrieved = uniqueSources(retrievedChunks);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = (process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini").trim();

  // Rule: Prefer answering from the local library first.
  // Only call the LLM API when either:
  // - We have hits (grounded mode), or
  // - There are no hits at all (general educational mode).
  if (!apiKey) {
    return {
      answerMarkdown: buildFallbackAnswer(question, retrieved, { reason: "no_api_key" }),
      sources: retrieved.map((s) => ({ title: s.title, url: s.url })),
      usedModel: null,
      mode: "fallback",
    };
  }

  const client = new OpenAI({ apiKey });

  try {
    // If nothing was retrieved, call API in "no-sources" mode.
    if (retrieved.length === 0) {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT_NO_SOURCES },
          { role: "user", content: buildNoHitApiUserPrompt(question) },
        ],
        temperature: 0.2,
      });

      const text = completion.choices?.[0]?.message?.content?.trim();
      return {
        answerMarkdown:
          text ||
          `## 一句话结论\n资料库未命中相关片段，我先给出通用解释（未引用资料库来源，可能不够精确）。\n\n## 概念定义（一句话 + 关键词）\n（无）\n\n## 核心机制 / 怎么运作（分步骤）\n（无）\n\n## 核心要点（记住这几条就够）\n（无）\n\n## 为什么重要（解决什么问题 / 影响什么）\n（无）\n\n## 常见误区 / 风险提醒\n- 注意私钥/助记词安全与钓鱼风险。\n\n## 参考来源\n- （本次未命中资料库来源）\n`,
        sources: [],
        usedModel: model,
        mode: "llm",
      };
    }

    // Otherwise, we have hits: call API in grounded mode (must use retrieved snippets).
    const userPrompt = buildUserPrompt(question, retrieved);
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const text = completion.choices?.[0]?.message?.content?.trim();

    return {
      answerMarkdown:
        text ||
        buildFallbackAnswer(question, retrieved) +
          "\n\n> 注：模型没有返回内容，我已降级为检索摘要。",
      sources: retrieved.map((s) => ({ title: s.title, url: s.url })),
      usedModel: model,
      mode: "llm",
    };
  } catch (err: unknown) {
    const status = extractStatus(err);
    const msg = extractMessage(err);
    const short =
      status === 429
        ? "大模型调用被限额/额度不足（429）。请检查 OpenAI 计费与额度。"
        : "大模型调用失败，已自动降级为检索摘要。";

    return {
      answerMarkdown:
        buildFallbackAnswer(question, retrieved, { reason: "llm_error", detail: short }) +
        `\n\n> 详细：${msg}`,
      sources: retrieved.map((s) => ({ title: s.title, url: s.url })),
      usedModel: null,
      mode: "fallback",
      llmError: status ? `${status} ${msg}` : msg,
    };
  }
}

export async function* streamWithRag(
  question: string,
  retrievedChunks: RetrievedChunk[],
  opts?: { debug?: boolean },
): AsyncGenerator<StreamEvent> {
  const retrieved = uniqueSources(retrievedChunks);
  const sources = retrieved.map((s) => ({ title: s.title, url: s.url }));
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = (process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini").trim();

  const metaBase = {
    sources,
    retrievedCount: retrievedChunks.length,
    ...(opts?.debug
      ? {
          retrieved: retrievedChunks.map((c) => ({
            score: c.score,
            title: c.title,
            url: c.url,
            content: c.content,
          })),
        }
      : {}),
  };

  if (!apiKey) {
    yield { type: "meta", ...metaBase, mode: "fallback", usedModel: null };
    const full = buildFallbackAnswer(question, retrieved, { reason: "no_api_key" });
    for (const chunk of chunkForStreaming(full)) yield { type: "delta", text: chunk };
    yield { type: "done" };
    return;
  }

  yield { type: "meta", ...metaBase, mode: "llm", usedModel: model };

  const client = new OpenAI({ apiKey });
  const hasHits = retrieved.length > 0;
  const systemPrompt = hasHits ? SYSTEM_PROMPT : SYSTEM_PROMPT_NO_SOURCES;
  const userPrompt = hasHits ? buildUserPrompt(question, retrieved) : buildNoHitApiUserPrompt(question);

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      stream: true,
    });

    for await (const chunk of completion) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield { type: "delta", text };
    }

    yield { type: "done" };
  } catch (err: unknown) {
    const status = extractStatus(err);
    const msg = extractMessage(err);
    const short =
      status === 429
        ? "大模型调用被限额/额度不足（429）。请检查 OpenAI 计费与额度。"
        : "大模型调用失败，已自动降级为检索摘要。";
    const full =
      buildFallbackAnswer(question, retrieved, { reason: "llm_error", detail: short }) + `\n\n> 详细：${msg}`;
    for (const chunk of chunkForStreaming(full)) yield { type: "delta", text: chunk };
    yield { type: "done" };
  }
}

function* chunkForStreaming(text: string, size = 80): Generator<string> {
  for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size);
}
