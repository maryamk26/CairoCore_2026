"use client";

import { useEffect, useRef } from "react";
import FeedCard from "./FeedCard";
import CaughtUpState from "./CaughtUpState";
import type { FeedItem } from "@/lib/feed/types";

interface FeedListProps {
  items: FeedItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#d8c9b8] bg-white/90 shadow-sm animate-pulse">
      <div className="aspect-[16/9] bg-[#e8ddd4]" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-32 rounded bg-[#eadfd0]" />
        <div className="h-5 w-2/3 rounded bg-[#eadfd0]" />
        <div className="h-4 w-full rounded bg-[#f1e8dc]" />
        <div className="h-4 w-5/6 rounded bg-[#f1e8dc]" />
      </div>
    </div>
  );
}

export default function FeedList({
  items,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
}: FeedListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <FeedCard key={`${item.type}-${item.id}`} item={item} />
      ))}

      {loadingMore && (
        <div className="space-y-6">
          <SkeletonCard />
        </div>
      )}

      {hasMore ? <div ref={sentinelRef} className="h-2" /> : <CaughtUpState />}
    </div>
  );
}
