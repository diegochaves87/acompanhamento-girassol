"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FamilySession = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  clinics: { name: string; phone: string | null } | null;
};

export type FeedItem = {
  id: string;
  created_at: string;
  content: string;
  context_type: string;
  source: "terapeuta" | "familia";
  image_url: string | null;
};

type Props = {
  familiarNome: string;
  familiarId: string;
  patientId: string;
  patientNome: string;
  patientFoto: string | null;
  descricaoPaciente: string | null;
  therapistNome: string;
  therapistEspec: string | null;
  sessions: FamilySession[];
  feedItems: FeedItem[];
  notifCount: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function formatDataPT(s: string) {
  const d = new Date(s);
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function formatHora(s: string) {
  const d = new Date(s);
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatHoraFim(s: string, dur: number | null) {
  const d = new Date(s);
  d.setMinutes(d.getMinutes() + (dur ?? 50));
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function relativeTime(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  if (h < 48) return "ontem";
  return `há ${Math.floor(h / 24)} dias`;
}

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase() : name[0]?.toUpperCase() ?? "?";
}

function badgeForType(t: string): { label: string; bg: string; color: string } {
  if (t === "evolucao") return { label: "Evolução", bg: "#F0FFF4", color: "#4CAF50" };
  if (t === "atividade") return { label: "Atividade", bg: "#EFF6FF", color: "#2E7BC1" };
  if (t === "mensagem") return { label: "Mensagem", bg: "#F3F0FF", color: "#8E6CCF" };
  if (t === "familia") return { label: "Família", bg: "#F3F0FF", color: "#8E6CCF" };
  return { label: "Novidade", bg: "#FFFBEB", color: "#FFC107" };
}

function statusBadge(status: string) {
  if (status === "confirmed") return { label: "Confirmada", bg: "#F0FFF4", color: "#4CAF50" };
  if (status === "completed") return { label: "Realizada", bg: "#F3F4F6", color: "#9CA3AF" };
  return { label: "Agendada", bg: "#EFF6FF", color: "#2E7BC1" };
}

function buildWAConfirm(
  session: FamilySession,
  familiarNome: string,
  patientNome: string,
  therapistNome: string,
  therapistEspec: string | null,
) {
  const clinica = session.clinics?.name ? toTitleCase(session.clinics.name) : "a clínica";
  return (
    `*Acompanhamento Girassol*\n\n` +
    `Olá! Sou ${familiarNome}, responsável por ${patientNome}.\n\n` +
    `Estou entrando em contato através do *Acompanhamento Girassol* sobre o agendamento abaixo:\n\n` +
    `📅 Data: ${formatDataPT(session.scheduled_at)}\n` +
    `⏰ Horário: ${formatHora(session.scheduled_at)} às ${formatHoraFim(session.scheduled_at, session.duration_minutes)}\n` +
    `👩‍⚕️ Profissional: ${therapistNome}\n` +
    `🏥 Especialidade: ${therapistEspec ?? "—"}\n` +
    `📍 Clínica: ${clinica}\n\n` +
    `Gostaria de *CONFIRMAR* este agendamento.\n\nObrigado(a)!`
  );
}

function buildWACancel(
  session: FamilySession,
  familiarNome: string,
  patientNome: string,
  therapistNome: string,
  therapistEspec: string | null,
) {
  const clinica = session.clinics?.name ? toTitleCase(session.clinics.name) : "a clínica";
  return (
    `*Acompanhamento Girassol*\n\n` +
    `Olá! Sou ${familiarNome}, responsável por ${patientNome}.\n\n` +
    `Estou entrando em contato através do *Acompanhamento Girassol* sobre o agendamento abaixo:\n\n` +
    `📅 Data: ${formatDataPT(session.scheduled_at)}\n` +
    `⏰ Horário: ${formatHora(session.scheduled_at)} às ${formatHoraFim(session.scheduled_at, session.duration_minutes)}\n` +
    `👩‍⚕️ Profissional: ${therapistNome}\n` +
    `🏥 Especialidade: ${therapistEspec ?? "—"}\n` +
    `📍 Clínica: ${clinica}\n\n` +
    `Gostaria de mais informações sobre este agendamento.\n\nAguardo retorno. Obrigado(a)!`
  );
}

function waHref(phone: string | null | undefined, msg: string) {
  const encoded = encodeURIComponent(msg);
  if (phone) return `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encoded}`;
  return `https://wa.me/?text=${encoded}`;
}

// ─── Sub-components (module-level to prevent focus loss) ─────────────────────

function SessionCard({
  session,
  therapistNome,
  therapistEspec,
  onConfirm,
  onCancel,
}: {
  session: FamilySession;
  therapistNome: string;
  therapistEspec: string | null;
  onConfirm: (s: FamilySession) => void;
  onCancel: (s: FamilySession) => void;
}) {
  const badge = statusBadge(session.status);
  const clinica = session.clinics?.name ? toTitleCase(session.clinics.name) : null;
  return (
    <div
      className="flex-shrink-0 w-72 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200"
      style={{ borderRadius: 16 }}
    >
      {/* Terapeuta */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0" style={{ backgroundColor: "#1D3557" }}>
          {initials(therapistNome)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#1D3557" }}>{therapistNome}</p>
          {therapistEspec && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0FFF4", color: "#4CAF50" }}>
              {therapistEspec}
            </span>
          )}
        </div>
      </div>

      {/* Data */}
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: "#2E7BC1" }}>
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm font-semibold" style={{ color: "#1D3557" }}>{formatDataPT(session.scheduled_at)}</p>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          {formatHora(session.scheduled_at)} às {formatHoraFim(session.scheduled_at, session.duration_minutes)}
        </span>
        {clinica && (
          <span className="flex items-center gap-1 truncate">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" strokeWidth={2} />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth={2} />
            </svg>
            <span className="truncate">{clinica}</span>
          </span>
        )}
      </div>

      {/* Status badge */}
      <span className="inline-flex self-start text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: badge.bg, color: badge.color }}>
        {badge.label}
      </span>

      {/* Actions */}
      {session.status === "scheduled" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onConfirm(session)}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#4CAF50" }}
          >
            Confirmar presença
          </button>
          <button
            onClick={() => onCancel(session)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors hover:bg-red-50"
            style={{ borderColor: "#FF5C7A", color: "#FF5C7A" }}
          >
            Não poderei ir
          </button>
        </div>
      )}
    </div>
  );
}

function FeedCard({
  item,
  therapistNome,
  therapistEspec,
  familiarNome,
  liked,
  onToggleLike,
  showComments,
  onToggleComments,
}: {
  item: FeedItem;
  therapistNome: string;
  therapistEspec: string | null;
  familiarNome: string;
  liked: boolean;
  onToggleLike: () => void;
  showComments: boolean;
  onToggleComments: () => void;
}) {
  const badge = badgeForType(item.context_type);
  const authorName = item.source === "familia" ? familiarNome : therapistNome;
  const authorSubtitle = item.source === "familia" ? "Familiar" : (therapistEspec ?? "Terapeuta");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{ backgroundColor: item.source === "familia" ? "#8E6CCF" : "#1D3557" }}
          >
            {initials(authorName)}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1D3557" }}>{authorName}</p>
            <p className="text-xs text-gray-400">{authorSubtitle} &middot; {relativeTime(item.created_at)}</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: badge.bg, color: badge.color }}>
          {badge.label}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{item.content}</p>

      {/* Image */}
      {item.image_url && (
        <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="block mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image_url} alt="Imagem compartilhada" className="w-full rounded-xl object-cover max-h-64 hover:opacity-90 transition-opacity" />
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
        <button
          onClick={onToggleLike}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: liked ? "#FF5C7A" : "#9CA3AF" }}
        >
          <svg
            className="w-4 h-4 transition-transform duration-150"
            style={{ transform: liked ? "scale(1.2)" : "scale(1)" }}
            fill={liked ? "#FF5C7A" : "none"}
            viewBox="0 0 24 24"
          >
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke={liked ? "#FF5C7A" : "#9CA3AF"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {liked ? "Curtido" : "Curtir"}
        </button>
        <button
          onClick={onToggleComments}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: showComments ? "#8E6CCF" : "#9CA3AF" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Comentar
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 flex gap-2 items-start">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
            style={{ backgroundColor: "#8E6CCF" }}
          >
            {initials(familiarNome)}
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-400 italic">Comentários em breve...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmModal({
  session,
  familiarNome,
  patientNome,
  therapistNome,
  therapistEspec,
  onSend,
  onClose,
}: {
  session: FamilySession;
  familiarNome: string;
  patientNome: string;
  therapistNome: string;
  therapistEspec: string | null;
  onSend: () => void;
  onClose: () => void;
}) {
  const msg = buildWAConfirm(session, familiarNome, patientNome, therapistNome, therapistEspec);
  const href = waHref(session.clinics?.phone, msg);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm text-center" style={{ borderRadius: 20 }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#F0FFF4" }}
        >
          <svg className="w-8 h-8 animate-[bounce_0.5s_ease-in-out_1]" fill="none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="#4CAF50" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
          Presença confirmada!
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Quer avisar a clínica sobre sua confirmação? Enviamos uma mensagem com todos os detalhes.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onSend}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Sim, enviar para a clínica
          </a>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelModal({
  session,
  familiarNome,
  patientNome,
  therapistNome,
  therapistEspec,
  onSend,
  onClose,
}: {
  session: FamilySession;
  familiarNome: string;
  patientNome: string;
  therapistNome: string;
  therapistEspec: string | null;
  onSend: () => void;
  onClose: () => void;
}) {
  const msg = buildWACancel(session, familiarNome, patientNome, therapistNome, therapistEspec);
  const href = waHref(session.clinics?.phone, msg);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm text-center" style={{ borderRadius: 20 }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#FFF0F3" }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" stroke="#FF5C7A" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
          Informar indisponibilidade
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Quer avisar a clínica que não poderá comparecer? Assim eles podem reorganizar a agenda.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onSend}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FF5C7A" }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Sim, avisar a clínica
          </a>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Não, só registrar
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNav({
  tab,
  setTab,
  notifCount,
}: {
  tab: string;
  setTab: (t: "feed" | "sessoes" | "mensagens" | "perfil") => void;
  notifCount: number;
}) {
  const items = [
    {
      key: "feed" as const,
      label: "Feed",
      icon: (active: boolean) => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke={active ? "#4CAF50" : "#9CA3AF"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: "sessoes" as const,
      label: "Sessões",
      icon: (active: boolean) => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke={active ? "#4CAF50" : "#9CA3AF"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: "mensagens" as const,
      label: "Mensagens",
      badge: notifCount,
      icon: (active: boolean) => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke={active ? "#4CAF50" : "#9CA3AF"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: "perfil" as const,
      label: "Perfil",
      icon: (active: boolean) => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke={active ? "#4CAF50" : "#9CA3AF"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg">
      <div className="flex items-center max-w-lg mx-auto">
        {items.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 relative transition-colors"
            >
              <div className="relative">
                {item.icon(active)}
                {item.badge && item.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center animate-pulse"
                    style={{ backgroundColor: "#FF5C7A" }}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold" style={{ color: active ? "#4CAF50" : "#9CA3AF" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FamiliaDashboard({
  familiarNome,
  familiarId,
  patientId,
  patientNome,
  patientFoto,
  descricaoPaciente,
  therapistNome,
  therapistEspec,
  sessions: initialSessions,
  feedItems: initialFeed,
  notifCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<"feed" | "sessoes" | "mensagens" | "perfil">("feed");
  const [sessions, setSessions] = useState(initialSessions);
  const [feed, setFeed] = useState(initialFeed);
  const [confirmSession, setConfirmSession] = useState<FamilySession | null>(null);
  const [cancelSession, setCancelSession] = useState<FamilySession | null>(null);
  const [postContent, setPostContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [descInput, setDescInput] = useState(descricaoPaciente ?? "");
  const [editingDesc, setEditingDesc] = useState(false);

  const primeiroNome = familiarNome.split(" ")[0];
  const primeiroPaciente = patientNome.split(" ")[0];

  async function handleConfirmClick(session: FamilySession) {
    const supabase = createClient();
    await supabase.from("sessions").update({ status: "confirmed" }).eq("id", session.id);
    setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "confirmed" } : s));
    setConfirmSession(session);
  }

  async function submitPost() {
    if (!postContent.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("family_posts")
      .insert({ family_access_id: familiarId, patient_id: patientId, content: postContent.trim() })
      .select("id, created_at, content, image_url")
      .single();
    if (!error && data) {
      setFeed((prev) => [
        { id: data.id, created_at: data.created_at, content: data.content, context_type: "familia", source: "familia" as const, image_url: null },
        ...prev,
      ]);
      setPostContent("");
    }
    setSubmitting(false);
  }

  async function saveDesc() {
    const supabase = createClient();
    await supabase.from("family_access").update({ descricao_paciente: descInput }).eq("id", familiarId);
    setEditingDesc(false);
  }

  function toggleLike(id: string) {
    setLikes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleComments(id: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F9FAFB" }}>
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/identidade-visual/Logo-Girassol.png" alt="" style={{ height: 32 }} />
          <span className="text-sm font-bold" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Olá, {primeiroNome}!
          </span>
          <div className="flex items-center gap-3">
            <button className="relative p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "#6B7280" }}>
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {notifCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: "#FF5C7A" }}
                >
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
              style={{ backgroundColor: "#8E6CCF" }}
            >
              {initials(familiarNome)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* ─── Patient card ─── */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: "#FFF7E6" }}>
          <div className="flex items-center gap-4 mb-3">
            <div className="relative flex-shrink-0">
              {patientFoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={patientFoto} alt={patientNome} className="w-16 h-16 rounded-full object-cover" style={{ border: "3px solid #4CAF50" }} />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl" style={{ backgroundColor: "#1D3557", border: "3px solid #4CAF50" }}>
                  {initials(patientNome)}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center" style={{ border: "2px solid #FFF7E6" }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4CAF50" }} />
              </div>
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>{patientNome}</p>
              {therapistEspec && (
                <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#F0FFF4", color: "#4CAF50" }}>
                  {therapistNome} &middot; {therapistEspec}
                </span>
              )}
            </div>
          </div>

          {editingDesc ? (
            <div className="mt-2">
              <textarea
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-[#4CAF50] resize-none bg-white"
                rows={3}
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder={`Conte um pouco sobre ${primeiroPaciente}...`}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={saveDesc} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: "#4CAF50" }}>Salvar</button>
                <button onClick={() => setEditingDesc(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500">Cancelar</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingDesc(true)}
              className="w-full text-left mt-1 text-sm italic px-3 py-2 rounded-xl border border-dashed border-gray-200 transition-colors hover:border-[#4CAF50]"
              style={{ color: descInput ? "#374151" : "#9CA3AF" }}
            >
              {descInput || `Conte um pouco sobre ${primeiroPaciente}...`}
            </button>
          )}
        </div>

        {/* ─── Feed Tab: sessions + feed ─── */}
        {activeTab === "feed" && (
          <>
            {/* Upcoming sessions strip */}
            {sessions.length > 0 && (
              <div>
                <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5" style={{ color: "#1D3557" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" style={{ color: "#2E7BC1" }}>
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Próximas sessões agendadas
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                  {sessions.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      therapistNome={therapistNome}
                      therapistEspec={therapistEspec}
                      onConfirm={handleConfirmClick}
                      onCancel={setCancelSession}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Post input */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex gap-3 items-start">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                  style={{ backgroundColor: "#8E6CCF" }}
                >
                  {initials(familiarNome)}
                </div>
                <div className="flex-1">
                  <textarea
                    className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none resize-none bg-transparent"
                    rows={2}
                    placeholder="Compartilhe algo com o terapeuta..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <button className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: "#FFC107" }}>
                        <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth={2} />
                      </svg>
                    </button>
                    <button
                      onClick={submitPost}
                      disabled={submitting || !postContent.trim()}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#4CAF50" }}
                    >
                      {submitting ? "Enviando…" : "Compartilhar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed */}
            {feed.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#F0FFF4" }}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" style={{ color: "#4CAF50" }}>
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-500 mb-1">Nenhuma publicação ainda</p>
                <p className="text-xs text-gray-400">As evoluções do terapeuta aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feed.map((item) => (
                  <FeedCard
                    key={item.id}
                    item={item}
                    therapistNome={therapistNome}
                    therapistEspec={therapistEspec}
                    familiarNome={familiarNome}
                    liked={likes.has(item.id)}
                    onToggleLike={() => toggleLike(item.id)}
                    showComments={expandedComments.has(item.id)}
                    onToggleComments={() => toggleComments(item.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Sessões Tab ─── */}
        {activeTab === "sessoes" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold" style={{ color: "#1D3557" }}>Todas as sessões agendadas</h2>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">Nenhuma sessão agendada no momento.</p>
              </div>
            ) : (
              sessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  therapistNome={therapistNome}
                  therapistEspec={therapistEspec}
                  onConfirm={handleConfirmClick}
                  onCancel={setCancelSession}
                />
              ))
            )}
          </div>
        )}

        {/* ─── Mensagens Tab ─── */}
        {activeTab === "mensagens" && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F3F0FF" }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" style={{ color: "#8E6CCF" }}>
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-bold text-sm mb-1" style={{ color: "#1D3557" }}>Mensagens em breve</p>
            <p className="text-xs text-gray-400">Em breve você poderá trocar mensagens diretamente com o terapeuta.</p>
          </div>
        )}

        {/* ─── Perfil Tab ─── */}
        {activeTab === "perfil" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold mb-4" style={{ color: "#1D3557", fontFamily: "var(--font-poppins, sans-serif)" }}>Meu perfil</h2>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl" style={{ backgroundColor: "#8E6CCF" }}>
                {initials(familiarNome)}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{familiarNome}</p>
                <p className="text-xs text-gray-400">Familiar de {patientNome}</p>
              </div>
            </div>
            <div className="border-t border-gray-50 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Paciente</span>
                <span className="font-semibold" style={{ color: "#1D3557" }}>{patientNome}</span>
              </div>
              {therapistEspec && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Especialidade</span>
                  <span className="font-semibold" style={{ color: "#4CAF50" }}>{therapistEspec}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Terapeuta</span>
                <span className="font-semibold" style={{ color: "#1D3557" }}>{therapistNome}</span>
              </div>
            </div>
            <button
              onClick={async () => { const s = createClient(); await s.auth.signOut(); window.location.href = "/familia/login"; }}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Sair da conta
            </button>
          </div>
        )}
      </main>

      {/* ─── Modals ─── */}
      {confirmSession && (
        <ConfirmModal
          session={confirmSession}
          familiarNome={familiarNome}
          patientNome={patientNome}
          therapistNome={therapistNome}
          therapistEspec={therapistEspec}
          onSend={() => setConfirmSession(null)}
          onClose={() => setConfirmSession(null)}
        />
      )}
      {cancelSession && (
        <CancelModal
          session={cancelSession}
          familiarNome={familiarNome}
          patientNome={patientNome}
          therapistNome={therapistNome}
          therapistEspec={therapistEspec}
          onSend={() => setCancelSession(null)}
          onClose={() => setCancelSession(null)}
        />
      )}

      {/* ─── Bottom Nav ─── */}
      <BottomNav tab={activeTab} setTab={setActiveTab} notifCount={notifCount} />
    </div>
  );
}
