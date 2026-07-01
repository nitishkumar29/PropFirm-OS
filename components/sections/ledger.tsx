"use client";

import { useMemo, useState } from "react";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";

export function LedgerSection() {
  const { payouts, settings } = useFinanceStore();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    return payouts.filter((payout) => `${payout.firm} ${payout.notes} ${payout.paymentMethod}`.toLowerCase().includes(lower));
  }, [payouts, query]);

  return (
    <div className="space-y-4 rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-400">Ledger</p>
          <p className="text-lg font-semibold text-white">Professional finance spreadsheet</p>
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ledger" className="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-300 outline-none" />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-slate-950/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Date</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Firm</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Method</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-900/70">
            {filtered.map((payout) => (
              <tr key={payout.id} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3 text-slate-300">{formatDate(payout.date)}</td>
                <td className="px-4 py-3 text-white">{payout.firm}</td>
                <td className="px-4 py-3 text-emerald-300">{formatCurrency(payout.amount, settings.currency)}</td>
                <td className="px-4 py-3 text-slate-300">{payout.paymentMethod}</td>
                <td className="px-4 py-3 text-slate-400">{payout.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
