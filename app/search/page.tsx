import { Suspense } from "react";
import SearchPageClient from "@/components/search/SearchPageClient";
import { getPlaceSuggestions } from "@/lib/places/search";

export default async function SearchPage() {
  const initialPlaces = await getPlaceSuggestions();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#5d4e37]">
          <p className="font-cinzel text-white">Loading...</p>
        </div>
      }
    >
      <SearchPageClient initialPlaces={initialPlaces} />
    </Suspense>
  );
}
