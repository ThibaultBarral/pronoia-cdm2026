import type { Metadata } from "next";
import LegalLayout from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Copafever",
  description: "Comment Copafever collecte et traite vos données personnelles (RGPD).",
};

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-[var(--accent)] mt-8 mb-2">{children}</h2>;
}

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="5 juin 2026">
      <p className="rounded-lg border border-[var(--border)] bg-[#141414] px-3.5 py-2.5 text-xs text-[var(--text-muted)]">
        Document à valeur indicative à faire relire/compléter par un professionnel. Les mentions
        entre crochets <span className="text-[#c0c0c0]">[…]</span> sont à renseigner.
      </p>

      <H>1. Responsable du traitement</H>
      <p>
        Le responsable du traitement est [Nom de l&apos;éditeur / société], [adresse]. Pour toute
        question relative à vos données :{" "}
        <a href="mailto:[email de contact]" className="text-[var(--accent)] underline">
          [email de contact]
        </a>
        .
      </p>

      <H>2. Données collectées</H>
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong className="text-[#f0f0f0]">Compte</strong> : adresse e-mail, identifiant, et le cas échéant nom/avatar fournis lors d&apos;une connexion via Google.</li>
        <li><strong className="text-[#f0f0f0]">Abonnement</strong> : offre souscrite, statut, dates de période et identifiant d&apos;adhésion Whop. <strong className="text-[#f0f0f0]">Aucune donnée bancaire</strong> n&apos;est stockée par Copafever.</li>
        <li><strong className="text-[#f0f0f0]">Usage</strong> : nombre d&apos;analyses réalisées, et données saisies dans le suivi de bankroll (paris enregistrés).</li>
        <li><strong className="text-[#f0f0f0]">Techniques</strong> : données de connexion et cookies strictement nécessaires au fonctionnement (session).</li>
      </ul>

      <H>3. Finalités et bases légales</H>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Fournir le Service et gérer votre compte — <em className="not-italic text-[#f0f0f0]">exécution du contrat</em>.</li>
        <li>Gérer les abonnements et paiements — <em className="not-italic text-[#f0f0f0]">exécution du contrat</em>.</li>
        <li>Générer les analyses IA à partir des données de match — <em className="not-italic text-[#f0f0f0]">exécution du contrat</em>.</li>
        <li>Sécurité, prévention des abus et obligations légales — <em className="not-italic text-[#f0f0f0]">intérêt légitime / obligation légale</em>.</li>
      </ul>

      <H>4. Sous-traitants et destinataires</H>
      <p>Vos données sont traitées par des prestataires agissant pour notre compte :</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong className="text-[#f0f0f0]">Supabase</strong> — authentification et base de données.</li>
        <li><strong className="text-[#f0f0f0]">Whop</strong> — paiement et gestion des abonnements.</li>
        <li><strong className="text-[#f0f0f0]">Anthropic</strong> — génération des analyses (modèle d&apos;IA).</li>
        <li><strong className="text-[#f0f0f0]">Fournisseur de données sportives</strong> — résultats, effectifs et cotes (aucune donnée personnelle transmise).</li>
        <li><strong className="text-[#f0f0f0]">Vercel</strong> — hébergement de l&apos;application.</li>
      </ul>
      <p>
        Certains prestataires peuvent être situés hors de l&apos;Union européenne ; les transferts
        sont alors encadrés par des garanties appropriées (clauses contractuelles types).
      </p>

      <H>5. Durée de conservation</H>
      <p>
        Les données de compte sont conservées tant que le compte est actif, puis supprimées ou
        anonymisées dans un délai raisonnable après sa fermeture, sous réserve des obligations légales
        (notamment comptables pour les factures).
      </p>

      <H>6. Vos droits</H>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
        d&apos;effacement, de limitation, d&apos;opposition et de portabilité de vos données. Vous
        pouvez les exercer à l&apos;adresse de contact ci-dessus. Vous avez également le droit
        d&apos;introduire une réclamation auprès de la CNIL (www.cnil.fr).
      </p>

      <H>7. Cookies</H>
      <p>
        Copafever utilise uniquement des cookies strictement nécessaires au fonctionnement
        (maintien de la session de connexion). Aucun cookie publicitaire n&apos;est déposé.
      </p>

      <H>8. Modifications</H>
      <p>
        La présente politique peut être mise à jour. En cas de modification substantielle, vous en
        serez informé via le Service.
      </p>
    </LegalLayout>
  );
}
