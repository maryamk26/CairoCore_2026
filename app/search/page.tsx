"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SearchHero from "@/components/search/SearchHero";
import SearchSuggestions from "@/components/search/SearchSuggestions";
import PopularSearches from "@/components/search/PopularSearches";
import type { SearchType, Suggestion } from "@/components/search/types";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("places");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [places, setPlaces] = useState<Suggestion[]>([]);
  const [people, setPeople] = useState<Suggestion[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setPlacesLoading(true);
    fetch("/api/places")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPlaces(data.places ?? []);
      })
      .catch(() => {
        if (!cancelled) setPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
    }, 150);

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
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    if (suggestion.type === "place") router.push(`/places/${suggestion.id}`);
    if (suggestion.type === "person") {
      router.push(`/users/${suggestion.subtitle.replace(/^@/, "")}`);
    }
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
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/backgrounds/searchbg.jpg')",
            backgroundColor: "#5d4e37",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#5d4e37]/40 via-[#8b6f47]/30 to-[#5d4e37]/40" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="w-full max-w-3xl relative">
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
