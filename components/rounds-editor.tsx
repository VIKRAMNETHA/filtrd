"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { RoundInput, RoundKind } from "@/lib/types";
import { Button, Input, Select } from "./ui";

export function RoundsEditor({
  rounds,
  onChange,
  disabled,
}: {
  rounds: RoundInput[];
  onChange: (rounds: RoundInput[]) => void;
  disabled?: boolean;
}) {
  const update = (index: number, patch: Partial<RoundInput>) =>
    onChange(rounds.map((round, i) => (i === index ? { ...round, ...patch } : round)));
  const move = (index: number, delta: number) => {
    const next = [...rounds];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className="@container space-y-3">
      {rounds.map((round, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2 @lg:flex-nowrap">
          <span className="w-5 shrink-0 text-center font-mono text-xs text-subtle">{index + 1}</span>
          <Input
            className="min-w-0 flex-1"
            aria-label={`Round ${index + 1} name`}
            value={round.name}
            disabled={disabled}
            onChange={(e) => update(index, { name: e.target.value })}
            placeholder="Technical interview"
          />
          <Select
            aria-label={`Round ${index + 1} type`}
            className="ml-7 !w-32 shrink-0 @lg:ml-0"
            value={round.kind}
            disabled={disabled}
            onChange={(e) => update(index, { kind: e.target.value as RoundKind })}
          >
            <option value="screening">Screening</option>
            <option value="assessment">Assessment</option>
            <option value="interview">Interview</option>
            <option value="final">Final</option>
          </Select>
          {!disabled && (
            <div className="ml-auto flex shrink-0 @lg:ml-0">
              <Button variant="ghost" size="sm" className="!px-2" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUp size={14} />
              </Button>
              <Button variant="ghost" size="sm" className="!px-2" aria-label="Move down" disabled={index === rounds.length - 1} onClick={() => move(index, 1)}>
                <ArrowDown size={14} />
              </Button>
              <Button variant="ghost" size="sm" className="!px-2" aria-label="Remove round" onClick={() => onChange(rounds.filter((_, i) => i !== index))}>
                <X size={14} />
              </Button>
            </div>
          )}
        </div>
      ))}
      {!disabled && (
        <Button variant="secondary" size="sm" className="mt-1" disabled={rounds.length >= 10} onClick={() => onChange([...rounds, { name: "", kind: "interview" }])}>
          <Plus size={14} /> Add round
        </Button>
      )}
    </div>
  );
}
