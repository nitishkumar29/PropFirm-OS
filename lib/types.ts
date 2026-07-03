export type AccountStatus = "Active" | "Passed" | "Failed" | "Pending" | "Live Account" | "Breached" | "Phase 1" | "Phase 2" | "Challenge";
export type ChallengeType = "Two-Step" | "One-Step" | "Instant Funding" | "Evaluation" | "Express";
export type Platform = string;
export type Currency = "USD" | "INR";
export type FlowNodeType = string;
export type BrokerStatus = "Active" | "Offline" | "Suspended";
export type BrokerTransactionType = "Deposit" | "Withdrawal" | "Profit" | "Loss" | "Commission" | "Swap" | "Transfer";

export interface Account {
  id: string;
  firm: string;
  accountNumber?: string;
  size: number;
  challengeType: ChallengeType;
  purchaseDate: string;
  purchasePrice: number;
  platform: Platform;
  currentBalance: number;
  profit: number;
  dailyDrawdown: number;
  maxDrawdown: number;
  status: AccountStatus;
  notes: string;
}

export interface AllocationItem {
  id: string;
  category: string;
  amount: number;
  notes: string;
  color: string;
}

export interface Payout {
  id: string;
  amount: number;
  date: string;
  firm: string;
  accountId: string;
  paymentMethod: string;
  transactionId: string;
  screenshot: string;
  notes: string;
  allocations: AllocationItem[];
}

export interface AppSettings {
  theme: "dark" | "light";
  currency: Currency;
  autoBackup: boolean;
}

export interface BackupEntry {
  id: string;
  timestamp: string;
  label: string;
  format: "json" | "csv" | "xlsx";
  size: number;
}

export interface Broker {
  id: string;
  name: string;
  accountNumber: string;
  platform: string;
  baseCurrency: string;
  currentBalance: number;
  equity: number;
  floatingPL: number;
  deposit: number;
  withdrawal: number;
  profit: number;
  loss: number;
  commission: number;
  swap: number;
  leverage: string;
  status: BrokerStatus;
  notes: string;
}

export interface BrokerTransaction {
  id: string;
  brokerId: string;
  date: string;
  type: BrokerTransactionType;
  amount: number;
  source: string;
  notes: string;
}

export interface FlowNodeModel {
  id: string;
  type: FlowNodeType;
  label: string;
  amount: number;
  date: string;
  notes: string;
  tags: string[];
  parentId?: string;
}

export interface FinanceState {
  accounts: Account[];
  payouts: Payout[];
  propFirms: string[];
  brokers: Broker[];
  brokerTransactions: BrokerTransaction[];
  flowNodes: FlowNodeModel[];
  settings: AppSettings;
  backupHistory: BackupEntry[];
  activeSection: string;
  searchQuery: string;
  addAccount: (account: Omit<Account, "id">) => void;
  addPropFirm: (firm: string) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  addPayout: (payout: Omit<Payout, "id">) => void;
  recordPayout: (payout: Omit<Payout, "id">) => void;
  updatePayout: (id: string, payout: Partial<Payout>) => void;
  addBroker: (broker: Omit<Broker, "id">) => void;
  updateBroker: (id: string, broker: Partial<Broker>) => void;
  addBrokerTransaction: (transaction: Omit<BrokerTransaction, "id">) => void;
  updateBrokerTransaction: (id: string, transaction: Partial<BrokerTransaction>) => void;
  addFlowNode: (node: Omit<FlowNodeModel, "id">) => void;
  updateFlowNode: (id: string, node: Partial<FlowNodeModel>) => void;
  deleteFlowNode: (id: string) => void;
  setActiveSection: (section: string) => void;
  setSearchQuery: (query: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  createBackup: (label?: string, format?: "json" | "csv" | "xlsx") => BackupEntry;
  restoreFromBackup: (snapshot: {
    accounts: Account[];
    payouts: Payout[];
    propFirms?: string[];
    brokers: Broker[];
    brokerTransactions: BrokerTransaction[];
    flowNodes: FlowNodeModel[];
    settings: AppSettings;
    backupHistory: BackupEntry[];
  }) => void;
}
