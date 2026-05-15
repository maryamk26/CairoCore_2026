"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FixedPhotoBackdrop from "@/components/layout/FixedPhotoBackdrop";
import SearchHero from "@/components/search/SearchHero";
import SearchSuggestions from "@/components/search/SearchSuggestions";
import PopularSearches from "@/components/search/PopularSearches";
import type { SearchType, Suggestion } from "@/components/search/types";

type Props = {
  initialPlaces: Suggestion[];
};

export default function SearchPageClient({ initialPlaces }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("places");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [places] = useState<Suggestion[]>(initialPlaces);
  const [people, setPeople] = useState<Suggestion[]>([]);
  const [placesLoading] = useState(false);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (searchType !== "people") return;

    const query = searchQuery.trim();
    if (!query) {
      setPeople([]);
      setPeopleLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setPeopleLoading(true);
      fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          setPeople(
            (data.users ?? []).map(
              (user: { id: string; name: string; username: string }) =>
                ({
                  id: user.id,
                  title: user.name,
                  subtitle: user.username,
                  type: "person",
                }) satisfies Suggestion
            )
          );
        })
        .catch((error) => {
          if (error?.name === "AbortError") return;
          setPeople([]);
        })
        .finally(() => {
          setPeopleLoading(false);
        });
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, searchType]);

  const allSuggestions = searchType === "places" ? places : people;
  const filteredSuggestions =
    searchType === "people" || searchQuery.trim() === ""
      ? allSuggestions
      : allSuggestions.filter(
          (s) =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
        );
  const loading = searchType === "places" ? placesLoading : peopleLoading;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setShowSuggestions(false);
    if (suggestion.type === "place") {
      const qs = new URLSearchParams({ from: "search" });
      const q = searchQuery.trim();
      if (q) qs.set("q", q);
      router.push(`/places/${suggestion.id}?${qs.toString()}`);
      return;
    }
    setSearchQuery(suggestion.title);
    router.push(`/users/${suggestion.subtitle.replace(/^@/, "")}`);
  };

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    setSearchQuery("");
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handlePopularTagClick = (tag: string) => {
    setSearchQuery(tag);
    setShowSuggestions(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <FixedPhotoBackdrop
        src="/images/backgrounds/searchbg.jpg"
        overlayClassName="bg-gradient-to-br from-[#5d4e37]/40 via-[#8b6f47]/30 to-[#5d4e37]/40"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-24 md:pt-32 md:pb-24">
        <div className="relative w-full max-w-3xl">
          <SearchHero
            searchType={searchType}
            onSearchTypeChange={handleSearchTypeChange}
            searchQuery={searchQuery}
            onSearchQueryChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onInputFocus={() => setShowSuggestions(true)}
            searchInputRef={searchInputRef}
          />

          <div className="relative">
            <SearchSuggestions
              suggestionsRef={suggestionsRef}
              show={showSuggestions}
              loading={loading}
              searchType={searchType}
              searchQuery={searchQuery}
              suggestions={filteredSuggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>

          <PopularSearches
            visible={showSuggestions || searchType === "people"}
            onTagClick={handlePopularTagClick}
            inputRef={searchInputRef}
          />
        </div>
      </div>
    </div>
  );
}
