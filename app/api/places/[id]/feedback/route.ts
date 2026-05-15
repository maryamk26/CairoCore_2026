import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  getFeedbackDisplayName,
  getFeedbackDisplayUsername,
  getPlaceFeedbackSummary,
  listPlaceFeedback,
  upsertPlaceFeedback,
} from "@/lib/db/feedback";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const place = await prisma.place.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const [feedbackRows, summary] = await Promise.all([
      listPlaceFeedback(id),
      getPlaceFeedbackSummary(id),
    ]);

    return NextResponse.json({
      summary,
      feedback: feedbackRows.map((entry) => ({
        id: entry.id,
        rating: entry.rating,
        content: entry.content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        user: {
          id: entry.user.id,
          name: getFeedbackDisplayName(entry.user),
          username: getFeedbackDisplayUsername(entry.user),
        },
      })),
    });
  } catch (err) {
    console.error("Place feedback fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const place = await prisma.place.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const rating =
      typeof body.rating === "number" && Number.isInteger(body.rating) ? body.rating : null;
    const content = typeof body.content === "string" ? body.content : null;

    const feedback = await upsertPlaceFeedback(id, user.id, { rating, content });
    const summary = await getPlaceFeedbackSummary(id);

    return NextResponse.json({
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
        content: feedback.content,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
        user: {
          id: feedback.user.id,
          name: getFeedbackDisplayName(feedback.user),
          username: getFeedbackDisplayUsername(feedback.user),
        },
      },
      summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit feedback";
    const status = message === "Feedback must include a rating or written comment." ? 400 : 500;

    if (status === 500) {
      console.error("Place feedback save failed:", err);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
