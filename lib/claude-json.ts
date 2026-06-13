import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { logAiUsage, type AiKind } from "@/lib/ai-cost";

/**
 * Call Claude and parse a JSON object from the response.
 *
 * The system prompt is sent with an ephemeral cache_control block (reused across
 * calls of the same kind → ~90% savings on system tokens). Non-streaming: we
 * want the full object to validate/cache/persist before rendering.
 *
 * This runs on a cache MISS only (callers wrap it in getCachedOrFetch), so the
 * token usage we log here is the true money cost of a real generation.
 */
export async function callClaudeJson<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
  kind?: AiKind;
  userId?: string | null;
}): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Clé API Anthropic manquante.");

  const client = new Anthropic({ apiKey });
  const model = opts.model ?? "claude-sonnet-4-5";

  const msg = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 1500,
    system: [
      { type: "text", text: opts.system, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: opts.user }],
  });

  // Record token usage + computed cost (best-effort, never throws).
  if (opts.kind) {
    await logAiUsage({ kind: opts.kind, model, usage: msg.usage, userId: opts.userId });
  }

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return parseJson<T>(text);
}

/** Extract and parse a JSON object from a model response (tolerant of fences). */
export function parseJson<T>(raw: string): T {
  let s = raw.trim();
  // Strip ```json … ``` fences if present.
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // Fall back to the outermost { … } if the model added prose around it.
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end > start) s = s.slice(start, end + 1);
  }
  return JSON.parse(s) as T;
}
