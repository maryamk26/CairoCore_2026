"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, RotateCcw, Send, Undo2 } from "lucide-react";
import FixedPhotoBackdrop from "@/components/layout/FixedPhotoBackdrop";
import ChatMessageBubble from "@/components/planner/ChatMessageBubble";
import ChatQuickReplies from "@/components/planner/ChatQuickReplies";
import {
  categoryBrowseChipLabel,
  getPendingBrowseCategory,
  isCategoryBrowseComplete,
} from "@/lib/planner/categoryBrowse";
import {
  WELCOME_MESSAGE,
  countUserMessages,
  type AssistantPhase,
  type PlannerChatMessage,
  type TripProfile,
} from "@/lib/planner/tripProfile";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

function createMessageId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface PlannerChatProps {
  initialMessages?: PlannerChatMessage[];
  initialTripProfile?: TripProfile | null;
  selectedPlaces: PlaceRecommendation[];
  onTogglePlace: (place: PlaceRecommendation) => void;
  onBuildRoute: () => void;
  onStartOver: () => void;
  onStateChange: (state: {
    messages: PlannerChatMessage[];
    tripProfile: TripProfile | null;
    phase: AssistantPhase;
    recommendations?: PlaceRecommendation[];
  }) => void;
}

function getShownPlaceIds(messages: PlannerChatMessage[]): string[] {
  const ids: string[] = [];
  for (const m of messages) {
    const recs = m.recommendations;
    if (!Array.isArray(recs)) continue;
    for (const r of recs) {
      if (r && typeof r.id === "string") ids.push(r.id);
    }
  }
  return [...new Set(ids)];
}

