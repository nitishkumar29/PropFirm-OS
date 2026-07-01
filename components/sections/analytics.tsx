"use client";

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

const performance = [
  { name: "Jan", roi: 16, growth: 21 },
  { name: "Feb", roi: 19, growth: 26 },
  { name: "Mar", roi: 24, growth: 30 },
  { name: "Apr", roi: 31, growth: 38 },
  { name: "May", roi: 35, growth: 42 },
  { name: "Jun", roi: 42, growth: 49 },
];

export function AnalyticsSection() {
  const { payouts, settings } = useFinanceStore();
  const lifetimePayout = payouts.reduce((sum, payout) => sum + payout.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Average Payout", value: formatCurrency(lifetimePayout / Math.max(payouts.length, 1), settings.currency) },
          { label: "Growth Rate", value: "+42.1%" },
          { label: "Success Rate", value: "83%" },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">ROI Growth</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performance}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
                <YAxis tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Line type="monotone" dataKey="roi" stroke="#38bdf8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Capital Growth</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
                <YAxis tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Bar dataKey="growth" fill="#818cf8" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
