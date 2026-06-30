import "server-only";
import { getMatches } from "@/lib/data-service";

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface UpcomingMatch {
  home: string;
  away: string;
  flagHome: string;
  flagAway: string;
  label: string; // ex: "Auj. 21h · 8e de finale"
}

export interface CampaignContext {
  firstName: string;
  url: string; // cible du CTA (page /tarifs)
  unsubUrl: string; // lien de désinscription (RGPD)
  matches: UpcomingMatch[]; // vrais matchs CDM à venir
}

export interface Campaign {
  key: string;
  label: string; // libellé admin
  description: string; // quand l'envoyer
  /** A/B : 2 objets testés (50/50). */
  subjects: [string, string];
  /** Corps HTML (inner), enveloppé par shell(). */
  build: (ctx: CampaignContext) => string;
}

/* ── Données dynamiques : prochains matchs réels ───────────────────────────── */

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Les N prochains matchs CDM non commencés, triés par date/heure. */
export async function getUpcomingMatches(n = 3): Promise<UpcomingMatch[]> {
  try {
    const all = await getMatches();
    const now = Date.now();
    const upcoming = all
      .filter((m) => (!m.status || m.status === "NS"))
      .map((m) => ({ m, ts: new Date(`${m.date}T${m.time || "12:00"}:00Z`).getTime() }))
      .filter(({ ts }) => Number.isFinite(ts) && ts > now - 2 * 3600_000) // garde aussi ceux qui démarrent dans l'heure
      .sort((a, b) => a.ts - b.ts)
      .slice(0, n);

    return upcoming.map(({ m, ts }) => {
      const d = new Date(ts);
      const today = new Date().toISOString().slice(0, 10) === m.date;
      const when = today
        ? `Auj. ${m.time || ""}`.trim()
        : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${m.time || ""}`.trim();
      const round = m.round && m.round !== "—" ? ` · ${m.round}` : m.group && m.group !== "—" ? ` · Groupe ${m.group}` : "";
      return {
        home: m.homeTeam.name,
        away: m.awayTeam.name,
        flagHome: m.homeTeam.flag || "",
        flagAway: m.awayTeam.flag || "",
        label: `${when}${round}`,
      };
    });
  } catch {
    return [];
  }
}

/* ── Gabarit HTML partagé ──────────────────────────────────────────────────── */

function matchList(matches: UpcomingMatch[]): string {
  if (matches.length === 0) return "";
  const items = matches
    .map(
      (m) => `
      <tr>
        <td style="padding:10px 14px;border:1px solid #1f1f1f;border-radius:10px;background:#161616;">
          <span style="font-size:15px;font-weight:700;color:#f0f0f0;">${m.flagHome} ${m.home} <span style="color:#666;">vs</span> ${m.away} ${m.flagAway}</span><br/>
          <span style="font-size:12px;color:#8a8a8a;">${m.label}</span>
        </td>
      </tr>
      <tr><td style="height:8px;line-height:8px;">&nbsp;</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">${items}</table>`;
}

function cta(url: string, text: string): string {
  return `<a href="${url}" style="display:inline-block;background:#34d399;color:#000;font-weight:700;text-decoration:none;padding:14px 26px;border-radius:10px;font-size:15px;">${text}</a>`;
}

/** Enveloppe commune : header + corps + footer avec désinscription (RGPD). */
export function shell(inner: string, ctx: CampaignContext): string {
  return `
  <div style="background:#0a0a0a;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:16px;padding:32px;color:#e8e8e8;">
      <div style="font-size:20px;font-weight:800;color:#34d399;margin-bottom:22px;">Copafever ⚽</div>
      ${inner}
      <div style="border-top:1px solid #1f1f1f;margin-top:28px;padding-top:16px;">
        <p style="font-size:11px;line-height:1.6;color:#666;margin:0;">
          Tu reçois cet e-mail car tu as un compte Copafever.
          <a href="${ctx.unsubUrl}" style="color:#888;text-decoration:underline;">Se désinscrire</a>.
        </p>
      </div>
    </div>
  </div>`;
}

const hi = (ctx: CampaignContext) => (ctx.firstName ? `Salut ${ctx.firstName},` : "Salut,");
const P = (html: string) => `<p style="font-size:15px;line-height:1.65;margin:0 0 14px;">${html}</p>`;

/* ── Campagnes ─────────────────────────────────────────────────────────────── */

export const CAMPAIGNS: Campaign[] = [
  {
    key: "conversion",
    label: "Conversion — non-abonnés",
    description: "Le mail de base pour transformer les comptes gratuits. À envoyer en premier.",
    subjects: [
      "Ton 1er match est offert (mais pas longtemps) ⚽",
      "{firstName}, l'IA a analysé le prochain match pour toi",
    ],
    build: (ctx) =>
      shell(
        `${P(hi(ctx))}
         ${P(`Tu t'es inscrit sur Copafever mais tu n'as pas encore lancé d'analyse complète. Tu rates le meilleur 👀`)}
         ${P(`Pour chaque match de la Coupe du monde, notre IA te sort une lecture <strong>claire, sans jargon</strong> : qui est favori et <em>pourquoi</em>, la forme réelle des équipes, les pièges à éviter. Pensé pour comprendre, pas pour faire semblant.`)}
         ${ctx.matches.length ? P(`Les prochains matchs à ne pas rater :`) + matchList(ctx.matches) : ""}
         ${P(`<strong>Ton premier match est gratuit.</strong> Tu testes, tu juges, tu décides.`)}
         <div style="margin:8px 0 4px;">${cta(ctx.url, "Débloquer mon analyse →")}</div>`,
        ctx,
      ),
  },
  {
    key: "match_du_jour",
    label: "Match du jour — tease IA",
    description: "À envoyer un jour de gros match. Injecte le prochain match réel et tease l'analyse.",
    subjects: [
      "Ce que l'IA pense du match de ce soir 🔥",
      "{firstName}, le match de ce soir vaut le coup d'œil",
    ],
    build: (ctx) => {
      const m = ctx.matches[0];
      const head = m ? `${m.flagHome} ${m.home} vs ${m.away} ${m.flagAway}` : "le prochain gros match";
      return shell(
        `${P(hi(ctx))}
         ${P(`Gros match en approche : <strong>${head}</strong>${m ? ` (${m.label})` : ""}.`)}
         ${P(`Notre IA a déjà tout décortiqué : favori, forme, joueurs clés, scénario probable. Les faits sont gratuits — l'analyse complète est juste derrière.`)}
         ${ctx.matches.length > 1 ? P(`Et juste après :`) + matchList(ctx.matches.slice(1)) : ""}
         ${P(`Ne regarde pas le match sans l'avoir lue.`)}
         <div style="margin:8px 0 4px;">${cta(ctx.url, "Lire l'analyse du match →")}</div>`,
        ctx,
      );
    },
  },
  {
    key: "track_record",
    label: "Preuve — track record vérifié",
    description: "Mail de réassurance : on montre les prédictions vérifiées. Bon pour les sceptiques.",
    subjects: [
      "On note nos prédictions. En public.",
      "{firstName}, la preuve que ça marche (track record)",
    ],
    build: (ctx) =>
      shell(
        `${P(hi(ctx))}
         ${P(`La plupart des sites de "pronos" oublient vite leurs ratés. Nous, on garde <strong>tout en public</strong> : chaque prédiction de l'IA est notée, gagnée ou perdue.`)}
         ${P(`Pas de promesse magique, pas de "100% sûr". Juste des données réelles et une lecture honnête de chaque match. C'est ça qui fait la différence sur la durée.`)}
         ${ctx.matches.length ? P(`Prochains matchs analysés :`) + matchList(ctx.matches) : ""}
         <div style="margin:8px 0 4px;">${cta(ctx.url, "Voir et tester →")}</div>`,
        ctx,
      ),
  },
  {
    key: "urgence_prix",
    label: "Urgence — le prix va monter",
    description: "Ancrage prix : prévenir que les tarifs augmentent bientôt. À utiliser avant une hausse.",
    subjects: [
      "Les prix augmentent bientôt ⏳",
      "{firstName}, bloque le tarif actuel avant la hausse",
    ],
    build: (ctx) =>
      shell(
        `${P(hi(ctx))}
         ${P(`Petit message honnête : les tarifs Copafever vont <strong>augmenter bientôt</strong>. Les abonnés actuels gardent leur prix.`)}
         ${P(`Si tu hésitais, c'est le moment de prendre ta place pendant la Coupe du monde — au tarif le plus bas qu'on proposera.`)}
         ${ctx.matches.length ? P(`Il reste de gros matchs à analyser :`) + matchList(ctx.matches) : ""}
         <div style="margin:8px 0 4px;">${cta(ctx.url, "Bloquer le tarif actuel →")}</div>`,
        ctx,
      ),
  },
  {
    key: "knockouts",
    label: "Phase finale — l'enjeu monte",
    description: "Pour la phase à élimination directe : matchs couperets, analyses plus précieuses.",
    subjects: [
      "Phase finale : plus de place à l'erreur 🏆",
      "{firstName}, les matchs couperets commencent",
    ],
    build: (ctx) =>
      shell(
        `${P(hi(ctx))}
         ${P(`On entre dans le money-time de la Coupe du monde : <strong>un match, un perdant rentre à la maison.</strong> C'est exactement là où une bonne lecture fait la différence.`)}
         ${ctx.matches.length ? P(`Les chocs à venir :`) + matchList(ctx.matches) : ""}
         ${P(`Notre IA compare la forme réelle, l'historique et les scénarios pour chaque affiche. Sans jargon, droit au but.`)}
         <div style="margin:8px 0 4px;">${cta(ctx.url, "Analyser la phase finale →")}</div>`,
        ctx,
      ),
  },
];

export function getCampaign(key: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.key === key);
}

/** Remplace {firstName} dans un objet A/B (vide → "toi" évité, on enlève juste le placeholder). */
export function renderSubject(subject: string, firstName: string): string {
  return subject.replace(/\{firstName\}/g, firstName || "").replace(/^,\s*/, "").replace(/\s+,/, ",").trim();
}
