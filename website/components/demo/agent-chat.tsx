"use client";

import { ArrowUp, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AgentMessage } from "../chat/agent-message";
import { cx } from "../ui";
import { useDemo } from "./context";

export function AgentChat() {
  const { state, messages, typing, ask, agentOpen, setAgentOpen, go } = useDemo();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, agentOpen]);

  useEffect(() => {
    if (agentOpen) inputRef.current?.focus();
  }, [agentOpen]);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    ask(text);
    setDraft("");
  };

  return (
    <>
      {!agentOpen && (
        <button
          type="button"
          onClick={() => setAgentOpen(true)}
          className="fixed bottom-5 right-5 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-sm font-medium text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] hover:bg-black/85"
        >
          <Sparkles size={16} /> Ask the hiring agent
        </button>
      )}
      <aside
        aria-label="Hiring agent"
        aria-hidden={!agentOpen}
        className={cx(
          "fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-line bg-white shadow-[0_0_60px_-20px_rgba(0,0,0,0.25)] transition-transform duration-300 sm:w-[420px]",
          agentOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-white"><Sparkles size={15} /></span>
            <div>
              <p className="text-sm font-semibold leading-tight">Hiring agent</p>
              <p className="text-xs text-muted">Works on {state.org.name}&apos;s demo data</p>
            </div>
          </div>
          <button type="button" aria-label="Close agent" onClick={() => setAgentOpen(false)} className="grid h-9 w-9 place-items-center rounded-control text-muted hover:bg-wash hover:text-ink">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={cx("animate-rise flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cx("max-w-[88%]", m.role === "user" && "rounded-[18px] rounded-br-md bg-ink px-3.5 py-2.5 text-sm text-white")}>
                {m.role === "user" ? (
                  m.text
                ) : (
                  <AgentMessage message={m} isLast={m.id === messages[messages.length - 1].id} compact />
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-1 px-1" aria-label="Agent is typing">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted" />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="shrink-0 border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <div className="flex items-end gap-2 rounded-[18px] border border-line px-3 py-2 focus-within:border-ink">
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              aria-label="Message the hiring agent"
              placeholder="Ask anything about your hiring…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              className="max-h-32 min-h-6 flex-1 resize-none bg-transparent py-1 text-sm placeholder:text-subtle focus:outline-none"
            />
            <button type="submit" aria-label="Send" disabled={!draft.trim() || typing} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-white disabled:opacity-30">
              <ArrowUp size={16} />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-subtle">A scripted preview of the agent, using sample data.</p>
        </form>
      </aside>
    </>
  );
}
