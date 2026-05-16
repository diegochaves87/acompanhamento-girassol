"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: string;
  type: string;
  message: string;
  action_url: string | null;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  patient_id: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  cpf_missing: "CPF ausente",
  evolution_pending: "Evolução pendente",
  invite_accepted: "Convite aceito",
  invite_pending: "Convite pendente",
  collab_request: "Colaboração",
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  cpf_missing:       { bg: "#FFF8E1", text: "#FFBA3D", border: "#FFE082" },
  evolution_pending: { bg: "#FFF3E0", text: "#FF8C42", border: "#FFCC80" },
  invite_accepted:   { bg: "#E8F5E9", text: "#4CAF50", border: "#A5D6A7" },
  invite_pending:    { bg: "#E3F2FD", text: "#2E7BC1", border: "#90CAF9" },
  collab_request:    { bg: "#F3E5F5", text: "#8E6CCF", border: "#CE93D8" },
};

function TypeBadge({ type }: { type: string }) {
  const c = TYPE_COLORS[type] ?? { bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ALL_TYPES = Object.keys(TYPE_LABELS);

export default function NotificacoesPage() {
  const [tab, setTab] = useState<"pendentes" | "resolvidas">("pendentes");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("todos");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvingAll, setResolvingAll] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    const tenantId = (userData as { tenant_id?: string } | null)?.tenant_id;
    if (!tenantId) { setLoading(false); return; }

    const { data } = await supabase
      .from("notifications")
      .select("id, type, message, action_url, created_at, resolved, resolved_at, patient_id")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setNotifs(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleResolve(id: string) {
    setResolvingId(id);
    const supabase = createClient();
    await supabase.from("notifications").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, resolved: true, resolved_at: new Date().toISOString() } : n));
    setResolvingId(null);
  }

  async function handleResolveAll() {
    setResolvingAll(true);
    const supabase = createClient();
    const pendingIds = displayed.filter((n) => !n.resolved).map((n) => n.id);
    if (pendingIds.length > 0) {
      await supabase.from("notifications").update({ resolved: true, resolved_at: new Date().toISOString() }).in("id", pendingIds);
      setNotifs((prev) => prev.map((n) => pendingIds.includes(n.id) ? { ...n, resolved: true, resolved_at: new Date().toISOString() } : n));
    }
    setResolvingAll(false);
  }

  const filtered = notifs.filter((n) =>
    (tab === "pendentes" ? !n.resolved : n.resolved) &&
    (filterType === "todos" || n.type === filterType)
  );

  const displayed = filtered;
  const pendingCount = notifs.filter((n) => !n.resolved).length;

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Notificações</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{pendingCount} pendente{pendingCount !== 1 ? "s" : ""}</p>
          )}
        </div>
        {tab === "pendentes" && displayed.length > 0 && (
          <button
            onClick={handleResolveAll}
            disabled={resolvingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: "#1a4a3a" }}
          >
            {resolvingAll ? "Resolvendo…" : "Resolver todas"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["pendentes", "resolvidas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors capitalize ${
              tab === t ? "text-[#1a4a3a] border-[#1a4a3a]" : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            {t === "pendentes" ? `Pendentes${pendingCount > 0 ? ` (${pendingCount})` : ""}` : "Resolvidas"}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["todos", ...ALL_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === t ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"
            }`}
            style={filterType === t ? { backgroundColor: "#1a4a3a" } : {}}
          >
            {t === "todos" ? "Todos" : (TYPE_LABELS[t] ?? t)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1a4a3a] rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-16 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm font-medium text-gray-500">
            {tab === "pendentes" ? "Nenhuma notificação pendente" : "Nenhuma notificação resolvida"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={n.type} />
                    {n.resolved && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {n.resolved_at && n.resolved_at !== n.created_at ? "Resolvido automaticamente" : "Resolvido"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400">{formatDate(n.created_at)}</p>
                </div>
                {!n.resolved && (
                  <button
                    onClick={() => handleResolve(n.id)}
                    disabled={resolvingId === n.id}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
                    style={{ backgroundColor: "#1a4a3a" }}
                  >
                    {resolvingId === n.id ? "…" : "Resolver"}
                  </button>
                )}
              </div>
              {n.action_url && (
                <a
                  href={n.action_url}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                  style={{ color: "#1a4a3a" }}
                >
                  Ver detalhes
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
