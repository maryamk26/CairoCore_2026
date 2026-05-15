"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProfileSwitch from "./ProfileSwitch";
import { FollowListUser } from "./types";

type FollowTab = "followers" | "following";

interface FollowListModalProps {
  isOpen: boolean;
  initialTab: FollowTab;
  title: string;
  followers: FollowListUser[];
  following: FollowListUser[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

const FOLLOW_TABS = [
  { id: "followers", label: "Followers" },
  { id: "following", label: "Following" },
] as const;

function UserRow({ user }: { user: FollowListUser }) {
  return (
    <Link
      href={`/users/${user.usernameRaw}`}
      className="flex items-center justify-between rounded-2xl border border-[#5d4e37]/10 px-4 py-3 hover:bg-[#5d4e37]/5 transition-colors"
    >
      <div className="min-w-0">
        <p className="truncate font-cinzel text-[#3a3428] font-semibold">{user.name}</p>
        <p className="truncate text-sm text-[#5d4e37]/70">{user.username}</p>
      </div>
      <span className="text-sm text-[#8b6f47]">View profile</span>
    </Link>
  );
}

export default function FollowListModal({
  isOpen,
  initialTab,
  title,
  followers,
  following,
  loading = false,
  error = null,
  onClose,
}: FollowListModalProps) {
  const [activeTab, setActiveTab] = useState<FollowTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const activeUsers = useMemo(
    () => (activeTab === "followers" ? followers : following),
    [activeTab, followers, following]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-[28px] bg-[#faf7f2] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#5d4e37]/10 px-6 py-5">
          <div>
            <h2 className="font-cinzel text-xl text-[#3a3428]">{title}</h2>
            <p className="text-sm text-[#5d4e37]/70">Browse followers and following</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-2 text-sm text-[#5d4e37] hover:bg-[#5d4e37]/10"
          >
            Close
          </button>
        </div>

        <div className="px-6 pt-4">
          <ProfileSwitch activeTab={activeTab} onSwitch={setActiveTab} tabs={FOLLOW_TABS} />
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="py-10 text-center text-[#5d4e37]/70">Loading...</p>
          ) : error ? (
            <p className="py-10 text-center text-[#5d4e37]">{error}</p>
          ) : activeUsers.length === 0 ? (
            <p className="py-10 text-center text-[#5d4e37]/70">
              No {activeTab === "followers" ? "followers" : "following"} yet.
            </p>
          ) : (
            <div className="space-y-3">
              {activeUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
