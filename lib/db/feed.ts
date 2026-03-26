import { prisma } from "@/lib/prisma";
import type { FeedActor, FeedItem, FeedPlace, FeedResponse } from "@/lib/feed/types";

const DEFAULT_FEED_LIMIT = 10;
const FETCH_BUFFER_MULTIPLIER = 3;

type CursorParts = {
  createdAt: Date;
  type: FeedItem["type"];
  id: string;
};

type FeedSortEntry = {
  createdAt: string | Date;
  type: FeedItem["type"];
  id: string;
};

type ActorRecord = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
};

type PlaceRecord = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  images: string[];
  user?: ActorRecord | null;
  feedbacks?: {
    rating: number | null;
  }[];
  _count?: {
    feedbacks: number;
  };
};

function getDisplayName(actor: ActorRecord) {
  return actor.name?.trim() || actor.username?.trim() || actor.email.split("@")[0] || "User";
}

function getUsernameRaw(actor: ActorRecord) {
  return (actor.username?.trim() || actor.email.split("@")[0] || "user").replace(/^@+/, "");
}

function serializeActor(actor: ActorRecord): FeedActor {
  const usernameRaw = getUsernameRaw(actor);
  return {
    id: actor.id,
    name: getDisplayName(actor),
    username: `@${usernameRaw}`,
    usernameRaw,
  };
}

function serializePlace(place: PlaceRecord): FeedPlace {
  const ratings = (place.feedbacks ?? [])
    .map((entry) => entry.rating)
    .filter((rating): rating is number => typeof rating === "number");
  const averageRating =
    ratings.length > 0
      ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1))
      : null;

  return {
    id: place.id,
    name: place.name,
    description: place.description,
    category: place.category,
    image: place.images[0] ?? null,
    feedbackCount: place._count?.feedbacks ?? 0,
    averageRating,
    creator: place.user ? serializeActor(place.user) : null,
  };
}

function encodeCursor(cursor: CursorParts) {
  return Buffer.from(
    JSON.stringify({
      createdAt: cursor.createdAt.toISOString(),
      type: cursor.type,
      id: cursor.id,
    })
  ).toString("base64url");
}

function decodeCursor(cursor: string | null): CursorParts | null {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      createdAt: string;
      type: FeedItem["type"];
      id: string;
    };

    return {
      createdAt: new Date(parsed.createdAt),
      type: parsed.type,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}

const SOCIAL_FEED_TYPE_PRIORITY: Record<FeedItem["type"], number> = {
  place_created: 0,
  place_feedback: 1,
  place_saved: 2,
  suggested_place: 3,
};

function getFeedTimestamp(value: string | Date) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function compareChronologicalFeedEntries(a: FeedSortEntry, b: FeedSortEntry) {
  const timeDiff = getFeedTimestamp(b.createdAt) - getFeedTimestamp(a.createdAt);
  if (timeDiff !== 0) return timeDiff;
  if (a.type !== b.type) return a.type.localeCompare(b.type);
  return b.id.localeCompare(a.id);
}

function compareSocialFeedEntries(a: FeedSortEntry, b: FeedSortEntry) {
  const priorityDiff =
    SOCIAL_FEED_TYPE_PRIORITY[a.type] - SOCIAL_FEED_TYPE_PRIORITY[b.type];
  if (priorityDiff !== 0) return priorityDiff;

  const timeDiff = getFeedTimestamp(b.createdAt) - getFeedTimestamp(a.createdAt);
  if (timeDiff !== 0) return timeDiff;

  return b.id.localeCompare(a.id);
}

function sortFeedItems(items: FeedItem[], mode: "social" | "chronological" = "chronological") {
  const comparator =
    mode === "social" ? compareSocialFeedEntries : compareChronologicalFeedEntries;

  return [...items].sort((a, b) => {
    return comparator(a, b);
  });
}

function applyCursor(
  items: FeedItem[],
  cursor: CursorParts | null,
  mode: "social" | "chronological" = "chronological"
) {
  if (!cursor) return items;

  const comparator =
    mode === "social" ? compareSocialFeedEntries : compareChronologicalFeedEntries;

  return items.filter((item) => comparator(item, cursor) > 0);
}

async function getFollowingIds(userId: string) {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  return rows.map((row) => row.followingId);
}

