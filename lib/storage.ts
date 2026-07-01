import Dexie, { type Table } from "dexie";
import type { Account, AppSettings, BackupEntry, Broker, BrokerTransaction, FlowNodeModel, Payout } from "./types";

const STORAGE_KEY = "propfirm-os-storage";

interface PersistedStateSnapshot {
  accounts: Account[];
  payouts: Payout[];
  brokers: Broker[];
  brokerTransactions: BrokerTransaction[];
  flowNodes: FlowNodeModel[];
  settings: AppSettings;
  backupHistory: BackupEntry[];
}

class FinanceDatabase extends Dexie {
  accounts!: Table<Account, string>;
  payouts!: Table<Payout, string>;
  brokers!: Table<Broker, string>;
  brokerTransactions!: Table<BrokerTransaction, string>;
  flowNodes!: Table<FlowNodeModel, string>;
  settings!: Table<AppSettings, string>;
  snapshots!: Table<{ id: string; value: PersistedStateSnapshot }, string>;

  constructor() {
    super("propfirm-os-db");
    this.version(1).stores({
      accounts: "id",
      payouts: "id",
      brokers: "id",
      brokerTransactions: "id",
      flowNodes: "id",
      settings: "id",
      snapshots: "id",
    });
  }
}

export const financeDb = new FinanceDatabase();

export async function ensureDbReady() {
  await financeDb.open();
}

function normalizeSnapshot(value: Partial<PersistedStateSnapshot> | null | undefined): PersistedStateSnapshot {
  return {
    accounts: value?.accounts ?? [],
    payouts: value?.payouts ?? [],
    brokers: value?.brokers ?? [],
    brokerTransactions: value?.brokerTransactions ?? [],
    flowNodes: value?.flowNodes ?? [],
    settings: value?.settings ?? { theme: "dark", currency: "USD", autoBackup: true },
    backupHistory: value?.backupHistory ?? [],
  };
}

export async function loadPersistedSnapshot(): Promise<PersistedStateSnapshot | null> {
  await ensureDbReady();
  const saved = await financeDb.snapshots.get("main");
  if (saved?.value) {
    return normalizeSnapshot(saved.value as Partial<PersistedStateSnapshot>);
  }

  const legacy = window.localStorage.getItem(STORAGE_KEY);
  if (!legacy) return null;

  try {
    const parsed = JSON.parse(legacy) as Partial<PersistedStateSnapshot>;
    const normalized = normalizeSnapshot(parsed);
    await savePersistedSnapshot(normalized);
    window.localStorage.removeItem(STORAGE_KEY);
    return normalized;
  } catch {
    return null;
  }
}

export async function savePersistedSnapshot(snapshot: Partial<PersistedStateSnapshot>) {
  await ensureDbReady();
  const normalized = normalizeSnapshot(snapshot);
  await financeDb.snapshots.put({ id: "main", value: normalized });
}

export async function clearPersistedSnapshot() {
  await ensureDbReady();
  await financeDb.snapshots.delete("main");
  window.localStorage.removeItem(STORAGE_KEY);
}

export const indexedDbStorage = {
  getItem: async (name: string) => {
    if (name !== STORAGE_KEY) return null;
    const snapshot = await loadPersistedSnapshot();
    return snapshot ? JSON.stringify(snapshot) : null;
  },
  setItem: async (name: string, value: string) => {
    if (name !== STORAGE_KEY) return;
    try {
      const parsed = JSON.parse(value) as Partial<PersistedStateSnapshot>;
      await savePersistedSnapshot(parsed);
    } catch {
      // Ignore invalid storage writes
    }
  },
  removeItem: async (name: string) => {
    if (name === STORAGE_KEY) {
      await clearPersistedSnapshot();
    }
  },
};
