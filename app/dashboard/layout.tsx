import type { Metadata } from "next";
import PWARegister from "@/components/pwa-register";
import BottomNav from "@/components/dashboard/bottom-nav";
import PWAInstallGuide from "@/components/pwa-install-guide";

export const metadata: Metadata = {
  title: "Dashboard — Copafever CDM 2026",
  description: "Analysez les 72 matchs de groupe de la CDM 2026 avec l'IA",
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
    </div>
  );
}
