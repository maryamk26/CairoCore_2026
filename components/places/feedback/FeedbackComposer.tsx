"use client";

import Link from "next/link";

function StarButton({ filled, onClick }: { filled: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[#c28b31]">
      <svg
        className={`h-6 w-6 ${filled ? "fill-current" : "fill-none text-[#c28b31]/35"}`}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.286 3.96c.3.921-.755 1.688-1.538 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.783.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.98 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.368-3.96z"
        />
      </svg>
    </button>
  );
}

type FeedbackComposerProps = {
  placeId: string;
  existingFeedback: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  rating: number;
  content: string;
  submitting: boolean;
  error: string | null;
  onRatingChange: (rating: number) => void;
  onContentChange: (content: string) => void;
  onSubmit: () => void;
};

export default function FeedbackComposer({
  placeId,
  existingFeedback,
  isLoading,
  isSignedIn,
  rating,
  content,
  submitting,
  error,
  onRatingChange,
  onContentChange,
  onSubmit,
}: FeedbackComposerProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
      <h3 className="font-cinzel text-xl">
        {existingFeedback ? "Update your review" : "Leave a review"}
      </h3>

      {isLoading ? (
        <p className="mt-3 text-sm text-white/65">Checking your session...</p>
      ) : !isSignedIn ? (
        <p className="mt-3 text-sm text-white/75">
          <Link
            href={`/auth?redirect=${encodeURIComponent(`/places/${placeId}`)}`}
            className="underline"
          >
            Sign in
          </Link>{" "}
          to add your review for this place.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarButton
                key={index}
                filled={index < rating}
                onClick={() => onRatingChange(index + 1)}
              />
            ))}
          </div>
          <textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            rows={5}
            placeholder="What stood out to you about this place?"
            className="mt-4 w-full rounded-2xl border border-white/10 bg-[#3a3428] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#c28b31]"
          />
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="mt-4 rounded-full bg-[#8b6f47] px-5 py-3 text-sm font-medium text-white hover:bg-[#5d4e37] disabled:opacity-60"
          >
            {submitting ? "Saving..." : existingFeedback ? "Update review" : "Post review"}
          </button>
        </>
      )}
    </div>
  );
}
