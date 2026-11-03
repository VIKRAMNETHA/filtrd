import { describe, expect, it } from "vitest";
import { keywordScore, type ScoringJob } from "@/lib/scoring";

const job: ScoringJob = {
  title: "AI Engineer",
  description: "Build production LLM systems and retrieval pipelines with Python.",
  requiredSkills: ["Python", "PyTorch", "C++", "Node.js"],
  niceSkills: ["Kubernetes"],
  experienceMin: 3,
  experienceMax: 6,
};

describe("keywordScore", () => {
  it("scores a strong resume above a weak one", () => {
    const strong = keywordScore(job, "AI engineer building production LLM retrieval pipelines in Python, PyTorch, C++ and Node.js on Kubernetes. 5 years.", 5);
    const weak = keywordScore(job, "Accountant preparing monthly financial statements and audits for retail clients.", 2);
    expect(strong.score).toBeGreaterThan(80);
    expect(weak.score).toBeLessThan(20);
    expect(strong.details.missingSkills).toEqual([]);
    expect(weak.details.missingSkills).toContain("Python");
  });

  it("matches skills on word boundaries, including symbols", () => {
    const result = keywordScore(job, "Pythonista who has read about torch. Knows C and Nodejs.", null);
    expect(result.details.matchedSkills).toEqual([]);
    expect(keywordScore(job, "Skilled in C++, and node.js.", null).details.matchedSkills).toEqual(["C++", "Node.js"]);
  });

  it("does not penalise experience above the range", () => {
    const text = "Python PyTorch";
    expect(keywordScore(job, text, 25).score).toBe(keywordScore(job, text, 5).score);
  });

  it("stays in range and rescales when the job lists no skills", () => {
    const bare: ScoringJob = { ...job, requiredSkills: [], niceSkills: [], experienceMin: null, experienceMax: null };
    const result = keywordScore(bare, "AI engineer building production LLM retrieval pipelines with Python systems.", null);
    expect(result.score).toBeGreaterThan(50);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.details.breakdown.reduce((sum, b) => sum + b.max, 0)).toBe(100);
  });
});
