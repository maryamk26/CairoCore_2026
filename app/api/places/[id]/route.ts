import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { updatePlace } from "@/lib/db/place";
import type { PlaceVibe } from "@prisma/client";
import {
  PLACE_TYPE_VALUES,
  PLACE_CATEGORY_VALUES,
  PLACE_VIBE_VALUES,
  PLACE_TAG_VALUES,
  ALLOWED_CITIES,
} from "@/lib/constants/places";

function parseNum(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const place = await prisma.place.findUnique({ where: { id } });

    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const vibeArr = place.vibes?.length ? place.vibes : place.vibe ? [place.vibe] : [];
    let workingHours: unknown = place.openingHours ?? null;
    if (typeof place.openingHours === "string" && place.openingHours.trim().startsWith("{")) {
      try {
        workingHours = JSON.parse(place.openingHours) as Record<string, { open: string; close: string } | "closed">;
      } catch {
        workingHours = place.openingHours;
      }
    }

    return NextResponse.json({
      id: place.id,
      type: place.type,
      title: place.name,
      description: place.description ?? "",
      images: place.images ?? [],
      location: {
        address: place.address ?? "",
        lat: place.latitude,
        lng: place.longitude,
      },
      city: place.city ?? null,
      workingHours,
      entryFees: place.entranceFee,
      cameraFees: place.cameraFee,
      vibe: vibeArr,
      tags: place.tags ?? [],
      createdBy: place.createdBy ?? null,
      petsFriendly: place.petsFriendly ?? false,
      kidsFriendly: place.kidsFriendly ?? true,
      elderlyFriendly: place.elderlyFriendly ?? null,
      bestTimeToVisit: place.bestVisitTime ? { timeOfDay: [place.bestVisitTime] } : null,
      category: place.category ?? "other",
    });
  } catch (error) {
    console.error("Place fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch place" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const type = body.type && PLACE_TYPE_VALUES.includes(body.type) ? body.type : undefined;
    const category = body.category !== undefined && body.category !== null && PLACE_CATEGORY_VALUES.includes(body.category) ? body.category : body.category === null ? null : undefined;
    const cityRaw = typeof body.city === "string" ? body.city.trim() : body.city;
    const city = cityRaw === null || cityRaw === "" ? null : ALLOWED_CITIES.includes(cityRaw as (typeof ALLOWED_CITIES)[number]) ? cityRaw : undefined;
    if (cityRaw && city === undefined) {
      return NextResponse.json(
        { error: "City must be one of: Cairo, Giza, Sheikh Zayed City" },
        { status: 400 }
      );
    }
    const vibes = Array.isArray(body.vibes) ? body.vibes.filter((v: unknown): v is PlaceVibe => typeof v === "string" && PLACE_VIBE_VALUES.includes(v as PlaceVibe)) : undefined;
    const tags = Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string" && PLACE_TAG_VALUES.includes(t)) : undefined;

    const updated = await updatePlace(
      id,
      {
        ...(typeof body.name === "string" && { name: body.name.trim() }),
        ...(typeof body.description === "string" && { description: body.description.trim() || null }),
        ...(type && { type }),
        ...(category !== undefined && { category }),
        ...(typeof body.address === "string" && { address: body.address.trim() || null }),
        ...(city !== undefined && { city }),
        ...(typeof body.openingHours === "string" && { openingHours: body.openingHours.trim() || null }),
        ...(body.entranceFee !== undefined && { entranceFee: parseNum(body.entranceFee) }),
        ...(body.cameraFee !== undefined && { cameraFee: parseNum(body.cameraFee) }),
        ...(vibes !== undefined && { vibes }),
        ...(tags !== undefined && { tags }),
        ...(typeof body.bestVisitTime === "string" && { bestVisitTime: body.bestVisitTime.trim() || null }),
        ...(Array.isArray(body.images) && { images: body.images.filter((u: unknown) => typeof u === "string") }),
        ...(body.kidsFriendly !== undefined && { kidsFriendly: body.kidsFriendly === true ? true : body.kidsFriendly === false ? false : null }),
        ...(body.elderlyFriendly !== undefined && { elderlyFriendly: body.elderlyFriendly === true ? true : body.elderlyFriendly === false ? false : null }),
        ...(body.petsFriendly !== undefined && { petsFriendly: body.petsFriendly === true ? true : body.petsFriendly === false ? false : null }),
        ...(body.latitude !== undefined && body.longitude !== undefined && { latitude: parseNum(body.latitude) ?? undefined, longitude: parseNum(body.longitude) ?? undefined }),
      },
      user.id
    );

    if (!updated) {
      return NextResponse.json({ error: "Place not found or you cannot edit it" }, { status: 404 });
    }

    return NextResponse.json({
      place: {
        id: updated.id,
        name: updated.name,
      },
    });
  } catch (err) {
    console.error("Update place failed:", err);
    const message = err instanceof Error ? err.message : "Failed to update place";
    return NextResponse.json(
      { error: "Failed to update place", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const place = await prisma.place.findUnique({ where: { id }, select: { createdBy: true } });
    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }
    if (place.createdBy !== user.id) {
      return NextResponse.json({ error: "You can only delete places you created" }, { status: 403 });
    }

    await prisma.place.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete place failed:", err);
    return NextResponse.json(
      { error: "Failed to delete place" },
      { status: 500 }
    );
  }
}
