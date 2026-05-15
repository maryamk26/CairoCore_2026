import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { EmbedAuthError, assertPlacesEmbedAuthorized } from "@/lib/places/embedPlacesAuth";
import { runEmbedPlacesJob } from "@/lib/places/embedPlacesJob";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    assertPlacesEmbedAuthorized(request);
  } catch (e) {
    if (e instanceof EmbedAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  let body: {
    placeIds?: string[];
    limit?: number;
    skipExisting?: boolean;
  } = {};
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      body = (await request.json()) as typeof body;
    }
  } catch {
    body = {};
  }

  const limit =
    typeof body.limit === "number" && Number.isFinite(body.limit)
      ? Math.min(5000, Math.max(1, Math.floor(body.limit)))
      : undefined;
  const placeIds = Array.isArray(body.placeIds)
    ? body.placeIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : undefined;

  const result = await runEmbedPlacesJob({
    placeIds,
    limit,
    skipExisting: Boolean(body.skipExisting),
  });

  return NextResponse.json({ success: true, ...result });
}
