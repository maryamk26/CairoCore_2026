import { prisma } from "@/lib/prisma";

export async function savePlaceToFolder(userId: string, folderId: string, placeId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });

  if (!folder) {
    throw new Error("Folder not found");
  }

  const saved = await prisma.savedPlace.upsert({
    where: {
      folderId_placeId: {
        folderId,
        placeId,
      },
    },
    create: {
      folderId,
      placeId,
    },
    update: {},
  });

  return saved;
}

export async function getFoldersForPlace(userId: string, placeId: string) {
  const saved = await prisma.savedPlace.findMany({
    where: {
      placeId,
      folder: {
        userId,
      },
    },
    select: {
      folderId: true,
    },
  });

  return saved.map((s) => s.folderId);
}

export async function removePlaceFromFolder(userId: string, folderId: string, placeId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });
  if (!folder) return null;
  await prisma.savedPlace.deleteMany({
    where: { folderId, placeId },
  });
  return { folderId, placeId };
}

export async function removePlaceFromAllUserBoards(userId: string, placeId: string) {
  return prisma.savedPlace.deleteMany({
    where: {
      placeId,
      folder: { userId },
    },
  });
}
