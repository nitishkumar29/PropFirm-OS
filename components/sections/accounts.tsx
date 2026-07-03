"use client";

import { motion } from "framer-motion";
import { Plus, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";

const accountStatusOptions = [
  "Active",
  "Passed",
  "Failed",
  "Pending",
  "Live Account",
  "Breached",
  "Phase 1",
  "Phase 2",
  "Challenge",
] as const;

const accountSchema = z
  .object({
    firm: z.string().min(1, "Select a prop firm."),
    size: z.number().min(1, "Account size must be greater than zero."),
    challengeType: z.enum(["One-Step", "Two-Step", "Instant Funding"]),
    platform: z.string().min(1, "Enter the trading platform."),
    status: z.enum(accountStatusOptions, "Choose the current stage."),
    purchaseDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid purchase date."),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.challengeType === "Instant Funding" && data.status !== "Live Account") {
      ctx.addIssue({ code: "custom", path: ["status"], message: "Instant Funding accounts must be Live Account." });
    }

    const oneStepStages = ["Challenge", "Live Account", "Passed", "Failed", "Breached"];
    const twoStepStages = ["Phase 1", "Phase 2", "Live Account", "Passed", "Failed", "Breached"];

    if (data.challengeType === "One-Step" && !oneStepStages.includes(data.status)) {
      ctx.addIssue({ code: "custom", path: ["status"], message: "Select a valid One Step stage." });
    }

    if (data.challengeType === "Two-Step" && !twoStepStages.includes(data.status)) {
      ctx.addIssue({ code: "custom", path: ["status"], message: "Select a valid Two Step stage." });
    }
  });

type AccountFormValues = z.infer<typeof accountSchema>;

const stageOptions = {
  "One-Step": ["Challenge", "Live Account", "Passed", "Failed", "Breached"],
  "Two-Step": ["Phase 1", "Phase 2", "Live Account", "Passed", "Failed", "Breached"],
};

function generateAccountNumber(firm: string, size: number, existingAccounts: Array<{ firm: string; size: number; accountNumber?: string }>) {
  const firmSlug = firm.replace(/[^A-Za-z0-9]/g, "").slice(0, 5).toUpperCase() || "ACC";
  const sequence = existingAccounts.filter((account) => account.firm === firm && account.size === size).length + 1;
  return `${firmSlug}-${Math.round(size / 1000)}K-${String(sequence).padStart(3, "0")}`;
}

export function AccountsSection() {
  const { accounts, settings, searchQuery, addAccount } = useFinanceStore();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<AccountFormValues>({
    defaultValues: {
      firm: "FundingPips",
      size: 100000,
      challengeType: "Two-Step",
      platform: "MT5",
      status: "Phase 1",
      purchaseDate: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const challengeType = useWatch({ control, name: "challengeType" });
  const status = useWatch({ control, name: "status" }) as (typeof accountStatusOptions)[number];

  useEffect(() => {
    if (challengeType === "Instant Funding") {
      setValue("status", "Live Account");
    }

    if (challengeType === "One-Step" && !stageOptions["One-Step"].includes(status)) {
      setValue("status", "Challenge");
    }

    if (challengeType === "Two-Step" && !stageOptions["Two-Step"].includes(status)) {
      setValue("status", "Phase 1");
    }
  }, [challengeType, status, setValue]);

  const filteredAccounts = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return accounts;
    return accounts.filter((account) => [account.firm, account.platform, account.status, account.notes].join(" ").toLowerCase().includes(term));
  }, [accounts, searchQuery]);

  const summary = useMemo(
    () => ({
      active: accounts.filter((account) => account.status === "Active").length,
      passed: accounts.filter((account) => account.status === "Passed").length,
      failed: accounts.filter((account) => account.status === "Failed").length,
    }),
    [accounts]
  );

  const onSubmit = (values: AccountFormValues) => {
    const parsed = accountSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AccountFormValues;
        setError(field, { type: "manual", message: issue.message });
      });
      return;
    }

    const accountNumber = generateAccountNumber(parsed.data.firm, parsed.data.size, accounts);

    if (accounts.some((account) => account.accountNumber === accountNumber)) {
      setError("firm", { type: "manual", message: "A matching account ID already exists. Adjust size or firm." });
      return;
    }

    addAccount({
      firm: parsed.data.firm,
      accountNumber,
      size: parsed.data.size,
      challengeType: parsed.data.challengeType,
      purchaseDate: parsed.data.purchaseDate,
      purchasePrice: 0,
      platform: parsed.data.platform,
      currentBalance: parsed.data.size,
      profit: 0,
      dailyDrawdown: 0,
      maxDrawdown: 0,
      status: parsed.data.status,
      notes: parsed.data.notes ?? "",
    });

    reset({
      firm: "FundingPips",
      size: 100000,
      challengeType: "Two-Step",
      platform: "MT5",
      status: "Phase 1",
      purchaseDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">Account Manager</p>
            <p className="text-lg font-semibold text-white">Current prop firm portfolio</p>
            <p className="mt-1 text-sm text-slate-400">Track every active, passed, and failed challenge without losing context.</p>
          </div>
          <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" />
            {showForm ? "Close form" : "Add Account"}
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

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Step 1</p>
                <p className="text-lg font-semibold text-white">Select Prop Firm</p>
                <select {...register("firm")} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">
                  {[
                    "FundingPips",
                    "FTMO",
                    "MyForexFunds",
                    "The5ers",
                    "FundedNext",
                    "True Forex Funds",
                    "Other",
                  ].map((firm) => (
                    <option key={firm} value={firm}>{firm}</option>
                  ))}
                </select>
                {errors.firm && <p className="mt-2 text-sm text-rose-400">{errors.firm.message}</p>}
              </div>

              <div>
                <p className="text-sm text-slate-400">Step 2</p>
                <p className="text-lg font-semibold text-white">Account Size</p>
                <input type="number" {...register("size", { valueAsNumber: true })} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
                {errors.size && <p className="mt-2 text-sm text-rose-400">{errors.size.message}</p>}
              </div>

              <div>
                <p className="text-sm text-slate-400">Step 3</p>
                <p className="text-lg font-semibold text-white">Challenge Type</p>
                <select {...register("challengeType")} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">
                  {[
                    "One-Step",
                    "Two-Step",
                    "Instant Funding",
                  ].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.challengeType && <p className="mt-2 text-sm text-rose-400">{errors.challengeType.message}</p>}
              </div>

              {challengeType !== "Instant Funding" ? (
                <div>
                  <p className="text-sm text-slate-400">Current Stage</p>
                  <select {...register("status")} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">
                    {stageOptions[challengeType].map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                  {errors.status && <p className="mt-2 text-sm text-rose-400">{errors.status.message}</p>}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-sm text-slate-400">Current Stage</p>
                  <p className="mt-2 text-lg font-semibold text-white">Live Account</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Platform</p>
                <input type="text" {...register("platform")} placeholder="MT5, MT4, cTrader, etc." className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
                {errors.platform && <p className="mt-2 text-sm text-rose-400">{errors.platform.message}</p>}
              </div>
              <div>
                <p className="text-sm text-slate-400">Purchase Date</p>
                <input type="date" {...register("purchaseDate")} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
                {errors.purchaseDate && <p className="mt-2 text-sm text-rose-400">{errors.purchaseDate.message}</p>}
              </div>
              <div>
                <p className="text-sm text-slate-400">Notes</p>
                <textarea {...register("notes")} rows={4} placeholder="Optional notes" className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <button type="submit" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white">
                Save account
              </button>
            </div>
          </div>
        </form>
      )}

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
