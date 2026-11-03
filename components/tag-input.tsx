"use client";

import { X } from "lucide-react";
import { useState } from "react";

/** Comma or Enter separated tags. Pending text is committed on blur so nothing typed gets lost. */
export function TagInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = (text: string) => {
    const added = text.split(",").map((t) => t.trim()).filter((t) => t && !value.some((v) => v.toLowerCase() === t.toLowerCase()));
    if (added.length) onChange([...value, ...added]);
    setDraft("");
  };

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-control border border-line bg-white px-2 py-1.5 focus-within:border-ink">
      {value.map((tag) => (
        <span key={tag} className="inline-flex h-7 items-center gap-1 rounded-lg bg-wash pl-2.5 pr-1 text-[13px]">
          {tag}
          <button type="button" aria-label={`Remove ${tag}`} className="grid h-5 w-5 place-items-center rounded-md text-muted hover:bg-white hover:text-ink" onClick={() => onChange(value.filter((v) => v !== tag))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        aria-label={label}
        value={draft}
        placeholder={value.length ? "" : placeholder}
        onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setDraft(e.target.value))}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        className="h-7 min-w-28 flex-1 bg-transparent px-1.5 text-sm placeholder:text-subtle focus:outline-none"
      />
    </div>
  );
}
