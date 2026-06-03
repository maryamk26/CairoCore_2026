import { runEmbedPlacesJob } from "@/lib/places/embedPlacesJob";

export function schedulePlaceEmbeddingRefresh(placeId: string): void {
  void runEmbedPlacesJob({ placeIds: [placeId], skipExisting: false })
    .then((r) => {
      if (r.errors.length > 0) {
        console.warn(`[embed] place ${placeId}: ${r.errors.map((e) => e.message).join("; ")}`);
      }
    })
    .catch((e) => {
      console.warn(`[embed] refresh failed for place ${placeId}:`, e);
    });
}
