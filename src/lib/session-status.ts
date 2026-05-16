// Real DB status values — these are the only values that exist in the database
export type SessionStatus =
  | "scheduled"
  | "completed"
  | "canceled_therapist"
  | "cancelled_family"
  | "makeup"
  | "makeup_completed"
  | "justified_absence"
  | "unjustified_absence"
  | "reposta";

// Primary source of truth — label, color (text/border), bg (background)
export const SESSION_STATUSES: Record<
  SessionStatus,
  { label: string; color: string; bg: string; badge: string }
> = {
  scheduled:           { label: "Agendada",           color: "#2E7BC1", bg: "#EFF6FF", badge: "AGENDADA" },
  completed:           { label: "Realizada",           color: "#4CAF50", bg: "#F0FFF4", badge: "REALIZADA" },
  canceled_therapist:  { label: "Cancelado",           color: "#FF8C42", bg: "#FFF7ED", badge: "CANCELADO" },
  cancelled_family:    { label: "Cancelado família",   color: "#FF8C42", bg: "#FFF7ED", badge: "CANCELADO" },
  makeup:              { label: "Reposição",           color: "#8E6CCF", bg: "#F5F3FF", badge: "REPOSIÇÃO" },
  makeup_completed:    { label: "Reposição Realizada", color: "#2E7D32", bg: "#F0FFF4", badge: "REPOS. REAL." },
  justified_absence:   { label: "Falta Justificada",  color: "#FF5C7A", bg: "#FFF0F3", badge: "FALTA JUST." },
  unjustified_absence: { label: "Falta Injustificada", color: "#DC2626", bg: "#FEF2F2", badge: "FALTA" },
  reposta:             { label: "Reposta",             color: "#4A5568", bg: "#F7FAFC", badge: "REPOSTA" },
};

// For status-change dropdowns (AgendaDia, AtendimentosFiltros) — all selectable statuses
export const SESSION_STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: "scheduled",           label: "Agendada" },
  { value: "completed",           label: "Realizada" },
  { value: "canceled_therapist",  label: "Cancelado pela terapeuta" },
  { value: "cancelled_family",    label: "Cancelado pela família" },
  { value: "makeup",              label: "Reposição" },
  { value: "makeup_completed",    label: "Reposição Realizada" },
  { value: "justified_absence",   label: "Falta Justificada" },
  { value: "unjustified_absence", label: "Falta Injustificada" },
  // "reposta" is set automatically — not selectable
];

// For session creation form — no makeup_completed (can't create an already-completed session)
export const CREATE_STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: "scheduled",           label: "Agendada" },
  { value: "completed",           label: "Realizada" },
  { value: "canceled_therapist",  label: "Cancelado pela terapeuta" },
  { value: "cancelled_family",    label: "Cancelado pela família" },
  { value: "makeup",              label: "Reposição" },
  { value: "justified_absence",   label: "Falta Justificada" },
  { value: "unjustified_absence", label: "Falta Injustificada" },
];

// Status filter options for agenda views (includes "all" sentinel)
export const STATUS_FILTER_OPTIONS = [
  { value: "all",                 label: "Todos",               color: "#6B7280" },
  { value: "scheduled",          label: "Agendada",            color: "#2E7BC1" },
  { value: "completed",          label: "Realizada",           color: "#4CAF50" },
  { value: "canceled_therapist", label: "Cancelado",           color: "#FF8C42" },
  { value: "cancelled_family",   label: "Cancelado família",   color: "#FF8C42" },
  { value: "makeup",             label: "Reposição",           color: "#8E6CCF" },
  { value: "makeup_completed",   label: "Reposição Realizada", color: "#2E7D32" },
  { value: "justified_absence",  label: "Falta Justificada",   color: "#FF5C7A" },
  { value: "unjustified_absence",label: "Falta Injustificada", color: "#DC2626" },
  { value: "reposta",            label: "Reposta",             color: "#4A5568" },
];

// Statuses that require an absence/cancellation note
export const NEEDS_NOTES: SessionStatus[] = [
  "unjustified_absence",
  "justified_absence",
  "canceled_therapist",
  "cancelled_family",
];

// Statuses eligible to be linked as the lost session in a makeup/reposition
export const LOST_STATUSES: SessionStatus[] = [
  "canceled_therapist",
  "cancelled_family",
  "justified_absence",
  "unjustified_absence",
];

// ─── Helper functions ─────────────────────────────────────────────────────────

export function statusLabel(status: string): string {
  return SESSION_STATUSES[status as SessionStatus]?.label ?? status;
}

export function statusBadge(status: string): string {
  return SESSION_STATUSES[status as SessionStatus]?.badge ?? status.toUpperCase();
}

// Returns Tailwind className string for badge/pill display
export function statusClassName(status: string): string {
  const map: Record<string, string> = {
    scheduled:           "bg-blue-50 text-blue-700 border border-blue-100",
    completed:           "bg-green-50 text-green-700 border border-green-100",
    canceled_therapist:  "bg-orange-50 text-orange-700 border border-orange-100",
    cancelled_family:    "bg-orange-50 text-orange-700 border border-orange-100",
    makeup:              "bg-purple-50 text-purple-700 border border-purple-100",
    makeup_completed:    "bg-green-50 text-[#2E7D32] border border-green-200",
    justified_absence:   "bg-red-50 text-[#FF5C7A] border border-red-100",
    unjustified_absence: "bg-red-50 text-red-700 border border-red-100",
    reposta:             "bg-gray-100 text-[#4A5568] border border-gray-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-500 border border-gray-200";
}

// Returns Tailwind className for card (used in list views)
export function statusCardClass(status: string): string {
  const map: Record<string, string> = {
    scheduled:           "bg-blue-50 border-l-2 border-blue-400 text-blue-900",
    completed:           "bg-green-50 border-l-2 border-green-500 text-green-900",
    canceled_therapist:  "bg-orange-50 border-l-2 border-orange-400 text-orange-900",
    cancelled_family:    "bg-orange-50 border-l-2 border-orange-400 text-orange-900",
    makeup:              "bg-purple-50 border-l-2 border-purple-400 text-purple-900",
    makeup_completed:    "bg-green-50 border-l-2 border-[#2E7D32] text-[#1B5E20]",
    justified_absence:   "bg-red-50 border-l-2 border-[#FF5C7A] text-red-900",
    unjustified_absence: "bg-red-50 border-l-2 border-red-400 text-red-900",
    reposta:             "bg-gray-100 border-l-2 border-[#4A5568] text-[#2D3748]",
  };
  return map[status] ?? "bg-gray-50 border-l-2 border-gray-300 text-gray-600";
}

// Returns inline style object for card (used in week grid and mobile list)
type CardStyle = { backgroundColor: string; borderLeftColor: string };

export function statusCardStyle(status: string): CardStyle {
  const s = SESSION_STATUSES[status as SessionStatus];
  if (s) return { backgroundColor: s.bg, borderLeftColor: s.color };
  // Fallback: orange so unknown statuses are always visible in the grid
  return { backgroundColor: "#FFF7ED", borderLeftColor: "#F97316" };
}