export default function PlannerChat({
  initialMessages,
  initialTripProfile,
  selectedPlaces,
  onTogglePlace,
  onBuildRoute,
  onStartOver,
  onStateChange,
}: PlannerChatProps) {
  const [messages, setMessages] = useState<PlannerChatMessage[]>(
    initialMessages?.length ? initialMessages : [WELCOME_MESSAGE]
  );
  const [tripProfile, setTripProfile] = useState<TripProfile | null>(initialTripProfile ?? null);
  const tripProfileRef = useRef<TripProfile | null>(initialTripProfile ?? null);
  const [phase, setPhase] = useState<AssistantPhase>(() => {
    if (initialTripProfile?.confidence === "ready") return "recommendations";
    const lastAssistant = [...(initialMessages ?? [])].reverse().find((m) => m.role === "assistant");
    if (lastAssistant?.recommendations?.length) return "recommendations";
    return "gathering";
  });
  const [input, setInput] = useState("");
  const [quickReplies, setQuickReplies] = useState<string[]>(
    WELCOME_MESSAGE.quickReplies ?? []
  );
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasUserMessages = countUserMessages(messages) > 0;
  const hasAnyRecommendations = messages.some((m) => (m.recommendations?.length ?? 0) > 0);
  const hasStopRecommendations = messages.some((m) =>
    (m.recommendations ?? []).some((r) => {
      const c = typeof r?.category === "string" ? r.category.toLowerCase() : "";
      return c === "cafe" || c === "restaurant";
    })
  );

  useEffect(() => {
    tripProfileRef.current = tripProfile;
  }, [tripProfile]);

  useEffect(() => {
    const isWelcomeOnly =
      Array.isArray(initialMessages) &&
      initialMessages.length === 1 &&
      initialMessages[0]?.id === WELCOME_MESSAGE.id;
    if (!isWelcomeOnly) return;

    if (isSending) stopRequest();
    setMessages([WELCOME_MESSAGE]);
    setTripProfile(initialTripProfile ?? null);
    setPhase("gathering");
    setQuickReplies(WELCOME_MESSAGE.quickReplies ?? []);
    setInput("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages, initialTripProfile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending, quickReplies]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const notifyParent = useCallback(
    (
      nextMessages: PlannerChatMessage[],
      nextProfile: TripProfile | null,
      nextPhase: AssistantPhase,
      nextRecommendations?: PlaceRecommendation[]
    ) => {
      onStateChange({
        messages: nextMessages,
        tripProfile: nextProfile,
        phase: nextPhase,
        recommendations: nextRecommendations,
      });
    },
    [onStateChange]
  );

  const stopRequest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsSending(false);
  };

  const undoLastTurn = () => {
    if (isSending) stopRequest();
    setError(null);
    setQuickReplies([]);
    if (messages.length <= 1) return;
    const next = [...messages];
    if (next[next.length - 1]?.role === "assistant") next.pop();
    if (next[next.length - 1]?.role === "user") next.pop();
    const normalized = next.length ? next : [WELCOME_MESSAGE];
    const nextPhase: AssistantPhase = normalized.some((m) => m.recommendations?.length)
      ? "recommendations"
      : "gathering";
    setMessages(normalized);
    setPhase(nextPhase);
    notifyParent(normalized, tripProfile, nextPhase);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setQuickReplies([]);
    setIsSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: PlannerChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    setInput("");

    try {
      const excludePlaceIds = getShownPlaceIds(messagesWithUser);
      const response = await fetch("/api/planner/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesWithUser,
          tripProfile: tripProfileRef.current,
          userMessage: trimmed,
          excludePlaceIds,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to send message");
      }

      const recommendations = Array.isArray(data.recommendations)
        ? (data.recommendations as PlaceRecommendation[])
        : undefined;

      const assistantMessage: PlannerChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: (data.assistantMessage as string) ?? "",
        quickReplies: Array.isArray(data.quickReplies) ? data.quickReplies : undefined,
        recommendations,
        createdAt: Date.now(),
      };

      const nextMessages = [...messagesWithUser, assistantMessage];
      const nextProfile = (data.tripProfile as TripProfile | null) ?? tripProfile;
      const nextPhase = (data.phase as AssistantPhase) ?? "gathering";
      const nextQuickReplies = Array.isArray(data.quickReplies) ? data.quickReplies : [];

      setMessages(nextMessages);
      setTripProfile(nextProfile);
      setPhase(nextPhase);
      setQuickReplies(nextQuickReplies);
      notifyParent(nextMessages, nextProfile, nextPhase, recommendations);
    } catch (sendError) {
      if (sendError instanceof Error && sendError.name === "AbortError") return;
      setError(sendError instanceof Error ? sendError.message : "Something went wrong");
      setMessages(messages);
      setInput(trimmed);
    } finally {
      abortRef.current = null;
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleBuildRouteClick = () => {
    if (tripProfile && !isCategoryBrowseComplete(tripProfile)) {
      const next = getPendingBrowseCategory(tripProfile);
      if (next) {
        void sendMessage(categoryBrowseChipLabel(next));
        return;
      }
    }

    const stopType = tripProfile?.wantsStop?.type;
    if (!hasStopRecommendations && (stopType === "cafe" || stopType === "restaurant")) {
      void sendMessage(stopType === "cafe" ? "Show coffee shops" : "Show restaurants");
      return;
    }
    onBuildRoute();
  };

  const statusText =
    phase === "recommendations" && hasAnyRecommendations
      ? `${selectedPlaces.length} selected · pick places or build route`
      : isSending
        ? "Typing…"
        : "Ask me about your Cairo trip";

  return (
    <div className="min-h-screen relative flex flex-col">
      <FixedPhotoBackdrop
        src="/images/backgrounds/survey.jpg"
        overlayClassName="bg-gradient-to-br from-[#3a3428]/85 via-[#3a3428]/75 to-[#2a241c]/90"
      />

      <div className="relative z-10 flex flex-col flex-1 max-h-screen pt-24 pb-4 px-4">
        <div className="mx-auto w-full max-w-2xl flex flex-col flex-1 min-h-0 rounded-2xl border border-white/10 bg-[#2a241c]/60 backdrop-blur-md shadow-2xl overflow-hidden">
          <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#3a3428]/80">
            <div className="w-10 h-10 rounded-full bg-[#5d4e37] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-cinzel text-base font-bold text-white truncate">
                Cairo Trip Assistant
              </h1>
              <p className="text-xs text-white/55 truncate">{statusText}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={undoLastTurn}
                disabled={messages.length <= 1}
                title="Undo last message"
                className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onStartOver}
                title="Start over"
                className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </header>

          {!hasUserMessages && (
            <div className="shrink-0 px-4 py-3 bg-[#d4af37]/10 border-b border-[#d4af37]/20 text-center">
              <p className="font-cinzel text-sm text-[#d4af37] font-semibold">
                Plan your perfect Cairo day
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Tell me who&apos;s coming, your vibe, budget &amp; timing
              </p>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
            {messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                selectedPlaceIds={selectedPlaces.map((p) => p.id)}
                onTogglePlace={onTogglePlace}
                highlightVibes={tripProfile?.vibes}
              />
            ))}

            {isSending && (
              <div className="flex gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#5d4e37] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-[#2a241c]/90 border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-[#d4af37]/80 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-[#d4af37]/80 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-[#d4af37]/80 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!isSending && quickReplies.length > 0 && (
              <ChatQuickReplies
                replies={quickReplies}
                onSelect={(reply) => void sendMessage(reply)}
                disabled={isSending}
              />
            )}

            {!isSending && phase === "recommendations" && hasAnyRecommendations && (
              <div className="flex gap-2.5 mb-2">
                <div className="w-9 shrink-0" aria-hidden />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {quickReplies.length === 0 && (
                    <button
                      type="button"
                      onClick={() => void sendMessage("Show me more options")}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                    >
                      Show more
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={handleBuildRouteClick}
                      disabled={selectedPlaces.length === 0}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#d4af37] text-[#3a3428] text-sm font-bold hover:bg-[#e5bf47] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Build route ({selectedPlaces.length})
                    </button>
                  </div>
                  <p className="text-[11px] text-white/45 text-center">
                    Tap a place card to select it
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mx-1 mb-2 rounded-xl bg-red-950/50 border border-red-400/40 px-4 py-3 text-center">
                <p className="text-red-200 text-sm mb-2">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-xs text-[#d4af37] hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-white/10 bg-[#3a3428]/90 p-3">
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message… e.g. romantic evening, budget-friendly"
                rows={1}
                disabled={isSending}
                className="flex-1 resize-none rounded-xl px-4 py-2.5 bg-[#2a241c]/80 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#d4af37]/60 disabled:opacity-60 max-h-[120px] leading-relaxed"
              />
              {isSending ? (
                <button
                  type="button"
                  onClick={stopRequest}
                  className="shrink-0 h-10 px-4 rounded-xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  title="Send"
                  className="shrink-0 w-10 h-10 rounded-xl bg-[#d4af37] text-[#3a3428] flex items-center justify-center hover:bg-[#e5bf47] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
          </footer>
        </div>
      </div>
    </div>
  );
}
