import type { Metadata } from "next";
import LegalLayout from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Copafever",
  description: "Conditions générales d'utilisation et de vente du service Copafever.",
};

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-[var(--accent)] mt-8 mb-2">{children}</h2>;
}

export default function CGUPage() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation" updated="5 juin 2026">
      <p className="rounded-lg border border-[var(--border)] bg-[#141414] px-3.5 py-2.5 text-xs text-[var(--text-muted)]">
        Document à valeur indicative à faire relire/compléter par un professionnel. Les mentions
        entre crochets <span className="text-[#c0c0c0]">[…]</span> sont à renseigner.
      </p>

      <H>1. Éditeur du service</H>
      <p>
        Copafever (ci-après « le Service ») est édité par [Nom de l&apos;éditeur / société],
        [forme juridique et capital le cas échéant], dont le siège est situé [adresse], immatriculée
        sous le numéro [SIREN/RCS]. Directeur de la publication : [nom]. Contact :{" "}
        <a href="mailto:copafever@gmail.com" className="text-[var(--accent)] underline">
          copafever@gmail.com
        </a>
        . Hébergement : Vercel Inc. et Supabase.
      </p>

      <H>2. Objet</H>
      <p>
        Copafever fournit des analyses générées par intelligence artificielle relatives aux matchs
        de football, notamment la Coupe du Monde 2026 : statistiques, cotes, formes d&apos;équipes,
        détection de « value bets » et recommandations. Ces contenus sont fournis à titre
        <strong className="text-[#f0f0f0]"> informatif et de divertissement uniquement</strong> et ne
        constituent ni un conseil financier, ni une garantie de résultat.
      </p>

      <H>3. Accès et compte</H>
      <p>
        L&apos;accès nécessite la création d&apos;un compte via une adresse e-mail (authentification
        gérée par Supabase). L&apos;utilisateur est responsable de la confidentialité de ses
        identifiants et de toute activité réalisée depuis son compte. L&apos;inscription est gratuite
        et donne accès à un aperçu de chaque match (verdict du modèle&nbsp;: probabilités, buts attendus).
      </p>

      <H>4. Offres et paiement</H>
      <p>L&apos;accès aux analyses IA complètes requiert une offre payante :</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong className="text-[#f0f0f0]">Hebdomadaire</strong> — 4,99 € / semaine, abonnement reconductible.</li>
        <li><strong className="text-[#f0f0f0]">Mensuel</strong> — 14,99 € / mois, abonnement reconductible, accès à toutes les compétitions (CDM 2026 puis saison de clubs).</li>
        <li><strong className="text-[#f0f0f0]">Accès à vie</strong> — 89 €, paiement unique, sans reconduction.</li>
      </ul>
      <p>
        Les paiements sont opérés par notre prestataire <strong className="text-[#f0f0f0]">Whop</strong>,
        qui collecte et traite les données de paiement ; Copafever ne stocke aucune donnée bancaire.
        Les prix sont indiqués toutes taxes comprises. Seul l&apos;abonnement hebdomadaire est reconduit
        automatiquement à échéance jusqu&apos;à résiliation ; le Pass CDM 2026 et l&apos;Accès à vie sont
        des paiements uniques sans reconduction.
      </p>

      <H>5. Résiliation et rétractation</H>
      <p>
        L&apos;utilisateur peut résilier un abonnement à tout moment depuis l&apos;espace de gestion
        Whop ; l&apos;accès reste actif jusqu&apos;à la fin de la période en cours. Conformément à
        l&apos;article L.221-28 du Code de la consommation, le contenu numérique étant fourni
        immédiatement, l&apos;utilisateur reconnaît renoncer à son droit de rétractation dès le début
        d&apos;exécution du service.
      </p>

      <H>6. Jeu responsable</H>
      <p>
        Les paris sportifs comportent un risque de perte financière et sont strictement réservés aux
        personnes majeures (18 ans et plus). Jouez de manière responsable. En cas de difficulté :
        Joueurs Info Service, 09 74 75 13 13 (appel non surtaxé).
      </p>

      <H>7. Propriété intellectuelle</H>
      <p>
        L&apos;ensemble des éléments du Service (marque, interface, contenus) est protégé. Toute
        reproduction non autorisée est interdite. Les données de matchs proviennent de fournisseurs
        tiers spécialisés.
      </p>

      <H>8. Responsabilité</H>
      <p>
        Le Service est fourni « en l&apos;état ». Les analyses étant produites par une IA à partir de
        données pouvant être incomplètes, Copafever ne saurait être tenu responsable des décisions de
        pari ni des pertes qui en découleraient. L&apos;éditeur ne garantit pas la disponibilité
        ininterrompue du Service.
      </p>

      <H>9. Modification et droit applicable</H>
      <p>
        Les présentes CGU peuvent être modifiées ; la version applicable est celle en vigueur lors de
        l&apos;utilisation. Elles sont soumises au droit français. Tout litige relève, à défaut de
        résolution amiable, des tribunaux compétents.
      </p>
    </LegalLayout>
  );
}
