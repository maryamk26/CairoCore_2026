"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

type FolderSummary = {
  id: string;
  name: string;
  pinCount: number;
};

type BoardPlace = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
};

type SearchPlace = {
  id: string;
  title: string;
  subtitle: string;
  category?: string;
};

type SelectedPlace = {
  id: string;
  title: string;
  subtitle: string;
  category?: string;
};

type ManualRouteDraft = {
  selectedBoardId: string | null;
  selectedPlaces: SelectedPlace[];
};

const MANUAL_ROUTE_STORAGE_KEY = "manual-route-draft";

function toSelectedPlace(place: BoardPlace | SearchPlace): SelectedPlace {
  if ("name" in place) {
    return {
      id: place.id,
      title: place.name,
      subtitle:
        place.description?.trim() || place.address?.trim() || place.category || "Saved place",
      category: place.category ?? undefined,
    };
  }

  return {
    id: place.id,
    title: place.title,
    subtitle: place.subtitle,
    category: place.category,
  };
}

function readDraft() {
  try {
    const raw = sessionStorage.getItem(MANUAL_ROUTE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<ManualRouteDraft>) : null;
  } catch {
    sessionStorage.removeItem(MANUAL_ROUTE_STORAGE_KEY);
    return null;
  }
}

export default function CreateRoutePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [boardPlaces, setBoardPlaces] = useState<BoardPlace[]>([]);
  const [boardPlacesLoading, setBoardPlacesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPlace[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([]);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setAuthTimedOut(true), 6000);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const draft = readDraft();
    if (Array.isArray(draft?.selectedPlaces)) {
      setSelectedPlaces(draft.selectedPlaces);
    }
    if (typeof draft?.selectedBoardId === "string" || draft?.selectedBoardId === null) {
      setSelectedBoardId(draft.selectedBoardId ?? null);
    }
    setHasRestoredDraft(true);
  }, [user]);

  useEffect(() => {
    if (!user || !hasRestoredDraft) return;

    const draft: ManualRouteDraft = {
      selectedBoardId,
      selectedPlaces,
    };

    sessionStorage.setItem(MANUAL_ROUTE_STORAGE_KEY, JSON.stringify(draft));
  }, [user, hasRestoredDraft, selectedBoardId, selectedPlaces]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setFoldersLoading(true);

    fetch("/api/profile/folders")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/auth");
          return { folders: [] };
        }
        return res.json().catch(() => ({ folders: [] }));
      })
      .then((data) => {
        if (cancelled) return;
        const nextFolders: FolderSummary[] = Array.isArray(data.folders) ? data.folders : [];
        setFolders(nextFolders);
        setSelectedBoardId((current) =>
          current && nextFolders.some((folder) => folder.id === current)
            ? current
            : (nextFolders[0]?.id ?? null)
        );
      })
      .catch(() => {
        if (!cancelled) {
          setFolders([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFoldersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, router]);

  useEffect(() => {
    if (!selectedBoardId) {
      setBoardPlaces([]);
      return;
    }

    let cancelled = false;
    setBoardPlacesLoading(true);

    fetch(`/api/profile/boards/${selectedBoardId}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (cancelled) return;
        setBoardPlaces(Array.isArray(data.places) ? data.places : []);
      })
      .catch(() => {
        if (!cancelled) {
          setBoardPlaces([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBoardPlacesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBoardId]);

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setSearchLoading(true);
      fetch(`/api/places?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          setSearchResults(Array.isArray(data.places) ? data.places : []);
        })
        .catch((error) => {
          if (error?.name === "AbortError") return;
          setSearchResults([]);
        })
        .finally(() => {
          setSearchLoading(false);
        });
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [searchQuery]);

  const selectedIds = useMemo(
    () => new Set(selectedPlaces.map((place) => place.id)),
    [selectedPlaces]
  );

  const togglePlace = (place: SelectedPlace) => {
    setSelectedPlaces((current) => {
      if (current.some((entry) => entry.id === place.id)) {
        return current.filter((entry) => entry.id !== place.id);
      }
      return [...current, place];
    });
  };

  const handleBuildRoute = () => {
    if (selectedPlaces.length === 0) return;
    const placeIds = selectedPlaces.map((place) => place.id).join(",");
    router.push(`/planner?placeIds=${placeIds}`);
  };

  if (authLoading && !authTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5d4e37]/70">Loading...</div>
      </div>
    );
  }

  if (authTimedOut && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fafafa] px-4">
        <p className="text-center text-[#5d4e37]">
          Taking longer than usual. Please sign in to build a route.
        </p>
        <Link
          href="/auth"
          className="rounded-full bg-[#8b6f47] px-6 py-3 font-cinzel font-medium text-white hover:bg-[#5d4e37]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-12">
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
          >
            <span className="text-xl">←</span>
            <span className="font-cinzel text-sm">Back</span>
          </Link>
        </div>

        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-cinzel text-3xl font-bold text-gray-900">Create route</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#5d4e37]/80">
              Pick places from your saved boards or search for any place in Cairo, then build your
              route using the same planner flow and ordering logic.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBuildRoute}
            disabled={selectedPlaces.length === 0}
            className="rounded-full bg-[#8b6f47] px-6 py-3 text-sm font-medium text-white hover:bg-[#5d4e37] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Build my route
          </button>
        </div>

        <div className="mb-8 rounded-3xl border border-[#e6ddd2] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-cinzel text-xl font-semibold text-[#2f2b25]">Selected places</h2>
              <p className="text-sm text-[#5d4e37]/75">
                {selectedPlaces.length === 0
                  ? "Choose at least one place to continue."
                  : `${selectedPlaces.length} place${selectedPlaces.length === 1 ? "" : "s"} selected`}
              </p>
            </div>
            {selectedPlaces.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedPlaces([])}
                className="text-sm font-medium text-[#8b6f47] hover:text-[#5d4e37]"
              >
                Clear all
              </button>
            )}
          </div>

          {selectedPlaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d7c7b4] bg-[#faf7f2] px-4 py-8 text-center text-sm text-[#5d4e37]/75">
              Your route will start here once you add places.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {selectedPlaces.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => togglePlace(place)}
                  className="rounded-2xl border border-[#d7c7b4] bg-[#faf7f2] px-4 py-3 text-left hover:border-[#8b6f47]"
                >
                  <p className="font-medium text-[#2f2b25]">{place.title}</p>
                  <p className="mt-1 max-w-xs truncate text-xs text-[#5d4e37]/75">
                    {place.subtitle}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#e6ddd2] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-cinzel text-xl font-semibold text-[#2f2b25]">From your boards</h2>
              <p className="text-sm text-[#5d4e37]/75">Add places you already saved.</p>
            </div>

            {foldersLoading ? (
              <div className="py-10 text-center text-sm text-[#5d4e37]/75">Loading boards...</div>
            ) : folders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d7c7b4] bg-[#faf7f2] px-4 py-8 text-center text-sm text-[#5d4e37]/75">
                You do not have any boards yet. You can still search and build a route manually.
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap gap-2">
                  {folders.map((folder) => {
                    const active = folder.id === selectedBoardId;
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => setSelectedBoardId(folder.id)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-[#8b6f47] text-white"
                            : "bg-[#f4ede3] text-[#5d4e37] hover:bg-[#eadfce]"
                        }`}
                      >
                        {folder.name} · {folder.pinCount}
                      </button>
                    );
                  })}
                </div>

                {boardPlacesLoading ? (
                  <div className="py-10 text-center text-sm text-[#5d4e37]/75">
                    Loading board places...
                  </div>
                ) : boardPlaces.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d7c7b4] bg-[#faf7f2] px-4 py-8 text-center text-sm text-[#5d4e37]/75">
                    This board does not have any places yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {boardPlaces.map((place) => {
                      const selected = selectedIds.has(place.id);
                      const selectedPlace = toSelectedPlace(place);
                      return (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => togglePlace(selectedPlace)}
                          className={`flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-colors ${
                            selected
                              ? "border-[#8b6f47] bg-[#faf3ea]"
                              : "border-[#ece3d8] hover:border-[#c9b59a]"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-[#2f2b25]">{place.name}</p>
                            <p className="mt-1 text-sm text-[#5d4e37]/75">
                              {place.description?.trim() ||
                                place.address?.trim() ||
                                place.category ||
                                "Saved place"}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#f4ede3] px-3 py-1 text-xs font-medium text-[#5d4e37]">
                            {selected ? "Added" : "Add"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="rounded-3xl border border-[#e6ddd2] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-cinzel text-xl font-semibold text-[#2f2b25]">Search places</h2>
              <p className="text-sm text-[#5d4e37]/75">
                Search any place and add it to this route.
              </p>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search places in Cairo"
              className="mb-5 w-full rounded-2xl border border-[#d7c7b4] px-4 py-3 text-sm text-[#2f2b25] outline-none placeholder:text-[#5d4e37]/50 focus:border-[#8b6f47]"
            />

            {!searchQuery.trim() ? (
              <div className="rounded-2xl border border-dashed border-[#d7c7b4] bg-[#faf7f2] px-4 py-8 text-center text-sm text-[#5d4e37]/75">
                Start typing to find places.
              </div>
            ) : searchLoading ? (
              <div className="py-10 text-center text-sm text-[#5d4e37]/75">Searching places...</div>
            ) : searchResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d7c7b4] bg-[#faf7f2] px-4 py-8 text-center text-sm text-[#5d4e37]/75">
                No places found for "{searchQuery.trim()}".
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((place) => {
                  const selected = selectedIds.has(place.id);
                  const selectedPlace = toSelectedPlace(place);
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => togglePlace(selectedPlace)}
                      className={`flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-colors ${
                        selected
                          ? "border-[#8b6f47] bg-[#faf3ea]"
                          : "border-[#ece3d8] hover:border-[#c9b59a]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#2f2b25]">{place.title}</p>
                        <p className="mt-1 text-sm text-[#5d4e37]/75">{place.subtitle}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#f4ede3] px-3 py-1 text-xs font-medium text-[#5d4e37]">
                        {selected ? "Added" : "Add"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
