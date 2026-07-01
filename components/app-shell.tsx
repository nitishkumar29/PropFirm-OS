"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Brain,
  CandlestickChart,
  CircleDollarSign,
  CreditCard,
  Flame,
  Landmark,
  LayoutDashboard,
  LibraryBig,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFinanceStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { name: "Accounts", icon: Landmark, group: "Operations" },
  { name: "Payouts", icon: CircleDollarSign, group: "Operations" },
  { name: "Financial Flow", icon: Activity, group: "Operations" },
  { name: "Ledger", icon: LibraryBig, group: "Operations" },
  { name: "Analytics", icon: BarChart3, group: "Intelligence" },
  { name: "Broker Portfolio", icon: CandlestickChart, group: "Intelligence" },
  { name: "Capital Allocation", icon: Boxes, group: "Intelligence" },
  { name: "Heatmap", icon: Flame, group: "Intelligence" },
  { name: "Prop Firms", icon: Landmark, group: "Portfolio" },
  { name: "PropFirm AI", icon: Brain, group: "AI" },
  { name: "Settings", icon: Settings, group: "System" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { activeSection, setActiveSection, searchQuery, setSearchQuery, settings } = useFinanceStore();

  const currentSection = navigation.find((item) => item.name === activeSection) ?? navigation[0];

  const groupedNavigation = useMemo(() => {
    const groups: Record<string, typeof navigation> = {};
    navigation.forEach((item) => {
      groups[item.group] = groups[item.group] ? [...groups[item.group], item] : [item];
    });
    return Object.entries(groups).map(([title, items]) => ({ title, items }));
  }, []);

  return (
    <div className={cn("min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_35%),linear-gradient(135deg,_#060816_0%,_#0f172a_100%)] text-slate-100", settings.theme === "light" && "bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900") }>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-3 py-3 lg:px-6 lg:py-6">
        <div className="mb-3 block lg:hidden">
          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-950/75 p-3">
            <label className="flex-1 text-sm text-slate-200">
              <span className="sr-only">Select section</span>
              <select value={activeSection} onChange={(e) => setActiveSection(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none">
                {navigation.map((item) => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </select>
            </label>
            <button onClick={() => setCollapsed((value) => !value)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {collapsed ? "Expand" : "Collapse"}
            </button>
          </div>
        </div>
        <div className="flex flex-1 gap-4">
          <motion.aside
            initial={false}
            animate={{ width: collapsed ? 92 : 268 }}
            className={cn("hidden rounded-[30px] border border-white/10 bg-slate-950/75 p-3 shadow-[0_24px_80px_rgba(2,8,23,0.5)] backdrop-blur-2xl lg:flex lg:flex-col", settings.theme === "light" && "border-slate-200/80 bg-white/85")}
          >
          <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-500 p-2.5 shadow-lg shadow-cyan-500/20">
                <Wallet className="h-5 w-5" />
              </div>
              {!collapsed && (
                <div>
                  <p className="text-sm font-semibold">PropFirm OS</p>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Fintech OS</p>
                </div>
              )}
            </div>
            <button className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10" onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          <nav className="mt-6 flex-1 space-y-5">
            {groupedNavigation.map((group) => (
              <div key={group.title}>
                {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.33em] text-slate-500">{group.title}</p>}
                <div className="space-y-1.5">
                  {group.items.map(({ name, icon: Icon }) => {
                    const isActive = activeSection === name;
                    return (
                      <button
                        key={name}
                        onClick={() => setActiveSection(name)}
                        className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition-all", isActive ? "bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-white shadow-lg shadow-cyan-500/10" : "text-slate-400 hover:bg-white/5 hover:text-white", settings.theme === "light" && (isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"))}
                      >
                        <Icon className="h-4 w-4" />
                        {!collapsed && <span>{name}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="rounded-[20px] border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-200/70">Live signal</p>
            <p className="mt-2 font-semibold">Momentum +24.8%</p>
            <p className="mt-1 text-xs text-cyan-200/80">Your payout cadence is accelerating faster than last month.</p>
          </div>
        </motion.aside>

        <div className="flex-1 rounded-[30px] border border-white/10 bg-slate-950/70 p-3 shadow-[0_24px_80px_rgba(2,8,23,0.45)] backdrop-blur-2xl lg:p-5">
          <header className="mb-4 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-2.5">
                <currentSection.icon className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-300">{currentSection.group}</p>
                <h1 className="text-2xl font-semibold text-white">{activeSection}</h1>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 shadow-inner shadow-black/20">
                <Search className="h-4 w-4" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search accounts, payouts, brokers..." className="w-48 bg-transparent outline-none sm:w-56" />
              </label>
              <button onClick={() => setActiveSection("PropFirm AI")} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20">
                <Sparkles className="h-4 w-4" />
                Ask AI
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                <CreditCard className="h-4 w-4" />
                <span>{settings.currency}</span>
              </div>
            </div>
          </header>

          {children}
          </div>
        </div>
      </div>
    </div>
  );
}
