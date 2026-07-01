import type { Account, Broker, BrokerTransaction, Payout } from "./types";

export function getAllocationBreakdown(payouts: Payout[]) {
  const categories = new Map<string, number>();

  payouts.forEach((payout) => {
    payout.allocations.forEach((allocation) => {
      const current = categories.get(allocation.category) ?? 0;
      categories.set(allocation.category, current + allocation.amount);
    });
  });

  const total = Array.from(categories.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(categories.entries())
    .map(([name, value]) => ({
      name,
      value,
      percent: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((left, right) => right.value - left.value);
}

export function getDashboardMetrics(accounts: Account[], payouts: Payout[], brokers: Broker[], brokerTransactions: BrokerTransaction[]) {
  const lifetimePayout = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  const allocated = payouts.reduce((sum, payout) => sum + payout.allocations.reduce((allocationSum, allocation) => allocationSum + allocation.amount, 0), 0);
  const currentCash = accounts.reduce((sum, account) => sum + account.currentBalance, 0) + Math.max(lifetimePayout - allocated, 0);
  const savings = payouts.reduce((sum, payout) => sum + (payout.allocations.find((item) => item.category === "Savings")?.amount ?? 0), 0);
  const investments = payouts.reduce((sum, payout) => sum + (payout.allocations.find((item) => item.category === "Investment")?.amount ?? 0), 0);
  const equipment = payouts.reduce((sum, payout) => sum + (payout.allocations.find((item) => item.category === "Equipment")?.amount ?? 0), 0);
  const personalExpenses = payouts.reduce((sum, payout) => sum + (payout.allocations.find((item) => item.category === "Personal Expense")?.amount ?? 0), 0);
  const donations = payouts.reduce((sum, payout) => sum + (payout.allocations.find((item) => item.category === "Donation")?.amount ?? 0), 0);
  const brokerDeposits = brokerTransactions.filter((transaction) => transaction.type === "Deposit").reduce((sum, transaction) => sum + transaction.amount, 0);
  const brokerWithdrawals = brokerTransactions.filter((transaction) => transaction.type === "Withdrawal").reduce((sum, transaction) => sum + transaction.amount, 0);
  const brokerBalance = brokers.reduce((sum, broker) => sum + broker.currentBalance, 0);
  const tradingProfit = brokerTransactions.filter((transaction) => transaction.type === "Profit").reduce((sum, transaction) => sum + transaction.amount, 0);
  const tradingLoss = brokerTransactions.filter((transaction) => transaction.type === "Loss").reduce((sum, transaction) => sum + transaction.amount, 0);
  const netWorth = currentCash + savings + investments + brokerBalance - personalExpenses - equipment - donations;
  const overallProfit = tradingProfit + accounts.reduce((sum, account) => sum + account.profit, 0);
  const overallRoi = lifetimePayout > 0 ? (overallProfit / lifetimePayout) * 100 : 0;

  return {
    lifetimePayout,
    currentCash,
    savings,
    investments,
    equipment,
    personalExpenses,
    donations,
    brokerDeposits,
    brokerWithdrawals,
    brokerBalance,
    tradingProfit,
    tradingLoss,
    netWorth,
    overallProfit,
    overallRoi,
    accounts: accounts.length,
    passed: accounts.filter((account) => account.status === "Passed").length,
    failed: accounts.filter((account) => account.status === "Failed").length,
    active: accounts.filter((account) => account.status === "Active").length,
    avgPayout: payouts.length ? lifetimePayout / payouts.length : 0,
  };
}

export function getBrokerMetrics(brokers: Broker[], brokerTransactions: BrokerTransaction[]) {
  const totalDeposits = brokerTransactions.filter((transaction) => transaction.type === "Deposit").reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalWithdrawals = brokerTransactions.filter((transaction) => transaction.type === "Withdrawal").reduce((sum, transaction) => sum + transaction.amount, 0);
  const netTradingProfit = brokerTransactions.filter((transaction) => transaction.type === "Profit").reduce((sum, transaction) => sum + transaction.amount, 0);
  const netTradingLoss = brokerTransactions.filter((transaction) => transaction.type === "Loss").reduce((sum, transaction) => sum + transaction.amount, 0);
  const currentBrokerBalance = brokers.reduce((sum, broker) => sum + broker.currentBalance, 0);
  const largestDeposit = brokerTransactions.filter((transaction) => transaction.type === "Deposit").reduce((max, transaction) => (transaction.amount > max ? transaction.amount : max), 0);
  const largestWithdrawal = brokerTransactions.filter((transaction) => transaction.type === "Withdrawal").reduce((max, transaction) => (transaction.amount > max ? transaction.amount : max), 0);
  const best = brokers.reduce((bestBroker, broker) => (broker.currentBalance > bestBroker.currentBalance ? broker : bestBroker), brokers[0]);
  const worst = brokers.reduce((worstBroker, broker) => (broker.currentBalance < worstBroker.currentBalance ? broker : worstBroker), brokers[0]);

  return {
    totalDeposits,
    totalWithdrawals,
    netTradingProfit,
    netTradingLoss,
    currentBrokerBalance,
    largestDeposit,
    largestWithdrawal,
    best,
    worst,
    winRate: brokers.length ? Math.round((netTradingProfit / Math.max(netTradingProfit + netTradingLoss, 1)) * 100) : 0,
    profitFactor: netTradingLoss > 0 ? Number((netTradingProfit / netTradingLoss).toFixed(2)) : netTradingProfit > 0 ? 1.5 : 0,
  };
}
