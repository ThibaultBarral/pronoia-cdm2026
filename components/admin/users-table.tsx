"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown, Search } from "lucide-react";
import type { AdminUserRow } from "@/lib/admin";
import { planName, type Plan } from "@/lib/plans";
import { channelLabel } from "@/lib/acquisition";
import VipToggle from "./vip-toggle";
import AdminToggle from "./admin-toggle";

const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  trialing: "Essai",
  expired: "Expiré",
  canceled: "Annulé",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
}
function fmtDateTime(iso: string | null): string {
  if (!iso) return "Jamais";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

type SortKey =
  | "name" | "bettorProfile" | "acquisitionChannel" | "plan" | "status"
  | "analysesCount" | "revenue" | "createdAt" | "lastSignInAt" | "vip" | "isAdmin";

type Access = "all" | "paid" | "vip" | "admin" | "free";

const PLAN_ORDER: Plan[] = ["free", "weekly", "monthly", "pass_cdm", "lifetime"];

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "name", label: "Utilisateur" },
  { key: "bettorProfile", label: "Profil" },
  { key: "acquisitionChannel", label: "Canal" },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Statut" },
  { key: "analysesCount", label: "Analyses", align: "right" },
  { key: "revenue", label: "CA", align: "right" },
  { key: "createdAt", label: "Inscrit" },
  { key: "lastSignInAt", label: "Dern. connexion" },
  { key: "vip", label: "Accès gratuit" },
  { key: "isAdmin", label: "Admin" },
];

const NUMERIC = new Set<SortKey>([
  "analysesCount", "revenue", "createdAt", "lastSignInAt", "vip", "isAdmin",
]);

function sortValue(u: AdminUserRow, key: SortKey): number | string {
  switch (key) {
    case "name": return norm(u.name ?? u.email ?? "");
    case "bettorProfile": return u.bettorProfile ?? "";
    case "acquisitionChannel": return channelLabel(u.acquisitionChannel);
    case "plan": return PLAN_ORDER.indexOf(u.plan);
    case "status": return u.status ?? "";
    case "analysesCount": return u.analysesCount;
    case "revenue": return u.revenue;
    case "createdAt": return u.createdAt ? Date.parse(u.createdAt) : 0;
    case "lastSignInAt": return u.lastSignInAt ? Date.parse(u.lastSignInAt) : 0;
    case "vip": return u.vip ? 1 : 0;
    case "isAdmin": return u.isAdmin ? 1 : 0;
  }
}

export default function UsersTable({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<string>("all");
  const [statusF, setStatusF] = useState<string>("all");
  const [access, setAccess] = useState<Access>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(NUMERIC.has(key) ? "desc" : "asc");
    }
  }

  const rows = useMemo(() => {
    let r = users;
    if (query.trim()) {
      const q = norm(query.trim());
      r = r.filter((u) => norm(`${u.name ?? ""} ${u.email ?? ""}`).includes(q));
    }
    if (plan !== "all") r = r.filter((u) => u.plan === plan);
    if (statusF !== "all") r = r.filter((u) => (u.status ?? "") === statusF);
    if (access === "paid") r = r.filter((u) => u.plan !== "free" && !u.vip);
    else if (access === "vip") r = r.filter((u) => u.vip);
    else if (access === "admin") r = r.filter((u) => u.isAdmin);
    else if (access === "free") r = r.filter((u) => u.plan === "free" && !u.vip);

    const dir = sortDir === "asc" ? 1 : -1;
    return [...r].sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "fr") * dir;
    });
  }, [users, query, plan, statusF, access, sortKey, sortDir]);

  const ACCESS_CHIPS: { id: Access; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "paid", label: "Payants" },
    { id: "free", label: "Gratuits" },
    { id: "vip", label: "VIP" },
    { id: "admin", label: "Admin" },
  ];

  const selectCls =
    "rounded-lg bg-[#0d0d0d] border border-white/10 text-xs text-[#cdd3db] px-2.5 py-2 focus:outline-none focus:border-[var(--accent)]/40";

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6472]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom ou e-mail…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0d0d0d] border border-white/10 text-xs text-[#cdd3db] placeholder-[#5a6472] focus:outline-none focus:border-[var(--accent)]/40"
          />
        </div>

        <select className={selectCls} value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="all">Tous les plans</option>
          {PLAN_ORDER.map((p) => (
            <option key={p} value={p}>{planName(p) ?? "Gratuit"}</option>
          ))}
        </select>

        <select className={selectCls} value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="all">Tous statuts</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          {ACCESS_CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => setAccess(c.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                access === c.id
                  ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-white/10 text-[#7a8290] hover:text-[#cdd3db] hover:bg-white/[0.04]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[11px] text-[#5a6472] tabular-nums">
          {rows.length} / {users.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[920px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-[#5a6472] border-b border-white/5">
                {COLUMNS.map((col) => {
                  const activeSort = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`font-semibold px-3 py-3 first:pl-4 ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 hover:text-[#cdd3db] transition-colors ${
                          col.align === "right" ? "flex-row-reverse" : ""
                        } ${activeSort ? "text-[var(--accent)]" : ""}`}
                      >
                        {col.label}
                        {activeSort ? (
                          sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                        ) : (
                          <ChevronsUpDown size={11} className="opacity-40" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-[#5a6472] text-xs">
                    Aucun utilisateur ne correspond à ces filtres.
                  </td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="text-[#f0f0f0] font-semibold">{u.name ?? "—"}</div>
                      <div className="text-[11px] text-[#5a6472]">{u.email ?? "—"}</div>
                    </td>
                    <td className="px-3 py-3 text-[#9aa3b2] capitalize">{u.bettorProfile ?? "—"}</td>
                    <td className="px-3 py-3">
                      {u.acquisitionChannel ? (
                        <div>
                          <div className="text-[#e0e0e0]">{channelLabel(u.acquisitionChannel)}</div>
                          {u.acquisitionDetail && (
                            <div className="text-[11px] text-[#5a6472] max-w-[160px] truncate" title={u.acquisitionDetail}>
                              {u.acquisitionDetail}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#5a6472]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[#9aa3b2]">{planName(u.plan) ?? "Gratuit"}</td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] text-[#9aa3b2]">
                        {u.status ? STATUS_LABEL[u.status] ?? u.status : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-[#e0e0e0]">{u.analysesCount}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[var(--accent)]">{u.revenue.toFixed(2)} €</td>
                    <td className="px-3 py-3 text-[#9aa3b2] whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    <td className="px-3 py-3 text-[#9aa3b2] whitespace-nowrap">{fmtDateTime(u.lastSignInAt)}</td>
                    <td className="px-3 py-3">
                      {u.email && <VipToggle email={u.email} vip={u.vip} />}
                    </td>
                    <td className="px-3 py-3">
                      {u.email && <AdminToggle email={u.email} isAdmin={u.isAdmin} />}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
