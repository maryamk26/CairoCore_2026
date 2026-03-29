"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { type PlaceItem } from "./CreatedGrid";
import { type FolderItem, type SavedRouteItem } from "./SavedGrid";
import ProfileView from "./ProfileView";
import { type ProfileData } from "./types";

const PROFILE_FETCH_TIMEOUT_MS = 10000;

export default function ProfileContent() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [routes, setRoutes] = useState<SavedRouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const clearSessionAndRedirect = useCallback(async () => {
    await signOut();
    router.replace("/auth");
  }, [router, signOut]);

  const fetchFolders = useCallback(async () => {
    const res = await fetch("/api/profile/folders");
    if (res.status === 401) {
      await clearSessionAndRedirect();
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setFolders(data.folders ?? []);
    }
  }, [clearSessionAndRedirect]);

  const fetchProfile = useCallback(() => {
    setFetchError(null);
    setLoading(true);
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PROFILE_FETCH_TIMEOUT_MS);

    fetch("/api/profile/page", { signal: controller.signal })
      .then((res) => {
        if (cancelled) return null;
        if (res.status === 401) {
          clearSessionAndRedirect();
          return null;
        }
        if (!res.ok) return res.json().then(() => null);
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data?.profile) return;
        setProfile({
          id: data.profile.id ?? "",
          name: data.profile.name ?? "",
          username: data.profile.username ?? "",
          usernameRaw: data.profile.usernameRaw ?? "",
          followerCount: data.profile.followerCount ?? 0,
          followingCount: data.profile.followingCount ?? 0,
        });
        setPlaces(data.places ?? []);
        setFolders(data.folders ?? []);
        setRoutes(data.routes ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.name === "AbortError") {
          setFetchError("Request took too long. Please try again.");
        } else {
          setFetchError("Could not load profile. Please try again.");
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [clearSessionAndRedirect]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    const cleanup = fetchProfile();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [user?.id, authLoading, router, fetchProfile]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5d4e37]/70">Loading...</div>
      </div>
    );
  }

  if (loading && !profile && !fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5d4e37]/70">Loading profile...</div>
      </div>
    );
  }

  if (fetchError || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] gap-4 px-4">
        <p className="text-[#5d4e37] text-center">
          {fetchError ?? "Could not load profile."}
        </p>
        <button
          type="button"
          onClick={fetchProfile}
          className="px-6 py-3 rounded-full bg-[#8b6f47] text-white font-cinzel font-medium hover:bg-[#5d4e37]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <ProfileView
      profile={profile}
      places={places}
      folders={folders}
      routes={routes}
      isOwnProfile
      followsEndpoint="/api/profile/follows"
      onFolderCreated={fetchFolders}
    />
  );
}
