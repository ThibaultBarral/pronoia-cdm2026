/** Onboarding segmentation (Feature 3) — experience level. Each segment derives
 *  a default bettor playstyle so analyses are personalised from day one (and
 *  the middleware's bettor_profile gate releases without changes). Client-safe. */
import type { Playstyle } from "@/lib/bankroll";

export interface Segment {
  id: "beginner" | "regular" | "strategist";
  emoji: string;
  label: string;
  tagline: string;
  bullets: string[];
  /** Default risk style derived from the segment (refinable on the Bankroll page). */
  playstyle: Playstyle;
}

export const SEGMENTS: Segment[] = [
  {
    id: "beginner",
    emoji: "🌱",
    label: "Débutant",
    tagline: "Je découvre les paris",
    bullets: [
      "Tu paries de temps en temps, pour le plaisir",
      "Tu veux qu'on t'explique en clair, sans jargon",
      "Tu cherches des conseils simples et prudents",
    ],
    playstyle: "safe",
  },
  {
    id: "regular",
    emoji: "⚽",
    label: "Régulier",
    tagline: "Je parie chaque week-end",
    bullets: [
      "Tu suis le foot et tu paries régulièrement",
      "Tu veux des value bets et un bon ratio risque/gain",
      "Tu gères déjà un budget de paris",
    ],
    playstyle: "balanced",
  },
  {
    id: "strategist",
    emoji: "🎯",
    label: "Stratège",
    tagline: "Je chasse la valeur",
    bullets: [
      "Tu analyses, tu compares les cotes avant de miser",
      "Tu vises le rendement sur le long terme",
      "Tu veux des paris à forte valeur, même plus osés",
    ],
    playstyle: "opportunist",
  },
];
