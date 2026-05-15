import { NextRequest, NextResponse } from "next/server";
import { mapModerationError, softDeleteFeedbackByAdmin } from "@/lib/admin/moderationService";
import { requireAdminApi } from "@/lib/auth/requireAdmin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "";

  try {
    const result = await softDeleteFeedbackByAdmin(id, {
      adminId: admin.dbUser.id,
      reason,
    });

    return NextResponse.json({
      ok: true,
      targetType: "FEEDBACK",
      targetId: id,
      strikeCount: result.strikeCount,
      autoBanned: result.autoBanned,
    });
  } catch (error) {
    const mapped = mapModerationError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
