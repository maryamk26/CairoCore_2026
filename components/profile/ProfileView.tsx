"use client";

import Link from "next/link";
import { useState } from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileSwitch from "./ProfileSwitch";
import CreatedGrid, { type PlaceItem } from "./CreatedGrid";
import SavedGrid, { type FolderItem } from "./SavedGrid";
import FollowListModal from "./FollowListModal";
import { FollowListUser, ProfileData } from "./types";

type ProfileTab = "created" | "saved";
type FollowTab = "followers" | "following";

interface ProfileViewProps {
  profile: ProfileData;
  places: PlaceItem[];
  folders: FolderItem[];
  isOwnProfile: boolean;
  followsEndpoint: string;
  onFolderCreated?: () => void;
  showSavedTab?: boolean;
}

const PROFILE_TABS = [
  { id: "created", label: "Created" },
  { id: "saved", label: "Saved" },
] as const;

export default function ProfileView({
  profile,
  places,
  folders,
  isOwnProfile,
  followsEndpoint,
  onFolderCreated,
  showSavedTab = true,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("created");
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followTab, setFollowTab] = useState<FollowTab>("followers");
  const [followers, setFollowers] = useState<FollowListUser[]>([]);
  const [following, setFollowing] = useState<FollowListUser[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [hasLoadedFollows, setHasLoadedFollows] = useState(false);

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

  const tabs = showSavedTab ? PROFILE_TABS : PROFILE_TABS.slice(0, 1);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[#5d4e37] hover:text-[#8b6f47] transition-colors"
            aria-label="Back"
          >
            <span className="text-xl font-medium">←</span>
            <span className="text-sm font-cinzel">Back</span>
          </Link>
        </div>

        <div className="mt-6">
          <ProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            onFollowersClick={() => openFollowModal("followers")}
            onFollowingClick={() => openFollowModal("following")}
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
