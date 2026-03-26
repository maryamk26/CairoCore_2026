import { PrismaClient, PlaceType, PlaceCategory, PlaceVibe } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

type JsonPlace = {
  type: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  vibe: string;
  address: string;
  city?: string;
  working_hours: string;
  entry_fee: string;
  camera_fee: string;
  kids_friendly: boolean;
  elderly_friendly: boolean;
  pets_friendly: boolean;
  best_time: string;
  latitude: number;
  longitude: number;
};

function parseFee(value: string): number | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "free") return 0;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

function mapType(t: string): PlaceType {
  if (t === "coffee_shop") return PlaceType.cafe;
  if (t === "restaurant") return PlaceType.restaurant;
  return PlaceType.place_to_visit;
}

function mapCategory(c: string): PlaceCategory | null {
  const normalized = c === "coffee_shop" ? "cafe" : c;
  if (Object.values(PlaceCategory).includes(normalized as PlaceCategory)) {
    return normalized as PlaceCategory;
  }
  return null;
}

function mapVibe(v: string): PlaceVibe | null {
  if (!v || typeof v !== "string") return null;
  const normalized = v.trim().toLowerCase();
  if (Object.values(PlaceVibe).includes(normalized as PlaceVibe)) {
    return normalized as PlaceVibe;
  }
  return null;
}

async function main() {
  const dataPath = path.join(process.cwd(), "data", "places_dataset.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const items: JsonPlace[] = JSON.parse(raw);

  for (const item of items) {
    const category = mapCategory(item.category);
    const vibe = mapVibe(item.vibe);
    if (!category) {
      console.warn(`Skipping place "${item.name}": unknown category "${item.category}"`);
      continue;
    }

    await prisma.place.create({
      data: {
        type: mapType(item.type),
        name: item.name,
        description: item.description ?? null,
        category,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address ?? null,
        city: item.city ?? null,
        openingHours: item.working_hours ?? null,
        entranceFee: parseFee(item.entry_fee),
        cameraFee: parseFee(item.camera_fee),
        vibe,
        bestVisitTime: item.best_time ?? null,
        images: Array.isArray(item.images) ? item.images : [],
        kidsFriendly: item.kids_friendly ?? null,
        elderlyFriendly: item.elderly_friendly ?? null,
        petsFriendly: item.pets_friendly ?? null,
        createdBy: null,
      },
    });
  }

  console.log(`Seeded ${items.length} places.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
