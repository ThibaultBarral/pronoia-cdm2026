"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  date: string;
  time: string;
  className?: string;
}

function format(diffMs: number): string {
  if (diffMs <= 0) return "En cours";
  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}j ${String(hours).padStart(2, "0")}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  return `${minutes}min`;
}

/** Live countdown to kickoff — ticks every second under 1h, every minute otherwise. */
export default function Countdown({ date, time, className }: CountdownProps) {
  const target = new Date(`${date}T${time}:00`).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const diff = target - Date.now();
    const interval = diff < 3_600_000 ? 1_000 : 60_000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [target]);

  return <span className={className}>{format(target - now)}</span>;
}
