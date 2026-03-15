import { prisma } from "@/lib/prisma";

export async function createFolder(userId: string, name: string) {
  return prisma.folder.create({
    data: { userId, name: name.trim() },
  });
}

export async function getFoldersByUserId(userId: string) {
  return prisma.folder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { savedPlaces: true } },
    },
  });
}

export async function deleteFolder(folderId: string, userId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });
  if (!folder) return null;
  await prisma.folder.delete({ where: { id: folderId } });
  return { id: folderId };
}

