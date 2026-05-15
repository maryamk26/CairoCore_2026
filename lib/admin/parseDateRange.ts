export type ParsedAdminDateRange = {
  gte: Date;
  lte?: Date;
};

export function parseAdminDateRange(
  searchParams: URLSearchParams
): { ok: true; range: ParsedAdminDateRange } | { ok: false; error: string } {
  const raw = (searchParams.get("range") || "7d").toLowerCase();
  const now = new Date();

  if (raw === "24h") {
    return { ok: true, range: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
  }

  if (raw === "7d") {
    return { ok: true, range: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
  }

  if (raw === "30d") {
    return { ok: true, range: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
  }

  if (raw !== "custom") {
    return { ok: false, error: "range must be 24h, 7d, 30d, or custom" };
  }

  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return { ok: false, error: "start and end are required when range=custom" };
  }

  const gte = new Date(start);
  const lte = new Date(end);
  if (Number.isNaN(gte.getTime()) || Number.isNaN(lte.getTime())) {
    return { ok: false, error: "invalid start or end date" };
  }
  if (gte > lte) {
    return { ok: false, error: "start must be before or equal to end" };
  }

  const spanMs = lte.getTime() - gte.getTime();
  const maxSpanMs = 400 * 24 * 60 * 60 * 1000;
  if (spanMs > maxSpanMs) {
    return {
      ok: false,
      error: "Custom range cannot exceed 400 days — narrow the dates or use presets.",
    };
  }

  return { ok: true, range: { gte, lte } };
}

export function parseAdminPagination(searchParams: URLSearchParams) {
  const limitRaw = Number.parseInt(searchParams.get("limit") || "50", 10);
  const offsetRaw = Number.parseInt(searchParams.get("offset") || "0", 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : 50;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  return { limit, offset };
}

export type AdminVisibility = "active" | "deleted" | "all";

export function parseAdminVisibility(searchParams: URLSearchParams): AdminVisibility {
  const value = (searchParams.get("visibility") || "active").toLowerCase();
  if (value === "deleted" || value === "all") return value;
  return "active";
}

export function placeVisibilityFilter(visibility: AdminVisibility) {
  if (visibility === "active") return { deletedAt: null };
  if (visibility === "deleted") return { deletedAt: { not: null } };
  return {};
}

export function feedbackVisibilityFilter(visibility: AdminVisibility) {
  if (visibility === "active") return { deletedAt: null };
  if (visibility === "deleted") return { deletedAt: { not: null } };
  return {};
}

export function userVisibilityFilter(visibility: AdminVisibility) {
  if (visibility === "active") return { deletedAt: null };
  if (visibility === "deleted") return { deletedAt: { not: null } };
  return {};
}
