"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { AFFIRMATIVE, respond, STARTER_PROMPTS } from "@/lib/demo/agent";
import { initialState } from "@/lib/demo/data";
import { reducer, type Action } from "@/lib/demo/store";
import type { DemoState, Screen } from "@/lib/demo/types";

export type Message = {
  id: number;
  role: "user" | "agent";
  text: string;
  steps?: string[];
  candidateIds?: string[];
  jobIds?: string[];
  suggestions?: string[];
  open?: Screen;
  widget?: "waitlist";
};

const GREETING: Message = {
  id: 0,
  role: "agent",
  text: "Hi! I'm the Filtrd hiring agent. Ask me to post a job, find your best candidates, or move someone to the next round.",
  suggestions: STARTER_PROMPTS,
};

type DemoContext = {
  state: DemoState;
  dispatch: (action: Action) => void;
  screen: Screen;
  go: (screen: Screen) => void;
  visitedCareer: boolean;
  simulating: boolean;
  simulate: () => void;
  messages: Message[];
  typing: boolean;
  ask: (text: string) => void;
  agentOpen: boolean;
  setAgentOpen: (open: boolean) => void;
  reset: () => void;
  mode: "tour" | "chat";
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
};

const Ctx = createContext<DemoContext | null>(null);

export function useDemo() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useDemo must be used inside DemoProvider");
  return value;
}

export function DemoProvider({ children, mode = "tour" }: { children: ReactNode; mode?: "tour" | "chat" }) {
  const seeded = mode === "chat";
  const [state, dispatch] = useReducer(reducer, { seeded }, initialState);
  const [screen, setScreen] = useState<Screen>(seeded ? { name: "dashboard" } : { name: "onboarding" });
  const [panelOpen, setPanelOpen] = useState(false);
  const [visitedCareer, setVisitedCareer] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [messages, setMessages] = useState<Message[]>(seeded ? [] : [GREETING]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const [typing, setTyping] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const nextMessageId = useRef(1);

  const go = useCallback(
    (next: Screen) => {
      setScreen(next);
      if (next.name === "career") setVisitedCareer(true);
      if (seeded) setPanelOpen(true);
      document.getElementById("demo-main")?.scrollTo({ top: 0 });
    },
    [seeded],
  );

  // Applicants arrive one at a time so scoring is visible as it happens.
  useEffect(() => {
    if (!simulating) return;
    const timer = setInterval(() => {
      const s = stateRef.current;
      const waiting = s.queue.some((a) => s.jobs.some((j) => j.id === a.jobId && j.status === "published"));
      if (!waiting) {
        setSimulating(false);
        return;
      }
      dispatch({ type: "arrive" });
    }, 650);
    return () => clearInterval(timer);
  }, [simulating]);

  const ask = useCallback(
    (text: string) => {
      const typed = text.trim();
      if (!typed) return;
      // "Yes" accepts whatever the agent last offered.
      const last = [...messagesRef.current].reverse().find((m) => m.role === "agent");
      const question = AFFIRMATIVE.test(typed) && last?.suggestions?.length ? last.suggestions[0] : typed;
      setMessages((m) => [...m, { id: nextMessageId.current++, role: "user", text: typed }]);
      setTyping(true);
      const reply = respond(question, stateRef.current);
      setTimeout(() => {
        reply.actions.forEach(dispatch);
        setMessages((m) => [...m, { id: nextMessageId.current++, role: "agent", ...reply }]);
        setTyping(false);
        if (!reply.open) return;
        if (!seeded) {
          go(reply.open);
          return;
        }
        // In chat, the workspace opens beside the conversation on wide screens; on phones it waits for a tap.
        setScreen(reply.open);
        if (reply.open.name === "career") setVisitedCareer(true);
        if (window.matchMedia("(min-width: 1024px)").matches) setPanelOpen(true);
      }, 600 + reply.steps.length * 280);
    },
    [go, seeded],
  );

  const reset = useCallback(() => {
    dispatch({ type: "reset", state: initialState({ seeded }) });
    setScreen(seeded ? { name: "dashboard" } : { name: "onboarding" });
    setVisitedCareer(false);
    setSimulating(false);
    setMessages(seeded ? [] : [GREETING]);
    setAgentOpen(false);
    setPanelOpen(false);
  }, [seeded]);

  const value = useMemo(
    () => ({ state, dispatch, screen, go, visitedCareer, simulating, simulate: () => setSimulating(true), messages, typing, ask, agentOpen, setAgentOpen, reset, mode, panelOpen, setPanelOpen }),
    [state, screen, go, visitedCareer, simulating, messages, typing, ask, agentOpen, reset, mode, panelOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
