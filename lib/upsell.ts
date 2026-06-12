/** Locked member-only teasers (Feature 2) — sold via an upsell modal, never
 *  hidden. Client-safe config; icons are mapped in the components. */
export interface LockedTeaser {
  id: "combos" | "chat_ia";
  label: string;
  title: string;
  body: string;
}

export const LOCKED_TEASERS: LockedTeaser[] = [
  {
    id: "combos",
    label: "Combinés IA",
    title: "Les Combinés IA sont réservés aux membres",
    body: "Le combiné IA du jour — 2 à 3 pronos haute confiance avec la cote totale — arrive très bientôt, réservé aux membres. Débloque-le dès 4,99 €/sem, ou 14,99 €/mois en analyses illimitées.",
  },
  {
    id: "chat_ia",
    label: "Chat IA",
    title: "Le Chat IA est réservé aux membres",
    body: "Pose tes questions à l'IA sur n'importe quel match et obtiens une réponse claire en quelques secondes. Inclus dès le Mensuel à 14,99 €/mois en illimité (ou teste à 4,99 €/sem).",
  },
];

export function getTeaser(id: string): LockedTeaser | undefined {
  return LOCKED_TEASERS.find((t) => t.id === id);
}
