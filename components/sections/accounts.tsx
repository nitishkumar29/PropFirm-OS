"use client";

import { motion } from "framer-motion";
import { Plus, SearchX } from "lucide-react";
import { useMemo } from "react";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";

export function AccountsSection() {
  const { accounts, settings, searchQuery } = useFinanceStore();

  const filteredAccounts = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return accounts;
    return accounts.filter((account) => [account.firm, account.platform, account.status, account.notes].join(" ").toLowerCase().includes(term));
  }, [accounts, searchQuery]);

  const summary = useMemo(() => ({
    active: accounts.filter((account) => account.status === "Active").length,
    passed: accounts.filter((account) => account.status === "Passed").length,
    failed: accounts.filter((account) => account.status === "Failed").length,
  }), [accounts]);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">Account Manager</p>
            <p className="text-lg font-semibold text-white">Current prop firm portfolio</p>
            <p className="mt-1 text-sm text-slate-400">Track every active, passed, and failed challenge without losing context.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Active", value: summary.active },
            { label: "Passed", value: summary.passed },
            { label: "Failed", value: summary.failed },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-900/60 p-10 text-center">
          <SearchX className="mx-auto h-10 w-10 text-slate-500" />
          <p className="mt-4 text-lg font-semibold text-white">No matching accounts</p>
          <p className="mt-2 text-sm text-slate-400">Try adjusting the search or add a new account to grow the portfolio view.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredAccounts.map((account) => (
            <motion.article key={account.id} whileHover={{ y: -2 }} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">{account.platform}</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{account.firm}</h3>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">{account.status}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-slate-400">Account Size</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(account.size, settings.currency)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-slate-400">Current Balance</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(account.currentBalance, settings.currency)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-slate-400">Profit</p>
                  <p className="text-lg font-semibold text-emerald-300">{formatCurrency(account.profit, settings.currency)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-slate-400">Purchased</p>
                  <p className="text-lg font-semibold text-white">{formatDate(account.purchaseDate)}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">{account.notes}</p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
