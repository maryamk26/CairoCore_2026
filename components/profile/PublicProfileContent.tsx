"use client";

import { useEffect, useState } from "react";
import ProfileView from "./ProfileView";
import { type PlaceItem } from "./CreatedGrid";
import { ProfileData } from "./types";

interface PublicProfileContentProps {
  username: string;
}

export default function PublicProfileContent({ username }: PublicProfileContentProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/users/${encodeURIComponent(username)}/page`);
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok || !data.profile) {
          setError(data.error || "Could not load profile.");
          setProfile(null);
          setPlaces([]);
          return;
        }

        setProfile(data.profile);
        setPlaces(data.places ?? []);
      } catch {
        if (cancelled) return;
        setError("Could not load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5d4e37]/70">Loading profile...</div>
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
        <p className="text-center text-[#5d4e37]">{error ?? "Profile not found."}</p>
      </div>
    );
  }

  return (
    <ProfileView
      profile={profile}
      places={places}
      folders={[]}
      isOwnProfile={false}
      followsEndpoint={`/api/users/${encodeURIComponent(profile.usernameRaw)}/follows`}
      showSavedTab={false}
    />
  );
}
