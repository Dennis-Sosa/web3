import { NextResponse } from "next/server";
import { z } from "zod";
import { retrieveChunks } from "@/lib/rag/index";
import { streamWithRag } from "@/lib/llm/askWithRag";

export const runtime = "nodejs";

const ReqSchema = z.object({
  question: z.string().min(1).max(500),
  demoPass: z.string().min(1).max(200).optional(),
});

type RateLimitState = Map<string, number[]>;

declare global {
  // eslint-disable-next-line no-var
  var __web3_demo_rate_limit_state: RateLimitState | undefined;
}

function getRateLimitState(): RateLimitState {
  if (!globalThis.__web3_demo_rate_limit_state) {
    globalThis.__web3_demo_rate_limit_state = new Map();
  }
  return globalThis.__web3_demo_rate_limit_state;
}

function getClientIp(req: Request): string {
  const h = req.headers;
  const xff =
    h.get("x-forwarded-for") ||
    h.get("x-vercel-forwarded-for") ||
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

function readBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = authorization.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function checkRateLimit(ip: string) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? "60000");
  const max = Number(process.env.RATE_LIMIT_MAX ?? "20");

  const effectiveWindowMs = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000;
  const effectiveMax = Number.isFinite(max) && max > 0 ? max : 20;

  const now = Date.now();
  const cutoff = now - effectiveWindowMs;

  const state = getRateLimitState();
  const hits = state.get(ip) ?? [];
  const kept = hits.filter((t) => t > cutoff);

  if (kept.length === 0) state.delete(ip);

  if (kept.length >= effectiveMax) {
    const oldest = kept[0] ?? now;
    const retryAfterMs = Math.max(0, oldest + effectiveWindowMs - now);
    state.set(ip, kept);
    return {
      ok: false as const,
      retryAfterMs,
      limit: effectiveMax,
      windowMs: effectiveWindowMs,
      remaining: 0,
    };
  }

  kept.push(now);
  state.set(ip, kept);
  return {
    ok: true as const,
    limit: effectiveMax,
    windowMs: effectiveWindowMs,
    remaining: Math.max(0, effectiveMax - kept.length),
  };
}

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

    const requiredPass = process.env.DEMO_PASS?.trim();
    if (requiredPass) {
      const provided =
        req.headers.get("x-demo-pass")?.trim() ||
        readBearerToken(req.headers.get("authorization")) ||
        parsed.data.demoPass?.trim() ||
        "";
      if (!provided || provided !== requiredPass) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Missing or invalid demo pass. Provide it via header `x-demo-pass` or JSON body field `demoPass`.",
          },
          { status: 401 },
        );
      }
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: "Rate limited",
          message: `Too many requests. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
          retryAfterMs: rl.retryAfterMs,
          limit: rl.limit,
          windowMs: rl.windowMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Window": String(rl.windowMs),
          },
        },
      );
    }

    const question = parsed.data.question.trim();
    const retrieved = await retrieveChunks(question, 6);

    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    void (async () => {
      try {
        for await (const event of streamWithRag(question, retrieved, { debug })) {
          await writer.write(encoder.encode("data: " + JSON.stringify(event) + "\n\n"));
        }
      } catch (e) {
        await writer.write(
          encoder.encode(
            "data: " + JSON.stringify({ type: "error", message: e instanceof Error ? e.message : String(e) }) + "\n\n",
          ),
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Window": String(rl.windowMs),
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Server error", message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
