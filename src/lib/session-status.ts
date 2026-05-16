export type SessionStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "unjustified_absence"
  | "justified_absence"
  | "makeup"
  | "makeup_completed"
  | "reposta"
  | "holiday"
  | "canceled_therapist"
  | "cancelled_family";

export const SESSION_STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: "scheduled", label: "Agendada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Realizada" },
  { value: "unjustified_absence", label: "Falta injustificada" },
  { value: "justified_absence", label: "Falta justificada" },
  { value: "makeup", label: "Reposição" },
  { value: "makeup_completed", label: "Reposição realizada" },
  { value: "holiday", label: "Feriado" },
  { value: "canceled_therapist", label: "Cancelada pela terapeuta" },
  { value: "cancelled_family", label: "Cancelada pela família" },
  // "reposta" is set automatically — not selectable by the user
];

export const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; className: string; badge: string; cardClass: string }
> = {
  scheduled: {
    label: "Agendada",
    className: "bg-blue-50 text-blue-700 border border-blue-100",
    badge: "AGENDADO",
    cardClass: "bg-blue-50 border-l-2 border-blue-400 text-blue-900",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-teal-50 text-teal-700 border border-teal-100",
    badge: "CONFIRMADO",
    cardClass: "bg-teal-50 border-l-2 border-teal-500 text-teal-900",
  },
  completed: {
    label: "Realizada",
    className: "bg-green-50 text-green-700 border border-green-100",
    badge: "FINALIZADO",
    cardClass: "bg-green-50 border-l-2 border-green-500 text-green-900",
  },
  unjustified_absence: {
    label: "Falta injustificada",
    className: "bg-red-50 text-red-700 border border-red-100",
    badge: "FALTA",
    cardClass: "bg-red-50 border-l-2 border-red-400 text-red-900",
  },
  justified_absence: {
    label: "Falta justificada",
    className: "bg-amber-50 text-amber-700 border border-amber-100",
    badge: "FALTA JUST.",
    cardClass: "bg-amber-50 border-l-2 border-amber-400 text-amber-900",
  },
  makeup: {
    label: "Reposição",
    className: "bg-purple-50 text-purple-700 border border-purple-100",
    badge: "REPOSIÇÃO",
    cardClass: "bg-purple-50 border-l-2 border-purple-400 text-purple-900",
  },
  makeup_completed: {
    label: "Reposição realizada",
    className: "bg-green-50 text-[#2E7D32] border border-green-200",
    badge: "REPOSIÇÃO REALIZADA",
    cardClass: "bg-green-50 border-l-2 border-[#2E7D32] text-[#1B5E20]",
  },
  reposta: {
    label: "Reposta",
    className: "bg-gray-100 text-[#4A5568] border border-gray-200",
    badge: "REPOSTA",
    cardClass: "bg-gray-100 border-l-2 border-[#4A5568] text-[#2D3748]",
  },
  holiday: {
    label: "Feriado",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
    badge: "FERIADO",
    cardClass: "bg-gray-50 border-l-2 border-gray-300 text-gray-500",
  },
  canceled_therapist: {
    label: "Cancelada pela terapeuta",
    className: "bg-orange-50 text-orange-700 border border-orange-100",
    badge: "CANCELADO",
    cardClass: "bg-gray-50 border-l-2 border-gray-200 text-gray-400",
  },
  cancelled_family: {
    label: "Cancelada pela família",
    className: "bg-orange-50 text-orange-700 border border-orange-100",
    badge: "CANCELADO",
    cardClass: "bg-gray-50 border-l-2 border-gray-200 text-gray-400",
  },
};

export const NEEDS_NOTES: SessionStatus[] = [
  "unjustified_absence",
  "justified_absence",
  "canceled_therapist",
  "cancelled_family",
];

export const LOST_STATUSES: SessionStatus[] = [
  "unjustified_absence",
  "justified_absence",
  "canceled_therapist",
  "cancelled_family",
  "holiday",
];

