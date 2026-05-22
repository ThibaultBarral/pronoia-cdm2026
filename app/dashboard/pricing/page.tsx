"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check, X, Zap, Crown, Infinity, Trophy,
  Star, Shield, ChevronRight, Flame,
} from "lucide-react";
import StaticSidebar from "@/components/dashboard/static-sidebar";

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "starter",
    icon: Zap,
    name: "Starter",
    tagline: "Pour commencer à parier intelligemment",
    price: { monthly: 9, yearly: 7 },
    color: "#00ff88",
    badge: null,
    cta: "Débloquer le Starter",
    features: [
      { text: "5 analyses complètes / jour", ok: true },
      { text: "Format data-driven avec value bets", ok: true },
      { text: "Cotes en temps réel (3 bookmakers)", ok: true },
      { text: "Stats qualifications + forme", ok: true },
      { text: "Squads CDM 2026", ok: true },
      { text: "Questions personnalisées à l'IA", ok: false },
      { text: "Historique de tes analyses", ok: false },
    ],
  },
  {
    id: "pro",
    icon: Crown,
    name: "Pro",
    tagline: "Pour les parieurs sérieux",
    price: { monthly: 19, yearly: 15 },
    color: "#00ff88",
    badge: { label: "⚡ Populaire", style: "neon" },
    cta: "Débloquer le Pro",
    features: [
      { text: "Analyses illimitées", ok: true },
      { text: "Format data-driven avec value bets", ok: true },
      { text: "Cotes en temps réel (3 bookmakers)", ok: true },
      { text: "Stats qualifications + forme + H2H", ok: true },
      { text: "Squads CDM 2026 complets", ok: true },
      { text: "Questions personnalisées à l'IA (5/j)", ok: true },
      { text: "Historique de tes analyses", ok: true },
    ],
    highlight: true,
  },
  {
    id: "cdm-pass",
    icon: Trophy,
    name: "CDM Pass",
    tagline: "Accès complet jusqu'à la finale",
    price: { once: 49 },
    color: "#ffd700",
    badge: { label: "🏆 Édition limitée", style: "gold" },
    cta: "Obtenir le CDM Pass",
    saving: "Économise +90€ vs Pro mensuel",
    features: [
      { text: "Analyses illimitées jusqu'au 19 juillet", ok: true },
      { text: "Format data-driven avec value bets", ok: true },
      { text: "Cotes en temps réel (3 bookmakers)", ok: true },
      { text: "Stats qualifications + forme + H2H", ok: true },
      { text: "Squads CDM 2026 complets", ok: true },
      { text: "Questions personnalisées à l'IA illimitées", ok: true },
      { text: "Priorité nouvelles features", ok: true },
    ],
  },
] as const;

const FAQ = [
  {
    q: "Quelle est la différence entre Pro et CDM Pass ?",
    a: "Le Pro est un abonnement mensuel résiliable à tout moment. Le CDM Pass est un paiement unique qui donne accès à toutes les features Pro jusqu'à la finale du 19 juillet 2026.",
  },
  {
    q: "Puis-je changer de plan ?",
    a: "Oui, tu peux upgrader ou résilier à tout moment depuis ton dashboard. Le CDM Pass n'est pas remboursable.",
  },
  {
    q: "Les analyses sont-elles des conseils de paris ?",
    a: "Non. Les analyses sont fournies à titre informatif et éducatif uniquement. Parie de manière responsable.",
  },
];

// ─── Feature row ──────────────────────────────────────────────────────────────

