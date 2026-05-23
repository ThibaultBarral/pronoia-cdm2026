"use client";

import { useState, useRef, useCallback } from "react";
import {
  X, Upload, Images, Pencil, Plus, Check, ChevronDown,
  Loader2, AlertCircle, CheckSquare, Square,
} from "lucide-react";
import { Bet, BetResult, BOOKMAKERS, SPORTS, calcProfit } from "@/lib/bankroll";
import { analyzeBetImages, ParsedBet } from "@/actions/analyze-bets";

type Tab = "image" | "multi" | "manuel";
type Stage = "upload" | "analyzing" | "preview";

const DEVISES = [
  { label: "Euro (€)", symbol: "€" },
  { label: "Dollar ($)", symbol: "$" },
  { label: "Livre (£)", symbol: "£" },
];
const RESULTS: { value: BetResult; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "won", label: "Gagné" },
  { value: "lost", label: "Perdu" },
  { value: "void", label: "Annulé" },
];

const inputCls =
  "w-full bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-[#c0c0c0] placeholder-[#333] focus:outline-none focus:border-[#00ff88]/30 transition-colors";
const labelCls = "block text-[10px] text-[#555] uppercase tracking-widest mb-2 font-medium";

function SelectField({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-8`}>
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#444]" />
    </div>
  );
}

function parsedToBet(p: ParsedBet): Bet {
  const result = (["won", "lost", "pending", "void"].includes(p.result) ? p.result : "pending") as BetResult;
  const profit = ["won", "lost"].includes(result)
    ? calcProfit(p.stake || 0, p.odds || 1, result)
    : 0;
  return {
    id: `bet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: p.date || new Date().toISOString().split("T")[0],
    match: p.match || "Paris non précisé",
    competition: p.sport || "CDM 2026",
    betType: p.betType || "Simple",
    bookmaker: p.bookmaker || "Autre",
    odds: p.odds || 1,
    stake: p.stake || 0,
    result,
    profit,
    note: p.note,
    sport: p.sport,
    isFreebet: p.isFreebet ?? false,
  };
}

async function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mediaType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const RESULT_COLOR: Record<BetResult, string> = {
  won: "text-[#22c55e]",
  lost: "text-[#ef4444]",
  pending: "text-[#ffd700]",
  void: "text-[#888]",
};
const RESULT_LABEL: Record<BetResult, string> = {
  won: "Gagné", lost: "Perdu", pending: "En attente", void: "Annulé",
};

export interface BetFormProps {
  onAdd: (bet: Bet) => void;
  onAddMultiple?: (bets: Bet[]) => void;
  onClose: () => void;
  currentBankroll: number;
  prefillMatch?: string;
}

