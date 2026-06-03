import type { TripProfile } from "@/lib/planner/tripProfile";

function line(key: string, value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const t = value.trim();
    return t ? `${key}: ${t}` : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return `${key}: ${value}`;
  if (Array.isArray(value)) {
    const items = value.map(String).map((s) => s.trim()).filter(Boolean);
    return items.length ? `${key}: ${items.join(", ")}` : null;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const parts = Object.entries(obj)
      .map(([k, v]) => line(k, v))
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    return parts.length ? `${key}: { ${parts.join("; ")} }` : null;
  }
  return `${key}: ${String(value)}`;
}

export function buildTripProfileRetrievalText(profile: TripProfile): string {
  const lines: string[] = [];

  const add = (k: string, v: unknown) => {
    const l = line(k, v);
    if (l) lines.push(l);
  };

  add("summary", profile.summary);
  add("categories", profile.categories);
  add("vibes", profile.vibes);
  add("budget_per_place", profile.budgetPerPlace);
  add("companions", profile.companions);
  add("visit_times", profile.visitTimes);
  add("pace", profile.pace);
  add("hard_constraints", profile.hardConstraints);
  add("soft_preferences", profile.softPreferences);
  add("wants_stop", profile.wantsStop);

  return lines.join("\n");
}

