"use client";

export type MonthBar = { label: string; value: number };

export default function BarChartMensal({ data }: { data: MonthBar[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2 h-44">
      {data.map((d) => {
        const pct = d.value / max;
        const barH = Math.max(pct * 128, d.value > 0 ? 4 : 0);
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center">
              {d.value > 0
                ? d.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                : ""}
            </span>
            <div className="flex-1 flex items-end w-full">
              <div
                className="w-full rounded-t-lg transition-all"
                style={{ height: `${barH}px`, backgroundColor: d.value > 0 ? "#4CAF50" : "#e5e7eb" }}
              />
            </div>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
