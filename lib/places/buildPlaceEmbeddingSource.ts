import type { Place } from "@prisma/client";

export function buildPlaceEmbeddingSource(place: Place): string {
  const vibeLine =
    place.vibes?.length > 0 ? place.vibes.join(", ") : place.vibe ? String(place.vibe) : "";
  const lines = [
    `type: ${place.type}`,
    `name: ${place.name}`,
    `category: ${place.category ?? "unknown"}`,
    `city: ${place.city ?? ""}`,
    `address: ${place.address ?? ""}`,
    `description: ${place.description ?? ""}`,
    `vibes: ${vibeLine}`,
    `tags: ${(place.tags ?? []).join(", ")}`,
    `entrance_fee: ${place.entranceFee ?? ""}`,
    `camera_fee: ${place.cameraFee ?? ""}`,
    `kids_friendly: ${place.kidsFriendly ?? ""}`,
    `elderly_friendly: ${place.elderlyFriendly ?? ""}`,
    `pets_friendly: ${place.petsFriendly ?? ""}`,
    `best_visit_time: ${place.bestVisitTime ?? ""}`,
  ];
  return lines.join("\n");
}
