import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminEmail, isAdminEmail, normalizeAdminEmail } from "@/lib/auth/adminPolicy";

type BasicUserRecord = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
};

type CountedUserRecord = BasicUserRecord & {
  _count: {
    followers: number;
    following: number;
  };
};

type SerializedProfile = {
  id: string;
  email: string;
  name: string;
  username: string;
  usernameRaw: string;
  followerCount: number;
  followingCount: number;
};

type SerializedProfileListItem = {
  id: string;
  name: string;
  username: string;
  usernameRaw: string;
};

type SerializedProfilePlace = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  createdAt: Date;
  images: string[];
};

function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function normalizeEmail(value: string) {
  return normalizeAdminEmail(value);
}

function resolveRoleForEmail(email: string) {
  return isAdminEmail(email) ? "ADMIN" : "USER";
}

async function enforceSingleAdminPolicy() {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return;

  await prisma.$transaction([
    prisma.user.updateMany({
      where: {
        role: "ADMIN",
        NOT: { email: adminEmail },
      },
      data: { role: "USER" },
    }),
    prisma.user.updateMany({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    }),
  ]);
}

export function decodeUsernamePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function getDisplayName(user: BasicUserRecord) {
  return user.name?.trim() || user.email.split("@")[0] || "User";
}

function getUsernameParts(user: BasicUserRecord) {
  const rawUsername = normalizeUsername(user.username || user.email.split("@")[0] || "user");
  return {
    usernameRaw: rawUsername,
    username: `@${rawUsername}`,
  };
}

function serializeProfile(user: CountedUserRecord): SerializedProfile {
  const { username, usernameRaw } = getUsernameParts(user);
  return {
    id: user.id,
    email: user.email,
    name: getDisplayName(user),
    username,
    usernameRaw,
    followerCount: user._count.followers,
    followingCount: user._count.following,
  };
}

function serializeProfileListItem(user: BasicUserRecord): SerializedProfileListItem {
  const { username, usernameRaw } = getUsernameParts(user);
  return {
    id: user.id,
    name: getDisplayName(user),
    username,
    usernameRaw,
  };
}

export async function upsertUser(
  supabaseId: string,
  email: string,
  data?: { name?: string; username?: string }
) {
  const trimmedEmail = normalizeEmail(email);
  const role = resolveRoleForEmail(trimmedEmail);
  const existingByEmail = await prisma.user.findUnique({
    where: { email: trimmedEmail },
  });

  if (existingByEmail) {
    if (existingByEmail.id === supabaseId) {
      const updated = await prisma.user.update({
        where: { id: supabaseId },
        data: {
          role,
          ...(data && {
            name: data.name ?? undefined,
            username: data.username ?? undefined,
          }),
        },
      });
      await enforceSingleAdminPolicy();
      return updated;
    }
    const oldId = existingByEmail.id;
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: supabaseId,
          email: `${trimmedEmail}.reconnect`,
          name: existingByEmail.name,
          username: existingByEmail.username,
          role,
        },
      }),
      prisma.place.updateMany({ where: { createdBy: oldId }, data: { createdBy: supabaseId } }),
      prisma.folder.updateMany({ where: { userId: oldId }, data: { userId: supabaseId } }),
      prisma.follow.updateMany({ where: { followerId: oldId }, data: { followerId: supabaseId } }),
      prisma.follow.updateMany({
        where: { followingId: oldId },
        data: { followingId: supabaseId },
      }),
      prisma.user.delete({ where: { id: oldId } }),
      prisma.user.update({ where: { id: supabaseId }, data: { email: trimmedEmail } }),
    ]);
    await enforceSingleAdminPolicy();
    return prisma.user.findUniqueOrThrow({ where: { id: supabaseId } });
  }

  const created = await prisma.user.create({
    data: {
      id: supabaseId,
      email: trimmedEmail,
      role,
      name: data?.name ?? null,
      username: data?.username ?? null,
    },
  });
  await enforceSingleAdminPolicy();
  return created;
}

