"use client";

import { useEffect, useMemo, useState } from "react";
import FeedbackComposer from "@/components/places/feedback/FeedbackComposer";
import FeedbackList from "@/components/places/feedback/FeedbackList";
import type { PlaceFeedbackResponse } from "@/components/places/feedback/types";
import { useAuth } from "@/lib/hooks/useAuth";
function createEmptyFeedbackResponse(): PlaceFeedbackResponse {
  return {
    summary: { count: 0, averageRating: null },
    feedback: [],
  };
}

export default function PlaceFeedbackSection({ placeId }: { placeId: string }) {
  const { user, isLoading } = useAuth();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlaceFeedbackResponse>(createEmptyFeedbackResponse);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/places/${placeId}/feedback`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch feedback");
        }
        return res.json();
      })
      .then((result) => {
        if (!cancelled) {
          setData({
            summary: result.summary ?? createEmptyFeedbackResponse().summary,
            feedback: result.feedback ?? [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(createEmptyFeedbackResponse());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const existingFeedback = useMemo(
    () => data.feedback.find((entry) => entry.user.id === user?.id) ?? null,
    [data.feedback, user?.id]
  );

  useEffect(() => {
    if (!existingFeedback) return;
    setRating(existingFeedback.rating ?? 0);
    setContent(existingFeedback.content ?? "");
  }, [existingFeedback]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/places/${placeId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: rating || null,
          content,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || "Failed to save feedback");
      }

      setData((prev) => {
        const others = prev.feedback.filter((entry) => entry.user.id !== result.feedback.user.id);
        return {
          summary: result.summary ?? prev.summary,
          feedback: [result.feedback, ...others],
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="text-sm text-white/75">
          {data.summary.count} {data.summary.count === 1 ? "review" : "reviews"}
          {data.summary.averageRating ? ` · ${data.summary.averageRating.toFixed(1)} / 5` : ""}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <FeedbackList feedback={data.feedback} />

        <FeedbackComposer
          placeId={placeId}
          existingFeedback={Boolean(existingFeedback)}
          isLoading={isLoading}
          isSignedIn={Boolean(user)}
          rating={rating}
          content={content}
          submitting={submitting}
          error={error}
          onRatingChange={setRating}
          onContentChange={setContent}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
