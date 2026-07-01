"use client";

import { motion } from "framer-motion";
import { Plus, SearchX } from "lucide-react";
import { useMemo } from "react";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PayoutsSection() {
  const { payouts, settings, searchQuery } = useFinanceStore();

  const filteredPayouts = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return payouts;
    return payouts.filter((payout) => [payout.firm, payout.paymentMethod, payout.notes, payout.transactionId].join(" ").toLowerCase().includes(term));
  }, [payouts, searchQuery]);

  const summary = useMemo(() => {
    const total = payouts.reduce((sum, payout) => sum + payout.amount, 0);
    const average = payouts.length ? total / payouts.length : 0;
    const latest = [...payouts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0];
    return { total, average, latest };
  }, [payouts]);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">Payouts</p>
            <p className="text-lg font-semibold text-white">Every payout becomes a growth event</p>
            <p className="mt-1 text-sm text-slate-400">Review capital movement and allocation decisions in one smooth stream.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            Record Payout
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: "Total payout", value: formatCurrency(summary.total, settings.currency) },
            { label: "Average payout", value: formatCurrency(summary.average, settings.currency) },
            { label: "Latest payout", value: summary.latest ? `${summary.latest.firm} • ${formatDate(summary.latest.date)}` : "No payout" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {filteredPayouts.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-900/60 p-10 text-center">
          <SearchX className="mx-auto h-10 w-10 text-slate-500" />
          <p className="mt-4 text-lg font-semibold text-white">No matching payouts</p>
          <p className="mt-2 text-sm text-slate-400">Try a different keyword or record a new payout to keep the ledger fresh.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPayouts.map((payout) => (
            <motion.article key={payout.id} whileHover={{ y: -2 }} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">{payout.firm}</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{formatCurrency(payout.amount, settings.currency)}</h3>
                  <p className="mt-1 text-sm text-slate-400">{formatDate(payout.date)} • {payout.paymentMethod}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {payout.allocations.map((allocation) => (
                    <span key={allocation.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
                      {allocation.category}: {formatCurrency(allocation.amount, settings.currency)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">{payout.notes}</p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
