"use client";

import Link from "next/link";
import { ProfileData } from "./types";

interface ProfileHeaderProps {
  profile: ProfileData;
  followerCount: number;
  isOwnProfile?: boolean;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  viewerFollows?: boolean | null;
  onFollow?: () => void | Promise<void>;
  onUnfollow?: () => void | Promise<void>;
  followBusy?: boolean;
  onShareProfile?: () => void | Promise<void>;
}

function ShareIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

export default function ProfileHeader({
  profile,
  followerCount,
  isOwnProfile = false,
  onFollowersClick,
  onFollowingClick,
  viewerFollows,
  onFollow,
  onUnfollow,
  followBusy = false,
  onShareProfile,
}: ProfileHeaderProps) {
  const showFollowActions = !isOwnProfile && viewerFollows !== undefined;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-4 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
        <span className="text-3xl font-bold text-[#5d4e37]/70">
          {profile.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <h1 className="mb-1 font-cinzel text-2xl font-bold text-[#5d4e37]">{profile.name}</h1>

      <p className="mb-3 text-sm text-[#5d4e37]/80">{profile.username}</p>

      <div className="mb-4 flex items-center gap-3 text-sm text-[#5d4e37]/70">
        <button
          type="button"
          onClick={onFollowersClick}
          className="transition-colors hover:text-[#5d4e37]"
        >
          {followerCount} followers
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={onFollowingClick}
          className="transition-colors hover:text-[#5d4e37]"
        >
          {profile.followingCount} following
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {showFollowActions &&
          (viewerFollows ? (
            <>
              <span className="inline-flex items-center rounded-full border border-[#8b6f47]/40 bg-[#faf3ea] px-4 py-2 font-cinzel text-sm font-medium text-[#5d4e37]">
                Followed
              </span>
              <button
                type="button"
                disabled={followBusy}
                onClick={() => void onUnfollow?.()}
                className="inline-flex items-center rounded-full border border-[#5d4e37]/25 px-4 py-2 font-cinzel text-sm font-medium text-[#5d4e37] transition-colors hover:bg-[#5d4e37]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Unfollow
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={followBusy}
              onClick={() => void onFollow?.()}
              className="inline-flex items-center rounded-full bg-[#5d4e37] px-5 py-2 font-cinzel text-sm font-medium text-white transition-colors hover:bg-[#8b6f47] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Follow
            </button>
          ))}

        <button
          type="button"
          onClick={() => void onShareProfile?.()}
          className="inline-flex items-center gap-2 rounded-full bg-[#5d4e37]/10 px-4 py-2 font-cinzel text-sm font-medium text-[#5d4e37] transition-colors hover:bg-[#5d4e37]/20"
        >
          <ShareIcon />
          Share profile
        </button>

        {isOwnProfile && (
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 rounded-full bg-[#5d4e37]/10 px-4 py-2 font-cinzel text-sm font-medium text-[#5d4e37] transition-colors hover:bg-[#5d4e37]/20"
          >
            <PencilIcon />
            Edit profile
          </Link>
        )}
      </div>
    </div>
  );
}
