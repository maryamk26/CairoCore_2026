import { prisma } from "@/lib/prisma";

function firstPlaceImage(images: string[] | null | undefined) {
  if (!images?.length) return null;
  const url = images.find((u) => typeof u === "string" && u.trim());
  return url ?? null;
}

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
      savedPlaces: {
        orderBy: { createdAt: "asc" },
        take: 4,
        select: {
          place: {
            select: { images: true },
          },
        },
      },
    },
  });
}

export function folderPreviewImages(
  folder: Awaited<ReturnType<typeof getFoldersByUserId>>[number]
): (string | null)[] {
  return folder.savedPlaces.map((sp) => firstPlaceImage(sp.place.images));
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