export default function BetForm({ onAdd, onAddMultiple, onClose, currentBankroll, prefillMatch }: BetFormProps) {
  const [tab, setTab] = useState<Tab>("image");

  // ── Image tab state ──
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageStage, setImageStage] = useState<Stage>("upload");

  // ── Multi tab state ──
  const [multiFiles, setMultiFiles] = useState<File[]>([]);
  const [multiStage, setMultiStage] = useState<Stage>("upload");
  const [detectedBets, setDetectedBets] = useState<Array<ParsedBet & { selected: boolean }>>([]);

  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const multiRef = useRef<HTMLInputElement>(null);

  // ── Manuel/common form ──
  const [bookmakers, setBookmakers] = useState([...BOOKMAKERS]);
  const [showAddBk, setShowAddBk] = useState(false);
  const [newBk, setNewBk] = useState("");

  const [form, setForm] = useState({
    description: prefillMatch ?? "",
    sport: "",
    date: new Date().toISOString().split("T")[0],
    bookmaker: "",
    devise: "€",
    stake: "10.00",
    odds: "1.85",
    result: "pending" as BetResult,
    isFreebet: false,
  });

  const set = useCallback((k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v })), []);

  const stakeNum = parseFloat(form.stake) || 0;
  const oddsNum = parseFloat(form.odds) || 0;
  const potentialProfit = stakeNum > 0 && oddsNum > 1 ? calcProfit(stakeNum, oddsNum, "won") : null;

  // ── Image analysis ──
  async function handleAnalyzeImage() {
    if (!imageFile) return;
    setImageStage("analyzing");
    setAnalysisError(null);
    try {
      const imgData = await fileToBase64(imageFile);
      const result = await analyzeBetImages([imgData]);
      if (!result.ok) { setAnalysisError(result.error); setImageStage("upload"); return; }
      const p = result.bets[0];
      // Pre-fill the form
      if (p.bookmaker) set("bookmaker", p.bookmaker);
      if (p.sport) set("sport", p.sport);
      if (p.date) set("date", p.date);
      if (p.odds) set("odds", String(p.odds));
      if (p.stake) set("stake", String(p.stake));
      if (p.result) set("result", p.result);
      if (p.match) set("description", p.match);
      setImageStage("preview");
    } catch {
      setAnalysisError("Erreur lors de l'analyse");
      setImageStage("upload");
    }
  }

  // ── Multi analysis ──
  async function handleAnalyzeMulti() {
    if (multiFiles.length === 0) return;
    setMultiStage("analyzing");
    setAnalysisError(null);
    try {
      const imgData = await Promise.all(multiFiles.slice(0, 12).map(fileToBase64));
      const result = await analyzeBetImages(imgData);
      if (!result.ok) { setAnalysisError(result.error); setMultiStage("upload"); return; }
      setDetectedBets(result.bets.map((b) => ({ ...b, selected: true })));
      setMultiStage("preview");
    } catch {
      setAnalysisError("Erreur lors de l'analyse");
      setMultiStage("upload");
    }
  }

  function handleConfirmMulti() {
    const selected = detectedBets.filter((b) => b.selected).map(parsedToBet);
    if (selected.length === 0) return;
    if (onAddMultiple) {
      onAddMultiple(selected);
    } else {
      selected.forEach(onAdd);
    }
  }

  // ── Manuel submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stakeNum || !oddsNum || oddsNum < 1.01 || stakeNum <= 0) return;
    const profit = calcProfit(stakeNum, oddsNum, form.result);
    const bet: Bet = {
      id: `bet_${Date.now()}`,
      date: form.date,
      match: form.description || (imageFile ? imageFile.name.replace(/\.[^.]+$/, "") : "Paris non précisé"),
      competition: form.sport || "CDM 2026",
      betType: form.sport || "Simple",
      bookmaker: form.bookmaker || "Autre",
      odds: oddsNum,
      stake: stakeNum,
      result: form.result,
      profit,
      sport: form.sport || undefined,
      isFreebet: form.isFreebet,
    };
    onAdd(bet);
  }

  function handleAddBookmaker() {
    const name = newBk.trim();
    if (name && !bookmakers.includes(name)) setBookmakers((p) => [...p, name]);
    if (name) set("bookmaker", name);
    setShowAddBk(false);
    setNewBk("");
  }

  const tabs: { key: Tab; icon: React.ElementType; label: string }[] = [
    { key: "image", icon: Upload, label: "Image" },
    { key: "multi", icon: Images, label: "Multi" },
    { key: "manuel", icon: Pencil, label: "Manuel" },
  ];

  // Whether to show the common form fields
  const showCommonFields = tab === "manuel" || (tab === "image" && imageStage === "preview");
  const isImageMode = tab === "image";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#0d0d0d] border border-[#1a1a1a] rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <h2 className="text-base font-bold text-[#f0f0f0]">Nouveau pari</h2>
          <button type="button" onClick={onClose} className="text-[#444] hover:text-[#888] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 shrink-0">
          <div className="flex gap-1 bg-[#111] rounded-xl p-1 border border-[#1a1a1a]">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button key={key} type="button" onClick={() => { setTab(key); setAnalysisError(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  tab === key ? "bg-[#0d0d0d] text-[#f0f0f0] border border-[#2a2a2a] shadow-sm" : "text-[#555] hover:text-[#888]"
                }`}>
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 mt-4">

          {/* ─── IMAGE TAB ─── */}
          {tab === "image" && (
            <>
              {imageStage === "upload" && (
                <>
                  <div className="p-3 rounded-xl bg-[#0d1a20] border border-[#1a3040] text-xs text-[#5a9ab8] leading-relaxed">
                    💡 <span className="font-medium">Astuce :</span> importe le screenshot de ton ticket, l'IA détecte automatiquement le sport, la cote et le résultat.
                  </div>
                  <div
                    className="border-2 border-dashed border-[#1a3a4a] rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:bg-[#0d1520]/60 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { setImageFile(e.target.files?.[0] ?? null); setImageStage("upload"); }} />
                    <Upload size={22} className="text-[#4a8aaa]" />
                    <p className="text-sm font-semibold text-[#4a8aaa]">
                      {imageFile ? imageFile.name : "Uploader une image"}
                    </p>
                    <p className="text-xs text-[#2a5a6a]">Détection automatique IA</p>
                  </div>
                  {imageFile && (
                    <button type="button" onClick={handleAnalyzeImage}
                      className="w-full py-3 rounded-xl bg-[#00ff88] text-[#0a0a0a] font-bold text-sm hover:bg-[#00cc6a] transition-all">
                      Analyser le ticket →
                    </button>
                  )}
                </>
              )}

              {imageStage === "analyzing" && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 size={32} className="text-[#00ff88] animate-spin" />
                  <p className="text-sm text-[#888]">Analyse du ticket en cours…</p>
                </div>
              )}

              {imageStage === "preview" && (
                <div className="p-3 rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20 flex items-center gap-2 text-xs text-[#00ff88]">
                  <Check size={14} />
                  <span>Ticket détecté — vérifie les champs ci-dessous</span>
                  <button type="button" onClick={() => { setImageStage("upload"); setImageFile(null); }}
                    className="ml-auto text-[#555] hover:text-[#888]">
                    <X size={13} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── MULTI TAB ─── */}
          {tab === "multi" && (
            <>
              {multiStage === "upload" && (
                <div
                  className="border-2 border-dashed border-[#2a1a4a] rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:bg-[#110d20]/60 transition-colors"
                  onClick={() => multiRef.current?.click()}
                >
                  <input ref={multiRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { setMultiFiles(Array.from(e.target.files ?? [])); setMultiStage("upload"); }} />
                  <Images size={22} className="text-[#7a5aaa]" />
                  <p className="text-sm font-semibold text-[#7a5aaa]">
                    {multiFiles.length > 0
                      ? `${multiFiles.length} screenshot(s) sélectionné(s)`
                      : "Sélectionner jusqu'à 12 screenshots"}
                  </p>
                  <p className="text-xs text-[#4a3a6a]">L'IA analysera chaque ticket</p>
                </div>
              )}

              {multiStage === "upload" && multiFiles.length > 0 && (
                <>
                  {/* File list */}
                  <div className="space-y-1.5">
                    {multiFiles.slice(0, 12).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#1a1a1a]">
                        <Images size={12} className="text-[#7a5aaa] shrink-0" />
                        <span className="text-xs text-[#888] truncate flex-1">{f.name}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={handleAnalyzeMulti}
                    className="w-full py-3 rounded-xl bg-[#00ff88] text-[#0a0a0a] font-bold text-sm hover:bg-[#00cc6a] transition-all">
                    Analyser {multiFiles.length} ticket{multiFiles.length > 1 ? "s" : ""} →
                  </button>
                </>
              )}

              {multiStage === "analyzing" && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 size={32} className="text-[#00ff88] animate-spin" />
                  <p className="text-sm text-[#888]">
                    Analyse de {multiFiles.length} ticket{multiFiles.length > 1 ? "s" : ""}…
                  </p>
                  <p className="text-xs text-[#444]">Reconnaissance IA en cours…</p>
                </div>
              )}

              {multiStage === "preview" && detectedBets.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#555]">{detectedBets.filter(b => b.selected).length}/{detectedBets.length} paris sélectionnés</p>
                    <button type="button"
                      onClick={() => setDetectedBets(prev => {
                        const allSelected = prev.every(b => b.selected);
                        return prev.map(b => ({ ...b, selected: !allSelected }));
                      })}
                      className="text-xs text-[#444] hover:text-[#888] transition-colors"
                    >
                      {detectedBets.every(b => b.selected) ? "Tout désélectionner" : "Tout sélectionner"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {detectedBets.map((bet, i) => {
                      const result = (bet.result || "pending") as BetResult;
                      return (
                        <div
                          key={i}
                          onClick={() => setDetectedBets(prev => prev.map((b, j) => j === i ? { ...b, selected: !b.selected } : b))}
                          className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                            bet.selected ? "border-[#00ff88]/20 bg-[#00ff88]/5" : "border-[#1a1a1a] bg-[#111] opacity-50"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 shrink-0 text-[#555]">
                              {bet.selected
                                ? <CheckSquare size={15} className="text-[#00ff88]" />
                                : <Square size={15} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-[10px] font-semibold text-[#666] uppercase">{bet.bookmaker}</span>
                                <span className="text-[10px] text-[#444]">·</span>
                                <span className="text-[10px] text-[#666]">{bet.betType}</span>
                                {bet.sport && (
                                  <>
                                    <span className="text-[10px] text-[#444]">·</span>
                                    <span className="text-[10px] text-[#555]">{bet.sport}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs font-medium text-[#c0c0c0] leading-snug">{bet.match}</p>
                              {bet.note && <p className="text-[10px] text-[#444] mt-0.5 leading-snug">{bet.note}</p>}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className={`text-sm font-black tabular-nums ${RESULT_COLOR[result]}`}>
                                {bet.profit > 0 ? "+" : ""}{bet.profit.toFixed(2)}€
                              </p>
                              <p className="text-[10px] text-[#444]">{bet.stake}€ × {bet.odds}</p>
                              <p className={`text-[10px] font-medium mt-0.5 ${RESULT_COLOR[result]}`}>
                                {RESULT_LABEL[result]}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmMulti}
                    disabled={detectedBets.filter(b => b.selected).length === 0}
                    className="w-full py-3.5 rounded-xl bg-[#00ff88] text-[#0a0a0a] font-bold text-sm hover:bg-[#00cc6a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Enregistrer {detectedBets.filter(b => b.selected).length} pari{detectedBets.filter(b => b.selected).length > 1 ? "s" : ""}
                  </button>

                  <button type="button" onClick={() => { setMultiStage("upload"); setMultiFiles([]); setDetectedBets([]); }}
                    className="w-full py-2 text-xs text-[#444] hover:text-[#666] transition-colors">
                    ← Recommencer
                  </button>
                </>
              )}
            </>
          )}

          {/* ─── MANUEL / common fields ─── */}
          {tab === "manuel" && (
            <>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Ex: PSG vs OM - Victoire PSG" rows={2}
                  className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Sport</label>
                  <SelectField value={form.sport} onChange={(v) => set("sport", v)}>
                    <option value="">Choisir</option>
                    {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectField>
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {analysisError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-xs text-[#ef4444]">
              <AlertCircle size={13} />
              {analysisError}
            </div>
          )}

          {/* Common fields (Manuel + Image preview) */}
          {showCommonFields && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bookmaker */}
              <div>
                <label className={labelCls}>Bookmaker</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SelectField value={form.bookmaker} onChange={(v) => set("bookmaker", v)}>
                      <option value="">Sélectionner</option>
                      {bookmakers.map((b) => <option key={b} value={b}>{b}</option>)}
                    </SelectField>
                  </div>
                  <button type="button" onClick={() => setShowAddBk((v) => !v)}
                    className="w-11 shrink-0 border border-[#1a1a1a] bg-[#111] rounded-xl flex items-center justify-center text-[#555] hover:text-[#888] hover:border-[#2a2a2a] transition-colors">
                    <Plus size={15} />
                  </button>
                </div>
                {showAddBk && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={newBk} onChange={(e) => setNewBk(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBookmaker())}
                      placeholder="Nom du bookmaker" autoFocus className={inputCls} />
                    <button type="button" onClick={handleAddBookmaker}
                      className="px-3 rounded-xl bg-[#00ff88] text-[#0a0a0a]"><Check size={14} /></button>
                  </div>
                )}
              </div>

              {/* Devise */}
              <div>
                <label className={labelCls}>Devise</label>
                <SelectField value={form.devise} onChange={(v) => set("devise", v)}>
                  {DEVISES.map((d) => <option key={d.symbol} value={d.symbol}>{d.label}</option>)}
                </SelectField>
              </div>

              {/* Mise + Cote */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Mise *</label>
                  <input type="number" value={form.stake} onChange={(e) => set("stake", e.target.value)}
                    step="0.01" min="0.01" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Cote *</label>
                  <input type="number" value={form.odds} onChange={(e) => set("odds", e.target.value)}
                    step="0.01" min="1.01" className={inputCls} required />
                </div>
              </div>

              {potentialProfit !== null && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#00ff88]/5 border border-[#00ff88]/10">
                  <span className="text-xs text-[#555]">Gain potentiel</span>
                  <span className="text-sm font-bold text-[#00ff88]">+{potentialProfit.toFixed(2)}{form.devise}</span>
                </div>
              )}

              {/* Résultat */}
              <div>
                <label className={labelCls}>Résultat</label>
                <SelectField value={form.result} onChange={(v) => set("result", v as BetResult)}>
                  {RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </SelectField>
              </div>

              {/* Freebet */}
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111] border border-[#1a1a1a] cursor-pointer">
                <input type="checkbox" checked={form.isFreebet} onChange={(e) => set("isFreebet", e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00ff88]" />
                <span className="text-sm text-[#888]">🎁 Ce pari est un freebet</span>
              </label>

              <button type="submit"
                className="w-full py-3.5 rounded-xl bg-[#00ff88] text-[#0a0a0a] font-bold text-sm hover:bg-[#00cc6a] transition-all hover:scale-[1.01]">
                Enregistrer le pari
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
