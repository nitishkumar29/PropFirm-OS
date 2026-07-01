"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeDollarSign, Brain, PiggyBank, TrendingUp, Wallet2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { useMemo } from "react";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getAllocationBreakdown, getDashboardMetrics } from "@/lib/metrics";

export function DashboardSection() {
  const { accounts, payouts, brokers, brokerTransactions, settings, setActiveSection } = useFinanceStore();

  const metrics = useMemo(() => getDashboardMetrics(accounts, payouts, brokers, brokerTransactions), [accounts, payouts, brokers, brokerTransactions]);
  const topFirm = useMemo(() => {
    const fundTotals = accounts.reduce((map, account) => {
      map.set(account.firm, (map.get(account.firm) ?? 0) + account.currentBalance);
      return map;
    }, new Map<string, number>());
    return Array.from(fundTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No active firm";
  }, [accounts]);
  const roi = metrics.currentCash > 0 ? (((metrics.netWorth - metrics.currentCash) / metrics.currentCash) * 100).toFixed(1) : "0.0";

  const monthly = useMemo(() => {
    const map = new Map<string, { payouts: number; savings: number }>();
    payouts.forEach((payout) => {
      const label = new Date(payout.date).toLocaleString("en-US", { month: "short" });
      const existing = map.get(label) ?? { payouts: 0, savings: 0 };
      map.set(label, {
        payouts: existing.payouts + payout.amount,
        savings: existing.savings + (payout.allocations.find((item) => item.category === "Savings")?.amount ?? 0),
      });
    });
    return Array.from(map.entries()).map(([name, values]) => ({ name, ...values })).slice(-6);
  }, [payouts]);

  const allocation = useMemo(() => getAllocationBreakdown(payouts), [payouts]);
  const allocationPalette = ["#4ade80", "#60a5fa", "#a78bfa", "#f59e0b", "#f472b6", "#06b6d4", "#fb923c", "#64748b"];

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-950/80 p-5 shadow-[0_20px_60px_rgba(2,8,23,0.35)]">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Operating command center</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Your trading business feels calm, measured, and ready to scale.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Track payouts, capital flow, account health, and broker movement from one premium workspace designed for fast decisions.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => setActiveSection("PropFirm AI")} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white">
                <Brain className="h-4 w-4" />
                Ask the AI
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => setActiveSection("Payouts")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
                Review payouts
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active focus</p>
                <p className="text-lg font-semibold text-white">{topFirm}</p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">Live</div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Accounts passed", value: metrics.passed },
                { label: "Broker balance", value: formatCurrency(metrics.brokerBalance, settings.currency) },
                { label: "ROI", value: `${roi}%` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Lifetime Payout", value: formatCurrency(metrics.lifetimePayout, settings.currency), icon: BadgeDollarSign, accent: "from-emerald-500/20 to-cyan-500/20" },
          { title: "Broker Deposits", value: formatCurrency(metrics.brokerDeposits, settings.currency), icon: Wallet2, accent: "from-indigo-500/20 to-sky-500/20" },
          { title: "Net Worth", value: formatCurrency(metrics.netWorth, settings.currency), icon: TrendingUp, accent: "from-fuchsia-500/20 to-pink-500/20" },
          { title: "Savings", value: formatCurrency(metrics.savings, settings.currency), icon: PiggyBank, accent: "from-amber-500/20 to-orange-500/20" },
        ].map(({ title, value, icon: Icon, accent }) => (
          <motion.div key={title} whileHover={{ y: -4, scale: 1.01 }} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4 shadow-lg">
            <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${accent} p-2`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Monthly Payout</p>
              <p className="text-lg font-semibold text-white">Performance pulse</p>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">+18.7%</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="payout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Area type="monotone" dataKey="payouts" stroke="#2dd4bf" fill="url(#payout)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-4">
            <p className="text-sm text-slate-400">Capital Allocation</p>
            <p className="text-lg font-semibold text-white">Where capital flows</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocation} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={3}>
                  {allocation.map((entry, index) => <Cell key={entry.name} fill={allocationPalette[index % allocationPalette.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Account Intelligence</p>
              <p className="text-lg font-semibold text-white">Execution health</p>
            </div>
            <div className="text-sm text-cyan-300">ROI {roi}%</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Accounts Passed", value: metrics.passed },
              { label: "Broker Balance", value: formatCurrency(metrics.brokerBalance, settings.currency) },
              { label: "Overall Profit", value: formatCurrency(metrics.overallProfit, settings.currency) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-4">
            <p className="text-sm text-slate-400">Recent Flow</p>
            <p className="text-lg font-semibold text-white">Latest payouts</p>
          </div>
          <div className="space-y-3">
            {payouts.slice(0, 3).map((payout) => (
              <div key={payout.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="font-medium text-white">{payout.firm}</p>
                  <p className="text-sm text-slate-400">{formatDate(payout.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-300">{formatCurrency(payout.amount, settings.currency)}</p>
                  <p className="text-sm text-slate-400">{payout.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
