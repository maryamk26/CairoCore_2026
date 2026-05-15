"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type TabKey = "places" | "feedback" | "users";
type RangeKey = "24h" | "7d" | "30d" | "custom";
type Visibility = "active" | "deleted" | "all";

type PlaceRow = {
  id: string;
  name: string;
  type: string;
  city: string | null;
  createdAt: string;
  createdBy: string | null;
  deletedAt: string | null;
  deleteReason: string | null;
};

type FeedbackRow = {
  id: string;
  placeId: string;
  userId: string;
  rating: number | null;
  content: string | null;
  createdAt: string;
  deletedAt: string | null;
  deleteReason: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
  };
  place: {
    id: string;
    name: string;
  };
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: "USER" | "ADMIN";
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  deletedAt: string | null;
  createdAt: string;
  strikeCount: number;
};

type PendingAction =
  | { kind: "place"; id: string; label: string }
  | { kind: "feedback"; id: string; label: string }
  | { kind: "user"; id: string; label: string }
  | null;

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AdminPanelClient() {
  const [tab, setTab] = useState<TabKey>("places");
  const [range, setRange] = useState<RangeKey>("7d");
  const [visibility, setVisibility] = useState<Visibility>("active");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 25;
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  const endpoint = useMemo(() => `/api/admin/${tab}`, [tab]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("range", range);
    params.set("visibility", visibility);
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (range === "custom") {
      if (!start.trim() || !end.trim()) {
        return null;
      }
      params.set("start", start.trim());
      params.set("end", end.trim());
    }
    return params.toString();
  }, [end, limit, offset, range, start, visibility]);

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;

      const query = buildQuery();
      if (query === null) {
        if (!silent) {
          setLoading(false);
          setError(null);
          setPlaces([]);
          setFeedback([]);
          setUsers([]);
          setTotal(0);
        }
        return;
      }

      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const response = await fetch(`${endpoint}?${query}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed to load admin data");
        }
        setTotal(typeof data.total === "number" ? data.total : 0);
        if (tab === "places") setPlaces(data.places || []);
        if (tab === "feedback") setFeedback(data.feedback || []);
        if (tab === "users") setUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load admin data");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [buildQuery, endpoint, tab]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 8000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    setOffset(0);
  }, [tab, range, visibility, start, end]);

  function openAction(action: PendingAction) {
    setPendingAction(action);
    setReason("");
    setConfirmText("");
    setError(null);
    setSuccess(null);
  }

  function closeAction(options?: { force?: boolean }) {
    if (submitting && !options?.force) return;
    setPendingAction(null);
    setReason("");
    setConfirmText("");
  }

  async function runAction(url: string, method: "DELETE" | "POST", message: string) {
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "Moderation action failed"
        );
      }
      setSuccess(message);
      closeAction({ force: true });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : /Failed to fetch|network/i.test(String(err))
            ? "Network error — check your connection and try again."
            : "Moderation action failed";
      setError(msg);
      throw err instanceof Error ? err : new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const onDeletePlace = async (id: string) => {
    try {
      await runAction(`/api/admin/places/${id}`, "DELETE", "Place deleted successfully");
      await loadData({ silent: true });
    } catch {
      return;
    }
  };

  const onDeleteFeedback = async (id: string) => {
    try {
      await runAction(`/api/admin/feedback/${id}`, "DELETE", "Feedback deleted successfully");
      await loadData({ silent: true });
    } catch {
      return;
    }
  };

  const onBanUser = async (id: string) => {
    try {
      await runAction(`/api/admin/users/${id}/ban`, "POST", "User banned successfully");
      await loadData({ silent: true });
    } catch {
      return;
    }
  };

  const onRestorePlace = async (id: string) => {
    try {
      await runAction(`/api/admin/places/${id}/restore`, "POST", "Place restored successfully");
      await loadData({ silent: true });
    } catch {
      return;
    }
  };

  const onRestoreFeedback = async (id: string) => {
    try {
      await runAction(
        `/api/admin/feedback/${id}/restore`,
        "POST",
        "Feedback restored successfully"
      );
      await loadData({ silent: true });
    } catch {
      return;
    }
  };

  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = Math.min(offset + limit, total);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;
  const isPendingPlaceDeleted =
    pendingAction?.kind === "place"
      ? (places.find((p) => p.id === pendingAction.id)?.deletedAt ?? null) !== null
      : false;
  const isPendingFeedbackDeleted =
    pendingAction?.kind === "feedback"
      ? (feedback.find((f) => f.id === pendingAction.id)?.deletedAt ?? null) !== null
      : false;
  const confirmLabel =
    pendingAction?.kind === "place"
      ? isPendingPlaceDeleted
        ? "Restore place"
        : "Delete place"
      : pendingAction?.kind === "feedback"
        ? isPendingFeedbackDeleted
          ? "Restore feedback"
          : "Delete feedback"
        : "Ban user";

  const tabLabels: Record<TabKey, string> = {
    places: "Places",
    feedback: "Feedback",
    users: "Users",
  };

  const controlSelectCls =
    "font-cinzel min-w-[12rem] rounded-lg border border-white/50 bg-white/90 px-4 py-2.5 text-base text-[#5d4e37] shadow-sm backdrop-blur-sm md:min-w-[14rem] md:text-lg md:py-3";
  const controlDateCls =
    "font-cinzel min-w-[11rem] rounded-lg border border-white/50 bg-white/90 px-3 py-2.5 text-base text-[#5d4e37] shadow-sm backdrop-blur-sm md:min-w-[12rem] md:text-lg md:py-3";

  return (
    <div className="space-y-8 font-cinzel">
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        <div className="inline-flex flex-wrap justify-center rounded-full border border-white/40 bg-white/80 p-1.5 shadow-md backdrop-blur-sm">
          {(["places", "feedback", "users"] as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-6 py-3 text-lg capitalize transition-colors duration-200 md:px-8 md:py-3.5 md:text-xl ${
                tab === key
                  ? "bg-[#5d4e37] text-white shadow-inner"
                  : "text-[#5d4e37] hover:text-[#8b6f47]"
              }`}
            >
              {tabLabels[key]}
              {tab === key ? ` (${total})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        <select
          className={controlSelectCls}
          value={range}
          onChange={(e) => setRange(e.target.value as RangeKey)}
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last week</option>
          <option value="30d">Last month</option>
          <option value="custom">Custom</option>
        </select>
        <select
          className={controlSelectCls}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
        >
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
          <option value="all">All</option>
        </select>
        {range === "custom" ? (
          <>
            <input
              type="date"
              aria-label="Custom range start date"
              className={controlDateCls}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <input
              type="date"
              aria-label="Custom range end date"
              className={controlDateCls}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </>
        ) : null}
        <button
          type="button"
          onClick={() => void loadData()}
          className="font-cinzel rounded-full border border-white/50 bg-[#5d4e37] px-6 py-2.5 text-base text-white shadow-md transition-colors hover:bg-[#4a3d2d] md:text-lg md:py-3"
        >
          Refresh
        </button>
      </div>

      {range === "custom" && (!start.trim() || !end.trim()) ? (
        <p className="text-center text-base text-white drop-shadow-md md:text-lg">
          Choose <strong>start</strong> and <strong>end</strong> dates for a custom range (use each
          field&apos;s calendar; both required).
        </p>
      ) : null}

      {error && !pendingAction ? (
        <p className="text-center text-base text-red-200 drop-shadow md:text-lg">{error}</p>
      ) : null}
      {success ? (
        <p className="text-center text-base text-emerald-200 drop-shadow md:text-lg">{success}</p>
      ) : null}
      {loading ? (
        <p className="text-center text-base text-white/90 md:text-lg">Loading list…</p>
      ) : null}

      {tab === "places" ? (
        <div className="space-y-3 text-base md:text-lg">
          {places.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-white/40 bg-white/90 p-4 text-[#3a3428] shadow-md backdrop-blur-sm md:p-5"
            >
              <p className="font-semibold text-[#5d4e37]">{row.name}</p>
              <p className="mt-1 text-[#6b5d4a]">
                {row.type} | {row.city || "Unknown city"} | {formatDate(row.createdAt)}
              </p>
              <p className="text-[#6b5d4a]">Deleted: {formatDate(row.deletedAt)}</p>
              {!row.deletedAt ? (
                <button
                  type="button"
                  className="mt-3 rounded-full bg-red-600 px-4 py-2 text-base text-white transition-colors hover:bg-red-700 md:text-lg"
                  onClick={() =>
                    openAction({ kind: "place", id: row.id, label: row.name || row.id })
                  }
                >
                  Delete place
                </button>
              ) : (
                <button
                  type="button"
                  className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-base text-white transition-colors hover:bg-emerald-700 md:text-lg"
                  onClick={() =>
                    openAction({ kind: "place", id: row.id, label: row.name || row.id })
                  }
                >
                  Restore place
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {tab === "feedback" ? (
        <div className="space-y-3 text-base md:text-lg">
          {feedback.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-white/40 bg-white/90 p-4 text-[#3a3428] shadow-md backdrop-blur-sm md:p-5"
            >
              <p className="font-semibold text-[#5d4e37]">{row.place.name}</p>
              <p className="mt-1">{row.content || "(no comment)"}</p>
              <p className="mt-1 text-[#6b5d4a]">
                by {row.user.username || row.user.email} | rating: {row.rating ?? "-"} |{" "}
                {formatDate(row.createdAt)}
              </p>
              <p className="text-[#6b5d4a]">Deleted: {formatDate(row.deletedAt)}</p>
              {!row.deletedAt ? (
                <button
                  type="button"
                  className="mt-3 rounded-full bg-red-600 px-4 py-2 text-base text-white transition-colors hover:bg-red-700 md:text-lg"
                  onClick={() =>
                    openAction({
                      kind: "feedback",
                      id: row.id,
                      label: `${row.place.name} - ${row.user.username || row.user.email}`,
                    })
                  }
                >
                  Delete feedback
                </button>
              ) : (
                <button
                  type="button"
                  className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-base text-white transition-colors hover:bg-emerald-700 md:text-lg"
                  onClick={() =>
                    openAction({
                      kind: "feedback",
                      id: row.id,
                      label: `${row.place.name} - ${row.user.username || row.user.email}`,
                    })
                  }
                >
                  Restore feedback
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="space-y-3 text-base md:text-lg">
          {users.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-white/40 bg-white/90 p-4 text-[#3a3428] shadow-md backdrop-blur-sm md:p-5"
            >
              <p className="font-semibold text-[#5d4e37]">{row.username || row.email}</p>
              <p className="mt-1 text-[#6b5d4a]">
                {row.email} | role: {row.role} | registered: {formatDate(row.createdAt)}
              </p>
              <p className="text-[#6b5d4a]">
                banned: {row.isBanned ? "yes" : "no"} {row.banReason ? `(${row.banReason})` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-sm md:text-base ${
                    row.isBanned ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {row.isBanned ? "Banned" : "Active"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm md:text-base ${
                    row.strikeCount >= 5
                      ? "bg-red-100 text-red-800"
                      : row.strikeCount >= 3
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                  }`}
                >
                  Strikes: {row.strikeCount}
                </span>
              </div>
              {!row.isBanned && row.role !== "ADMIN" ? (
                <button
                  type="button"
                  className="mt-3 rounded-full bg-red-600 px-4 py-2 text-base text-white transition-colors hover:bg-red-700 md:text-lg"
                  onClick={() =>
                    openAction({ kind: "user", id: row.id, label: row.username || row.email })
                  }
                >
                  Ban user
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col items-center justify-center gap-4 border-t border-white/30 pt-6 text-base text-white md:flex-row md:text-lg">
        <p className="text-center drop-shadow">
          Showing {pageFrom}-{pageTo} of {total}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="font-cinzel rounded-full border border-white/50 bg-white/90 px-5 py-2 text-[#5d4e37] transition-colors hover:bg-white disabled:opacity-50 md:px-6 md:py-2.5"
            disabled={!hasPrev || loading}
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
          >
            Previous
          </button>
          <button
            type="button"
            className="font-cinzel rounded-full border border-white/50 bg-white/90 px-5 py-2 text-[#5d4e37] transition-colors hover:bg-white disabled:opacity-50 md:px-6 md:py-2.5"
            disabled={!hasNext || loading}
            onClick={() => setOffset((prev) => prev + limit)}
          >
            Next
          </button>
        </div>
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 font-cinzel">
          <div className="w-full max-w-md rounded-2xl border border-white/30 bg-[#f5f1e8] p-6 shadow-2xl">
            <h2 className="text-center text-lg font-semibold text-[#5d4e37] md:text-xl">
              Confirm moderation action
            </h2>
            <p className="mt-3 text-center text-base text-[#6b5d4a] md:text-lg">
              Target: <span className="font-medium text-[#3a3428]">{pendingAction.label}</span>
            </p>
            <textarea
              className="mt-4 min-h-28 w-full rounded-xl border border-[#d4c4b0] bg-white/90 px-4 py-3 text-base text-[#3a3428] md:text-lg"
              placeholder="Reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
            {pendingAction.kind === "user" ? (
              <div className="mt-4">
                <label className="block text-center text-sm text-[#6b5d4a] md:text-base">
                  Type <span className="font-mono text-[#3a3428]">BAN</span> to confirm
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-[#d4c4b0] bg-white/90 px-4 py-3 text-base text-[#3a3428] md:text-lg"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={submitting}
                  autoComplete="off"
                />
              </div>
            ) : null}
            {error ? (
              <p className="mt-3 text-center text-base text-red-700 md:text-lg">{error}</p>
            ) : null}
            {submitting ? (
              <p className="mt-2 text-center text-base text-[#6b5d4a]">Sending request…</p>
            ) : null}
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="rounded-full border border-[#8b6f47] px-5 py-2.5 text-base text-[#5d4e37] transition-colors hover:bg-white/80 md:text-lg"
                onClick={() => closeAction()}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-red-600 px-5 py-2.5 text-base text-white transition-colors hover:bg-red-700 disabled:opacity-50 md:text-lg"
                disabled={submitting}
                onClick={() => {
                  setError(null);
                  if (pendingAction.kind === "place") {
                    if (isPendingPlaceDeleted) {
                      void onRestorePlace(pendingAction.id);
                      return;
                    }
                    void onDeletePlace(pendingAction.id);
                    return;
                  }
                  if (pendingAction.kind === "feedback") {
                    if (isPendingFeedbackDeleted) {
                      void onRestoreFeedback(pendingAction.id);
                      return;
                    }
                    void onDeleteFeedback(pendingAction.id);
                    return;
                  }
                  if (confirmText.trim().toUpperCase() !== "BAN") {
                    setError("Type BAN to confirm banning a user");
                    return;
                  }
                  void onBanUser(pendingAction.id);
                }}
              >
                {submitting ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
