"use client";

import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, addEdge, Connection, useEdgesState, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import { useMemo } from "react";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

const nodeColors: Record<string, string> = {
  Payout: "#10b981",
  Account: "#3b82f6",
  Passed: "#f59e0b",
  Savings: "#a78bfa",
  Expense: "#fb923c",
  Donation: "#f472b6",
  Equipment: "#06b6d4",
  "Broker Deposit": "#6366f1",
  "Broker Withdrawal": "#34d399",
  Loss: "#ef4444",
  "Trading Profit": "#84cc16",
  Transfer: "#64748b",
  Reinvest: "#818cf8",
  Investment: "#8b5cf6",
  "Home / Family": "#fb923c",
  "Self Investment": "#f472b6",
  Other: "#94a3b8",
};

function FlowCanvas() {
  const { payouts, accounts, flowNodes, settings } = useFinanceStore();

  const initialNodes = useMemo(() => {
    const nodes = [...flowNodes].map((node, index) => ({
      id: node.id,
      data: { label: `${node.label}\n${formatCurrency(node.amount, settings.currency)}` },
      type: "default",
      position: { x: (index % 4) * 240, y: Math.floor(index / 4) * 220 },
      style: { background: nodeColors[node.type] ?? "#64748b", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: 12 },
    }));

    const payoutNodes = payouts.map((payout, index) => ({
      id: payout.id,
      data: { label: `${payout.firm}\n${formatCurrency(payout.amount, settings.currency)}` },
      type: "default",
      position: { x: 460 + (index % 3) * 220, y: 40 + Math.floor(index / 3) * 220 },
      style: { background: nodeColors.Payout, color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: 12 },
    }));

    const accountNodes = accounts.map((account, index) => ({
      id: `account-${account.id}`,
      data: { label: account.firm },
      type: "default",
      position: { x: 900 + (index % 2) * 220, y: 60 + Math.floor(index / 2) * 220 },
      style: { background: nodeColors.Account, color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: 12 },
    }));

    return [...nodes, ...payoutNodes, ...accountNodes];
  }, [accounts, flowNodes, payouts, settings.currency]);

  const initialEdges = useMemo(() => {
    const edges: Array<{ id: string; source: string; target: string; animated: boolean }> = [];
    flowNodes.forEach((node) => {
      if (node.parentId) edges.push({ id: `edge-${node.id}`, source: node.parentId, target: node.id, animated: true });
    });
    payouts.forEach((payout) => {
      const accountNodeId = `account-${accounts.find((account) => account.id === payout.accountId)?.id ?? accounts[0]?.id ?? "acc-1"}`;
      edges.push({ id: `payout-edge-${payout.id}`, source: payout.id, target: accountNodeId, animated: true });
    });
    return edges;
  }, [accounts, flowNodes, payouts]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[75vh] rounded-[24px] border border-white/10 bg-slate-900/70 p-2">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection: Connection) => setEdges((currentEdges) => addEdge(connection, currentEdges))}
        fitView
      >
        <Background gap={20} size={1} color="rgba(255,255,255,0.06)" />
        <MiniMap nodeColor={() => "#3b82f6"} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function FinancialFlowSection() {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
        <p className="text-sm text-slate-400">Financial Flow</p>
        <p className="text-lg font-semibold text-white">Infinite capital flow graph with broker-connected nodes</p>
      </div>
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}
