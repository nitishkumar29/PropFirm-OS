import type { Account, Broker, BrokerTransaction, Payout } from "./types";

export type IntentType =
  | "overview"
  | "count_payouts"
  | "payout_summary"
  | "savings_summary"
  | "account_status"
  | "broker_balance"
  | "broker_summary"
  | "max_payout"
  | "latest_payout"
  | "firm_summary"
  | "search"
  | "unknown";

export interface ExtractedEntities {
  propFirm?: string;
  broker?: string;
  accountNumber?: string;
  month?: string;
  year?: number;
  status?: string;
  transactionType?: string;
  minAmount?: number;
  maxAmount?: number;
  amountOperator?: "gte" | "lte";
  currency?: "USD" | "INR";
  topic?: string;
}

export interface ParsedQuery {
  intent: IntentType;
  entities: ExtractedEntities;
  filtersApplied: string[];
}

export interface AssistantResponse {
  title: string;
  content: string;
  cards: Array<{ title: string; value: string; hint?: string }>;
  details?: Array<{ label: string; value: string }>;
}

const pipelineSteps = [
  "User Question",
  "Intent Detection",
  "Entity Detection",
  "Database Search",
  "Filtering",
  "Aggregation",
  "Analysis",
  "Response Formatting",
];

const firmAliases: Record<string, string> = {
  fundingpips: "FundingPips",
  ftmo: "FTMO",
  myforexfunds: "MyForexFunds",
  the5ers: "The5ers",
  fundednext: "FundedNext",
  trueforexfunds: "True Forex Funds",
  alpha: "Alpha Capital",
  alphacapital: "Alpha Capital",
};

const brokerAliases: Record<string, string> = {
  "ic markets": "IC Markets",
  exness: "Exness",
  eightcap: "Eightcap",
  pepperstone: "Pepperstone",
  vantage: "Vantage",
  blackbull: "BlackBull",
};

const monthAliases: Record<string, string> = {
  january: "January",
  february: "February",
  march: "March",
  april: "April",
  may: "May",
  june: "June",
  july: "July",
  august: "August",
  september: "September",
  october: "October",
  november: "November",
  december: "December",
};

const statusAliases: Record<string, string> = {
  passed: "Passed",
  failed: "Failed",
  active: "Active",
  pending: "Pending",
};

const transactionTypes = ["deposit", "withdrawal", "profit", "loss", "commission", "swap", "transfer"] as const;

