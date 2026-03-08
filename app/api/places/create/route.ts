import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertUser } from "@/lib/db/user";
import { createPlace } from "@/lib/db/place";
import { PlaceCategory, PlaceVibe } from "@prisma/client";

function validCoord(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

const CATEGORIES = new Set<string>(Object.values(PlaceCategory));
const VIBES = new Set<string>(Object.values(PlaceVibe));

function asCategory(v: unknown): PlaceCategory | null {
  return v != null && CATEGORIES.has(String(v)) ? (v as PlaceCategory) : null;
}
function asVibe(v: unknown): PlaceVibe | null {
  return v != null && VIBES.has(String(v)) ? (v as PlaceVibe) : null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.email?.trim();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await upsertUser(user.id, email);

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = body.name;
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const lat = body.latitude;
    const lon = body.longitude;
    if (!validCoord(lat, -90, 90) || !validCoord(lon, -180, 180)) {
      return NextResponse.json({ error: "Valid latitude and longitude required" }, { status: 400 });
    }

    const num = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? v : null;
    const str = (v: unknown) => (v != null ? String(v).trim() || null : null);
    const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : undefined);

    const place = await createPlace(
      {
        name: name.trim(),
        latitude: lat,
        longitude: lon,
        category: asCategory(body.category),
        description: str(body.description),
        address: str(body.address),
        city: str(body.city),
        openingHours: str(body.openingHours),
        entranceFee: num(body.entranceFee),
        cameraFee: num(body.cameraFee),
        vibe: asVibe(body.vibe),
        bestVisitTime: str(body.bestVisitTime),
        images: arr(body.images),
        kidsFriendly: body.kidsFriendly === true ? true : body.kidsFriendly === false ? false : null,
        elderlyFriendly: body.elderlyFriendly === true ? true : body.elderlyFriendly === false ? false : null,
        petsFriendly: body.petsFriendly === true ? true : body.petsFriendly === false ? false : null,
      },
      user.id
    );

    return NextResponse.json({ place }, { status: 201 });
  } catch (err) {
    console.error("Place create failed:", err);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
