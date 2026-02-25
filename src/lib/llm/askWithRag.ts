import OpenAI from "openai";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";
import type { RetrievedChunk } from "@/lib/rag/types";

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

## 概念解释（小白版）
你问的是：**${question}**。\n\n下面是资料库里最相关的摘录（你可以先对照理解关键词）：\n${excerptBullets || "- （未检索到相关资料片段）"}

## 为什么重要
从资料片段能确认：这类概念通常和“区块链如何达成一致 / 交易如何被确认 / 为什么安全”相关。理解它们能帮助你看懂链上交易页面、费用提示与安全风险。

## 常见误区 / 风险提醒
- 不要把“概念理解”当作“收益承诺”。Web3 有真实风险。
- 不要向任何人/网站透露助记词、私钥或导出密钥。
- 连接 dApp 或签名/授权前，先确认域名与操作内容。

## 下一步怎么学
- 把问题写完整一点（例如“PoW 是什么？它怎么帮助达成共识？”），检索命中会更准
- 从“钱包/助记词/私钥”“Gas/手续费”“授权 approve”三件事学起
- 只用官方/知名教程入口，避免搜到钓鱼站

## 参考来源
${refs || "- （本次没有可引用来源）"}
`;
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

  if (!apiKey) {
    return {
      answerMarkdown: buildFallbackAnswer(question, retrieved, { reason: "no_api_key" }),
      sources: retrieved.map((s) => ({ title: s.title, url: s.url })),
      usedModel: null,
      mode: "fallback",
    };
  }

  const client = new OpenAI({ apiKey });
  const userPrompt = buildUserPrompt(question, retrieved);

  try {
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

