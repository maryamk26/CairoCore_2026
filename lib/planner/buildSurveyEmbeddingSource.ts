import type { SurveyAnswers } from "@/lib/planner/survey";

export function buildSurveyEmbeddingSource(preferences: SurveyAnswers): string {
  const keys = Object.keys(preferences).sort();
  const lines: string[] = [];
  for (const k of keys) {
    const v = preferences[k];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      lines.push(`${k}: ${[...v].map(String).sort().join(", ")}`);
    } else {
      lines.push(`${k}: ${String(v)}`);
    }
  }
  return lines.join("\n");
}
