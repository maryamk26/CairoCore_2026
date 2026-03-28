import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getFoldersForPlace,
  removePlaceFromAllUserBoards,
  removePlaceFromFolder,
  savePlaceToFolder,
} from "@/lib/db/savedPlace";

async function authUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await authUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const placeId = new URL(request.url).searchParams.get("placeId")?.trim();
    if (!placeId) {
      return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    const folderIds = await getFoldersForPlace(user.id, placeId);
    return NextResponse.json({ folderIds });
  } catch (err) {
    console.error("Saved folders fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch saved folders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const folderId = typeof body.folderId === "string" ? body.folderId.trim() : "";
    const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";

    if (!folderId || !placeId) {
      return NextResponse.json(
        { error: "folderId and placeId are required" },
        { status: 400 }
      );
    }

    const saved = await savePlaceToFolder(user.id, folderId, placeId);

    return NextResponse.json(
      {
        saved: {
          id: saved.id,
          folderId: saved.folderId,
          placeId: saved.placeId,
          createdAt: saved.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Save place failed:", err);
    return NextResponse.json({ error: "Failed to save place" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";
    const folderId = typeof body.folderId === "string" ? body.folderId.trim() : "";

    if (!placeId) {
      return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    if (body.removeAll === true) {
      await removePlaceFromAllUserBoards(user.id, placeId);
      return NextResponse.json({ ok: true });
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "folderId is required unless removeAll is true" },
        { status: 400 }
      );
    }

    const result = await removePlaceFromFolder(user.id, folderId, placeId);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Remove from board failed:", err);
    return NextResponse.json({ error: "Failed to remove from board" }, { status: 500 });
  }
}
