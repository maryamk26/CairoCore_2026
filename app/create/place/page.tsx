"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { DAYS } from "@/lib/constants/places";
import type { WorkingHoursState } from "@/lib/places/types";
import PlaceImageUpload from "@/components/places/PlaceImageUpload";
import PlaceFormFields from "@/components/places/PlaceFormFields";

export default function CreatePlacePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("place_to_visit");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHoursState>(() =>
    Object.fromEntries(DAYS.map((d) => [d, "closed"]))
  );
  const [entranceFee, setEntranceFee] = useState("");
  const [cameraFee, setCameraFee] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [bestVisitTime, setBestVisitTime] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [kidsFriendly, setKidsFriendly] = useState<boolean | null>(null);
  const [elderlyFriendly, setElderlyFriendly] = useState<boolean | null>(null);
  const [petsFriendly, setPetsFriendly] = useState<boolean | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [authLoading, user, router]);

  useEffect(() => {
    const t = window.setTimeout(() => setAuthTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      const lat = latitude.trim() ? parseFloat(latitude) : null;
      const lng = longitude.trim() ? parseFloat(longitude) : null;
      if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        setError("Latitude and longitude are required.");
        return;
      }
      if (!name.trim()) {
        setError("Title is required.");
        return;
      }
      const openingHoursObj: Record<string, { open: string; close: string } | "closed"> = {};
      DAYS.forEach((day) => {
        const v = workingHours[day];
        if (v === "closed") openingHoursObj[day] = "closed";
        else if (v && typeof v === "object") openingHoursObj[day] = { open: v.start, close: v.end };
      });
      const openingHoursJson =
        Object.keys(openingHoursObj).length > 0 ? JSON.stringify(openingHoursObj) : null;
      setSubmitting(true);
      try {
        const res = await fetch("/api/profile/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            type: type || "place_to_visit",
            category: category || null,
            address: address.trim() || null,
            city: city.trim() || null,
            openingHours: openingHoursJson,
            entranceFee: entranceFee.trim() ? parseFloat(entranceFee) : null,
            cameraFee: cameraFee.trim() ? parseFloat(cameraFee) : null,
            vibes: vibes.length ? vibes : [],
            tags: tags.length ? tags : [],
            bestVisitTime: bestVisitTime.trim() || null,
            latitude: lat,
            longitude: lng,
            images,
            kidsFriendly,
            elderlyFriendly,
            petsFriendly,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to create place");
        router.push(`/places/${data.place.id}?from=profile`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [
      name,
      description,
      type,
      category,
      address,
      city,
      workingHours,
      entranceFee,
      cameraFee,
      vibes,
      tags,
      bestVisitTime,
      latitude,
      longitude,
      images,
      kidsFriendly,
      elderlyFriendly,
      petsFriendly,
    ]
  );

  if (authLoading && !authTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5d4e37]/70">Loading...</div>
      </div>
    );
  }
  if (authTimedOut && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] gap-4 px-4">
        <p className="text-[#5d4e37] text-center">
          Taking longer than usual. Please sign in to continue.
        </p>
        <Link
          href="/auth"
          className="px-6 py-3 rounded-full bg-[#8b6f47] text-white font-cinzel font-medium hover:bg-[#5d4e37]"
        >
          Sign in
        </Link>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
          >
            <span className="text-xl">←</span>
            <span className="font-cinzel text-sm">Back</span>
          </Link>
        </div>
        <h1 className="text-2xl font-cinzel font-bold text-gray-900 mb-8">Create place</h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <PlaceImageUpload images={images} onImagesChange={setImages} />
          </div>
          <div className="lg:col-span-3">
            <PlaceFormFields
              variant="create"
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              type={type}
              onTypeChange={setType}
              category={category}
              onCategoryChange={setCategory}
              tags={tags}
              onTagsChange={setTags}
              vibes={vibes}
              onVibesChange={setVibes}
              address={address}
              onAddressChange={setAddress}
              city={city}
              onCityChange={setCity}
              latitude={latitude}
              onLatitudeChange={setLatitude}
              longitude={longitude}
              onLongitudeChange={setLongitude}
              workingHours={workingHours}
              onWorkingHoursChange={setWorkingHours}
              entranceFee={entranceFee}
              onEntranceFeeChange={setEntranceFee}
              cameraFee={cameraFee}
              onCameraFeeChange={setCameraFee}
              bestVisitTime={bestVisitTime}
              onBestVisitTimeChange={setBestVisitTime}
              kidsFriendly={kidsFriendly}
              onKidsFriendlyChange={setKidsFriendly}
              elderlyFriendly={elderlyFriendly}
              onElderlyFriendlyChange={setElderlyFriendly}
              petsFriendly={petsFriendly}
              onPetsFriendlyChange={setPetsFriendly}
              moreOpen={moreOpen}
              onMoreOpenChange={setMoreOpen}
              error={error}
              submitLabel={submitting ? "Creating..." : "Create place"}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
