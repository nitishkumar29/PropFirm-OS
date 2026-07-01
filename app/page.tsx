"use client";

import { AppShell } from "@/components/app-shell";
import { AccountsSection } from "@/components/sections/accounts";
import { AnalyticsSection } from "@/components/sections/analytics";
import { BrokerPortfolioSection } from "@/components/sections/broker-portfolio";
import { CapitalAllocationSection } from "@/components/sections/capital-allocation";
import { DashboardSection } from "@/components/sections/dashboard";
import { FinancialFlowSection } from "@/components/sections/financial-flow";
import { HeatmapSection } from "@/components/sections/heatmap";
import { LedgerSection } from "@/components/sections/ledger";
import { PropFirmsSection } from "@/components/sections/prop-firms";
import { PropFirmAISection } from "@/components/sections/propfirm-ai";
import { PayoutsSection } from "@/components/sections/payouts";
import { SettingsSection } from "@/components/sections/settings";
import { useFinanceStore } from "@/lib/store";

const sectionMap = {
  Dashboard: <DashboardSection />,
  Accounts: <AccountsSection />,
  Payouts: <PayoutsSection />,
  "Financial Flow": <FinancialFlowSection />,
  Ledger: <LedgerSection />,
  Analytics: <AnalyticsSection />,
  "Broker Portfolio": <BrokerPortfolioSection />,
  "Capital Allocation": <CapitalAllocationSection />,
  "Heatmap": <HeatmapSection />,
  "Prop Firms": <PropFirmsSection />,
  "PropFirm AI": <PropFirmAISection />,
  Settings: <SettingsSection />,
};

export default function Home() {
  const activeSection = useFinanceStore((state) => state.activeSection);

  return <AppShell>{sectionMap[activeSection as keyof typeof sectionMap] ?? <DashboardSection />}</AppShell>;
}
