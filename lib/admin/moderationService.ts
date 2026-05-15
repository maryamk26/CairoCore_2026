import { ModerationActionType, ModerationTargetType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

type AdminActionInput = {
  adminId: string;
  reason: string;
};

function buildReason(reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error("Reason is required");
  }
  return trimmed;
}

async function enforceFiveStrikeRule(userId: string, adminId: string) {
  const strikeCount = await prisma.moderationAction.count({
    where: {
      ownerUserId: userId,
      actionType: ModerationActionType.SOFT_DELETE_CONTENT,
    },
  });

  if (strikeCount < 5) {
    return { strikeCount, autoBanned: false as const };
  }

  const existingAutoAction = await prisma.moderationAction.findFirst({
    where: {
      ownerUserId: userId,
      actionType: ModerationActionType.AUTO_BAN_AT_STRIKE_LIMIT,
    },
    select: { id: true },
  });

  if (existingAutoAction) {
    return { strikeCount, autoBanned: true as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        banReason: "Auto-banned after 5 moderation deletions",
        deletedAt: new Date(),
      },
    }),
    prisma.moderationAction.create({
      data: {
        adminId,
        targetType: ModerationTargetType.USER,
        targetId: userId,
        ownerUserId: userId,
        actionType: ModerationActionType.AUTO_BAN_AT_STRIKE_LIMIT,
        reason: "User reached 5 deleted posts/feedback items",
      },
    }),
  ]);

  try {
    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Failed to delete auth user after strike limit:", error);
    }
  } catch (error) {
    console.error("Failed to delete auth user after strike limit:", error);
  }

  return { strikeCount, autoBanned: true as const };
}

export async function softDeletePlaceByAdmin(placeId: string, input: AdminActionInput) {
  const reason = buildReason(input.reason);
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: {
      id: true,
      createdBy: true,
      deletedAt: true,
      name: true,
      city: true,
      description: true,
      type: true,
    },
  });

  if (!place) {
    throw new Error("PLACE_NOT_FOUND");
  }
  if (place.deletedAt) {
    throw new Error("PLACE_ALREADY_DELETED");
  }

  await prisma.$transaction([
    prisma.place.update({
      where: { id: placeId },
      data: {
        deletedAt: new Date(),
        deletedByAdminId: input.adminId,
        deleteReason: reason,
      },
    }),
    prisma.moderationAction.create({
      data: {
        adminId: input.adminId,
        targetType: ModerationTargetType.PLACE,
        targetId: place.id,
        ownerUserId: place.createdBy ?? null,
        actionType: ModerationActionType.SOFT_DELETE_CONTENT,
        reason,
        snapshot: {
          name: place.name,
          city: place.city,
          description: place.description,
          type: place.type,
        },
      },
    }),
  ]);

  if (!place.createdBy) {
    return { strikeCount: null, autoBanned: false as const };
  }
  return enforceFiveStrikeRule(place.createdBy, input.adminId);
}

export async function softDeleteFeedbackByAdmin(feedbackId: string, input: AdminActionInput) {
  const reason = buildReason(input.reason);
  const feedback = await prisma.placeFeedback.findUnique({
    where: { id: feedbackId },
    select: {
      id: true,
      userId: true,
      placeId: true,
      rating: true,
      content: true,
      deletedAt: true,
    },
  });

  if (!feedback) {
    throw new Error("FEEDBACK_NOT_FOUND");
  }
  if (feedback.deletedAt) {
    throw new Error("FEEDBACK_ALREADY_DELETED");
  }

  await prisma.$transaction([
    prisma.placeFeedback.update({
      where: { id: feedbackId },
      data: {
        deletedAt: new Date(),
        deletedByAdminId: input.adminId,
        deleteReason: reason,
      },
    }),
    prisma.moderationAction.create({
      data: {
        adminId: input.adminId,
        targetType: ModerationTargetType.FEEDBACK,
        targetId: feedback.id,
        ownerUserId: feedback.userId,
        actionType: ModerationActionType.SOFT_DELETE_CONTENT,
        reason,
        snapshot: {
          placeId: feedback.placeId,
          rating: feedback.rating,
          content: feedback.content,
        },
      },
    }),
  ]);

  return enforceFiveStrikeRule(feedback.userId, input.adminId);
}