function inferLabel(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("cancel")) return "Cancelada";
  if (s.includes("falta") || s.includes("absence") || s.includes("ausencia")) return "Falta";
  if (s.includes("feriado") || s.includes("holiday")) return "Feriado";
  if (s.includes("repos")) return "Reposição";
  if (s.includes("realiz") || s.includes("complet")) return "Realizada";
  return status;
}

function inferBadge(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("cancel")) return "CANCELADO";
  if (s.includes("falta") || s.includes("absence") || s.includes("ausencia")) return "FALTA";
  if (s.includes("feriado") || s.includes("holiday")) return "FERIADO";
  if (s.includes("repos")) return "REPOSIÇÃO";
  if (s.includes("realiz") || s.includes("complet")) return "REALIZADO";
  return status.toUpperCase();
}

function inferCardStyle(status: string): CardStyle {
  const s = status.toLowerCase();
  if (s.includes("cancel")) return { backgroundColor: "#FFF0F3", borderLeftColor: "#FF5C7A" };
  if (s.includes("falta") || s.includes("absence") || s.includes("ausencia")) return { backgroundColor: "#FEF2F2", borderLeftColor: "#DC2626" };
  if (s.includes("feriado") || s.includes("holiday")) return { backgroundColor: "#F9FAFB", borderLeftColor: "#D1D5DB" };
  if (s.includes("repos")) return { backgroundColor: "#F5F3FF", borderLeftColor: "#8B5CF6" };
  return { backgroundColor: "#FFF7ED", borderLeftColor: "#F97316" };
}

export function statusLabel(status: string): string {
  return STATUS_CONFIG[status as SessionStatus]?.label ?? inferLabel(status);
}

export function statusClassName(status: string): string {
  if (STATUS_CONFIG[status as SessionStatus]) {
    return STATUS_CONFIG[status as SessionStatus].className;
  }
  const s = status.toLowerCase();
  if (s.includes("cancel")) return "bg-orange-50 text-orange-700 border border-orange-100";
  if (s.includes("falta") || s.includes("absence")) return "bg-red-50 text-red-700 border border-red-100";
  return "bg-gray-100 text-gray-500 border border-gray-200";
}

export function statusBadge(status: string): string {
  return STATUS_CONFIG[status as SessionStatus]?.badge ?? inferBadge(status);
}

export function statusCardClass(status: string): string {
  return (
    STATUS_CONFIG[status as SessionStatus]?.cardClass ??
    "bg-orange-50 border-l-2 border-orange-300 text-gray-700"
  );
}

type CardStyle = { backgroundColor: string; borderLeftColor: string };

const CARD_STYLES: Record<SessionStatus, CardStyle> = {
  scheduled:           { backgroundColor: "#EFF6FF", borderLeftColor: "#2E7BC1" },
  confirmed:           { backgroundColor: "#F0FFF4", borderLeftColor: "#4CAF50" },
  completed:           { backgroundColor: "#F3F4F6", borderLeftColor: "#9CA3AF" },
  unjustified_absence: { backgroundColor: "#FEF2F2", borderLeftColor: "#DC2626" },
  justified_absence:   { backgroundColor: "#FFF7ED", borderLeftColor: "#F59E0B" },
  makeup:              { backgroundColor: "#F5F3FF", borderLeftColor: "#8B5CF6" },
  makeup_completed:    { backgroundColor: "#F0FDF4", borderLeftColor: "#2E7D32" },
  reposta:             { backgroundColor: "#F7FAFC", borderLeftColor: "#4A5568" },
  holiday:             { backgroundColor: "#F9FAFB", borderLeftColor: "#D1D5DB" },
  canceled_therapist:  { backgroundColor: "#FFF0F3", borderLeftColor: "#FF5C7A" },
  cancelled_family:    { backgroundColor: "#FFF0F3", borderLeftColor: "#FF5C7A" },
};

export function statusCardStyle(status: string): CardStyle {
  return CARD_STYLES[status as SessionStatus] ?? inferCardStyle(status);
}
