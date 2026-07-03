"use client";

import { motion } from "framer-motion";
import { Plus, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Payout } from "@/lib/types";

const payoutSchema = z.object({
  accountId: z.string().min(1, "Select a live account."),
  amount: z.number().positive("Payout amount must be greater than zero."),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid payout date."),
  paymentMethod: z.string().min(1, "Enter a payment method."),
  transactionId: z.string().min(1, "Transaction ID is required."),
  notes: z.string().optional(),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

type AllocationRow = {
  id: string;
  category: string;
  amount: number;
  notes: string;
  color: string;
};

const allocationColors: Record<string, string> = {
  Reinvest: "#6366f1",
  Savings: "#4ade80",
  "Home / Family": "#f97316",
  "Self Investment": "#ec4899",
  Equipment: "#06b6d4",
  Donation: "#f472b6",
  "Broker Deposit": "#60a5fa",
  Investment: "#a78bfa",
  "Personal Expense": "#f59e0b",
  Other: "#94a3b8",
};

const defaultAllocationCategories = [
  "Reinvest",
  "Savings",
  "Home / Family",
  "Self Investment",
  "Equipment",
  "Donation",
  "Broker Deposit",
  "Investment",
  "Personal Expense",
  "Other",
];

function buildDefaultAllocations(amount: number) {
  const tentative = [
    { category: "Reinvest", ratio: 0.25 },
    { category: "Savings", ratio: 0.18 },
    { category: "Broker Deposit", ratio: 0.2 },
    { category: "Investment", ratio: 0.15 },
    { category: "Home / Family", ratio: 0.1 },
    { category: "Donation", ratio: 0.05 },
    { category: "Self Investment", ratio: 0.04 },
    { category: "Equipment", ratio: 0.03 },
  ];
  const allocations = tentative.map((entry) => ({
    id: crypto.randomUUID(),
    category: entry.category,
    amount: Math.max(0, Math.round(amount * entry.ratio)),
    notes: "",
    color: allocationColors[entry.category] ?? "#64748b",
  }));
  const allocated = allocations.reduce((sum, item) => sum + item.amount, 0);
  const remainder = amount - allocated;
  if (remainder > 0) {
    allocations[0].amount += remainder;
  }
  return allocations;
}

export function PayoutsSection() {
  const { payouts, accounts, settings, recordPayout } = useFinanceStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [allocationStep, setAllocationStep] = useState(false);
  const [pendingPayout, setPendingPayout] = useState<Omit<Payout, "id"> | null>(null);
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>([]);
  const [keepRemainingCash, setKeepRemainingCash] = useState(false);

  const liveAccounts = useMemo(() => accounts.filter((account) => account.status === "Live Account"), [accounts]);

  const filteredLiveAccounts = useMemo(() => {
    const term = accountSearch.toLowerCase().trim();
    if (!term) return liveAccounts;
    return liveAccounts.filter((account) =>
      [account.firm, account.platform, account.accountNumber ?? "", account.status].join(" ").toLowerCase().includes(term)
    );
  }, [accountSearch, liveAccounts]);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(liveAccounts[0]?.id ?? "");

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PayoutFormValues>({
    defaultValues: {
      accountId: liveAccounts[0]?.id ?? "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: "",
      transactionId: "",
      notes: "",
    },
  });

  const watchedAccountId = useWatch({ control, name: "accountId" });

  const allocatedTotal = allocationRows.reduce((sum, allocation) => sum + allocation.amount, 0);
  const payoutAmount = pendingPayout?.amount ?? 0;
  const remainingAmount = pendingPayout ? payoutAmount - allocatedTotal : 0;
  const percentageAllocated = pendingPayout && payoutAmount > 0 ? (allocatedTotal / payoutAmount) * 100 : 0;
  const hasMissingCategory = allocationRows.some((allocation) => allocation.category.trim().length === 0);
  const categoryNames = allocationRows.map((allocation) => allocation.category.trim().toLowerCase()).filter(Boolean);
  const hasDuplicateCategories = new Set(categoryNames).size !== categoryNames.length;
  const hasNegativeAllocation = allocationRows.some((allocation) => allocation.amount < 0);
  const canSaveAllocation = Boolean(
    pendingPayout &&
      remainingAmount >= 0 &&
      (remainingAmount === 0 || keepRemainingCash) &&
      !hasMissingCategory &&
      !hasDuplicateCategories &&
      !hasNegativeAllocation &&
      allocationRows.length > 0
  );

  const filteredPayouts = useMemo(() => {
    const term = accountSearch.toLowerCase().trim();
    if (!term) return payouts;
    return payouts.filter((payout) => [payout.firm, payout.paymentMethod, payout.notes, payout.transactionId].join(" ").toLowerCase().includes(term));
  }, [payouts, accountSearch]);

  const summary = useMemo(() => {
    const total = payouts.reduce((sum, payout) => sum + payout.amount, 0);
    const average = payouts.length ? total / payouts.length : 0;
    const latest = [...payouts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0];
    return { total, average, latest };
  }, [payouts]);

  const allocationDefaults = (amount: number) => buildDefaultAllocations(amount);

  const onSubmit = (values: PayoutFormValues) => {
    const parsed = payoutSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof PayoutFormValues;
        setError(field, { type: "manual", message: issue.message });
      });
      return;
    }

    const account = accounts.find((entry) => entry.id === parsed.data.accountId);
    if (!account) {
      setError("accountId", { type: "manual", message: "Selected account no longer exists." });
      return;
    }

    if (account.status !== "Live Account") {
      setError("accountId", { type: "manual", message: "Payouts can only be recorded for Live Accounts." });
      return;
    }

    if (payouts.some((payout) => payout.transactionId === parsed.data.transactionId)) {
      setError("transactionId", { type: "manual", message: "A payout with this transaction ID already exists." });
      return;
    }

    const defaultAllocations = buildDefaultAllocations(parsed.data.amount);
    setPendingPayout({
      accountId: parsed.data.accountId,
      amount: parsed.data.amount,
      date: parsed.data.date,
      firm: account.firm,
      paymentMethod: parsed.data.paymentMethod,
      transactionId: parsed.data.transactionId,
      screenshot: "",
      notes: parsed.data.notes ?? "",
      allocations: defaultAllocations,
    });
    setAllocationRows(defaultAllocations);
    setAllocationStep(true);
  };

  const addAllocationRow = () => {
    setAllocationRows((rows) => [
      ...rows,
      { id: crypto.randomUUID(), category: "", amount: 0, notes: "", color: "#94a3b8" },
    ]);
  };

  const updateAllocationRow = (id: string, field: keyof AllocationRow, value: string | number) => {
    setAllocationRows((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: field === "amount" ? Number(value) : String(value),
            }
          : row
      )
    );
  };

  const removeAllocationRow = (id: string) => {
    setAllocationRows((rows) => rows.filter((row) => row.id !== id));
  };

  const cancelAllocation = () => {
    setAllocationStep(false);
    setPendingPayout(null);
    setAllocationRows([]);
    setKeepRemainingCash(false);
  };

  const saveAllocation = () => {
    if (!pendingPayout || !canSaveAllocation) return;
    const allocations = allocationRows.map((row) => ({
      id: row.id,
      category: row.category.trim(),
      amount: row.amount,
      notes: row.notes,
      color: allocationColors[row.category] ?? row.color ?? "#94a3b8",
    }));

    recordPayout({
      ...pendingPayout,
      allocations,
    });

    reset({
      accountId: liveAccounts[0]?.id ?? "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: "",
      transactionId: "",
      notes: "",
    });
    setSelectedAccountId(liveAccounts[0]?.id ?? "");
    setAllocationStep(false);
    setPendingPayout(null);
    setAllocationRows([]);
    setKeepRemainingCash(false);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">Payouts</p>
            <p className="text-lg font-semibold text-white">Every payout becomes a growth event</p>
            <p className="mt-1 text-sm text-slate-400">Record payouts from live accounts with a smart linked workflow.</p>
          </div>
          <button onClick={() => setIsFormOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            {isFormOpen ? "Close payout" : "Record Payout"}
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

      {isFormOpen && !allocationStep && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Select a live account</p>
                    <p className="text-lg font-semibold text-white">Linked account search</p>
                  </div>
                  <span className="text-sm text-slate-400">{filteredLiveAccounts.length} live accounts</span>
                </div>
                <input
                  value={accountSearch}
                  onChange={(event) => setAccountSearch(event.target.value)}
                  placeholder="Search live accounts"
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <div className="grid gap-3">
                {filteredLiveAccounts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-slate-400">
                    No live accounts are available. Promote an account to Live Account to record a payout.
                  </div>
                ) : (
                  filteredLiveAccounts.map((account) => {
                    const isSelected = account.id === (watchedAccountId || selectedAccountId);
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setValue("accountId", account.id);
                        }}
                        className={`rounded-2xl border p-4 text-left transition ${isSelected ? "border-cyan-400 bg-cyan-500/10 text-white" : "border-white/10 bg-slate-950/70 text-slate-300"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">{account.firm}</p>
                            <h3 className="mt-1 text-lg font-semibold">{account.accountNumber}</h3>
                          </div>
                          <div className="rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-300">{account.platform}</div>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
                            <p className="text-xs text-slate-400">Size</p>
                            <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(account.size, settings.currency)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
                            <p className="text-xs text-slate-400">Balance</p>
                            <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(account.currentBalance, settings.currency)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
                            <p className="text-xs text-slate-400">Challenge</p>
                            <p className="mt-1 text-sm font-semibold text-white">{account.challengeType}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
                            <p className="text-xs text-slate-400">Stage</p>
                            <p className="mt-1 text-sm font-semibold text-white">{account.status}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              {errors.accountId && <p className="text-sm text-rose-400">{errors.accountId.message}</p>}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Payout Amount</p>
                <input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
                {errors.amount && <p className="mt-2 text-sm text-rose-400">{errors.amount.message}</p>}
              </div>
              <div>
                <p className="text-sm text-slate-400">Date</p>
                <input type="date" {...register("date")} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
                {errors.date && <p className="mt-2 text-sm text-rose-400">{errors.date.message}</p>}
              </div>
              <div>
                <p className="text-sm text-slate-400">Transaction ID</p>
                <input {...register("transactionId")} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
                {errors.transactionId && <p className="mt-2 text-sm text-rose-400">{errors.transactionId.message}</p>}
              </div>
              <div>
                <p className="text-sm text-slate-400">Payment Method</p>
                <input {...register("paymentMethod")} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
                {errors.paymentMethod && <p className="mt-2 text-sm text-rose-400">{errors.paymentMethod.message}</p>}
              </div>
              <div>
                <p className="text-sm text-slate-400">Notes</p>
                <textarea {...register("notes")} rows={4} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <button type="submit" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white">
                Save payout
              </button>
            </div>
          </div>
        </form>
      )}
      {isFormOpen && allocationStep && pendingPayout && (
        <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">Allocate this payout</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(pendingPayout.amount, settings.currency)}</p>
                <p className="mt-2 text-sm text-slate-400">{pendingPayout.firm} • {formatDate(pendingPayout.date)}</p>
                <p className="mt-4 text-sm text-slate-400">Transaction ID: {pendingPayout.transactionId}</p>
              </div>

              {allocationRows.map((row) => (
                <div key={row.id} className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_1.2fr_auto]">
                  <div>
                    <p className="text-sm text-slate-400">Category</p>
                    <input
                      value={row.category}
                      onChange={(event) => updateAllocationRow(row.id, "category", event.target.value)}
                      placeholder="Category name"
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Amount</p>
                    <input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={(event) => updateAllocationRow(row.id, "amount", Number(event.target.value))}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Notes</p>
                    <input
                      value={row.notes}
                      onChange={(event) => updateAllocationRow(row.id, "notes", event.target.value)}
                      placeholder="Optional notes"
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAllocationRow(row.id)}
                    className="mt-7 inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-rose-500/10 px-4 text-sm text-rose-300 transition hover:bg-rose-500/15"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={addAllocationRow}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Allocation
                </button>
                <label className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={keepRemainingCash}
                    onChange={(event) => setKeepRemainingCash(event.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-slate-950 text-cyan-500"
                  />
                  Keep Remaining Cash
                </label>
              </div>

              <div className="space-y-2">
                {hasMissingCategory && <p className="text-sm text-rose-400">All allocations must have a category name.</p>}
                {hasDuplicateCategories && <p className="text-sm text-rose-400">Duplicate categories are not allowed.</p>}
                {hasNegativeAllocation && <p className="text-sm text-rose-400">Allocation amounts must be zero or positive.</p>}
                {remainingAmount < 0 && <p className="text-sm text-rose-400">Allocated amount exceeds the payout total.</p>}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!canSaveAllocation}
                  onClick={saveAllocation}
                  className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition ${canSaveAllocation ? "bg-gradient-to-r from-cyan-500 to-indigo-500" : "bg-slate-700/60 cursor-not-allowed"}`}
                >
                  Save allocation
                </button>
                <button
                  type="button"
                  onClick={cancelAllocation}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-slate-950/70 px-5 py-3 text-sm font-semibold text-white"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Allocation summary</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-slate-400">Total payout</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(pendingPayout.amount, settings.currency)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-slate-400">Allocated</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(allocatedTotal, settings.currency)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-slate-400">Remaining</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(remainingAmount, settings.currency)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm text-slate-400">Allocation</p>
                  <p className="mt-2 text-lg font-semibold text-white">{percentageAllocated.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