export async function restorePlaceByAdmin(placeId: string, input: AdminActionInput) {
  const reason = buildReason(input.reason);
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: {
      id: true,
      createdBy: true,
      deletedAt: true,
      name: true,
      city: true,
    },
  });

  if (!place) {
    throw new Error("PLACE_NOT_FOUND");
  }
  if (!place.deletedAt) {
    throw new Error("PLACE_NOT_DELETED");
  }

  await prisma.$transaction([
    prisma.place.update({
      where: { id: placeId },
      data: {
        deletedAt: null,
        deletedByAdminId: null,
        deleteReason: null,
      },
    }),
    prisma.moderationAction.create({
      data: {
        adminId: input.adminId,
        targetType: ModerationTargetType.PLACE,
        targetId: place.id,
        ownerUserId: place.createdBy ?? null,
        actionType: ModerationActionType.RESTORE_CONTENT,
        reason,
        snapshot: {
          name: place.name,
          city: place.city,
        },
      },
    }),
  ]);
}

export async function restoreFeedbackByAdmin(feedbackId: string, input: AdminActionInput) {
  const reason = buildReason(input.reason);
  const feedback = await prisma.placeFeedback.findUnique({
    where: { id: feedbackId },
    select: {
      id: true,
      userId: true,
      placeId: true,
      deletedAt: true,
      rating: true,
      content: true,
    },
  });

  if (!feedback) {
    throw new Error("FEEDBACK_NOT_FOUND");
  }
  if (!feedback.deletedAt) {
    throw new Error("FEEDBACK_NOT_DELETED");
  }

  await prisma.$transaction([
    prisma.placeFeedback.update({
      where: { id: feedbackId },
      data: {
        deletedAt: null,
        deletedByAdminId: null,
        deleteReason: null,
      },
    }),
    prisma.moderationAction.create({
      data: {
        adminId: input.adminId,
        targetType: ModerationTargetType.FEEDBACK,
        targetId: feedback.id,
        ownerUserId: feedback.userId,
        actionType: ModerationActionType.RESTORE_CONTENT,
        reason,
        snapshot: {
          placeId: feedback.placeId,
          rating: feedback.rating,
          content: feedback.content,
        },
      },
    }),
  ]);
}

export async function banUserByAdmin(userId: string, input: AdminActionInput) {
  const reason = buildReason(input.reason);
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isBanned: true,
    },
  });

  if (!targetUser) {
    throw new Error("USER_NOT_FOUND");
  }
  if (targetUser.role === "ADMIN") {
    throw new Error("CANNOT_BAN_ADMIN");
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: now,
        banReason: reason,
        deletedAt: now,
      },
    }),
    prisma.moderationAction.create({
      data: {
        adminId: input.adminId,
        targetType: ModerationTargetType.USER,
        targetId: targetUser.id,
        ownerUserId: targetUser.id,
        actionType: ModerationActionType.BAN_USER,
        reason,
        snapshot: {
          email: targetUser.email,
          wasAlreadyBanned: targetUser.isBanned,
        },
      },
    }),
  ]);

  try {
    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Failed to delete auth user after admin ban:", error);
    }
  } catch (error) {
    console.error("Failed to delete auth user after admin ban:", error);
  }
}

export function mapModerationError(error: unknown) {
  if (!(error instanceof Error)) {
    return { status: 500, message: "Internal server error" };
  }

  const map: Record<string, { status: number; message: string }> = {
    PLACE_NOT_FOUND: { status: 404, message: "Place not found" },
    PLACE_ALREADY_DELETED: { status: 409, message: "Place already deleted" },
    PLACE_NOT_DELETED: { status: 409, message: "Place is not deleted" },
    FEEDBACK_NOT_FOUND: { status: 404, message: "Feedback not found" },
    FEEDBACK_ALREADY_DELETED: { status: 409, message: "Feedback already deleted" },
    FEEDBACK_NOT_DELETED: { status: 409, message: "Feedback is not deleted" },
    USER_NOT_FOUND: { status: 404, message: "User not found" },
    CANNOT_BAN_ADMIN: { status: 403, message: "Cannot ban an admin user" },
  };

  if (error.message === "Reason is required") {
    return { status: 400, message: "Reason is required" };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return { status: 404, message: "Record not found" };
  }

  return map[error.message] ?? { status: 500, message: "Internal server error" };
}
