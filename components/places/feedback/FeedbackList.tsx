"use client";

import Link from "next/link";
import type { PlaceFeedbackItem } from "./types";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FeedbackList({ feedback }: { feedback: PlaceFeedbackItem[] }) {
  if (feedback.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-white/75">
        No reviews yet. Be the first to share your thoughts about this place.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((entry) => (
        <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href={`/users/${entry.user.username.replace(/^@/, "")}`}
                className="font-cinzel text-lg hover:underline"
              >
                {entry.user.name}
              </Link>
              <p className="text-sm text-white/60">{entry.user.username}</p>
            </div>
            <p className="text-xs text-white/55">{formatDate(entry.updatedAt)}</p>
          </div>
          {entry.rating && (
            <p className="mt-3 text-sm text-[#f3c46a]">{"★".repeat(entry.rating)}</p>
          )}
          {entry.content && (
            <p className="mt-3 text-sm leading-relaxed text-white/85">{entry.content}</p>
          )}
        </div>
      ))}
    </div>
  );
}
