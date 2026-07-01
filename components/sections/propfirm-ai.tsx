"use client";

import { motion } from "framer-motion";
import { Bot, Send, Sparkles, Search, ChevronRight, MessageSquareText } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useFinanceStore } from "@/lib/store";
import { buildAssistantResponse, extractEntities, type ParsedQuery } from "@/lib/ai";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  content: string;
  meta?: string;
  cards?: Array<{ title: string; value: string; hint?: string }>;
}

const quickPrompts = [
  "Today's Summary",
  "Net Worth",
  "Broker Summary",
  "Monthly Report",
  "FundingPips Report",
  "Capital Allocation",
];

function answerQuestion(input: string, state: ReturnType<typeof useFinanceStore.getState>): ChatMessage {
  const parsed: ParsedQuery = extractEntities(input);
  const response = buildAssistantResponse(
    {
      accounts: state.accounts,
      payouts: state.payouts,
      brokers: state.brokers,
      brokerTransactions: state.brokerTransactions,
      settings: state.settings,
    },
    parsed
  );

  return createMessage({ role: "assistant", content: `${response.title}\n\n${response.content}`, cards: response.cards });
}

function createMessage(message: Omit<ChatMessage, "id">): ChatMessage {
  return {
    ...message,
    id: Date.now(),
    meta: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  };
}

export function PropFirmAISection() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "I’m connected to your portfolio data. Ask me anything about payouts, accounts, brokers, capital flow, or business health.",
      cards: [
        { title: "Net Worth", value: "$0" },
        { title: "Broker Balance", value: "$0" },
      ],
    },
  ]);
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const history = useMemo(() => messages.filter((message) => message.role === "user").map((message) => message.content), [messages]);

  const runPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const userMessage: ChatMessage = createMessage({ role: "user", content: trimmed });
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    const response = answerQuestion(trimmed, useFinanceStore.getState());
    window.setTimeout(() => {
      setMessages((current) => [...current, response]);
    }, 450);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">PropFirm AI</p>
            <p className="text-lg font-semibold text-white">Financial intelligence</p>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 p-2">
            <Bot className="h-4 w-4 text-cyan-300" />
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-3">
          <p className="text-sm text-slate-400">Suggested prompts</p>
          <div className="mt-3 space-y-2">
            {quickPrompts.map((prompt) => (
              <button key={prompt} onClick={() => runPrompt(prompt)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-left text-sm text-slate-300">
                <span>{prompt}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Conversation history</p>
            <button onClick={() => setHistoryOpen((value) => !value)} className="text-sm text-cyan-300">{historyOpen ? "Hide" : "Show"}</button>
          </div>
          {historyOpen && (
            <div className="mt-3 space-y-2">
              {history.length > 0 ? history.slice(-4).map((entry) => (
                <div key={entry} className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
                  {entry}
                </div>
              )) : <p className="text-sm text-slate-500">No prior questions yet.</p>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Assistant</p>
            <p className="text-lg font-semibold text-white">Grounded answers from your data</p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">Live</div>
        </div>

        <div className="flex h-[560px] flex-col rounded-[20px] border border-white/10 bg-slate-950/70 p-3">
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {messages.map((message) => (
              <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-[20px] border px-4 py-3 ${message.role === "user" ? "border-cyan-400/20 bg-cyan-500/10 text-white" : "border-white/10 bg-white/5 text-slate-200"}`}>
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    {message.role === "user" ? <MessageSquareText className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    {message.role === "user" ? "You" : "PropFirm AI"}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
                  {message.cards && (
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      {message.cards.map((card) => (
                        <div key={card.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{card.title}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{card.value}</p>
                          {card.hint && <p className="mt-1 text-xs text-slate-400">{card.hint}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {message.meta && <p className="mt-2 text-[11px] text-slate-500">{message.meta}</p>}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-[16px] border border-white/10 bg-slate-900/70 p-2">
            <Search className="ml-2 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runPrompt(draft);
              }}
              placeholder="Ask about payouts, brokers, accounts, net worth..."
              className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none"
            />
            <button onClick={() => runPrompt(draft)} className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 p-2 text-white">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
