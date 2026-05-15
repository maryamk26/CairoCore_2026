"use client";

import Link from "next/link";
import type { FeedItem } from "@/lib/feed/types";

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString();
}

function HeaderAvatar({ label }: { label: string }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8ddd4] font-cinzel text-lg font-semibold text-[#5d4e37]">
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

function getActivityLabel(item: FeedItem) {
  switch (item.type) {
    case "place_created":
      return "Created a place";
    case "place_saved":
      return `Created board ${item.metadata.boardName}`;
    case "place_feedback":
      return "Shared a review";
    case "suggested_place":
      return item.metadata.reason;
  }
}

export default function FeedCard({ item }: { item: FeedItem }) {
  const creator = item.place.creator;
  const activityActor = item.actor ?? creator;
  const activityName = activityActor?.name ?? "CairoCore";
  const activityProfile = activityActor ? `/users/${activityActor.usernameRaw}` : null;
  const creatorName = creator?.name ?? "CairoCore";
  const reviewCount = item.place.feedbackCount;
  const activityLabel = getActivityLabel(item);

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#e6e0d8] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <HeaderAvatar label={activityName} />
          <div className="min-w-0">
            {activityProfile ? (
              <Link
                href={activityProfile}
                className="block truncate font-cinzel text-base font-semibold text-[#2f2b25] hover:underline"
              >
                {activityName}
              </Link>
            ) : (
              <p className="truncate font-cinzel text-base font-semibold text-[#2f2b25]">
                {activityName}
              </p>
            )}
            <p className="truncate text-sm text-[#7b7268]">
              {activityLabel} · {item.place.name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="whitespace-nowrap text-xs text-[#7b7268]">
            {formatRelativeDate(item.createdAt)}
          </p>
        </div>
      </div>

      <Link href={`/places/${item.place.id}`} className="block">
        <div className="relative aspect-[4/3] bg-[#e8ddd4]">
          {item.place.image ? (
            <img
              src={item.place.image}
              alt={item.place.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: "url(/images/backgrounds/home1.jpg)" }}
            />
          )}
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center justify-between gap-4 border-b border-[#f0ece7] pb-4">
          <div className="flex items-center gap-5 text-sm text-[#4d463d]">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#c28b31]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.286 3.96c.3.921-.755 1.688-1.538 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.783.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.98 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.368-3.96z" />
              </svg>
              <span>{item.place.averageRating?.toFixed(1) ?? "No rating"}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z"
                />
              </svg>
              <span>
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>
          <Link
            href={`/places/${item.place.id}`}
            className="rounded-full border border-[#d7c7b4] px-4 py-2 text-sm font-medium text-[#5d4e37] transition-colors hover:bg-[#f7f2ea]"
          >
            See more
          </Link>
        </div>

        <div className="pt-4">
          <p className="text-sm leading-relaxed text-[#3f382f]">
            <span className="font-semibold text-[#2f2b25]">{creatorName}</span>{" "}
            <span className="text-[#6d6357]">
              {item.place.description ?? "No caption available for this place yet."}
            </span>
          </p>
          {item.type === "place_feedback" && item.metadata.content && (
            <p className="mt-3 rounded-2xl bg-[#f7f2ea] px-4 py-3 text-sm text-[#5d4e37]">
              <span className="mb-1 block font-semibold text-[#2f2b25]">
                Review by {item.actor.name}
              </span>
              “{item.metadata.content}”
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
