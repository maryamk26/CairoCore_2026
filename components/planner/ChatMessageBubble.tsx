"use client";

import { Bot, User } from "lucide-react";
import type { PlannerChatMessage } from "@/lib/planner/tripProfile";
import ChatRecommendationsList from "@/components/planner/ChatRecommendationsList";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

interface ChatMessageBubbleProps {
  message: PlannerChatMessage;
  selectedPlaceIds: string[];
  onTogglePlace: (place: PlaceRecommendation) => void;
  highlightVibes?: string[];
}

function formatTime(ts?: number): string | null {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ChatMessageBubble({
  message,
  selectedPlaceIds,
  onTogglePlace,
  highlightVibes,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const time = formatTime(message.createdAt);
  const hasRecommendations =
    message.role === "assistant" &&
    Array.isArray(message.recommendations) &&
    message.recommendations.length > 0;

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      <div
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          isUser ? "bg-[#d4af37] text-[#3a3428]" : "bg-[#5d4e37] text-[#d4af37] border border-[#d4af37]/30"
        }`}
        aria-hidden
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`flex flex-col min-w-0 max-w-[min(100%,28rem)] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
            isUser
              ? "bg-[#d4af37] text-[#3a3428] rounded-tr-sm"
              : "bg-[#2a241c]/90 text-white border border-white/10 rounded-tl-sm"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {time && (
          <p className={`mt-1 text-[10px] text-white/40 px-1 ${isUser ? "text-right" : "text-left"}`}>
            {time}
          </p>
        )}

        {hasRecommendations && (
          <div className="mt-3 w-full">
            <ChatRecommendationsList
              recommendations={message.recommendations!}
              selectedPlaceIds={selectedPlaceIds}
              onTogglePlace={onTogglePlace}
              highlightVibes={highlightVibes}
            />
          </div>
        )}
      </div>
    </div>
  );
}
