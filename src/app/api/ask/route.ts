import { NextResponse } from "next/server";
import { z } from "zod";
import { retrieveChunks } from "@/lib/rag/index";
import { askWithRag } from "@/lib/llm/askWithRag";

export const runtime = "nodejs";

const ReqSchema = z.object({
  question: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1";

    const json = await req.json().catch(() => null);
    const parsed = ReqSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const question = parsed.data.question.trim();
    const retrieved = await retrieveChunks(question, 6);
    const result = await askWithRag(question, retrieved);

    return NextResponse.json({
      question,
      answerMarkdown: result.answerMarkdown,
      sources: result.sources,
      mode: result.mode,
      usedModel: result.usedModel,
      retrievedCount: retrieved.length,
      ...(debug
        ? {
            retrieved: retrieved.map((c) => ({
              score: c.score,
              title: c.title,
              url: c.url,
              content: c.content,
            })),
          }
        : {}),
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Server error", message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

