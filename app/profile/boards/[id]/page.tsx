"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BoardHeader from "@/components/profile/BoardHeader";
import BoardPlaceGrid, { type BoardPlace } from "@/components/profile/BoardPlaceGrid";
import DeleteBoardModal from "@/components/profile/DeleteBoardModal";

type BoardData = {
  id: string;
  name: string;
  pinCount: number;
};

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameFromUrl = searchParams.get("name") || undefined;
  const [board, setBoard] = useState<BoardData | null>(null);
  const [places, setPlaces] = useState<BoardPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteBoardConfirm, setShowDeleteBoardConfirm] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/profile/boards/${id}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data.board) {
          setError(data.error || "Failed to load board");
          setBoard({ id, name: nameFromUrl ?? "Board", pinCount: 0 });
          setPlaces([]);
        } else {
          setError(null);
          setBoard({
            id: data.board.id,
            name: nameFromUrl ?? data.board.name,
            pinCount: data.board.pinCount ?? data.places?.length ?? 0,
          });
          setPlaces(data.places ?? []);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load board");
          setBoard(null);
          setPlaces([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, nameFromUrl, refreshKey]);

  const toggleSelect = (placeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const handleRemoveFromBoard = async () => {
    if (selectedIds.size === 0) return;
    setRemovingIds(new Set(selectedIds));
    try {
      for (const placeId of selectedIds) {
        await fetch("/api/profile/saved", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: id, placeId }),
        });
      }
      setSelectedIds(new Set());
      setSelectMode(false);
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to remove some places.");
    } finally {
      setRemovingIds(new Set());
    }
  };

  const handleBuildRoute = () => {
    if (selectedIds.size === 0) return;
    router.push(`/planner?placeIds=${[...selectedIds].join(",")}`);
  };

  const handleDeleteBoard = async () => {
    setDeletingBoard(true);
    try {
      const res = await fetch(`/api/profile/folders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete board");
      }
      setShowDeleteBoardConfirm(false);
      router.push("/profile");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete board");
    } finally {
      setDeletingBoard(false);
    }
  };

  const handleToggleSelectMode = () => {
    setSelectMode((m) => !m);
    if (selectMode) setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5d4e37]/70">Loading board...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
        <p className="text-[#5d4e37] mb-4">{error || "Board not found."}</p>
        <Link
          href="/profile"
          className="px-4 py-2 rounded-full bg-[#8b6f47] text-white text-sm font-medium hover:bg-[#5d4e37]"
        >
          Back to profile
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-4 pt-28 md:pt-32 pb-12">
        <BoardHeader
          name={board.name}
          pinCount={board.pinCount}
          hasPlaces={places.length > 0}
          selectMode={selectMode}
          onToggleSelectMode={handleToggleSelectMode}
          onDeleteBoardClick={() => setShowDeleteBoardConfirm(true)}
        />

        {selectMode && selectedIds.size > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[#5d4e37]/10 border border-[#5d4e37]/20">
            <span className="text-[#5d4e37] text-sm font-medium">{selectedIds.size} selected</span>
            <button
              type="button"
              onClick={handleRemoveFromBoard}
              disabled={removingIds.size > 0}
              className="px-4 py-2 rounded-full bg-red-600/90 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {removingIds.size > 0 ? "Removing…" : "Remove from board"}
            </button>
            <button
              type="button"
              onClick={handleBuildRoute}
              className="px-4 py-2 rounded-full bg-[#8b6f47] text-white text-sm font-medium hover:bg-[#5d4e37]"
            >
              Build route
            </button>
          </div>
        )}

        <BoardPlaceGrid
          places={places}
          boardId={id}
          boardName={board.name}
          selectMode={selectMode}
          selectedIds={selectedIds}
          removingIds={removingIds}
          onToggleSelect={toggleSelect}
        />

        {showDeleteBoardConfirm && (
          <DeleteBoardModal
            onConfirm={handleDeleteBoard}
            onCancel={() => setShowDeleteBoardConfirm(false)}
            deleting={deletingBoard}
          />
        )}
      </div>
    </div>
  );
}
