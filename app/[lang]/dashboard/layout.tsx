import type { Metadata } from "next";
import PWARegister from "@/components/pwa-register";
import BottomNav from "@/components/dashboard/bottom-nav";
import PWAInstallGuide from "@/components/pwa-install-guide";
import AcquisitionSurvey from "@/components/acquisition-survey";
import WinbackPopup from "@/components/winback-popup";
import NoSubSurvey from "@/components/no-sub-survey";
import SocialProofGate from "@/components/social-proof/social-proof-gate";

export const metadata: Metadata = {
  title: "Dashboard — Copafever CDM 2026",
  description: "Analysez chaque match de la CDM 2026 avec l'IA — phase de groupes et phases finales.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <PWARegister />
      {/* Padding-bottom on mobile to clear the bottom nav + home indicator */}
      <div className="flex flex-1 min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
      <BottomNav />
      <PWAInstallGuide />
      <AcquisitionSurvey />
      <WinbackPopup />
      <NoSubSurvey />
      <SocialProofGate />
    </div>
  );
}
