"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import ProfileSwitch from "./ProfileSwitch";
import CreatedGrid, { type PlaceItem } from "./CreatedGrid";
import SavedGrid, { type FolderItem, type SavedRouteItem } from "./SavedGrid";
import FollowListModal from "./FollowListModal";
import { FollowListUser, ProfileData } from "./types";

type ProfileTab = "created" | "saved";
type FollowTab = "followers" | "following";

interface ProfileViewProps {
  profile: ProfileData;
  places: PlaceItem[];
  folders: FolderItem[];
  routes: SavedRouteItem[];
  isOwnProfile: boolean;
  followsEndpoint: string;
  onFolderCreated?: () => void;
  showSavedTab?: boolean;
  viewerFollows?: boolean | null;
}

const PROFILE_TABS = [
  { id: "created", label: "Created" },
  { id: "saved", label: "Saved" },
] as const;

async function copyProfileUrl(usernameRaw: string) {
  const url = `${window.location.origin}/users/${encodeURIComponent(usernameRaw)}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = url;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

export default function ProfileView({
  profile,
  places,
  folders,
  routes,
  isOwnProfile,
  followsEndpoint,
  onFolderCreated,
  showSavedTab = true,
  viewerFollows: viewerFollowsProp,
}: ProfileViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ProfileTab>("created");
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followTab, setFollowTab] = useState<FollowTab>("followers");
  const [followers, setFollowers] = useState<FollowListUser[]>([]);
  const [following, setFollowing] = useState<FollowListUser[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [hasLoadedFollows, setHasLoadedFollows] = useState(false);

  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [viewerFollows, setViewerFollows] = useState<boolean | null | undefined>(
    isOwnProfile ? undefined : viewerFollowsProp
  );
  const [followBusy, setFollowBusy] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const followApiPath = `/api/users/${encodeURIComponent(profile.usernameRaw)}/follow`;

  useEffect(() => {
    setFollowerCount(profile.followerCount);
    if (!isOwnProfile) {
      setViewerFollows(viewerFollowsProp);
    }
  }, [profile.id, profile.followerCount, viewerFollowsProp, isOwnProfile]);

  useEffect(() => {
    if (!shareToast) return;
    const t = window.setTimeout(() => setShareToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [shareToast]);

  const openFollowModal = async (tab: FollowTab) => {
    setFollowTab(tab);
    setFollowModalOpen(true);

    if (hasLoadedFollows) return;

    setFollowLoading(true);
    setFollowError(null);
    try {
      const res = await fetch(followsEndpoint);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to load follow lists");
      }

      setFollowers(data.followers ?? []);
      setFollowing(data.following ?? []);
      setHasLoadedFollows(true);
    } catch (error) {
      setFollowError(error instanceof Error ? error.message : "Failed to load follow lists");
    } finally {
      setFollowLoading(false);
    }
  };

  const submitFollowChange = async (action: "follow" | "unfollow") => {
    if (followBusy) return;
    setFollowBusy(true);
    try {
      const res = await fetch(followApiPath, {
        method: "POST",
        credentials: "include",
        headers: action === "unfollow" ? { "Content-Type": "application/json" } : undefined,
        body: action === "unfollow" ? JSON.stringify({ action: "unfollow" }) : undefined,
      });
      if (res.status === 401) {
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || (action === "unfollow" ? "Failed to unfollow" : "Failed to follow")
        );
      }
      const delta = typeof data.followerCountDelta === "number" ? data.followerCountDelta : 0;
      setViewerFollows(action === "unfollow" ? false : true);
      setFollowerCount((c) => c + delta);
      setHasLoadedFollows(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : action === "unfollow"
            ? "Failed to unfollow"
            : "Failed to follow"
      );
    } finally {
      setFollowBusy(false);
    }
  };

  const handleShareProfile = async () => {
    const ok = await copyProfileUrl(profile.usernameRaw);
    setShareToast(
      ok
        ? "Profile link copied — you can paste it anywhere."
        : "Could not copy the link. Try again."
    );
  };

  const tabs = showSavedTab ? PROFILE_TABS : PROFILE_TABS.slice(0, 1);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {shareToast && (
        <div
          role="status"
          className="fixed bottom-8 left-1/2 z-[100] max-w-[min(90vw,420px)] -translate-x-1/2 rounded-full bg-[#3a3428] px-5 py-3 text-center text-sm text-white shadow-lg"
        >
          {shareToast}
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 pb-12 pt-24">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[#5d4e37] transition-colors hover:text-[#8b6f47]"
            aria-label="Back"
          >
            <span className="text-xl font-medium">←</span>
            <span className="font-cinzel text-sm">Back</span>
          </Link>
        </div>

        <div className="mt-6">
          <ProfileHeader
            profile={profile}
            followerCount={followerCount}
            isOwnProfile={isOwnProfile}
            onFollowersClick={() => openFollowModal("followers")}
            onFollowingClick={() => openFollowModal("following")}
            viewerFollows={isOwnProfile ? undefined : (viewerFollows ?? null)}
            onFollow={() => void submitFollowChange("follow")}
            onUnfollow={() => void submitFollowChange("unfollow")}
            followBusy={followBusy}
            onShareProfile={handleShareProfile}
          />
        </div>

        <div className="mt-10">
          <ProfileSwitch activeTab={activeTab} onSwitch={setActiveTab} tabs={tabs} />
        </div>

        <div className="mt-8 min-h-[320px]">
          {activeTab === "created" && (
            <CreatedGrid
              places={places}
              isOwnProfile={isOwnProfile}
              ownerLabel={isOwnProfile ? "Your" : `${profile.name}'s`}
            />
          )}

          {showSavedTab && activeTab === "saved" && (
            <SavedGrid
              folders={folders}
              routes={routes}
              onFolderCreated={onFolderCreated}
              isOwnProfile={isOwnProfile}
              ownerLabel={isOwnProfile ? "Your" : `${profile.name}'s`}
            />
          )}
        </div>
      </div>

      <FollowListModal
        isOpen={followModalOpen}
        initialTab={followTab}
        title={profile.name}
        followers={followers}
        following={following}
        loading={followLoading}
        error={followError}
        onClose={() => setFollowModalOpen(false)}
      />
    </div>
  );
}
