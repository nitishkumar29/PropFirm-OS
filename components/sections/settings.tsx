"use client";

import { useCallback, type ChangeEvent } from "react";
import { useFinanceStore } from "@/lib/store";
import type { BackupEntry } from "@/lib/types";

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function SettingsSection() {
  const { settings, updateSettings, backupHistory, createBackup, restoreFromBackup, accounts, payouts, brokers, brokerTransactions, flowNodes } = useFinanceStore();

  const handleExport = useCallback((format: BackupEntry["format"]) => {
    const snapshot = {
      accounts,
      payouts,
      brokers,
      brokerTransactions,
      flowNodes,
      settings,
      backupHistory,
    };

    if (format === "json") {
      const text = JSON.stringify(snapshot, null, 2);
      downloadBlob(text, `propfirm-os-backup-${Date.now()}.json`, "application/json");
    }

    if (format === "csv") {
      const rows = ["type,id,amount,date,firm", ...payouts.map((payout) => `payout,${payout.id},${payout.amount},${payout.date},${payout.firm}`)];
      downloadBlob(rows.join("\n"), `propfirm-os-backup-${Date.now()}.csv`, "text/csv");
    }

    createBackup(`Exported ${format.toUpperCase()}`, format);
  }, [accounts, backupHistory, brokers, brokerTransactions, createBackup, flowNodes, payouts, settings]);

  const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        restoreFromBackup(parsed);
        createBackup(`Imported ${file.name}`, "json");
      } catch {
        window.alert("The selected file could not be restored.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }, [createBackup, restoreFromBackup]);

  return (
    <div className="space-y-4 rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
      <div>
        <p className="text-sm text-slate-400">Settings</p>
        <p className="text-lg font-semibold text-white">Control the operating environment</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-[20px] border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-sm text-slate-400">Theme</p>
          <select value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as "dark" | "light" })} className="w-full rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label className="rounded-[20px] border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-sm text-slate-400">Currency</p>
          <select value={settings.currency} onChange={(e) => updateSettings({ currency: e.target.value as "USD" | "INR" })} className="w-full rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white">
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </label>
      </div>

      <label className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div>
          <p className="font-medium text-white">Auto Backup</p>
          <p className="text-sm text-slate-400">Persist local snapshots for recovery</p>
        </div>
        <input type="checkbox" checked={settings.autoBackup} onChange={(e) => updateSettings({ autoBackup: e.target.checked })} className="h-4 w-4 rounded border-white/10 bg-slate-950" />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-sm text-slate-400">Backup & Restore</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleExport("json")} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Export JSON</button>
            <button onClick={() => handleExport("csv")} className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-300">Export CSV</button>
            <label className="cursor-pointer rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-white">
              Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-sm text-slate-400">Backup History</p>
          <div className="space-y-2">
            {backupHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No backups captured yet.</p>
            ) : (
              backupHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
                  <span>{entry.label}</span>
                  <span className="text-slate-500">{entry.format.toUpperCase()} • {new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
