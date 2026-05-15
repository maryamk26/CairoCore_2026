function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim();
}

export function assertPlacesEmbedAuthorized(request: Request): void {
  const secret = process.env.PLACES_EMBED_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV !== "development") {
      throw new EmbedAuthError("PLACES_EMBED_SECRET is required outside development", 403);
    }
    return;
  }
  const token = getBearerToken(request);
  if (token !== secret) {
    throw new EmbedAuthError("Unauthorized", 401);
  }
}

export class EmbedAuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "EmbedAuthError";
    this.status = status;
  }
}
