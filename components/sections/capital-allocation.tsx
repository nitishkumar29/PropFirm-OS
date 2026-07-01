"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useMemo } from "react";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { getAllocationBreakdown } from "@/lib/metrics";

const palette = ["#4ade80", "#60a5fa", "#a78bfa", "#f59e0b", "#f472b6", "#06b6d4", "#fb923c", "#64748b"];

export function CapitalAllocationSection() {
  const { payouts, accounts, brokers, settings } = useFinanceStore();
  const breakdown = useMemo(() => getAllocationBreakdown(payouts), [payouts]);
  const lifetimePayout = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  const currentCash = accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  const brokerBalance = brokers.reduce((sum, broker) => sum + broker.currentBalance, 0);

  const summary = [
    { label: "Lifetime Payout", value: formatCurrency(lifetimePayout, settings.currency) },
    { label: "Accounts Purchased", value: formatCurrency(payouts.reduce((sum, payout) => sum + (payout.allocations.find((item) => item.category === "Broker Deposit")?.amount ?? 0), 0), settings.currency) },
    { label: "Broker Balance", value: formatCurrency(brokerBalance, settings.currency) },
    { label: "Current Cash", value: formatCurrency(currentCash, settings.currency) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Allocation Distribution</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown} innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={3}>
                  {breakdown.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Allocation Cards</p>
          <div className="mt-4 space-y-3">
            {breakdown.map((item, index) => (
              <motion.div key={item.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                    <span className="font-medium text-white">{item.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">{item.percent.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(item.percent, 100)}%`, backgroundColor: palette[index % palette.length] }} />
                </div>
                <p className="mt-2 text-sm text-slate-400">{formatCurrency(item.value, settings.currency)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
