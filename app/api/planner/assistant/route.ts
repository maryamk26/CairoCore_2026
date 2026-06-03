import { NextRequest, NextResponse } from "next/server";

import { PLANNER_AI_REQUIRED_MESSAGE } from "@/lib/ai/config";
import { runPlannerAssistantTurn } from "@/lib/planner/plannerAssistant";
import type { PlannerChatMessage, TripProfile } from "@/lib/planner/tripProfile";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 50;

function isValidMessage(raw: unknown): raw is PlannerChatMessage {
  if (!raw || typeof raw !== "object") return false;
  const m = raw as PlannerChatMessage;
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userMessage = typeof body.userMessage === "string" ? body.userMessage.trim() : "";
    const tripProfile = (body.tripProfile ?? null) as TripProfile | null;
    const messagesRaw = body.messages;
    const excludePlaceIdsRaw = body.excludePlaceIds;

    if (!userMessage) {
      return NextResponse.json({ error: "userMessage is required" }, { status: 400 });
    }
    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }
    if (!Array.isArray(messagesRaw)) {
      return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
    }
    const messages = messagesRaw.filter(isValidMessage).slice(-MAX_MESSAGES);
    const excludePlaceIds = Array.isArray(excludePlaceIdsRaw)
      ? excludePlaceIdsRaw.filter(
          (x: unknown): x is string => typeof x === "string" && x.trim().length > 0
        )
      : undefined;
    const excludeClean = excludePlaceIds?.map((s) => s.trim()).filter((s) => s.length > 0);

    const result = await runPlannerAssistantTurn({
      messages,
      tripProfile,
      userMessage,
      excludePlaceIds: excludeClean,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[planner-assistant] error:", error);
    const message = error instanceof Error ? error.message : "Assistant request failed";
    const status =
      message === PLANNER_AI_REQUIRED_MESSAGE ||
      message.includes("LM_STUDIO") ||
      message.includes("AI_PLANNER") ||
      message.includes("retrieval requires") ||
      message.includes("Vector retrieval")
        ? 503
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
