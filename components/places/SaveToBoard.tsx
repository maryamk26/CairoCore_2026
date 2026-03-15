"use client";

import { useEffect, useMemo, useState } from "react";

type Folder = {
  id: string;
  name: string;
  pinCount: number;
};

interface SaveToBoardProps {
  placeId: string;
}

export default function SaveToBoard({ placeId }: SaveToBoardProps) {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFolderIds, setSavedFolderIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [foldersRes, savedRes] = await Promise.all([
          fetch("/api/profile/folders"),
          fetch(`/api/profile/saved?placeId=${encodeURIComponent(placeId)}`),
        ]);

        if (foldersRes.status === 401 || savedRes.status === 401) {
          window.location.href = "/auth";
          return;
        }

        if (foldersRes.ok) {
          const data = await foldersRes.json();
          if (!cancelled) setFolders(data.folders ?? []);
        }

        if (savedRes.ok) {
          const data = await savedRes.json();
          if (!cancelled) setSavedFolderIds(data.folderIds ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [open, placeId]);

  const visibleFolders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(term));
  }, [folders, search]);

  async function handleSaveToFolder(folderId: string) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, placeId }),
      });
      if (res.status === 401) {
        window.location.href = "/auth";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save place");
      }
      setSavedFolderIds((prev) =>
        prev.includes(folderId) ? prev : [...prev, folderId]
      );
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save place");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateBoard() {
    const name = newName.trim();
    if (!name || saving) return;

    setSaving(true);
    try {
      const res = await fetch("/api/profile/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 401) {
        window.location.href = "/auth";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create board");
      }
      const data = await res.json();
      const folder = data.folder as Folder | undefined;
      if (folder) {
        setFolders((prev) => [folder, ...prev]);
        await handleSaveToFolder(folder.id);
      }
      setNewName("");
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create board");
    } finally {
      setSaving(false);
    }
  }

  const buttonLabel = savedFolderIds.length > 0 ? "Saved" : "Save";

  return (
    <div className="relative inline-block text-left z-40">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#8b6f47] text-white text-sm md:text-base font-cinzel shadow-lg hover:bg-[#a68454] transition-colors"
      >
        <span>{buttonLabel}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boards"
              className="w-full px-3 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/60"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Loading boards...
              </div>
            ) : folders.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                You have no boards yet.
              </div>
            ) : (
              visibleFolders.map((folder) => {
                const isSaved = savedFolderIds.includes(folder.id);
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleSaveToFolder(folder.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      {folder.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {folder.name}
                        </span>
                        {isSaved && (
                          <span className="text-xs text-green-600 font-semibold">
                            Saved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {folder.pinCount} {folder.pinCount === 1 ? "Pin" : "Pins"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              setOpen(false);
            }}
            className="mt-1 w-full flex items-center gap-3 px-4 py-3 border-t border-gray-200 bg-white hover:bg-gray-50 text-sm rounded-b-2xl"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8b6f47] text-white text-xl">
              +
            </span>
            <span className="font-medium text-gray-900">Create board</span>
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 relative">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-6 md:p-8 space-y-6">
              <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-gray-900">
                Create a board
              </h2>

              <div className="w-40 h-32 rounded-2xl overflow-hidden bg-gray-100 grid grid-cols-2 grid-rows-2 gap-1">
                <div className="col-span-2 row-span-2 bg-[#8b6f47]/60 flex items-center justify-center text-white text-xs font-cinzel text-center px-2">
                  Your saved places will appear here
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Board name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name your board"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6f47]"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={handleCreateBoard}
                disabled={!newName.trim() || saving}
                className="w-full mt-2 px-4 py-3 rounded-full text-sm font-semibold font-cinzel tracking-wide disabled:opacity-60 disabled:cursor-not-allowed bg-[#8b6f47] text-white hover:bg-[#a68454] transition-colors"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

