"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { getBrokerMetrics } from "@/lib/metrics";

export function BrokerPortfolioSection() {
  const { brokers, brokerTransactions, settings } = useFinanceStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const metrics = useMemo(() => getBrokerMetrics(brokers, brokerTransactions), [brokers, brokerTransactions]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Deposits", value: formatCurrency(metrics.totalDeposits, settings.currency) },
          { label: "Total Withdrawals", value: formatCurrency(metrics.totalWithdrawals, settings.currency) },
          { label: "Net Trading Profit", value: formatCurrency(metrics.netTradingProfit, settings.currency) },
          { label: "Current Broker Balance", value: formatCurrency(metrics.currentBrokerBalance, settings.currency) },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Broker Portfolio</p>
            <p className="text-lg font-semibold text-white">Every broker account, fully connected</p>
          </div>
          <button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            Add Broker
          </button>
        </div>

        <div className="grid gap-4">
          {brokers.map((broker) => {
            const isOpen = expanded === broker.id;
            return (
              <motion.article key={broker.id} whileHover={{ y: -2 }} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">{broker.platform}</p>
                    <h3 className="text-xl font-semibold text-white">{broker.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">#{broker.accountNumber}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">Balance {formatCurrency(broker.currentBalance, settings.currency)}</div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">Equity {formatCurrency(broker.equity, settings.currency)}</div>
                    <button className="rounded-full border border-white/10 p-2" onClick={() => setExpanded(isOpen ? null : broker.id)}>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-white" /> : <ChevronDown className="h-4 w-4 text-white" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                      <p className="text-sm text-slate-400">Floating P/L</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-300">{formatCurrency(broker.floatingPL, settings.currency)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                      <p className="text-sm text-slate-400">Profit / Loss</p>
                      <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(broker.profit, settings.currency)} / {formatCurrency(broker.loss, settings.currency)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                      <p className="text-sm text-slate-400">Leverage</p>
                      <p className="mt-1 text-lg font-semibold text-white">{broker.leverage}</p>
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
