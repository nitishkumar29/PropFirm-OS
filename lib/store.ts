"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { indexedDbStorage } from "./storage";
import type { Account, AppSettings, BackupEntry, Broker, BrokerTransaction, FinanceState, FlowNodeModel, Payout } from "./types";

const defaultSettings: AppSettings = {
  theme: "dark",
  currency: "USD",
  autoBackup: true,
};

const initialAccounts: Account[] = [
  {
    id: "acc-1",
    firm: "FundingPips",
    size: 100000,
    challengeType: "Two-Step",
    purchaseDate: "2025-01-15",
    purchasePrice: 450,
    platform: "FundingPips",
    currentBalance: 30500,
    profit: 20500,
    dailyDrawdown: 4.3,
    maxDrawdown: 8.1,
    status: "Passed",
    notes: "High-conviction swing setup",
  },
  {
    id: "acc-2",
    firm: "FTMO",
    size: 200000,
    challengeType: "One-Step",
    purchaseDate: "2025-04-02",
    purchasePrice: 650,
    platform: "FTMO",
    currentBalance: 18200,
    profit: 8200,
    dailyDrawdown: 2.9,
    maxDrawdown: 6.8,
    status: "Active",
    notes: "Scalping plan in motion",
  },
];

const initialPayouts: Payout[] = [
  {
    id: "payout-1",
    amount: 2000,
    date: "2025-02-05",
    firm: "FundingPips",
    accountId: "acc-1",
    paymentMethod: "Wise",
    transactionId: "TXN-1001",
    screenshot: "",
    notes: "First payout after passing account",
    allocations: [
      { id: "a1", category: "Savings", amount: 800, color: "#4ade80" },
      { id: "a2", category: "Broker Deposit", amount: 700, color: "#60a5fa" },
      { id: "a3", category: "Equipment", amount: 500, color: "#f59e0b" },
    ],
  },
  {
    id: "payout-2",
    amount: 3500,
    date: "2025-05-14",
    firm: "FTMO",
    accountId: "acc-2",
    paymentMethod: "Bank Transfer",
    transactionId: "TXN-1002",
    screenshot: "",
    notes: "Reward for disciplined execution",
    allocations: [
      { id: "b1", category: "Investment", amount: 1200, color: "#a78bfa" },
      { id: "b2", category: "Savings", amount: 1100, color: "#4ade80" },
      { id: "b3", category: "Donation", amount: 400, color: "#f472b6" },
      { id: "b4", category: "Personal Expense", amount: 800, color: "#fb923c" },
    ],
  },
];

const initialBrokers: Broker[] = [
  {
    id: "broker-1",
    name: "IC Markets",
    accountNumber: "A-1001",
    platform: "MT4",
    baseCurrency: "USD",
    currentBalance: 2400,
    equity: 2850,
    floatingPL: 450,
    deposit: 1800,
    withdrawal: 1000,
    profit: 1250,
    loss: 120,
    commission: 45,
    swap: 12,
    leverage: "1:500",
    status: "Active",
    notes: "Primary trading account",
  },
];

const initialBrokerTransactions: BrokerTransaction[] = [
  { id: "tx-1", brokerId: "broker-1", date: "2025-01-01", type: "Deposit", amount: 1000, source: "FundingPips Payout #12", notes: "Initial funding" },
  { id: "tx-2", brokerId: "broker-1", date: "2025-01-02", type: "Profit", amount: 450, source: "FX trade", notes: "Profitable session" },
  { id: "tx-3", brokerId: "broker-1", date: "2025-01-05", type: "Loss", amount: 120, source: "FX trade", notes: "Temporary drawdown" },
  { id: "tx-4", brokerId: "broker-1", date: "2025-01-08", type: "Withdrawal", amount: 1000, source: "Savings", notes: "Moved to cash reserve" },
];

