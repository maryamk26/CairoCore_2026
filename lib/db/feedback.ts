import { prisma } from "@/lib/prisma";

export type PlaceFeedbackInput = {
  rating?: number | null;
  content?: string | null;
};

type FeedbackUserRecord = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
};

export function getFeedbackDisplayName(user: FeedbackUserRecord) {
  return user.name?.trim() || user.username?.trim() || user.email.split("@")[0] || "User";
}

export function getFeedbackDisplayUsername(user: FeedbackUserRecord) {
  const rawUsername = (user.username?.trim() || user.email.split("@")[0] || "user").replace(
    /^@+/,
    ""
  );
  return `@${rawUsername}`;
}

function normalizeFeedbackInput(input: PlaceFeedbackInput) {
  const rawRating = input.rating;
  const rating =
    rawRating == null
      ? null
      : Number.isInteger(rawRating) && rawRating >= 1 && rawRating <= 5
        ? rawRating
        : null;
  const trimmedContent = input.content?.trim() ?? "";

  if (!rating && !trimmedContent) {
    throw new Error("Feedback must include a rating or written comment.");
  }

  return {
    rating,
    content: trimmedContent || null,
  };
}

const placeFeedbackUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
} as const;

export async function upsertPlaceFeedback(
  placeId: string,
  userId: string,
  input: PlaceFeedbackInput
) {
  const data = normalizeFeedbackInput(input);

  return prisma.placeFeedback.upsert({
    where: {
      userId_placeId: {
        userId,
        placeId,
      },
    },
    update: data,
    create: {
      placeId,
      userId,
      ...data,
    },
    include: {
      user: {
        select: placeFeedbackUserSelect,
      },
    },
  });
}

export async function listPlaceFeedback(placeId: string) {
  return prisma.placeFeedback.findMany({
    where: { placeId },
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: placeFeedbackUserSelect,
      },
    },
  });
}

export async function getPlaceFeedbackSummary(placeId: string) {
  const [count, aggregate] = await Promise.all([
    prisma.placeFeedback.count({ where: { placeId } }),
    prisma.placeFeedback.aggregate({
      where: { placeId },
      _avg: { rating: true },
    }),
  ]);

  return {
    count,
    averageRating: aggregate._avg.rating ?? null,
  };
}
