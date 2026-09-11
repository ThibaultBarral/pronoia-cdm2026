import type { Metadata } from "next";
import MobileNav from "@/components/dashboard/mobile-nav";
import AcquisitionSurvey from "@/components/acquisition-survey";
import SocialProofGate from "@/components/social-proof/social-proof-gate";

export const metadata: Metadata = {
  title: "Mon espace | Copafever",
  description: "Choisis une équipe, un match, et lis l'analyse : forme, effectifs, confrontations et probabilités.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      {/* Mobile: pinned top bar + burger drawer. Desktop keeps <AppSidebar>. */}
      <MobileNav />
      <div className="flex flex-1 min-w-0">
        {children}
      </div>
      <AcquisitionSurvey />
      <SocialProofGate />
    </div>
  );
}
