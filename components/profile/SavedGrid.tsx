"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeDate } from "./formatRelativeDate";

export interface FolderItem {
  id: string;
  name: string;
  pinCount: number;
  createdAt: string;
  previewImages?: (string | null)[];
}

export interface SavedRouteItem {
  id: string;
  name: string;
  stopCount: number;
  createdAt: string;
  transportMode: string | null;
  previewImage: string | null;
  placeNames: string[];
}

function BoardCard({
  folder,
  onClick,
}: {
  folder: FolderItem;
  onClick: () => void;
}) {
  const slots = folder.previewImages ?? [];
  const hasPins = folder.pinCount > 0;

  const gridClass =
    slots.length <= 1
      ? "grid-cols-1 grid-rows-1"
      : slots.length === 2
        ? "grid-cols-2 grid-rows-1"
        : "grid-cols-2 grid-rows-2";

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 transition-colors hover:border-gray-300"
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] bg-gray-200">
        {hasPins && slots.length > 0 ? (
          <div className={`absolute inset-0 grid gap-0.5 p-1 ${gridClass}`}>
            {slots.map((url, i) => (
              <div
                key={i}
                className="min-h-0 overflow-hidden rounded-md bg-gray-300"
              >
                {url ? (
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : hasPins ? (
          <div className="absolute inset-0 flex flex-wrap gap-0.5 p-1">
            {Array.from({ length: Math.min(folder.pinCount, 4) }).map((_, i) => (
              <div
                key={i}
                className="min-h-[45%] min-w-[45%] flex-1 rounded-md bg-gray-300"
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-md bg-gray-300" />
            ))}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate font-semibold text-[#5d4e37]">
          {folder.name}
        </h3>
        <p className="mt-0.5 text-xs text-[#5d4e37]/70">
          {folder.pinCount} {folder.pinCount === 1 ? "Pin" : "Pins"} · {formatRelativeDate(folder.createdAt)}
        </p>
      </div>
    </div>
  );
}

function SavedRouteCard({
  route,
  onClick,
}: {
  route: SavedRouteItem;
  onClick: () => void;
}) {
  return (
    <div
      className="cursor-pointer overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-gray-300"
      onClick={onClick}
    >
      <div className="aspect-[16/9] bg-gray-200">
        {route.previewImage ? (
          <img
            src={route.previewImage}
            alt={route.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: "url(/images/backgrounds/home1.jpg)" }}
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate font-semibold text-[#5d4e37]">
          {route.name}
        </h3>
        <p className="mt-1 text-xs text-[#5d4e37]/70">
          {route.stopCount} stop{route.stopCount === 1 ? "" : "s"} · {formatRelativeDate(route.createdAt)}
          {route.transportMode ? ` · ${route.transportMode}` : ""}
        </p>
        {route.placeNames.length > 0 && (
          <p className="mt-2 text-xs text-[#5d4e37]/75">
            {route.placeNames.join(" · ")}
            {route.stopCount > route.placeNames.length ? "..." : ""}
          </p>
        )}
      </div>
    </div>
  );
}

interface SavedGridProps {
  folders: FolderItem[];
  routes: SavedRouteItem[];
  onFolderCreated?: () => void;
  isOwnProfile?: boolean;
  ownerLabel?: string;
}

export default function SavedGrid({
  folders,
  routes,
  onFolderCreated,
  isOwnProfile = false,
  ownerLabel = "Your",
}: SavedGridProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create folder");
      }

      setNewName("");
      setIsCreating(false);
      onFolderCreated?.();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#5d4e37]">
          {ownerLabel} boards
        </h2>
        {isOwnProfile && !isCreating && folders.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-full bg-[#8b6f47] text-white text-sm font-medium hover:bg-[#5d4e37]"
          >
            Create board
          </button>
        ) : isOwnProfile && isCreating ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Board name"
              className="px-3 py-1.5 border border-[#5d4e37]/30 rounded-lg text-sm w-40 text-[#5d4e37] placeholder:text-[#5d4e37]/50 focus:ring-2 focus:ring-[#8b6f47] focus:border-[#8b6f47]"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || isSubmitting}
              className="px-3 py-1.5 rounded-lg bg-[#8b6f47] text-white text-sm font-medium hover:bg-[#5d4e37] disabled:opacity-50"
            >
              {isSubmitting ? "..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setNewName(""); }}
              className="text-sm text-[#5d4e37]/80 hover:text-[#5d4e37]"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>

      {folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <BoardCard
              key={folder.id}
              folder={folder}
              onClick={() =>
                router.push(
                  `/profile/boards/${folder.id}?name=${encodeURIComponent(folder.name)}`
                )
              }
            />
          ))}
        </div>
      )}

      {folders.length === 0 && !isCreating && (
        <div className="text-center py-16 text-[#5d4e37]/80">
          <p className="font-medium">
            No boards yet
          </p>
          <p className="text-sm mt-1">
            {isOwnProfile
              ? "Create a board to save places you like."
              : "This user has not created any boards yet."}
          </p>
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mt-4 px-4 py-2 rounded-full bg-[#8b6f47] text-white text-sm font-medium hover:bg-[#5d4e37]"
            >
              Create board
            </button>
          )}
        </div>
      )}

      <div className="mt-12 mb-4">
        <h2 className="text-sm font-medium text-[#5d4e37]">
          {ownerLabel} routes
        </h2>
      </div>

      {routes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {routes.map((route) => (
            <SavedRouteCard
              key={route.id}
              route={route}
              onClick={() => router.push(`/profile/routes/${route.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#5d4e37]/80">
          <p className="font-medium">No saved routes yet</p>
          <p className="text-sm mt-1">
            {isOwnProfile
              ? "Routes you save from the planner will appear here."
              : "This user has not saved any routes yet."}
          </p>
        </div>
      )}
    </div>
  );
}
