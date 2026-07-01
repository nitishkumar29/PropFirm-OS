"use client";

import { motion } from "framer-motion";
import { ChevronRight, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export function PropFirmsSection() {
  const { accounts, payouts, settings } = useFinanceStore();

  const firms = useMemo(() => {
    const grouped = new Map<string, typeof accounts>();
    accounts.forEach((account) => {
      const current = grouped.get(account.firm) ?? [];
      current.push(account);
      grouped.set(account.firm, current);
    });

    return Array.from(grouped.entries()).map(([firm, entries]) => {
      const totalPayout = payouts.filter((payout) => payout.firm === firm).reduce((sum, payout) => sum + payout.amount, 0);
      const passed = entries.filter((entry) => entry.status === "Passed").length;
      const active = entries.filter((entry) => entry.status === "Active").length;
      const failed = entries.filter((entry) => entry.status === "Failed").length;
      return { firm, entries, totalPayout, passed, active, failed, successRate: Math.round((passed / Math.max(entries.length, 1)) * 100) };
    });
  }, [accounts, payouts]);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
        <p className="text-sm text-slate-400">Prop Firm Portfolio</p>
        <p className="text-lg font-semibold text-white">Premium firm-level performance cards</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {firms.map((firm) => (
          <motion.article key={firm.firm} whileHover={{ y: -2 }} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Prop Firm</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{firm.firm}</h3>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">{firm.successRate}% success</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-slate-400">Total Accounts</p>
                <p className="text-lg font-semibold text-white">{firm.entries.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-slate-400">Total Payout</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(firm.totalPayout, settings.currency)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-slate-400">Passed / Active</p>
                <p className="text-lg font-semibold text-white">{firm.passed} / {firm.active}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-slate-400">Failed</p>
                <p className="text-lg font-semibold text-white">{firm.failed}</p>
              </div>
            </div>
            <button className="mt-4 flex items-center gap-2 text-sm text-cyan-300">
              <TrendingUp className="h-4 w-4" />
              View details
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