const initialFlowNodes: FlowNodeModel[] = [
  { id: "flow-1", type: "Payout", label: "FundingPips Payout", amount: 2000, date: "2025-02-05", notes: "Primary payout", tags: ["payout"], parentId: undefined },
  { id: "flow-2", type: "Broker Deposit", label: "IC Markets Deposit", amount: 700, date: "2025-02-06", notes: "Capital on broker", tags: ["broker"], parentId: "flow-1" },
  { id: "flow-3", type: "Trading Profit", label: "Broker Profit", amount: 450, date: "2025-02-09", notes: "Trading result", tags: ["profit"], parentId: "flow-2" },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      accounts: initialAccounts,
      payouts: initialPayouts,
      brokers: initialBrokers,
      brokerTransactions: initialBrokerTransactions,
      flowNodes: initialFlowNodes,
      settings: defaultSettings,
      backupHistory: [],
      activeSection: "Dashboard",
      searchQuery: "",
      addAccount: (account) =>
        set((state) => ({
          accounts: [...state.accounts, { ...account, id: crypto.randomUUID() }],
        })),
      updateAccount: (id, account) =>
        set((state) => ({
          accounts: state.accounts.map((entry) => (entry.id === id ? { ...entry, ...account } : entry)),
        })),
      addPayout: (payout) =>
        set((state) => ({
          payouts: [...state.payouts, { ...payout, id: crypto.randomUUID() }],
        })),
      recordPayout: (payout) =>
        set((state) => {
          const account = state.accounts.find((entry) => entry.id === payout.accountId);
          const firm = account?.firm ?? payout.firm;
          const newPayout = { ...payout, id: crypto.randomUUID(), firm };
          const newFlowNode: FlowNodeModel = {
            id: crypto.randomUUID(),
            type: "Payout",
            label: `${firm} payout`,
            amount: payout.amount,
            date: payout.date,
            notes: payout.notes,
            tags: ["payout"],
            parentId: account ? `account-${account.id}` : undefined,
          };
          return {
            payouts: [...state.payouts, newPayout],
            flowNodes: [...state.flowNodes, newFlowNode],
          };
        }),
      updatePayout: (id, payout) =>
        set((state) => ({
          payouts: state.payouts.map((entry) => (entry.id === id ? { ...entry, ...payout } : entry)),
        })),
      addBroker: (broker) =>
        set((state) => ({
          brokers: [...state.brokers, { ...broker, id: crypto.randomUUID() }],
        })),
      updateBroker: (id, broker) =>
        set((state) => ({
          brokers: state.brokers.map((entry) => (entry.id === id ? { ...entry, ...broker } : entry)),
        })),
      addBrokerTransaction: (transaction) =>
        set((state) => ({
          brokerTransactions: [...state.brokerTransactions, { ...transaction, id: crypto.randomUUID() }],
        })),
      updateBrokerTransaction: (id, transaction) =>
        set((state) => ({
          brokerTransactions: state.brokerTransactions.map((entry) => (entry.id === id ? { ...entry, ...transaction } : entry)),
        })),
      addFlowNode: (node) =>
        set((state) => ({
          flowNodes: [...state.flowNodes, { ...node, id: crypto.randomUUID() }],
        })),
      updateFlowNode: (id, node) =>
        set((state) => ({
          flowNodes: state.flowNodes.map((entry) => (entry.id === id ? { ...entry, ...node } : entry)),
        })),
      deleteFlowNode: (id) =>
        set((state) => ({
          flowNodes: state.flowNodes.filter((entry) => entry.id !== id),
        })),
      setActiveSection: (section) => set({ activeSection: section }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
      createBackup: (label = "Manual backup", format = "json") => {
        const entry: BackupEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          label,
          format,
          size: 1024 + Math.round(Math.random() * 500),
        };
        set((state) => ({ backupHistory: [entry, ...state.backupHistory].slice(0, 10) }));
        return entry;
      },
      restoreFromBackup: (snapshot) =>
        set(() => ({
          accounts: snapshot.accounts,
          payouts: snapshot.payouts,
          brokers: snapshot.brokers,
          brokerTransactions: snapshot.brokerTransactions,
          flowNodes: snapshot.flowNodes,
          settings: snapshot.settings,
          backupHistory: snapshot.backupHistory,
        })),
    }),
    {
      name: "propfirm-os-storage",
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        payouts: state.payouts,
        brokers: state.brokers,
        brokerTransactions: state.brokerTransactions,
        flowNodes: state.flowNodes,
        settings: state.settings,
        backupHistory: state.backupHistory,
      }),
    }
  )
);
