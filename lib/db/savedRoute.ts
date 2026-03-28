import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const routePlaceSelect = {
  position: true,
  place: {
    select: {
      id: true,
      name: true,
      description: true,
      images: true,
      latitude: true,
      longitude: true,
      address: true,
      vibes: true,
      entranceFee: true,
      cameraFee: true,
      petsFriendly: true,
      kidsFriendly: true,
      category: true,
    },
  },
} satisfies Prisma.SavedRoutePlaceSelect;

const routeListPlaceSelect = {
  position: true,
  place: {
    select: {
      id: true,
      name: true,
      images: true,
    },
  },
} satisfies Prisma.SavedRoutePlaceSelect;

type RoutePlaceRecord = {
  position: number;
  place: {
    id: string;
    name: string;
    description: string | null;
    images: string[];
    latitude: number;
    longitude: number;
    address: string | null;
    vibes: string[];
    entranceFee: number | null;
    cameraFee: number | null;
    petsFriendly: boolean | null;
    kidsFriendly: boolean | null;
    category: string | null;
  };
};

function serializeRoutePlace(entry: RoutePlaceRecord) {
  return {
    id: entry.place.id,
    name: entry.place.name,
    description: entry.place.description,
    images: entry.place.images,
    latitude: entry.place.latitude,
    longitude: entry.place.longitude,
    address: entry.place.address,
    vibe: entry.place.vibes,
    entryFees: entry.place.entranceFee,
    cameraFees: entry.place.cameraFee,
    petsFriendly: entry.place.petsFriendly ?? false,
    kidsFriendly: entry.place.kidsFriendly ?? false,
    category: entry.place.category,
    position: entry.position,
  };
}

function buildRouteName(placeNames: string[]) {
  if (placeNames.length === 0) return "My route";
  if (placeNames.length === 1) return `${placeNames[0]} route`;
  return `${placeNames[0]} + ${placeNames.length - 1} more`;
}

function normalizeTransportMode(value?: string | null) {
  const transportMode = value?.trim();
  return transportMode ? transportMode : null;
}

function isSchemaNotReadyError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

function getOrderedPlaces(
  placeIds: string[],
  places: { id: string; name: string }[]
) {
  const placeMap = new Map(places.map((place) => [place.id, place]));
  return placeIds.flatMap((id) => {
    const place = placeMap.get(id);
    return place ? [place] : [];
  });
}

export async function createSavedRoute(
  userId: string,
  placeIds: string[],
  transportMode?: string | null
) {
  const uniquePlaceIds = [...new Set(placeIds.map((id) => id.trim()).filter(Boolean))];
  if (uniquePlaceIds.length === 0) {
    throw new Error("At least one place is required");
  }

  const places = await prisma.place.findMany({
    where: { id: { in: uniquePlaceIds } },
    select: {
      id: true,
      name: true,
    },
  });

  const orderedPlaces = getOrderedPlaces(uniquePlaceIds, places);
  if (orderedPlaces.length === 0) {
    throw new Error("No valid places were provided");
  }

  try {
    const route = await prisma.savedRoute.create({
      data: {
        userId,
        name: buildRouteName(orderedPlaces.map((place) => place.name)),
        transportMode: normalizeTransportMode(transportMode),
        places: {
          create: orderedPlaces.map((place, index) => ({
            placeId: place.id,
            position: index,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        transportMode: true,
        places: {
          orderBy: { position: "asc" },
          select: routePlaceSelect,
        },
      },
    });

    return {
      id: route.id,
      name: route.name,
      createdAt: route.createdAt,
      transportMode: route.transportMode,
      stopCount: route.places.length,
      places: route.places.map(serializeRoutePlace),
    };
  } catch (error) {
    if (isSchemaNotReadyError(error)) {
      throw new Error(
        "Saved routes are not ready yet. Update the database schema, then try again."
      );
    }
    throw error;
  }
}

export async function listSavedRoutesByUserId(userId: string) {
  try {
    const routes = await prisma.savedRoute.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        transportMode: true,
        places: {
          orderBy: { position: "asc" },
          select: routeListPlaceSelect,
        },
      },
    });

    return routes.map((route) => ({
      id: route.id,
      name: route.name,
      createdAt: route.createdAt,
      transportMode: route.transportMode,
      stopCount: route.places.length,
      previewImage: route.places[0]?.place.images[0] ?? null,
      placeNames: route.places.slice(0, 3).map((entry) => entry.place.name),
    }));
  } catch (error) {
    if (isSchemaNotReadyError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getSavedRouteById(routeId: string, userId: string) {
  try {
    const route = await prisma.savedRoute.findFirst({
      where: {
        id: routeId,
        userId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        transportMode: true,
        places: {
          orderBy: { position: "asc" },
          select: routePlaceSelect,
        },
      },
    });

    if (!route) {
      return null;
    }

    return {
      id: route.id,
      name: route.name,
      createdAt: route.createdAt,
      transportMode: route.transportMode,
      stopCount: route.places.length,
      places: route.places.map(serializeRoutePlace),
    };
  } catch (error) {
    if (isSchemaNotReadyError(error)) {
      return null;
    }
    throw error;
  }
}
