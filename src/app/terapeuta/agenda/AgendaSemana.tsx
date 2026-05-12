"use client";

import { Fragment, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { statusCardStyle, statusBadge } from "@/lib/session-status";
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
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

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

  const mobileDayISO = weekDays[selectedDayIdx];
  const mobileDaySessions = sessions
    .filter((s) => {
      const d = new Date(s.scheduled_at);
      const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      return iso === mobileDayISO;
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  async function navigate(newMonday: string) {
    setLoading(true);
    setSelectedDayIdx(0);
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
    <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1D3557" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left: back + icon + title + nav */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/terapeuta" className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60" style={{ color: "rgba(255,255,255,0.65)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Início
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={1.8} />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="font-bold text-lg" style={{ color: "white", fontFamily: "var(--font-poppins, sans-serif)" }}>Agenda</h1>
            </div>
            <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
              <Link href="/terapeuta/agenda" className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.95)", color: "#1D3557" }}>
                Semana
              </Link>
              <Link href="/terapeuta/agenda/atendimentos" className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10" style={{ color: "rgba(255,255,255,0.65)" }}>
                Atendimentos
              </Link>
            </div>
          </div>

          {/* Right: week navigation + new session + petal */}
          <div className="relative flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.25)" }}>
              <button
                onClick={() => navigate(addDaysISO(monday, -7))}
                disabled={loading}
                className="p-2 transition-opacity hover:opacity-60 disabled:opacity-30"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-xs font-medium capitalize min-w-[150px] text-center" style={{ color: "white" }}>
                {formatWeekRange(monday)}
              </span>
              <button
                onClick={() => navigate(addDaysISO(monday, 7))}
                disabled={loading}
                className="p-2 transition-opacity hover:opacity-60 disabled:opacity-30"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <Link
              href="/terapeuta/agenda/sessoes"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#4CAF50" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
              </svg>
              Nova sessão
            </Link>
            {/* Pétala decorativa */}
            <svg className="absolute opacity-20 pointer-events-none" style={{ top: -6, right: -6 }} width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
              <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFC107" transform="rotate(0 26 26)" />
              <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFBA3D" transform="rotate(72 26 26)" />
              <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFC107" transform="rotate(144 26 26)" />
              <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFBA3D" transform="rotate(216 26 26)" />
              <ellipse cx="26" cy="13" rx="8" ry="13" fill="#FFC107" transform="rotate(288 26 26)" />
            </svg>
          </div>
        </div>
      </header>

      {/* ── Mobile day view ── */}
      <div className="md:hidden">
        {/* Day pills */}
        <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
          {weekDays.map((dayISO, i) => {
            const isSelected = i === selectedDayIdx;
            const isToday = dayISO === today;
            return (
              <button
                key={dayISO}
                onClick={() => setSelectedDayIdx(i)}
                className="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-colors"
                style={{
                  backgroundColor: isSelected ? "#1a4a3a" : isToday ? "#f0f4f1" : "white",
                  color: isSelected ? "white" : isToday ? "#1a4a3a" : "#6B7280",
                  border: isSelected ? "none" : "1px solid #E5E7EB",
                }}
              >
                <span className="text-[11px] font-semibold">{DAY_NAMES[i]}</span>
                <span className="text-sm font-bold">{formatDayLabel(dayISO)}</span>
              </button>
            );
          })}
        </div>

        {/* Day navigation arrows */}
        <div className="flex items-center justify-between px-4 pb-3">
          <button
            onClick={() => setSelectedDayIdx((p) => Math.max(0, p - 1))}
            disabled={selectedDayIdx === 0}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>
          <span className="text-sm font-semibold" style={{ color: "#1a4a3a" }}>
            {DAY_NAMES[selectedDayIdx]} · {formatDayLabel(mobileDayISO)}
          </span>
          <button
            onClick={() => setSelectedDayIdx((p) => Math.min(4, p + 1))}
            disabled={selectedDayIdx === 4}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 disabled:opacity-30"
          >
            Próximo
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Sessions for selected day */}
        <div className="px-4 pb-6 space-y-2">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Carregando…</p>
          ) : mobileDaySessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400">Nenhuma sessão neste dia</p>
              <Link
                href={`/terapeuta/agenda/dia/${mobileDayISO}`}
                className="mt-3 inline-block text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: "#f0f4f1", color: "#1a4a3a" }}
              >
                Ver dia completo
              </Link>
            </div>
          ) : (
            <>
              {mobileDaySessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/terapeuta/pacientes/${s.patient_id}?aba=agenda`}
                  className="block rounded-xl px-4 py-3 border-l-4"
                  style={statusCardStyle(s.status)}
                >
                  <p className="text-sm font-bold leading-tight" style={{ color: "#1D3557" }}>
                    {s.patients?.full_name ?? "—"}
                  </p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "#374151", opacity: 0.75 }}>
                    {formatTime(s.scheduled_at)} – {formatEndTime(s.scheduled_at, s.duration_minutes)}
                    {" · "}{statusBadge(s.status)}
                  </p>
                </Link>
              ))}
              <Link
                href={`/terapeuta/agenda/dia/${mobileDayISO}`}
                className="block text-center text-xs font-semibold pt-1"
                style={{ color: "#1a4a3a" }}
              >
                Ver dia completo →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Link
          href="/terapeuta/agenda/sessoes/nova"
          className="flex items-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold text-white shadow-2xl active:scale-95 transition-transform"
          style={{ backgroundColor: "#4CAF50" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
          Nova sessão
        </Link>
      </div>

      {/* Grid — desktop only */}
      <main className="hidden md:block max-w-6xl mx-auto px-4 py-4 overflow-x-auto">
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
                              className="rounded px-1.5 py-0.5 mb-0.5 text-[11px] font-medium leading-tight border-l-2"
                              style={statusCardStyle(s.status)}
                            >
                              <Link
                                href={`/terapeuta/pacientes/${s.patient_id}?aba=agenda`}
                                className="truncate block hover:underline cursor-pointer font-semibold"
                                style={{ color: "#1D3557" }}
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
