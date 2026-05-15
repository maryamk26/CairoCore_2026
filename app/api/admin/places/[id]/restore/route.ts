import { NextRequest, NextResponse } from "next/server";
import { mapModerationError, restorePlaceByAdmin } from "@/lib/admin/moderationService";
import { requireAdminApi } from "@/lib/auth/requireAdmin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "";

  try {
    await restorePlaceByAdmin(id, {
      adminId: admin.dbUser.id,
      reason,
    });

    return NextResponse.json({
      ok: true,
      targetType: "PLACE",
      targetId: id,
      action: "RESTORE_CONTENT",
    });
  } catch (error) {
    const mapped = mapModerationError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
