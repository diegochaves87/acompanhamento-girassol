"use client";

import { Fragment, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { statusCardClass, statusBadge } from "@/lib/session-status";
import type { AgendaSession } from "./page";

type SessionGroup = { sessions: AgendaSession[]; timeRange: string };

function buildGroups(allSessions: AgendaSession[]): {
  sessionGroups: Map<string, SessionGroup>;
  skippedIds: Set<string>;
} {
  const sessionGroups = new Map<string, SessionGroup>();
  const skippedIds = new Set<string>();

  const byDay = new Map<string, AgendaSession[]>();
  for (const s of allSessions) {
    const dayKey = s.scheduled_at.slice(0, 10);
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey)!.push(s);
  }

  for (const daySessions of Array.from(byDay.values())) {
    const sorted = [...daySessions].sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

    type Group = { patientId: string; sessions: AgendaSession[] };
    const groups: Group[] = [];

    for (const s of sorted) {
      let added = false;
      for (const g of groups) {
        if (g.patientId !== s.patient_id) continue;
        const last = g.sessions[g.sessions.length - 1];
        const lastEnd =
          new Date(last.scheduled_at).getTime() + (last.duration_minutes ?? 30) * 60000;
        const gap = new Date(s.scheduled_at).getTime() - lastEnd;
        if (gap <= 15 * 60000) {
          g.sessions.push(s);
          skippedIds.add(s.id);
          added = true;
          break;
        }
      }
      if (!added) groups.push({ patientId: s.patient_id, sessions: [s] });
    }

    for (const g of groups) {
      if (g.sessions.length < 2) continue;
      const first = g.sessions[0];
      const last = g.sessions[g.sessions.length - 1];
      const lastEndMs =
        new Date(last.scheduled_at).getTime() + (last.duration_minutes ?? 30) * 60000;
      const lastEndDate = new Date(lastEndMs);
      const hh = String(lastEndDate.getUTCHours()).padStart(2, "0");
      const mm = String(lastEndDate.getUTCMinutes()).padStart(2, "0");
      const firstTime = `${String(new Date(first.scheduled_at).getUTCHours()).padStart(2, "0")}:${String(new Date(first.scheduled_at).getUTCMinutes()).padStart(2, "0")}`;
      sessionGroups.set(first.id, {
        sessions: g.sessions,
        timeRange: `${firstTime} – ${hh}:${mm}`,
      });
    }
  }

  return { sessionGroups, skippedIds };
}

type Props = {
  tenantId: string;
  initialSessions: AgendaSession[];
  initialMonday: string;
};

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex"];

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
  const friday = addDaysISO(monday, 4);
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(monday)} – ${fmt(friday)}`;
}

function getSlotKey(scheduledAt: string, mondayISO: string): string | null {
  const d = new Date(scheduledAt);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const dateISO = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  const diffDays = Math.round(
    (new Date(dateISO + "T12:00:00Z").getTime() - new Date(mondayISO + "T12:00:00Z").getTime()) /
    (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0 || diffDays > 4) return null;
  const slotIndex = (h - 7) * 2 + (m >= 30 ? 1 : 0);
  if (slotIndex < 0 || slotIndex >= 23) return null;
  return `${diffDays}-${slotIndex}`;
}

function formatTime(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function formatEndTime(scheduledAt: string, durationMinutes: number | null): string {
  const d = new Date(new Date(scheduledAt).getTime() + (durationMinutes ?? 30) * 60000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default function AgendaSemana({ tenantId, initialSessions, initialMonday }: Props) {
  const router = useRouter();
  const [monday, setMonday] = useState(initialMonday);
  const [sessions, setSessions] = useState<AgendaSession[]>(initialSessions);
  const [loading, setLoading] = useState(false);

  const today = todayISO();
  const weekDays = Array.from({ length: 5 }, (_, i) => addDaysISO(monday, i));

  const slotsMap = new Map<string, AgendaSession[]>();
  for (const s of sessions) {
    const key = getSlotKey(s.scheduled_at, monday);
    if (key) {
      if (!slotsMap.has(key)) slotsMap.set(key, []);
      slotsMap.get(key)!.push(s);
    }
  }

  const { sessionGroups, skippedIds } = useMemo(() => buildGroups(sessions), [sessions]);

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
              <Link
                href="/terapeuta/agenda/sessoes"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#4CAF50" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Sessões
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-semibold text-lg">Agenda</h1>
            </div>
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
            style={{ gridTemplateColumns: "52px repeat(5, 1fr)" }}
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
                      {slotSessions
                        .filter((s) => !skippedIds.has(s.id))
                        .map((s) => {
                          const group = sessionGroups.get(s.id);
                          return (
                            <div
                              key={s.id}
                              className={`rounded px-1.5 py-0.5 mb-0.5 text-[11px] font-medium leading-tight ${statusCardClass(s.status)}`}
                            >
                              <Link
                                href={`/terapeuta/pacientes/${s.patient_id}?aba=agenda`}
                                className="truncate block hover:underline cursor-pointer"
                                title={s.patients?.full_name ?? ""}
                              >
                                {s.patients?.full_name ?? "—"}
                              </Link>
                              {group ? (
                                <Link
                                  href={`/terapeuta/agenda/dia/${dayISO}`}
                                  className="block text-[10px] opacity-70 hover:opacity-100"
                                >
                                  {group.timeRange} · {group.sessions.length} atend.
                                </Link>
                              ) : (
                                <Link
                                  href={`/terapeuta/agenda/dia/${dayISO}`}
                                  className="block text-[10px] opacity-70 hover:opacity-100"
                                >
                                  {formatTime(s.scheduled_at)} – {formatEndTime(s.scheduled_at, s.duration_minutes)} · {statusBadge(s.status)}
                                </Link>
                              )}
                            </div>
                          );
                        })}
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
