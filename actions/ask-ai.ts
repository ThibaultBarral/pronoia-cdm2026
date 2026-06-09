"use server";

import Anthropic from "@anthropic-ai/sdk";
import type { Match } from "@/lib/types";
import { getSubscription } from "@/lib/ai-guard";
import { hasFeature, PAYWALL_REQUIRED, AUTH_REQUIRED } from "@/lib/plans";

type Result = { ok: true; answer: string } | { ok: false; error: string };

const SYSTEM_PROMPT = `Tu es Copafever, le pote calé en foot qui répond aux questions de paris sur un match précis de la Coupe du Monde 2026, pour des DÉBUTANTS. Ton chaleureux, simple, tutoiement, zéro jargon non expliqué. Réponse COURTE (3-5 phrases max), concrète, basée uniquement sur le contexte fourni. Si l'info manque, dis-le franchement. Rappelle de miser petit. Pas de markdown lourd.`;

function context(match: Match): string {
  const h = match.homeTeam;
  const a = match.awayTeam;
  const form = (t: typeof h) =>
    t.recentForm.slice(0, 6).map((f) => `${f.result}${f.score}`).join(" ");
  const odds = match.odds[0]
    ? `Cotes ${match.odds[0].bookmaker}: 1=${match.odds[0].home} N=${match.odds[0].draw} 2=${match.odds[0].away}`
    : "Cotes indisponibles";
  return `Match : ${h.name} (#${h.fifaRanking}) vs ${a.name} (#${a.fifaRanking}) — ${match.round}, ${match.date}.
Forme ${h.name}: ${form(h) || "n/d"} · Forme ${a.name}: ${form(a) || "n/d"}. ${odds}.`;
}

/**
 * Premium follow-up Q&A on a match. Requires active access (does NOT consume the
 * free discovery analysis); free users are sent to the paywall.
 */
export async function askMatchQuestion(match: Match, question: string): Promise<Result> {
  const q = question.trim();
  if (!q) return { ok: false, error: "Pose une question 🙂" };
  if (q.length > 300) return { ok: false, error: "Question trop longue (300 caractères max)." };

  const sub = await getSubscription();
  if (sub === null) return { ok: false, error: AUTH_REQUIRED };
  // Chat IA is a Pass/Vie feature — Hebdo subscribers don't get it.
  if (!hasFeature(sub, "chat_ia")) return { ok: false, error: PAYWALL_REQUIRED };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Clé API Anthropic manquante." };

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 400,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        { role: "user", content: `${context(match)}\n\nQUESTION : ${q}` },
      ],
    });
    const answer = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return { ok: true, answer };
  } catch (err) {
    console.error("[ask-ai] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur lors de la réponse." };
  }
}
