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
    <LegalLayout title="Conditions Générales d'Utilisation" updated="18 septembre 2026">
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
        de football des grands championnats européens : statistiques, forme des équipes, effectifs,
        confrontations et probabilités. Ces contenus sont fournis à titre
        <strong className="text-[#f0f0f0]"> informatif et de divertissement uniquement</strong> et ne
        constituent ni un conseil financier, ni une garantie de résultat.
      </p>

      <H>3. Accès et compte</H>
      <p>
        L&apos;accès nécessite la création d&apos;un compte via une adresse e-mail (authentification
        gérée par Supabase). L&apos;utilisateur est responsable de la confidentialité de ses
        identifiants et de toute activité réalisée depuis son compte. Pour créer un compte et
        souscrire une offre, l&apos;utilisateur doit avoir la capacité juridique de contracter, ou
        disposer de l&apos;autorisation de son représentant légal. L&apos;inscription donne accès
        à un aperçu gratuit de chaque match (verdict du modèle&nbsp;: probabilités, buts attendus) ;
        l&apos;analyse IA complète requiert une offre payante.
      </p>

      <H>4. Offres et paiement</H>
      <p>L&apos;accès aux analyses IA complètes requiert une offre payante :</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong className="text-[#f0f0f0]">Semaine</strong> : 9,99 € pour 7 jours, abonnement reconductible.</li>
        <li><strong className="text-[#f0f0f0]">Mois</strong> : 19,99 € pour 30 jours, abonnement reconductible.</li>
        <li><strong className="text-[#f0f0f0]">Saison</strong> : 169 € pour 12 mois, abonnement reconductible.</li>
      </ul>
      <p>
        Les trois formules donnent le même accès : analyses de match illimitées, chat IA, historique,
        sur l&apos;ensemble des compétitions couvertes (saison 2026/27). Seule la durée de facturation change.
      </p>
      <p>
        Les paiements sont opérés par notre prestataire <strong className="text-[#f0f0f0]">Whop</strong>,
        qui collecte et traite les données de paiement ; Copafever ne stocke aucune donnée bancaire.
        Les prix sont indiqués toutes taxes comprises. Les abonnements sont reconduits
        automatiquement à échéance jusqu&apos;à résiliation. Les offres souscrites avant le
        11 septembre 2026 (Mini, Pro, Accès à vie) restent honorées aux conditions de l&apos;époque.
      </p>

      <H>5. Résiliation et rétractation</H>
      <p>
        L&apos;utilisateur peut résilier un abonnement à tout moment depuis l&apos;espace de gestion
        Whop ; l&apos;accès reste actif jusqu&apos;à la fin de la période en cours. Conformément à
        l&apos;article L.221-28 du Code de la consommation, le contenu numérique étant fourni
        immédiatement, l&apos;utilisateur reconnaît renoncer à son droit de rétractation dès le début
        d&apos;exécution du service.
      </p>

      <H>6. Usage des analyses</H>
      <p>
        Les analyses expriment des probabilités, jamais des certitudes. Elles ne constituent ni un
        conseil financier, ni une incitation à une quelconque dépense, et l&apos;utilisateur reste
        seul responsable de l&apos;usage qu&apos;il en fait.
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
        données pouvant être incomplètes, Copafever ne saurait être tenu responsable des décisions
        prises par l&apos;utilisateur sur la base de ces analyses, ni de leurs conséquences.
        L&apos;éditeur ne garantit pas la disponibilité
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
