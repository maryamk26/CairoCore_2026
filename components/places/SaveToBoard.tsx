"use client";

import { useEffect, useMemo, useState } from "react";

type Folder = {
  id: string;
  name: string;
  pinCount: number;
};

function boardInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SaveToBoard({ placeId }: { placeId: string }) {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const [savedFolderIds, setSavedFolderIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = `/api/profile/saved?placeId=${encodeURIComponent(placeId)}`;
    fetch(q)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setSavedFolderIds(data.folderIds ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const q = `/api/profile/saved?placeId=${encodeURIComponent(placeId)}`;

    Promise.all([fetch("/api/profile/folders"), fetch(q)])
      .then(async ([foldersRes, savedRes]) => {
        if (foldersRes.status === 401 || savedRes.status === 401) {
          window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        if (cancelled) return;

        if (foldersRes.ok) {
          const d = await foldersRes.json();
          setFolders(d.folders ?? []);
        } else {
          setLoadError("Could not load your boards. Please try again.");
        }

        if (savedRes.ok) {
          const d = await savedRes.json();
          setSavedFolderIds(d.folderIds ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load your boards. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, placeId]);

  const visibleFolders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(term));
  }, [folders, search]);

  async function handleUnsave() {
    if (unsaving || savedFolderIds.length === 0) return;
    setUnsaving(true);
    try {
      const res = await fetch("/api/profile/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, removeAll: true }),
      });
      if (res.status === 401) {
        window.location.href = "/auth";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not remove from boards");
      }
      setSavedFolderIds([]);
      setOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not unsave");
    } finally {
      setUnsaving(false);
    }
  }

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
        throw new Error(data.error || "Could not save");
      }
      setSavedFolderIds((prev) => (prev.includes(folderId) ? prev : [...prev, folderId]));
      setOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save");
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
        throw new Error(data.error || "Could not create board");
      }
      const data = await res.json();
      const folder = data.folder as Folder | undefined;
      if (folder) {
        setFolders((prev) => [folder, ...prev]);
        await handleSaveToFolder(folder.id);
      }
      setNewName("");
      setShowCreateModal(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not create board");
    } finally {
      setSaving(false);
    }
  }

  const savedSomewhere = savedFolderIds.length > 0;

  return (
    <div className="z-40 inline-flex flex-wrap items-center gap-2 text-left">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-full bg-[#8b6f47] px-6 py-3 font-cinzel text-sm text-white shadow-lg transition-colors hover:bg-[#a68454] md:text-base"
        >
          {savedSomewhere ? "Saved" : "Save"}
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 flex w-72 flex-col rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 p-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search boards"
                className="w-full rounded-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/60"
              />
            </div>

            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">Loading boards...</div>
              ) : loadError ? (
                <div className="px-4 py-6 text-center text-sm text-red-600">{loadError}</div>
              ) : folders.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  You have no boards yet.
                </div>
              ) : (
                visibleFolders.map((folder) => {
                  const inFolder = savedFolderIds.includes(folder.id);
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => handleSaveToFolder(folder.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-100"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500">
                        {boardInitials(folder.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900">{folder.name}</span>
                          {inFolder && (
                            <span className="shrink-0 text-xs font-semibold text-green-600">
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
              className="mt-1 flex w-full items-center gap-3 rounded-b-2xl border-t border-gray-200 bg-white px-4 py-3 text-sm hover:bg-gray-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8b6f47] text-xl text-white">
                +
              </span>
              <span className="font-medium text-gray-900">Create board</span>
            </button>
          </div>
        )}
      </div>

      {savedSomewhere && (
        <button
          type="button"
          onClick={handleUnsave}
          disabled={unsaving}
          className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 font-cinzel text-sm text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
        >
          {unsaving ? "…" : "Unsave"}
        </button>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="space-y-6 p-6 md:p-8">
              <h2 className="font-cinzel text-2xl font-bold text-gray-900 md:text-3xl">
                Create a board
              </h2>

              <div className="grid h-32 w-40 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl bg-gray-100">
                <div className="col-span-2 row-span-2 flex items-center justify-center bg-[#8b6f47]/60 px-2 text-center font-cinzel text-xs text-white">
                  Your saved places will appear here
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Board name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name your board"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6f47]"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={handleCreateBoard}
                disabled={!newName.trim() || saving}
                className="mt-2 w-full rounded-full bg-[#8b6f47] px-4 py-3 text-sm font-semibold font-cinzel tracking-wide text-white transition-colors hover:bg-[#a68454] disabled:cursor-not-allowed disabled:opacity-60"
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
