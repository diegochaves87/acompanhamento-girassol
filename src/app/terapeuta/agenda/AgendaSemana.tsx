"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { statusCardClass, statusBadge } from "@/lib/session-status";
import type { AgendaSession } from "./page";

type Props = {
  tenantId: string;
  initialSessions: AgendaSession[];
  initialMonday: string;
};

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
  const hour = 7 + Math.floor(i / 2);
  const minute = i % 2 === 0 ? 0 : 30;
  return {
    hour,
    minute,
    label: `${String(hour).padStart(2, "0")}:${minute === 0 ? "00" : "30"}`,
  };
});

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatWeekRange(monday: string): string {
  const saturday = addDaysISO(monday, 5);
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(monday)} – ${fmt(saturday)}`;
}

function getSlotKey(scheduledAt: string, mondayISO: string): string | null {
  const d = new Date(scheduledAt);
  const monday = new Date(mondayISO + "T00:00:00");
  const diffMs = d.getTime() - monday.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0 || diffDays > 5) return null;
  // Extrai hora/minuto no fuso de Fortaleza (UTC-3)
  const timeStr = d.toLocaleTimeString("en-US", {
    timeZone: "America/Fortaleza",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = timeStr.split(":").map(Number);
  const slotIndex = (h - 7) * 2 + (m >= 30 ? 1 : 0);
  if (slotIndex < 0 || slotIndex >= 23) return null;
  return `${diffDays}-${slotIndex}`;
}

export default function AgendaSemana({ tenantId, initialSessions, initialMonday }: Props) {
  const router = useRouter();
  const [monday, setMonday] = useState(initialMonday);
  const [sessions, setSessions] = useState<AgendaSession[]>(initialSessions);
  const [loading, setLoading] = useState(false);

  const today = todayISO();
  const weekDays = Array.from({ length: 6 }, (_, i) => addDaysISO(monday, i));

  const slotsMap = new Map<string, AgendaSession[]>();
  for (const s of sessions) {
    const key = getSlotKey(s.scheduled_at, monday);
    if (key) {
      if (!slotsMap.has(key)) slotsMap.set(key, []);
      slotsMap.get(key)!.push(s);
    }
  }

  async function navigate(newMonday: string) {
    setLoading(true);
    setMonday(newMonday);
    const nextMonday = addDaysISO(newMonday, 7);
    const supabase = createClient();
    const { data } = await supabase
      .from("sessions")
      .select("id, scheduled_at, status, duration_minutes, patient_id, patients(id, full_name), clinics(name)")
      .eq("tenant_id", tenantId)
      .gte("scheduled_at", newMonday + "T00:00:00")
      .lt("scheduled_at", nextMonday + "T00:00:00")
      .order("scheduled_at");
    setSessions((data ?? []) as unknown as AgendaSession[]);
    router.replace(`/terapeuta/agenda?semana=${newMonday}`, { scroll: false });
    setLoading(false);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0f4f1" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1a4a3a" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link href="/terapeuta" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao menu principal
            </Link>
            <div className="flex gap-1 bg-white/10 rounded-xl p-1">
              <Link href="/terapeuta/agenda" className="px-3 py-1 rounded-lg text-sm font-semibold text-white bg-white/20">
                Semana
              </Link>
              <Link href="/terapeuta/agenda/atendimentos" className="px-3 py-1 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                Atendimentos
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-white font-semibold text-lg">Agenda</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(addDaysISO(monday, -7))}
                disabled={loading}
                className="text-white/70 hover:text-white transition-colors disabled:opacity-40 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-white/90 text-sm font-medium capitalize min-w-[180px] text-center">
                {formatWeekRange(monday)}
              </span>
              <button
                onClick={() => navigate(addDaysISO(monday, 7))}
                disabled={loading}
                className="text-white/70 hover:text-white transition-colors disabled:opacity-40 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-4 py-4 overflow-x-auto">
        {loading && (
          <div className="text-center py-4 text-sm text-gray-400">Carregando…</div>
        )}
        <div className="min-w-[640px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="grid"
            style={{ gridTemplateColumns: "52px repeat(6, 1fr)" }}
          >
            {/* Header row */}
            <div className="border-b border-r border-gray-100 bg-gray-50" />
            {weekDays.map((dayISO, i) => {
              const isToday = dayISO === today;
              const colBg = isToday ? "bg-[#f0f4f1]" : i % 2 === 0 ? "bg-white" : "bg-[#f5f5f3]";
              return (
                <Link
                  key={dayISO}
                  href={`/terapeuta/agenda/dia/${dayISO}`}
                  className={`border-b border-r border-gray-100 py-2 text-center hover:brightness-95 transition-all ${colBg}`}
                >
                  <p className="text-xs font-semibold text-gray-500">{DAY_NAMES[i]}</p>
                  <p className={`text-sm font-bold ${isToday ? "text-[#1a4a3a]" : "text-gray-700"}`}>
                    {formatDayLabel(dayISO)}
                  </p>
                </Link>
              );
            })}

            {/* Time slot rows */}
            {TIME_SLOTS.map((slot, slotIdx) => (
              <Fragment key={slotIdx}>
                <div className="border-b border-r border-gray-100 text-[10px] text-gray-400 text-right pr-1.5 pt-1 leading-none">
                  {slot.minute === 0 ? slot.label : ""}
                </div>
                {weekDays.map((dayISO, dayIdx) => {
                  const key = `${dayIdx}-${slotIdx}`;
                  const slotSessions = slotsMap.get(key) ?? [];
                  return (
                    <div
                      key={dayISO}
                      className={`border-b border-r border-gray-100 min-h-[30px] p-0.5 ${
                        slot.minute === 0 ? "border-t border-t-gray-100" : ""
                      } ${dayISO === today ? "bg-[#f0f4f1]/40" : dayIdx % 2 === 0 ? "bg-white" : "bg-[#f5f5f3]"}`}
                    >
                      {slotSessions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/terapeuta/agenda/dia/${dayISO}`}
                          className={`block rounded px-1.5 py-0.5 mb-0.5 text-[11px] font-medium leading-tight truncate ${statusCardClass(s.status)}`}
                          title={s.patients?.full_name ?? ""}
                        >
                          <span className="truncate block">{s.patients?.full_name ?? "—"}</span>
                          <span className="text-[10px] opacity-70">{statusBadge(s.status)}</span>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
