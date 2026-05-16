"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: string;
  type: string;
  message: string;
  action_url: string | null;
  created_at: string;
};

const BELL_SVG = (
  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
);

function typeConfig(type: string) {
  switch (type) {
    case "cpf_missing":
      return { bg: "#FEF3C7", color: "#D97706", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> };
    case "evolution_pending":
      return { bg: "#FEE2E2", color: "#EA580C", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> };
    case "invite_accepted":
      return { bg: "#DCFCE7", color: "#16A34A", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> };
    case "invite_pending":
      return { bg: "#DBEAFE", color: "#2563EB", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> };
    case "collab_request":
      return { bg: "#EDE9FE", color: "#7C3AED", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> };
    default:
      return { bg: "#F3F4F6", color: "#6B7280", icon: BELL_SVG };
  }
}

function NotifIcon({ type }: { type: string }) {
  const { bg, color, icon } = typeConfig(type);
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
      <svg className="w-4 h-4" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {icon}
      </svg>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days !== 1 ? "s" : ""}`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, type, message, action_url, created_at")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) { setNotifs(data); setCount(data.length); }
  }, []);

  useEffect(() => {
    // Gera notificações faltantes e depois carrega a lista
    window.fetch("/api/notifications/check").catch(() => null).finally(() => fetch());
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [fetch]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function resolve(notif: Notif) {
    const supabase = createClient();
    await supabase.from("notifications").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", notif.id);
    setNotifs((p) => p.filter((n) => n.id !== notif.id));
    setCount((p) => Math.max(0, p - 1));
    setOpen(false);
    if (notif.action_url) router.push(notif.action_url);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notificações"
        className="relative p-1.5 rounded-lg transition-colors hover:bg-gray-100"
        style={{ color: count > 0 ? "#DC2626" : "#6B7280" }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>{BELL_SVG}</svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: "#DC2626" }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Notificações</p>
            {count > 0 && (
              <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#DC2626" }}>
                {count} pendente{count !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{BELL_SVG}</svg>
                <p className="text-sm font-medium text-gray-400">Tudo em ordem!</p>
                <p className="text-xs text-gray-300 mt-0.5">Sem notificações pendentes</p>
              </div>
            ) : (
              notifs.map((n) => (
                <button key={n.id} onClick={() => resolve(n)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                  <NotifIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-100">
            <Link
              href="/terapeuta/notificacoes"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors"
              style={{ color: "#1a4a3a" }}
            >
              Ver todas as notificações
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