function normalizeAmount(value: string) {
  const cleaned = value.replace(/[$₹,]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseAccountNumber(input: string) {
  const match = input.match(/account(?: number| id)?\s*(?:[:#]?\s*)?([A-Za-z0-9-]{2,})/i);
  return match ? match[1] : undefined;
}

function matchAmount(input: string, entities: ExtractedEntities) {
  const amountRegex = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)|₹(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g;
  const matches = input.matchAll(amountRegex);
  const amounts = Array.from(matches, (match) => normalizeAmount(match[0] ?? "") ?? 0).filter(Boolean);
  if (amounts.length === 0) return entities;
  const target = amounts[0];
  const operator: "gte" | "lte" = /above|over|more than|greater than|at least/.test(input) ? "gte" : /below|under|less than|at most|up to/.test(input) ? "lte" : "gte";
  return { ...entities, minAmount: operator === "gte" ? target : undefined, maxAmount: operator === "lte" ? target : undefined, amountOperator: operator };
}

export function detectIntent(input: string): IntentType {
  const lower = input.toLowerCase();
  if (/(latest|newest|recent).*(payout|payment)/.test(lower) || /(latest payout|recent payout)/.test(lower)) return "latest_payout";
  if (/(net worth|today|summary|overview)/.test(lower)) return "overview";
  if (/(how many|count|number of)/.test(lower) && /(payout|payouts)/.test(lower)) return "count_payouts";
  if (/(how much|total|lifetime|amount)/.test(lower) && /(payout|payouts)/.test(lower)) return "payout_summary";
  if (/(savings|save|saved)/.test(lower)) return "savings_summary";
  if (/(passed|failed|active|pending)/.test(lower) && /(account|accounts)/.test(lower)) return "account_status";
  if (/(broker balance|current balance|balance)/.test(lower) && /(broker|brokers)/.test(lower)) return "broker_balance";
  if (/(deposit|withdraw|profit|loss|broker)/.test(lower)) return "broker_summary";
  if (/(highest|largest|max|maximum)/.test(lower) && /(payout|payouts)/.test(lower)) return "max_payout";
  if (/(prop firm|firm|portfolio)/.test(lower)) return "firm_summary";
  return "search";
}

export function extractEntities(input: string, priorEntities?: ExtractedEntities): ParsedQuery {
  const lower = input.toLowerCase();
  const entities: ExtractedEntities = { ...priorEntities };

  for (const [alias, canonical] of Object.entries(firmAliases)) {
    if (lower.includes(alias)) {
      entities.propFirm = canonical;
      break;
    }
  }

  for (const [alias, canonical] of Object.entries(brokerAliases)) {
    if (lower.includes(alias)) {
      entities.broker = canonical;
      break;
    }
  }

  for (const [alias, canonical] of Object.entries(statusAliases)) {
    if (lower.includes(alias)) {
      entities.status = canonical;
      break;
    }
  }

  for (const [alias, canonical] of Object.entries(monthAliases)) {
    if (lower.includes(alias)) {
      entities.month = canonical;
      break;
    }
  }

  const yearMatch = lower.match(/\b(20\d{2})\b/);
  if (yearMatch) entities.year = Number(yearMatch[1]);

  const accountNumber = parseAccountNumber(input);
  if (accountNumber) {
    entities.accountNumber = accountNumber;
  }

  for (const type of transactionTypes) {
    if (lower.includes(type)) {
      entities.transactionType = type.charAt(0).toUpperCase() + type.slice(1);
      break;
    }
  }

  if (/(usd|inr)/.test(lower)) {
    entities.currency = lower.includes("inr") ? "INR" : "USD";
  }

  const filtersApplied = [
    entities.propFirm ? `Prop firm: ${entities.propFirm}` : undefined,
    entities.broker ? `Broker: ${entities.broker}` : undefined,
    entities.accountNumber ? `Account: ${entities.accountNumber}` : undefined,
    entities.month ? `Month: ${entities.month}` : undefined,
    entities.year ? `Year: ${entities.year}` : undefined,
    entities.status ? `Status: ${entities.status}` : undefined,
    entities.transactionType ? `Type: ${entities.transactionType}` : undefined,
  ].filter(Boolean) as string[];

  return {
    intent: detectIntent(input),
    entities: matchAmount(input, entities),
    filtersApplied,
  };
}

function matchesMonth(date: string, month?: string) {
  if (!month) return true;
  return new Date(date).toLocaleString("en-US", { month: "long" }) === month;
}

function matchesYear(date: string, year?: number) {
  if (!year) return true;
  return new Date(date).getFullYear() === year;
}

function matchesAmount(value: number, entities: ExtractedEntities) {
  if (entities.minAmount !== undefined && value < entities.minAmount) return false;
  if (entities.maxAmount !== undefined && value > entities.maxAmount) return false;
  return true;
}

export function buildAssistantResponse(state: { accounts: Account[]; payouts: Payout[]; brokers: Broker[]; brokerTransactions: BrokerTransaction[]; settings: { currency: "USD" | "INR" } }, query: ParsedQuery): AssistantResponse {
  const filters = query.filtersApplied;
  const hasScope = Boolean(
    query.entities.propFirm ||
    query.entities.broker ||
    query.entities.accountNumber ||
    query.entities.month ||
    query.entities.year ||
    query.entities.status ||
    query.entities.transactionType ||
    query.entities.minAmount !== undefined ||
    query.entities.maxAmount !== undefined
  );

  if (!hasScope) {
    return {
      title: "Need a narrower scope",
      content: `I follow this pipeline: ${pipelineSteps.join(" → ")}\n\nI need a specific scope before I can answer from your records. Add a prop firm, broker, account, month, status, or transaction type to continue.`,
      cards: [{ title: "Scope Required", value: "Specify a firm, broker, or account" }],
    };
  }

  let payouts = state.payouts;
  let accounts = state.accounts;
  let brokers = state.brokers;
  let transactions = state.brokerTransactions;

  if (query.entities.propFirm) {
    payouts = payouts.filter((payout) => payout.firm === query.entities.propFirm);
    accounts = accounts.filter((account) => account.firm === query.entities.propFirm);
  }

  if (query.entities.accountNumber) {
    accounts = accounts.filter((account) => account.accountNumber?.toLowerCase() === query.entities.accountNumber?.toLowerCase());
    payouts = payouts.filter((payout) => payout.accountId && accounts.some((account) => account.id === payout.accountId));
  }

  if (query.entities.month) {
    payouts = payouts.filter((payout) => matchesMonth(payout.date, query.entities.month));
    transactions = transactions.filter((transaction) => matchesMonth(transaction.date, query.entities.month));
  }

  if (query.entities.year) {
    payouts = payouts.filter((payout) => matchesYear(payout.date, query.entities.year));
    transactions = transactions.filter((transaction) => matchesYear(transaction.date, query.entities.year));
  }

  const sortedPayouts = [...payouts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  if (query.entities.status) {
    accounts = accounts.filter((account) => account.status === query.entities.status);
  }

  if (query.entities.transactionType) {
    transactions = transactions.filter((transaction) => transaction.type === query.entities.transactionType);
  }

  if (query.entities.minAmount !== undefined || query.entities.maxAmount !== undefined) {
    payouts = payouts.filter((payout) => matchesAmount(payout.amount, query.entities));
    transactions = transactions.filter((transaction) => matchesAmount(transaction.amount, query.entities));
  }

  if (query.entities.broker) {
    const brokerMatch = brokers.find((broker) => broker.name === query.entities.broker);
    if (brokerMatch) {
      transactions = transactions.filter((transaction) => transaction.brokerId === brokerMatch.id);
      brokers = brokers.filter((broker) => broker.id === brokerMatch.id);
    } else {
      brokers = [];
      transactions = [];
    }
  }

  if (payouts.length === 0 && accounts.length === 0 && transactions.length === 0 && brokers.length === 0) {
    return {
      title: "No matching records found",
      content: filters.length > 0 ? `I filtered your data to the request and found no matching records for ${filters.join(", ")}.` : "I filtered the records and found no matching entries for your request.",
      cards: [{ title: "Result", value: "No matching records found" }],
    };
  }

  const lifetimePayout = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  const latestPayout = sortedPayouts[0];
  const largestPayout = payouts.reduce((largest, payout) => (payout.amount > largest.amount ? payout : largest), payouts[0] ?? { amount: 0, date: "", firm: "" });
  const savingsAllocated = payouts.reduce((sum, payout) => sum + (payout.allocations.find((item) => item.category === "Savings")?.amount ?? 0), 0);
  const brokerDeposits = transactions.filter((transaction) => transaction.type === "Deposit").reduce((sum, transaction) => sum + transaction.amount, 0);
  const brokerWithdrawals = transactions.filter((transaction) => transaction.type === "Withdrawal").reduce((sum, transaction) => sum + transaction.amount, 0);
  const brokerBalance = brokers.reduce((sum, broker) => sum + broker.currentBalance, 0);
  const activeAccounts = accounts.filter((account) => account.status === "Active").length;
  const passedAccounts = accounts.filter((account) => account.status === "Passed").length;

  if (query.intent === "count_payouts") {
    return {
      title: `${query.entities.propFirm ?? "Portfolio"} Payout Summary`,
      content: `Filtered to ${filters.length > 0 ? filters.join(", ") : "the current request"}.`,
      cards: [
        { title: "Total Payouts", value: String(payouts.length) },
        { title: "Lifetime Payout", value: `${state.settings.currency === "USD" ? "$" : "₹"}${lifetimePayout.toLocaleString()}` },
        { title: "Largest Payout", value: `${state.settings.currency === "USD" ? "$" : "₹"}${largestPayout.amount.toLocaleString()}` },
      ],
    };
  }

  if (query.intent === "latest_payout") {
    return {
      title: `Latest Payout`,
      content: latestPayout
        ? `The latest payout was recorded on ${latestPayout.date} from ${latestPayout.firm}.`
        : `No payouts were found for the requested scope.`,
      cards: [
        { title: "Latest payout", value: latestPayout ? `${latestPayout.firm} • ${state.settings.currency === "USD" ? "$" : "₹"}${latestPayout.amount.toLocaleString()}` : "None" },
        { title: "Recorded date", value: latestPayout ? latestPayout.date : "N/A" },
      ],
    };
  }

  if (query.intent === "broker_balance" || query.entities.broker) {
    return {
      title: `${query.entities.broker ?? "Broker"} Overview`,
      content: `Broker-level summary for the selected scope.`,
      cards: [
        { title: "Balance", value: `${state.settings.currency === "USD" ? "$" : "₹"}${brokerBalance.toLocaleString()}` },
        { title: "Deposits", value: `${state.settings.currency === "USD" ? "$" : "₹"}${brokerDeposits.toLocaleString()}` },
        { title: "Withdrawals", value: `${state.settings.currency === "USD" ? "$" : "₹"}${brokerWithdrawals.toLocaleString()}` },
      ],
      details: brokers.map((broker) => ({ label: broker.name, value: `${state.settings.currency === "USD" ? "$" : "₹"}${broker.currentBalance.toLocaleString()}` })),
    };
  }

  if (query.intent === "account_status") {
    return {
      title: `${query.entities.propFirm ?? "Accounts"} Status`,
      content: `Filtered account records are summarized below.`,
      cards: [
        { title: "Passed", value: String(passedAccounts) },
        { title: "Active", value: String(activeAccounts) },
        { title: "Failed", value: String(accounts.filter((account) => account.status === "Failed").length) },
      ],
    };
  }

  if (query.intent === "savings_summary") {
    return {
      title: `${query.entities.propFirm ?? "Portfolio"} Savings Summary`,
      content: `The savings allocation from the filtered payouts is shown below.`,
      cards: [
        { title: "Savings Allocated", value: `${state.settings.currency === "USD" ? "$" : "₹"}${savingsAllocated.toLocaleString()}` },
        { title: "Payouts Included", value: String(payouts.length) },
        { title: "Latest Payout", value: latestPayout ? `${latestPayout.firm} • ${latestPayout.date}` : "No payout found" },
      ],
    };
  }

  return {
    title: `${query.entities.propFirm ?? query.entities.broker ?? "Portfolio"} Summary`,
    content: `Filtered to ${filters.length > 0 ? filters.join(", ") : "the requested scope"}.\n- Total payouts: ${payouts.length}\n- Lifetime payout: ${state.settings.currency === "USD" ? "$" : "₹"}${lifetimePayout.toLocaleString()}\n- Savings from these payouts: ${state.settings.currency === "USD" ? "$" : "₹"}${savingsAllocated.toLocaleString()}`,
    cards: [
      { title: "Total Payouts", value: String(payouts.length) },
      { title: "Savings", value: `${state.settings.currency === "USD" ? "$" : "₹"}${savingsAllocated.toLocaleString()}` },
      { title: "Broker Balance", value: `${state.settings.currency === "USD" ? "$" : "₹"}${brokerBalance.toLocaleString()}` },
    ],
    details: [
      { label: "Filtered Records", value: `${payouts.length} payout(s), ${accounts.length} account(s), ${transactions.length} transaction(s)` },
      { label: "Recommendation", value: query.entities.propFirm ? `Focus on the ${query.entities.propFirm} pipeline for the next growth cycle.` : "Use the filtered view to target the strongest revenue stream." },
    ],
  };
}
