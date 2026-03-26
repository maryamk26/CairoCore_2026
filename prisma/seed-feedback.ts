import { PrismaClient, PlaceCategory } from "@prisma/client";

const prisma = new PrismaClient();
const MIN_REVIEWS_PER_PLACE = 3;
const VARIABLE_REVIEW_RANGE = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const POPULAR_PLACE_REVIEW_TARGETS: Record<string, number> = {
  "Pyramids of Giza and Sphinx": 12,
  "Khan el-Khalili": 10,
  "The Egyptian Museum": 9,
};

type UserRecord = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
};

type PlaceRecord = {
  id: string;
  name: string;
  category: PlaceCategory | null;
  createdBy: string | null;
  feedbacks: {
    userId: string;
    rating: number | null;
  }[];
};

function getDisplayName(user: UserRecord) {
  return user.name?.trim() || user.username?.trim() || user.email.split("@")[0] || "A CairoCore user";
}

function getCategoryLabel(category: PlaceCategory | null) {
  return category ? category.replace(/_/g, " ") : "spot";
}

function getHash(value: string) {
  return [...value].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)];
}

function getDesiredReviewCount(place: Pick<PlaceRecord, "id" | "name">) {
  if (POPULAR_PLACE_REVIEW_TARGETS[place.name]) {
    return POPULAR_PLACE_REVIEW_TARGETS[place.name];
  }

  return MIN_REVIEWS_PER_PLACE + (getHash(`${place.id}:${place.name}`) % VARIABLE_REVIEW_RANGE);
}

function buildReviewContent(
  place: Pick<PlaceRecord, "name" | "category">,
  reviewer: UserRecord,
  rating: number,
  variant: number
) {
  const reviewerName = getDisplayName(reviewer);
  const categoryLabel = getCategoryLabel(place.category);
  const intros = [
    `${reviewerName} loved exploring ${place.name}.`,
    `${place.name} stood out to ${reviewerName} right away.`,
    `${reviewerName} had a really good time at ${place.name}.`,
  ];
  const details = [
    `It is one of the more memorable ${categoryLabel}s to recommend in Cairo.`,
    `The overall experience felt well worth the stop and easy to recommend to friends.`,
    `It had a welcoming atmosphere and felt like a solid pick for a day out.`,
  ];
  const closings =
    rating >= 5
      ? [
          "Definitely a favorite and worth returning to.",
          "This is an easy five-star recommendation.",
          "It left such a strong impression and felt worth the visit.",
        ]
      : rating === 4
        ? [
            "A very good place overall and one I would gladly suggest to others.",
            "It delivered a strong experience and felt worth the time.",
            "I would happily recommend it if you are nearby.",
          ]
        : [
            "It was enjoyable overall, even with a few small things that could be better.",
            "A good stop if you want to explore more of the city.",
            "It still felt like a worthwhile visit and had plenty to like.",
          ];

  return `${intros[variant % intros.length]} ${details[variant % details.length]} ${closings[variant % closings.length]}`;
}

function buildConnectedUserMap(follows: { followerId: string; followingId: string }[]) {
  const connections = new Map<string, Set<string>>();

  for (const follow of follows) {
    if (!connections.has(follow.followerId)) {
      connections.set(follow.followerId, new Set<string>());
    }
    if (!connections.has(follow.followingId)) {
      connections.set(follow.followingId, new Set<string>());
    }

    connections.get(follow.followerId)!.add(follow.followingId);
    connections.get(follow.followingId)!.add(follow.followerId);
  }

  return connections;
}

function pickReviewerIds(
  place: PlaceRecord,
  placeIndex: number,
  connectedReviewerIds: string[],
  allUserIds: string[]
) {
  const desiredReviewCount = getDesiredReviewCount(place);
  const existingReviewerIds = new Set(place.feedbacks.map((feedback) => feedback.userId));
  const candidates = uniqueIds([...connectedReviewerIds, ...allUserIds]).filter(
    (userId) => userId !== place.createdBy && !existingReviewerIds.has(userId)
  );

  if (candidates.length === 0) return [];

  const startIndex = (getHash(place.id) + placeIndex) % candidates.length;
  const selected: string[] = [];

  for (
    let step = 0;
    step < candidates.length && selected.length < desiredReviewCount - place.feedbacks.length;
    step += 1
  ) {
    selected.push(candidates[(startIndex + step) % candidates.length]);
  }

  return selected;
}

async function main() {
  const [users, places, follows] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.place.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        createdBy: true,
        feedbacks: {
          select: {
            userId: true,
            rating: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.follow.findMany({
      select: {
        followerId: true,
        followingId: true,
      },
    }),
  ]);

  const usersById = new Map(users.map((user) => [user.id, user]));
  const allUserIds = users.map((user) => user.id);
  const connectedUserMap = buildConnectedUserMap(follows);

  let processedReviewCount = 0;
  let updatedRatingsCount = 0;

  for (const [placeIndex, place] of places.entries()) {
    const desiredReviewCount = getDesiredReviewCount(place);
    const connectedReviewerIds = place.createdBy
      ? [...(connectedUserMap.get(place.createdBy) ?? new Set<string>())]
      : [];

    const selectedReviewerIds = pickReviewerIds(
      place,
      placeIndex,
      connectedReviewerIds,
      allUserIds
    );

    for (const [reviewIndex, reviewerId] of selectedReviewerIds.entries()) {
      const reviewer = usersById.get(reviewerId);
      if (!reviewer) continue;

      const rating = 3 + ((placeIndex + reviewIndex + getHash(reviewerId)) % 3);
      const content = buildReviewContent(place, reviewer, rating, placeIndex + reviewIndex);
      const createdAt = new Date(
        Date.now() - ((placeIndex * desiredReviewCount + reviewIndex + 1) * DAY_IN_MS) / 3
      );

      await prisma.placeFeedback.upsert({
        where: {
          userId_placeId: {
            userId: reviewerId,
            placeId: place.id,
          },
        },
        update: {
          rating,
          content,
        },
        create: {
          userId: reviewerId,
          placeId: place.id,
          rating,
          content,
          createdAt,
        },
      });

      processedReviewCount += 1;
    }

    for (const feedback of place.feedbacks) {
      if (feedback.rating !== null) continue;

      const rating = 3 + ((placeIndex + getHash(feedback.userId)) % 3);
      await prisma.placeFeedback.update({
        where: {
          userId_placeId: {
            userId: feedback.userId,
            placeId: place.id,
          },
        },
        data: { rating },
      });
      updatedRatingsCount += 1;
    }
  }

  const coverageCount = await prisma.place.count({
    where: {
      feedbacks: {
        some: {},
      },
    },
  });

  console.log(
    `Seeded feedback coverage for ${coverageCount}/${places.length} places. Created or refreshed ${processedReviewCount} reviews and filled ${updatedRatingsCount} missing ratings.`
  );
  console.log(
    `Popular places with extra reviews: ${Object.entries(POPULAR_PLACE_REVIEW_TARGETS)
      .map(([name, count]) => `${name} (${count})`)
      .join(", ")}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