async function getSocialFeedItems(followingIds: string[], limit: number, cursor: CursorParts | null) {
  if (followingIds.length === 0) return [];

  const fetchTake = Math.max(limit * FETCH_BUFFER_MULTIPLIER, DEFAULT_FEED_LIMIT * 2);

  const [createdRows, savedRows, feedbackRows] = await Promise.all([
    prisma.place.findMany({
      where: { createdBy: { in: followingIds } },
      orderBy: { createdAt: "desc" },
      take: fetchTake,
      select: {
        id: true,
        createdAt: true,
        name: true,
        description: true,
        category: true,
        images: true,
        feedbacks: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            feedbacks: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    }),
    prisma.savedPlace.findMany({
      where: {
        folder: {
          userId: { in: followingIds },
        },
      },
      orderBy: { createdAt: "desc" },
      take: fetchTake,
      select: {
        id: true,
        folderId: true,
        folder: {
          select: {
            name: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        },
        place: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            images: true,
            feedbacks: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                feedbacks: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.placeFeedback.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: "desc" },
      take: fetchTake,
      select: {
        id: true,
        createdAt: true,
        content: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
        place: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            images: true,
            feedbacks: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                feedbacks: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const createdItems: FeedItem[] = createdRows
    .filter((row) => row.user)
    .map((row) => ({
      id: row.id,
      type: "place_created",
      createdAt: row.createdAt.toISOString(),
      actor: serializeActor(row.user!),
      place: serializePlace(row),
      metadata: null,
    }));

  const savedItems: FeedItem[] = savedRows.map((row) => ({
    id: row.id,
    type: "place_saved",
    createdAt: row.folder.createdAt.toISOString(),
    actor: serializeActor(row.folder.user),
    place: serializePlace(row.place),
    metadata: {
      boardId: row.folderId,
      boardName: row.folder.name,
    },
  }));

  const feedbackItems: FeedItem[] = feedbackRows.map((row) => ({
    id: row.id,
    type: "place_feedback",
    createdAt: row.createdAt.toISOString(),
    actor: serializeActor(row.user),
    place: serializePlace(row.place),
    metadata: {
      content: row.content,
    },
  }));

  return applyCursor(
    sortFeedItems([...createdItems, ...savedItems, ...feedbackItems], "social"),
    cursor,
    "social"
  );
}

async function getSuggestedPlaceItems(limit: number, cursor: CursorParts | null) {
  const take = Math.max(limit * FETCH_BUFFER_MULTIPLIER, DEFAULT_FEED_LIMIT * 2);
  const rows = await prisma.place.findMany({
    orderBy: [{ createdAt: "desc" }],
    take,
    select: {
      id: true,
      createdAt: true,
      name: true,
      description: true,
      category: true,
      images: true,
      feedbacks: {
        select: {
          rating: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
      _count: {
        select: {
          feedbacks: true,
        },
      },
    },
  });

  const items: FeedItem[] = rows.map((row) => ({
    id: row.id,
    type: "suggested_place",
    createdAt: row.createdAt.toISOString(),
    actor: row.user ? serializeActor(row.user) : null,
    place: serializePlace(row),
    metadata: {
      reason:
        row._count.feedbacks > 0
          ? "Popular with the community"
          : "Suggested for you",
    },
  }));

  return applyCursor(sortFeedItems(items), cursor);
}

export async function getFeedForUser(
  userId: string,
  rawCursor: string | null,
  rawLimit: number | null
): Promise<FeedResponse> {
  const limit =
    rawLimit && Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(rawLimit, 20))
      : DEFAULT_FEED_LIMIT;
  const cursor = decodeCursor(rawCursor);
  const followingIds = await getFollowingIds(userId);

  const socialItems = await getSocialFeedItems(followingIds, limit + 1, cursor);
  const useSuggested = !cursor && socialItems.length === 0;
  const sourceItems = useSuggested
    ? await getSuggestedPlaceItems(limit + 1, cursor)
    : socialItems;

  const pageItems = sourceItems.slice(0, limit);
  const overflowItem = sourceItems[limit] ?? null;

  return {
    mode: useSuggested ? "suggested" : "social",
    items: pageItems,
    hasMore: !!overflowItem,
    nextCursor: overflowItem
      ? encodeCursor({
          createdAt: new Date(overflowItem.createdAt),
          type: overflowItem.type,
          id: overflowItem.id,
        })
      : null,
  };
}
