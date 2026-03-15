import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createPlace } from "@/lib/db/place";
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

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const places = await prisma.place.findMany({
      where: { createdBy: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        address: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      places: places.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        address: p.address,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("Profile places fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const lat = parseNum(body.latitude);
    const lng = parseNum(body.longitude);
    if (lat === null || lng === null) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const type = body.type && PLACE_TYPE_VALUES.includes(body.type) ? body.type : "place_to_visit";
    const category = body.category && PLACE_CATEGORY_VALUES.includes(body.category) ? body.category : null;
    const cityRaw = typeof body.city === "string" ? body.city.trim() : "";
    const city = ALLOWED_CITIES.includes(cityRaw as (typeof ALLOWED_CITIES)[number]) ? cityRaw : null;
    if (cityRaw && !city) {
      return NextResponse.json(
        { error: "City must be one of: Cairo, Giza, Sheikh Zayed City" },
        { status: 400 }
      );
    }
    const vibes = Array.isArray(body.vibes)
      ? body.vibes.filter((v: unknown) => typeof v === "string" && (PLACE_VIBE_VALUES as readonly string[]).includes(v))
      : [];
    const tags = Array.isArray(body.tags)
      ? body.tags.filter((t: unknown) => typeof t === "string" && PLACE_TAG_VALUES.includes(t))
      : [];
    const openingHours =
      typeof body.openingHours === "string" && body.openingHours.trim()
        ? body.openingHours.trim()
        : null;

    const place = await createPlace(
      {
        type,
        name,
        latitude: lat,
        longitude: lng,
        category,
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        address: typeof body.address === "string" ? body.address.trim() || null : null,
        city,
        openingHours,
        entranceFee: parseNum(body.entranceFee),
        cameraFee: parseNum(body.cameraFee),
        vibes,
        tags,
        bestVisitTime: typeof body.bestVisitTime === "string" ? body.bestVisitTime.trim() || null : null,
        images: Array.isArray(body.images) ? body.images.filter((u: unknown) => typeof u === "string") : [],
        kidsFriendly: body.kidsFriendly === true ? true : body.kidsFriendly === false ? false : null,
        elderlyFriendly: body.elderlyFriendly === true ? true : body.elderlyFriendly === false ? false : null,
        petsFriendly: body.petsFriendly === true ? true : body.petsFriendly === false ? false : null,
      },
      user.id
    );

    return NextResponse.json({
      place: {
        id: place.id,
        name: place.name,
        description: place.description,
        category: place.category,
        address: place.address,
        createdAt: place.createdAt,
      },
    });
  } catch (err) {
    console.error("Create place failed:", err);
    return NextResponse.json(
      { error: "Failed to create place" },
      { status: 500 }
    );
  }
}