function Feature({ text, ok, color }: { text: string; ok: boolean; color: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          ok ? "" : "bg-[#1a1a1a]"
        }`}
        style={ok ? { background: `${color}18`, border: `1px solid ${color}30` } : {}}
      >
        {ok ? (
          <Check size={10} style={{ color }} />
        ) : (
          <X size={9} className="text-[#333]" />
        )}
      </div>
      <span
        className={`text-sm leading-snug ${
          ok ? "text-[#c0c0c0]" : "text-[#333] line-through decoration-[#2a2a2a]"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] w-full">
      <StaticSidebar />

      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 h-14 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#141414] flex items-center px-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#333]">Dashboard</span>
            <span className="text-[#222]">/</span>
            <span className="text-[#666] font-medium">Pricing</span>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ffd700]/20 bg-[#ffd700]/5 mb-2">
              <Flame size={12} className="text-[#ffd700]" />
              <span className="text-[11px] text-[#ffd700] font-semibold uppercase tracking-wide">
                CDM 2026 · 11 juin — 19 juillet
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#f0f0f0]">
              Choisis ton plan
            </h1>
            <p className="text-[#666] text-base max-w-lg mx-auto">
              Arrête de parier à l&apos;aveugle. Accède à l&apos;analyse IA complète
              de tous les matchs de la CDM 2026.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#111] border border-[#1a1a1a] mt-2">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  billing === "monthly"
                    ? "bg-[#1a1a1a] text-[#f0f0f0]"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billing === "yearly"
                    ? "bg-[#1a1a1a] text-[#f0f0f0]"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                Annuel
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88]">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isHighlight = "highlight" in plan && plan.highlight;
              const price =
                "once" in plan.price
                  ? plan.price.once
                  : billing === "yearly"
                  ? plan.price.yearly
                  : plan.price.monthly;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border flex flex-col overflow-hidden transition-all ${
                    isHighlight
                      ? "border-[#00ff88]/30 bg-gradient-to-b from-[#00ff88]/5 to-[#0a0a0a] shadow-[0_0_40px_rgba(0,255,136,0.08)]"
                      : plan.color === "#ffd700"
                      ? "border-[#ffd700]/20 bg-gradient-to-b from-[#ffd700]/3 to-[#0a0a0a]"
                      : "border-[#1a1a1a] bg-[#0d0d0d]"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2">
                      <div
                        className={`px-3 py-1 text-[10px] font-bold rounded-b-lg border-x border-b ${
                          plan.badge.style === "gold"
                            ? "bg-[#ffd700]/10 border-[#ffd700]/30 text-[#ffd700]"
                            : "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                        }`}
                      >
                        {plan.badge.label}
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1 mt-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}25` }}
                      >
                        <Icon size={16} style={{ color: plan.color }} />
                      </div>
                      <h2 className="text-lg font-black text-[#f0f0f0]">{plan.name}</h2>
                    </div>
                    <p className="text-xs text-[#555] mb-5">{plan.tagline}</p>

                    {/* Price */}
                    <div className="mb-1">
                      <div className="flex items-end gap-1">
                        <span
                          className="text-4xl font-black tabular-nums"
                          style={{ color: plan.color }}
                        >
                          {price}€
                        </span>
                        <span className="text-[#555] text-sm pb-1.5">
                          {"once" in plan.price
                            ? " une seule fois"
                            : billing === "yearly"
                            ? " /mois · facturé annuellement"
                            : " /mois"}
                        </span>
                      </div>
                      {"saving" in plan && plan.saving && (
                        <p className="text-xs font-semibold mt-1" style={{ color: plan.color }}>
                          {plan.saving}
                        </p>
                      )}
                      {billing === "yearly" && !("once" in plan.price) && (
                        <p className="text-xs text-[#555] mt-0.5">
                          {"monthly" in plan.price
                            ? `vs ${plan.price.monthly}€/mois en mensuel`
                            : ""}
                        </p>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px my-4" style={{ background: `${plan.color}12` }} />

                    {/* Features */}
                    <div className="flex-1 space-y-0.5 mb-6">
                      {plan.features.map((f) => (
                        <Feature key={f.text} text={f.text} ok={f.ok} color={plan.color} />
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={
                        isHighlight
                          ? {
                              background: "#00ff88",
                              color: "#0a0a0a",
                              boxShadow: "0 0 20px rgba(0,255,136,0.25)",
                            }
                          : plan.color === "#ffd700"
                          ? {
                              background: "linear-gradient(135deg, #ffd700, #d4a900)",
                              color: "#0a0a0a",
                              boxShadow: "0 0 20px rgba(255,215,0,0.2)",
                            }
                          : {
                              background: "#111",
                              color: "#00ff88",
                              border: "1px solid rgba(0,255,136,0.2)",
                            }
                      }
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature comparison — full width */}
          <div className="rounded-2xl border border-[#141414] bg-[#0d0d0d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#141414]">
              <h3 className="font-bold text-[#f0f0f0] text-sm">Comparaison complète</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#141414]">
                    <th className="text-left px-6 py-3 text-[#444] text-xs font-medium w-1/2">Feature</th>
                    <th className="px-4 py-3 text-[#555] text-xs font-medium text-center">Free</th>
                    <th className="px-4 py-3 text-[#00ff88] text-xs font-medium text-center">Starter</th>
                    <th className="px-4 py-3 text-[#00ff88] text-xs font-bold text-center bg-[#00ff88]/3">Pro ⚡</th>
                    <th className="px-4 py-3 text-[#ffd700] text-xs font-medium text-center">CDM Pass</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Analyses / jour", "2", "5", "∞", "∞"],
                    ["Format data-driven", "✗", "✓", "✓", "✓"],
                    ["Cotes en temps réel", "✗", "✓", "✓", "✓"],
                    ["Squads CDM 2026", "✓", "✓", "✓", "✓"],
                    ["Stats H2H", "✗", "✗", "✓", "✓"],
                    ["Questions IA", "✗", "✗", "5/j", "∞"],
                    ["Historique analyses", "✗", "✗", "✓", "✓"],
                    ["Support prioritaire", "✗", "✗", "✗", "✓"],
                  ].map(([feature, free, starter, pro, cdmPass]) => (
                    <tr key={feature} className="border-b border-[#0f0f0f] last:border-0 hover:bg-[#111]/50 transition-colors">
                      <td className="px-6 py-3 text-[#888] text-xs">{feature}</td>
                      {[
                        { val: free, color: "#555" },
                        { val: starter, color: "#00ff88" },
                        { val: pro, color: "#00ff88", highlight: true },
                        { val: cdmPass, color: "#ffd700" },
                      ].map(({ val, color, highlight }, i) => (
                        <td
                          key={i}
                          className={`px-4 py-3 text-center text-xs font-medium ${highlight ? "bg-[#00ff88]/3" : ""}`}
                        >
                          {val === "✓" ? (
                            <Check size={13} className="mx-auto" style={{ color }} />
                          ) : val === "✗" ? (
                            <X size={11} className="mx-auto text-[#2a2a2a]" />
                          ) : (
                            <span style={{ color }}>{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#f0f0f0] text-sm text-center mb-5">Questions fréquentes</h3>
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-[#141414] bg-[#0d0d0d] p-4">
                <p className="text-sm font-semibold text-[#c0c0c0] mb-1">{q}</p>
                <p className="text-xs text-[#555] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>

          {/* Footer disclaimer */}
          <div className="text-center pb-6 space-y-2">
            <p className="text-xs text-[#444]">
              Tu peux résilier ton abonnement à tout moment. Toutes les analyses sont fournies
              à titre informatif uniquement — parie de manière responsable.
            </p>
            <p className="text-xs text-[#333]">
              Une question ?{" "}
              <a href="mailto:contact@pronoia.app" className="text-[#00ff88] hover:underline">
                contact@pronoia.app
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
