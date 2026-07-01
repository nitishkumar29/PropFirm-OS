"use client";

import { useMemo } from "react";
import { useFinanceStore } from "@/lib/store";

const days = Array.from({ length: 365 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (364 - index));
  const value = Math.sin(index / 20) * 10 + 40;
  return {
    date: date.toISOString().slice(0, 10),
    value: Math.max(0, Math.min(100, Math.round(value))),
    trades: 3 + (index % 5),
    profit: index % 4 === 0 ? 180 : index % 5 === 1 ? -90 : 60,
    broker: index % 2 === 0 ? "IC Markets" : "Exness",
    propFirm: index % 3 === 0 ? "FTMO" : "FundingPips",
    payout: index % 3 === 0 ? 500 : 0,
    deposits: index % 2 === 0 ? 300 : 0,
    withdrawals: index % 5 === 0 ? 100 : 0,
  };
});

function getColor(value: number) {
  if (value >= 80) return "#14532d";
  if (value >= 60) return "#166534";
  if (value >= 40) return "#ca8a04";
  if (value >= 20) return "#c2410c";
  return "#991b1b";
}

export function HeatmapSection() {
  const { settings } = useFinanceStore();
  const months = useMemo(() => {
    const grouped: Array<{ month: string; days: typeof days }> = [];
    let index = 0;
    while (index < days.length) {
      const month = new Date(days[index].date).toLocaleString("en-US", { month: "short" });
      const start = index;
      while (index < days.length && new Date(days[index].date).toLocaleString("en-US", { month: "short" }) === month) {
        index += 1;
      }
      grouped.push({ month, days: days.slice(start, index) });
    }
    return grouped;
  }, []);

  return (
    <div className="space-y-4 rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
      <div>
        <p className="text-sm text-slate-400">Activity Heatmap</p>
        <p className="text-lg font-semibold text-white">Trading business cadence</p>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {months.map((group) => (
            <div key={group.month} className="min-w-[220px]">
              <p className="mb-2 text-sm text-slate-400">{group.month}</p>
              <div className="grid grid-cols-7 gap-1">
                {group.days.map((day) => (
                  <div
                    key={day.date}
                    className="h-4 w-4 rounded-[4px]"
                    style={{ backgroundColor: getColor(day.value) }}
                    title={`${day.date}: Trades ${day.trades} • P/L ${settings.currency === "USD" ? "$" : "₹"}${day.profit}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