export type UpdateProfileData = {
  name?: string | null;
  username?: string | null;
};

export async function updateUserProfile(userId: string, data: UpdateProfileData) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name || null }),
      ...(data.username !== undefined && { username: data.username || null }),
    },
  });
}

async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });
  if (!user) return null;
  return serializeProfile(user);
}

export async function ensureProfile(userId: string, email?: string | null) {
  let profile = await getProfile(userId);
  if (profile) return profile;

  const trimmedEmail = email?.trim() || "";
  if (!trimmedEmail) {
    throw new Error("Email required");
  }

  await upsertUser(userId, trimmedEmail);
  profile = await getProfile(userId);

  if (!profile) {
    throw new Error("Profile not found");
  }

  return profile;
}

export async function getProfileByUsername(username: string) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return null;

  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: normalizedUsername,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) return null;
  return serializeProfile(user);
}

export async function getFollowLists(userId: string) {
  const [followersRows, followingRows] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      select: {
        follower: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        },
      },
    }),
    prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        following: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        },
      },
    }),
  ]);

  const alphabetical = (a: SerializedProfileListItem, b: SerializedProfileListItem) =>
    a.name.localeCompare(b.name) || a.usernameRaw.localeCompare(b.usernameRaw);

  return {
    followers: followersRows
      .map((row) => serializeProfileListItem(row.follower))
      .sort(alphabetical),
    following: followingRows
      .map((row) => serializeProfileListItem(row.following))
      .sort(alphabetical),
  };
}

export async function isUserFollowing(viewerId: string, targetUserId: string) {
  if (viewerId === targetUserId) return false;
  const row = await prisma.follow.findFirst({
    where: { followerId: viewerId, followingId: targetUserId },
    select: { followerId: true },
  });
  return !!row;
}

export async function followUser(viewerId: string, targetUserId: string) {
  if (viewerId === targetUserId) {
    throw new Error("SELF_FOLLOW");
  }
  try {
    await prisma.follow.create({
      data: { followerId: viewerId, followingId: targetUserId },
    });
    return { created: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { created: false as const, alreadyFollowing: true as const };
    }
    throw error;
  }
}

export async function unfollowUser(viewerId: string, targetUserId: string) {
  return prisma.follow.deleteMany({
    where: { followerId: viewerId, followingId: targetUserId },
  });
}

export async function searchProfiles(query: string, limit = 10) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const normalizedQuery = normalizeUsername(trimmedQuery);
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: trimmedQuery, mode: "insensitive" } },
        { username: { contains: normalizedQuery, mode: "insensitive" } },
        { email: { contains: trimmedQuery, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
    },
    take: limit,
  });

  const scoredUsers = users
    .map((user) => {
      const name = getDisplayName(user).toLowerCase();
      const usernameRaw = getUsernameParts(user).usernameRaw.toLowerCase();
      const email = user.email.toLowerCase();
      const rawQuery = trimmedQuery.toLowerCase();

      let score = 0;
      if (usernameRaw.startsWith(normalizedQuery)) score += 5;
      if (name.startsWith(rawQuery)) score += 4;
      if (usernameRaw.includes(normalizedQuery)) score += 3;
      if (name.includes(rawQuery)) score += 2;
      if (email.includes(rawQuery)) score += 1;

      return { user: serializeProfileListItem(user), score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.user.name.localeCompare(b.user.name);
    });

  return scoredUsers.map((entry) => entry.user);
}

export async function listCreatedPlacesByUserId(userId: string): Promise<SerializedProfilePlace[]> {
  const places = await prisma.place.findMany({
    where: { createdBy: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      address: true,
      createdAt: true,
      images: true,
    },
  });

  return places.map((place) => ({
    id: place.id,
    name: place.name,
    description: place.description,
    category: place.category,
    address: place.address,
    createdAt: place.createdAt,
    images: place.images ?? [],
  }));
}
