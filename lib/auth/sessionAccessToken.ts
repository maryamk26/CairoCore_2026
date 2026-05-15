export function decodeAccessTokenPayload(accessToken: string): Record<string, unknown> | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getUserIdAndEmailFromAccessToken(
  accessToken: string | undefined | null
): { userId: string; email: string } | null {
  if (!accessToken) return null;
  const payload = decodeAccessTokenPayload(accessToken);
  const userId = typeof payload?.sub === "string" ? payload.sub : null;
  const email = typeof payload?.email === "string" ? payload.email : null;
  if (!userId || !email) return null;
  return { userId, email };
}
