import { NextRequest, NextResponse } from "next/server";
import { banUserByAdmin, mapModerationError } from "@/lib/admin/moderationService";
import { requireAdminApi } from "@/lib/auth/requireAdmin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "";

  try {
    await banUserByAdmin(id, { adminId: admin.dbUser.id, reason });
    return NextResponse.json({
      ok: true,
      targetType: "USER",
      targetId: id,
      action: "BAN_USER",
    });
  } catch (error) {
    const mapped = mapModerationError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
