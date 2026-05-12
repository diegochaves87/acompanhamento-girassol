"use client";

import { useState } from "react";

type FamiliaEvo = {
  id: string;
  status: string;
  updated_at: string | null;
  session_id: string;
  published_to_family: boolean | null;
  sessions: { scheduled_at: string } | null;
};

type NextSession = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  clinics: { name: string } | null;
};

type Props = {
  patientName: string;
  initial: string;
  fotoUrl: string | null;
  diagnoses: string[];
  nextSession: NextSession | null;
  familiaEvos: FamiliaEvo[];
};

function formatNextSession(s: NextSession) {
  const d = new Date(s.scheduled_at);
  const weekdays = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
  const weekday = weekdays[d.getUTCDay()];
  const date = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  const startTime = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  const end = new Date(d.getTime() + (s.duration_minutes ?? 30) * 60000);
  const endTime = `${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}`;
  return `${weekday} ${date} · ${startTime}–${endTime}`;
}

function formatEvoDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

function diagnosisBadgeStyle(d: string): { bg: string; color: string } {
  const key = d.toLowerCase().replace(/\s/g, "");
  const map: Record<string, { bg: string; color: string }> = {
    tea: { bg: "#DBEAFE", color: "#1E40AF" },
    autismo: { bg: "#DBEAFE", color: "#1E40AF" },
    tdah: { bg: "#FEF3C7", color: "#92400E" },
    tdl: { bg: "#FCE7F3", color: "#831843" },
    dislexia: { bg: "#EDE9FE", color: "#5B21B6" },
  };
  return map[key] ?? { bg: "#CCFBF1", color: "#0F766E" };
}

export default function FamiliaPreviewModal({ patientName, initial, fotoUrl, diagnoses, nextSession, familiaEvos }: Props) {
  const [show, setShow] = useState(false);

  const lastPublished = familiaEvos.find((e) => e.published_to_family && e.status === "published");

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
        style={{ backgroundColor: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Visualizar como família
      </button>

      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#FFBA3D" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#78350F" }}>Prévia</p>
                <p className="text-sm font-semibold" style={{ color: "#451A03" }}>Como a família verá</p>
              </div>
              <button
                onClick={() => setShow(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ backgroundColor: "rgba(120,53,15,0.12)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#78350F" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Card */}
            <div className="bg-white p-6 space-y-4">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                {fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: "#1D3557" }}
                  >
                    {initial}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{patientName}</p>
                  {diagnoses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {diagnoses.slice(0, 2).map((d) => {
                        const style = diagnosisBadgeStyle(d);
                        return (
                          <span
                            key={d}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: style.bg, color: style.color }}
                          >
                            {d}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Next session */}
              <div className="rounded-xl p-3" style={{ backgroundColor: nextSession ? "#EFF6FF" : "#F3F4F6" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: nextSession ? "#3B82F6" : "#9CA3AF" }}>
                  Próxima sessão
                </p>
                {nextSession ? (
                  <>
                    <p className="text-sm font-semibold" style={{ color: "#1E3A8A" }}>{formatNextSession(nextSession)}</p>
                    {nextSession.clinics && (
                      <p className="text-xs mt-0.5" style={{ color: "#60A5FA" }}>
                        {(nextSession.clinics as { name: string }).name}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma sessão agendada</p>
                )}
              </div>

              {/* Last evolution */}
              {lastPublished ? (
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Última evolução</p>
                  {lastPublished.sessions?.scheduled_at && (
                    <p className="text-xs text-gray-500 mb-1">
                      Sessão de {formatEvoDate(lastPublished.sessions.scheduled_at)}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Relatório de evolução terapêutica disponível para leitura completa.
                  </p>
                  <button
                    disabled
                    className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-white cursor-default"
                    style={{ backgroundColor: "#1a4a3a", opacity: 0.65 }}
                  >
                    Ver evolução completa
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 p-4 text-center">
                  <p className="text-sm text-gray-400">Nenhuma evolução publicada ainda.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 text-center">
                Esta é uma prévia. O portal real pode ter pequenas diferenças.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
