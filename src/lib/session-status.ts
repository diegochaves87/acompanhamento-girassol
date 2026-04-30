export type SessionStatus =
  | "scheduled"
  | "completed"
  | "unjustified_absence"
  | "justified_absence"
  | "makeup"
  | "holiday"
  | "cancelled_therapist"
  | "cancelled_family";

export const SESSION_STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: "scheduled", label: "Agendada" },
  { value: "completed", label: "Realizada" },
  { value: "unjustified_absence", label: "Falta injustificada" },
  { value: "justified_absence", label: "Falta justificada" },
  { value: "makeup", label: "Reposição" },
  { value: "holiday", label: "Feriado" },
  { value: "cancelled_therapist", label: "Cancelada pela terapeuta" },
  { value: "cancelled_family", label: "Cancelada pela família" },
];

export const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  scheduled: {
    label: "Agendada",
    className: "bg-blue-50 text-blue-700 border border-blue-100",
  },
  completed: {
    label: "Realizada",
    className: "bg-green-50 text-green-700 border border-green-100",
  },
  unjustified_absence: {
    label: "Falta injustificada",
    className: "bg-red-50 text-red-700 border border-red-100",
  },
  justified_absence: {
    label: "Falta justificada",
    className: "bg-amber-50 text-amber-700 border border-amber-100",
  },
  makeup: {
    label: "Reposição",
    className: "bg-purple-50 text-purple-700 border border-purple-100",
  },
  holiday: {
    label: "Feriado",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
  },
  cancelled_therapist: {
    label: "Cancelada pela terapeuta",
    className: "bg-orange-50 text-orange-700 border border-orange-100",
  },
  cancelled_family: {
    label: "Cancelada pela família",
    className: "bg-orange-50 text-orange-700 border border-orange-100",
  },
};

export const NEEDS_NOTES: SessionStatus[] = [
  "unjustified_absence",
  "justified_absence",
  "cancelled_therapist",
  "cancelled_family",
];

export function statusLabel(status: string): string {
  return STATUS_CONFIG[status as SessionStatus]?.label ?? status;
}

export function statusClassName(status: string): string {
  return (
    STATUS_CONFIG[status as SessionStatus]?.className ??
    "bg-gray-100 text-gray-500 border border-gray-200"
  );
}
