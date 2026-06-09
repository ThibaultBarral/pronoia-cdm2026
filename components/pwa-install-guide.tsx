"use client";

import { useState, useEffect } from "react";
import { X, Share, MoreVertical, Plus, Smartphone, ArrowDown } from "lucide-react";

type Platform = "ios" | "android" | null;

const STORAGE_KEY = "pronoia_pwa_dismissed";

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-[var(--accent)]">{n}</span>
      </div>
      <p className="text-sm text-[#c0c0c0] leading-snug flex-1">{children}</p>
    </div>
  );
}

function IOSGuide() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#111] border border-[#1a1a1a] p-3 flex items-center gap-2 text-xs text-[#ffd700]">
        ⚠️ Cette fonctionnalité nécessite <span className="font-bold">Safari</span> sur iOS
      </div>
      <div className="space-y-3.5">
        <Step n={1}>
          Ouvre cette page dans <span className="font-semibold text-[#f0f0f0]">Safari</span> (pas Chrome ni Firefox)
        </Step>
        <Step n={2}>
          Appuie sur le bouton{" "}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#111] border border-[#1a1a1a] text-[#f0f0f0] text-xs font-medium">
            <Share size={11} /> Partager
          </span>{" "}
          en bas de l&apos;écran
        </Step>
        <Step n={3}>
          Fais défiler vers le bas et appuie sur{" "}
          <span className="font-semibold text-[#f0f0f0]">&quot;Sur l&apos;écran d&apos;accueil&quot;</span>
        </Step>
        <Step n={4}>
          Appuie sur{" "}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#111] border border-[#1a1a1a] text-[#f0f0f0] text-xs font-medium">
            <Plus size={11} /> Ajouter
          </span>{" "}
          en haut à droite — c&apos;est installé !
        </Step>
      </div>
      <div className="flex justify-center pt-1">
        <ArrowDown size={14} className="text-[var(--accent)] animate-bounce" />
      </div>
      <div className="rounded-xl bg-[#0d1a20] border border-[#1a3040] p-3 text-xs text-[#5a9ab8] text-center leading-relaxed">
        L&apos;app apparaîtra sur ton écran d&apos;accueil comme une vraie app — sans barre du navigateur, en plein écran.
      </div>
    </div>
  );
}

function AndroidGuide() {
  return (
    <div className="space-y-4">
      <div className="space-y-3.5">
        <Step n={1}>
          Appuie sur le menu{" "}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#111] border border-[#1a1a1a] text-[#f0f0f0] text-xs font-medium">
            <MoreVertical size={11} /> ⋮
          </span>{" "}
          en haut à droite de Chrome
        </Step>
        <Step n={2}>
          Appuie sur{" "}
          <span className="font-semibold text-[#f0f0f0]">&quot;Ajouter à l&apos;écran d&apos;accueil&quot;</span>
        </Step>
        <Step n={3}>
          Confirme en appuyant sur <span className="font-semibold text-[#f0f0f0]">&quot;Installer&quot;</span> ou{" "}
          <span className="font-semibold text-[#f0f0f0]">&quot;Ajouter&quot;</span>
        </Step>
      </div>
      <div className="rounded-xl bg-[#0d1a20] border border-[#1a3040] p-3 text-xs text-[#5a9ab8] text-center leading-relaxed">
        Une bannière &quot;Installer Copafever&quot; peut aussi apparaître automatiquement en bas de l&apos;écran.
      </div>
    </div>
  );
}

export default function PWAInstallGuide() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !(window as { MSStream?: unknown }).MSStream) {
      setPlatform("ios");
      setOpen(true);
    } else if (/Android/.test(ua)) {
      setPlatform("android");
      setOpen(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm p-4 md:hidden">
      <div className="w-full max-w-sm bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#141414]">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <Smartphone size={16} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#f0f0f0] text-sm">Installer Copafever</p>
            <p className="text-[10px] text-[#555]">Ajoute l&apos;app sur ton écran d&apos;accueil</p>
          </div>
          <button onClick={dismiss} className="text-[#444] hover:text-[#888] transition-colors p-1">
            <X size={17} />
          </button>
        </div>

        {/* Tab switcher (if needed) */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-1 bg-[#111] rounded-xl p-1 border border-[#1a1a1a]">
            {(["ios", "android"] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  platform === p
                    ? "bg-[#0d0d0d] text-[#f0f0f0] border border-[#2a2a2a]"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                {p === "ios" ? "🍎 iOS" : "🤖 Android"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-3">
          {platform === "ios" ? <IOSGuide /> : <AndroidGuide />}

          <button
            onClick={dismiss}
            className="w-full mt-4 py-3 rounded-xl bg-[var(--accent)] text-[#0a0a0a] font-bold text-sm hover:bg-[var(--accent-strong)] transition-all"
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
