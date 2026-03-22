"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeMonth } from "./formatRelativeMonth";

export interface FolderItem {
  id: string;
  name: string;
  pinCount: number;
  createdAt: string;
}

interface SavedGridProps {
  folders: FolderItem[];
  onFolderCreated?: () => void;
  isOwnProfile?: boolean;
  ownerLabel?: string;
}

export default function SavedGrid({
  folders,
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group"
            onClick={() =>
              router.push(
                `/profile/boards/${folder.id}?name=${encodeURIComponent(folder.name)}`
              )
            }
          >
            <div className="aspect-[3/4] relative bg-gray-200">
              {folder.pinCount > 0 ? (
                <div className="absolute inset-0 flex flex-wrap gap-0.5 p-1">
                  {Array.from({ length: Math.min(folder.pinCount, 4) }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 min-w-[45%] min-h-[45%] rounded-md bg-gray-300"
                      style={{
                        backgroundImage: "url(/images/backgrounds/home1.jpg)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
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
              <h3 className="font-semibold text-[#5d4e37] truncate">
                {folder.name}
              </h3>
              <p className="text-xs text-[#5d4e37]/70 mt-0.5">
                {folder.pinCount} {folder.pinCount === 1 ? "Pin" : "Pins"} · {formatRelativeMonth(folder.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
