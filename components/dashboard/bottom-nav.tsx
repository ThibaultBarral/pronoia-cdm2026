"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, TrendingUp } from "lucide-react";

const TABS = [
  { href: "/dashboard", icon: Grid2X2, label: "Matchs" },
  { href: "/dashboard/bankroll", icon: TrendingUp, label: "Bankroll" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#141414]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors ${
                active ? "text-[#00ff88]" : "text-[#444]"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-semibold tracking-wide uppercase">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
