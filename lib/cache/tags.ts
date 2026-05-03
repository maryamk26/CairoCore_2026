export const CACHE_TAGS = {
  placesList: "places:list",
} as const;

export function placeTag(id: string) {
  return `place:${id}`;
}
