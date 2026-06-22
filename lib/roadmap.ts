/**
 * Roadmap config — the timeline shown on /dashboard/roadmap.
 * The roadmap *tells* the story; the Compétitions pages *show* the data, so
 * milestones link into /dashboard/competitions where relevant.
 *
 * Add product-news milestones to PRODUCT_NEWS below (kept separate so they're
 * easy to edit without touching the core timeline).
 */

export type MilestoneTone = "live" | "urgent" | "gold" | "muted";

export interface Milestone {
  id: string;
  /** Short date/era label, e.g. "EN COURS", "19 JUILLET", "AOÛT 2026". */
  when: string;
  /** Optional pill, e.g. "DERNIER JOUR". */
  tag?: string;
  title: string;
  description: string;
  tone: MilestoneTone;
  /** Optional CTA. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Bullet points under the description. */
  points?: string[];
}

export const ROADMAP: Milestone[] = [
  {
    id: "world-cup",
    when: "EN COURS",
    title: "Coupe du Monde 2026",
    description:
      "104 matchs analysés par l'IA, favoris, groupes, bracket interactif et simulateur de parcours. Abonnements Hebdo & Mensuel disponibles. Tout est live.",
    tone: "live",
    ctaLabel: "Voir la Coupe du Monde",
    ctaHref: "/dashboard/coupe-du-monde",
  },
  {
    id: "price-hike",
    when: "19 JUILLET",
    tag: "DERNIER JOUR",
    title: "L'Accès à vie passe à 129 €",
    description:
      "Après la finale, le tarif de lancement de l'Accès à vie disparaît : il passe de 89 € à 129 €. Les abonnements Hebdo & Mensuel, eux, continuent sur toutes les compétitions.",
    tone: "urgent",
    ctaLabel: "Verrouiller 89 €",
    ctaHref: "/dashboard/pricing",
  },
  {
    id: "big-five",
    when: "AOÛT 2026",
    title: "Reprise des 5 grands championnats",
    description:
      "Ligue 1, Premier League, La Liga, Serie A et Bundesliga : analyses IA, value bets et pronostics sur chaque journée.",
    tone: "gold",
    ctaLabel: "Explorer les championnats",
    ctaHref: "/dashboard/competitions",
  },
  {
    id: "european-cups",
    when: "SEPTEMBRE 2026",
    title: "Ligue des Champions & Ligue Europa",
    description:
      "Les soirées européennes rejoignent l'app : phase de ligue, affiches et analyses des clubs qualifiés.",
    tone: "gold",
    ctaLabel: "Voir les compétitions",
    ctaHref: "/dashboard/competitions",
  },
  {
    id: "and-next",
    when: "ET ENSUITE",
    title: "La roadmap s'allonge",
    description:
      "Coupes nationales, compétitions internationales… on enrichit la couverture au fil de la saison.",
    tone: "muted",
  },
];

/**
 * Product-news milestones — edit freely. Rendered after the core timeline.
 * Example:
 *   { id: "chat-v2", when: "À VENIR", title: "Chat IA v2", description: "…", tone: "muted" }
 */
export const PRODUCT_NEWS: Milestone[] = [
  // { id: "...", when: "...", title: "...", description: "...", tone: "muted" },
];
