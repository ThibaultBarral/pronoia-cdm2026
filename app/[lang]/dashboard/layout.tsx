import type { Metadata } from "next";
import MobileNav from "@/components/dashboard/mobile-nav";
import AcquisitionSurvey from "@/components/acquisition-survey";
import WinbackPopup from "@/components/winback-popup";
import SocialProofGate from "@/components/social-proof/social-proof-gate";

export const metadata: Metadata = {
  title: "Dashboard — Copafever CDM 2026",
  description: "Analysez chaque match de la CDM 2026 avec l'IA — phase de groupes et phases finales.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      {/* Mobile: pinned top bar + burger drawer. Desktop keeps <AppSidebar>. */}
      <MobileNav />
      <div className="flex flex-1 min-w-0">
        {children}
      </div>
      <AcquisitionSurvey />
      <WinbackPopup />
      <SocialProofGate />
    </div>
  );
}
