"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireAnalysisAccess } from "@/lib/ai-guard";
import { validateImages } from "@/lib/validate-images";

export interface ParsedBet {
  bookmaker: string;
  sport: string;
  betType: string;
  match: string;
  odds: number;
  stake: number;
  result: "won" | "lost" | "pending" | "void";
  profit: number;
  date: string;
  note?: string;
  isFreebet?: boolean;
}

const PROMPT = `Analyse ce ticket de pari sportif. Réponds UNIQUEMENT avec un objet JSON valide — pas de markdown, pas de texte autour.

Format exact:
{
  "bookmaker": "nom du site (Betclic / Winamax / Unibet / PMU / Bwin / Bet365 / Parions Sport / Autre)",
  "sport": "Football | Tennis | Basketball | Rugby | Handball | Hockey | Baseball | MMA | Boxe | Autre",
  "betType": "Simple | Combiné (N) | Système | Autre",
  "match": "description courte — pour un simple: 'Équipe A vs Équipe B - Pari', pour un combiné: 'Équipe1 + Équipe2 + ...'",
  "odds": cote_totale_en_nombre,
  "stake": mise_en_nombre_sans_symbole,
  "result": "won | lost | pending | void",
  "profit": gain_net_en_nombre,
  "date": "YYYY-MM-DD",
  "note": "optionnel — pour combiné: détail de chaque sélection"
}

Règles:
- profit = gains_totaux - mise (ex: gains 11.05€ - mise 5€ = 6.05). Si perdu: -mise. Si en attente: 0
- Pour un combiné utilise la cote totale
- Si date absente: ${new Date().toISOString().split("T")[0]}
- Si résultat non visible: "pending"`;

export async function analyzeBetImages(
  images: Array<{ base64: string; mediaType: string }>
): Promise<{ ok: true; bets: ParsedBet[] } | { ok: false; error: string }> {
  // ── Auth + rate limit ─────────────────────────────────────────────
  const guard = await requireAnalysisAccess();
  if ("error" in guard) return { ok: false, error: guard.error };

  // ── Input validation ──────────────────────────────────────────────
  const validationError = validateImages(images);
  if (validationError) return { ok: false, error: validationError };

  // ── API Key check ─────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Clé API Anthropic manquante." };

  const client = new Anthropic({ apiKey });

  const results = await Promise.allSettled(
    images.map(async (img) => {
      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: img.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                  data: img.base64,
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      });

      const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
      return JSON.parse(cleaned) as ParsedBet;
    })
  );

  const bets: ParsedBet[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") bets.push(r.value);
  }

  if (bets.length === 0) return { ok: false, error: "Aucun pari détecté dans les images." };
  return { ok: true, bets };
}
