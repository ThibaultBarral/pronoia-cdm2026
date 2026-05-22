import Image from "next/image";
import { Users } from "lucide-react";
import { Team } from "@/lib/types";

const POSITION_ORDER = [
  "GK", "RB", "CB", "LB", "CDM", "CM",
  "RAM", "CAM", "LAM", "RM", "LM", "RW", "LW", "ST", "CF", "Attacker", "Midfielder", "Defender", "Goalkeeper",
];

const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: "GK",
  Defender: "DF",
  Midfielder: "MF",
  Attacker: "AT",
};

function posSort(pos: string) {
  const i = POSITION_ORDER.indexOf(pos);
  return i === -1 ? 99 : i;
}

function normalizePos(pos: string): string {
  return POSITION_LABELS[pos] ?? pos;
}

function posColor(pos: string): string {
  const p = normalizePos(pos);
  if (p === "GK") return "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20";
  if (p === "DF" || p === "CB" || p === "RB" || p === "LB") return "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20";
  if (p === "MF" || p === "CM" || p === "CDM" || p === "CAM") return "text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/20";
  return "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20";
}

export default function Lineup({ team }: { team: Team }) {
  const hasRealPlayers = team.lineup.players.length > 0;
  const sorted = [...team.lineup.players].sort((a, b) => posSort(a.position) - posSort(b.position));

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{team.flag}</span>
        <span className="font-semibold text-[#f0f0f0]">{team.name}</span>
        <span className="ml-auto text-[10px] text-[#00ff88] font-mono border border-[#00ff88]/20 bg-[#00ff88]/5 px-2 py-0.5 rounded">
          {team.lineup.formation}
        </span>
      </div>

      {team.coach && (
        <div className="mb-3 text-[10px] text-[#888]">
          Entraîneur : {team.coach}
        </div>
      )}

      {hasRealPlayers ? (
        <div className="space-y-1">
          {sorted.map((p, i) => {
            const pos = normalizePos(p.position);
            const colorClass = posColor(p.position);
            return (
              <div key={`${p.number}-${i}`} className="flex items-center gap-2 text-sm group">
                {/* Photo */}
                {p.photo ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-[#1f1f1f] shrink-0 bg-[#1a1a1a]">
                    <Image
                      src={p.photo}
                      alt={p.name}
                      width={28}
                      height={28}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full border border-[#1f1f1f] bg-[#1a1a1a] flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-[#555]">
                      {p.number || "—"}
                    </span>
                  </div>
                )}

                {/* Position badge */}
                <span className={`text-[9px] font-bold w-7 text-center border rounded px-0.5 shrink-0 ${colorClass}`}>
                  {pos}
                </span>

                {/* Name */}
                <span className="text-[#f0f0f0] font-medium text-xs truncate flex-1">
                  {p.name}
                </span>

                {/* Age */}
                {p.age && (
                  <span className="text-[10px] text-[#555] shrink-0">{p.age}a</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="py-4 text-center text-[#555] text-xs">
          Sélection non encore annoncée
        </div>
      )}

      {/* Key players (mock mode) */}
      {team.keyPlayers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1f1f1f]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users size={11} className="text-[#ffd700]" />
            <span className="text-[10px] text-[#888] uppercase tracking-wide">Joueurs clés</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {team.keyPlayers.map((p) => (
              <span
                key={p}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/20 text-[#ffd700]"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
