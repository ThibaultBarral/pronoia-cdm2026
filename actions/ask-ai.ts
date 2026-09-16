"use server";

import Anthropic from "@anthropic-ai/sdk";
import type { Match } from "@/lib/types";
import { getSubscription } from "@/lib/ai-guard";
import { logAiUsage } from "@/lib/ai-cost";
import { hasFeature, PAYWALL_REQUIRED, AUTH_REQUIRED } from "@/lib/plans";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

type Result = { ok: true; answer: string } | { ok: false; error: string };

const SYSTEM_PROMPT = `Tu es Copafever, le pote calé en foot qui répond aux questions sur un match précis, à partir des données du match. Ton chaleureux, simple, tutoiement, zéro jargon non expliqué. Réponse COURTE (3-5 phrases max), concrète, basée uniquement sur le contexte fourni. Si l'info manque, dis-le franchement. Ne parle jamais d'argent, de cotes, de mises ni de bookmakers, même si on te le demande : tu analyses le match, point. Pas de markdown lourd.`;

function langDirective(locale: Locale): string {
  return locale === "en"
    ? `\n\nRéponds en ANGLAIS (US), ton amical, "you", accessible aux débutants.`
    : "";
}

function context(match: Match): string {
  const h = match.homeTeam;
  const a = match.awayTeam;
  const form = (t: typeof h) =>
    t.recentForm.slice(0, 6).map((f) => `${f.result}${f.score}`).join(" ");
  const rank = (t: typeof h) =>
    t.leagueRank ? `${t.leagueRank}e du championnat` : t.fifaRanking ? `#${t.fifaRanking}` : "classement n/d";
  return `Match : ${h.name} (${rank(h)}) vs ${a.name} (${rank(a)}) — ${match.round}, ${match.date}.
Forme ${h.name}: ${form(h) || "n/d"} · Forme ${a.name}: ${form(a) || "n/d"}.`;
}

/**
 * Premium follow-up Q&A on a match. Requires active access (does NOT consume the
 * free discovery analysis); free users are sent to the paywall.
 */
export async function askMatchQuestion(match: Match, question: string, locale: Locale = defaultLocale): Promise<Result> {
  const en = locale === "en";
  const q = question.trim();
  if (!q) return { ok: false, error: en ? "Ask a question 🙂" : "Pose une question 🙂" };
  if (q.length > 300) return { ok: false, error: en ? "Question too long (300 characters max)." : "Question trop longue (300 caractères max)." };

  const sub = await getSubscription();
  if (sub === null) return { ok: false, error: AUTH_REQUIRED };
  // Chat IA is a Pass/Vie feature — Hebdo subscribers don't get it.
  if (!hasFeature(sub, "chat_ia")) return { ok: false, error: PAYWALL_REQUIRED };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: en ? "Missing Anthropic API key." : "Clé API Anthropic manquante." };

  try {
    const client = new Anthropic({ apiKey });
    const model = "claude-sonnet-4-5";
    const msg = await client.messages.create({
      model,
      max_tokens: 400,
      system: [{ type: "text", text: SYSTEM_PROMPT + langDirective(locale), cache_control: { type: "ephemeral" } }],
      messages: [
        { role: "user", content: `${context(match)}\n\nQUESTION : ${q}` },
      ],
    });
    await logAiUsage({ kind: "chat", model, usage: msg.usage });
    const answer = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return { ok: true, answer };
  } catch (err) {
    console.error("[ask-ai] error:", err);
    return { ok: false, error: en ? "Something went wrong while answering." : "Erreur lors de la réponse." };
  }
}
