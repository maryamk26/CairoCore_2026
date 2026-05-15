"use client";

import { useCallback, useEffect, useState } from "react";
import FeedList from "./FeedList";
import type { FeedItem, FeedPayload } from "@/lib/feed/types";

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async (cursor: string | null, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const query = new URLSearchParams();
      query.set("limit", "8");
      if (cursor) query.set("cursor", cursor);

      const res = await fetch(`/api/feed?${query.toString()}`);
      const data = (await res.json().catch(() => ({}))) as Partial<FeedPayload> & {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Failed to load feed");
      }

      setItems((prev) => (append ? [...prev, ...(data.items ?? [])] : (data.items ?? [])));
      setNextCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore && data.nextCursor));
    } catch (err) {
      if (!append) {
        setError(err instanceof Error ? err.message : "Failed to load feed");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed(null, false);
  }, [loadFeed]);

  const handleLoadMore = useCallback(() => {
    if (!nextCursor || loading || loadingMore || !hasMore) return;
    void loadFeed(nextCursor, true);
  }, [hasMore, loadFeed, loading, loadingMore, nextCursor]);

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-[#3a3428] px-4 pt-28 pb-16">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-[#d8c9b8] bg-white px-6 py-10 text-center shadow-sm">
          <h1 className="font-cinzel text-3xl text-[#3a3428]">Your Feed</h1>
          <p className="mt-3 text-sm text-[#5d4e37]/75">{error}</p>
          <button
            type="button"
            onClick={() => void loadFeed(null, false)}
            className="mt-5 rounded-full bg-[#8b6f47] px-5 py-3 text-sm font-medium text-white hover:bg-[#5d4e37]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ef] px-4 pt-28 pb-16">
      <div className="mx-auto max-w-3xl">
        <FeedList
          items={items}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}
