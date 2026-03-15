import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { DAYS } from "@/lib/constants/places";
import type { WorkingHoursState } from "@/lib/places/types";

export type DraftState = {
  name: string;
  description: string;
  type: string;
  category: string;
  address: string;
  city: string;
  workingHours: WorkingHoursState;
  entranceFee: string;
  cameraFee: string;
  vibes: string[];
  tags: string[];
  bestVisitTime: string;
  latitude: string;
  longitude: string;
  images: string[];
  kidsFriendly: boolean | null;
  elderlyFriendly: boolean | null;
  petsFriendly: boolean | null;
};

const DRAFT_KEY = (placeId: string) => `place-edit-draft-${placeId}`;

function getDraft(id: string): DraftState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY(id));
    if (!raw) return null;
    return JSON.parse(raw) as DraftState;
  } catch {
    return null;
  }
}

function setDraft(id: string, draft: DraftState): void {
  try {
    sessionStorage.setItem(DRAFT_KEY(id), JSON.stringify(draft));
  } catch {}
}

export function clearDraft(id: string): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY(id));
  } catch {}
}

export function parseWorkingHours(wh: unknown): WorkingHoursState {
  const defaultState: WorkingHoursState = Object.fromEntries(
    DAYS.map((d) => [d, "closed"])
  );
  if (!wh || typeof wh !== "object") return defaultState;
  const o = wh as Record<string, { open: string; close: string } | "closed">;
  DAYS.forEach((day) => {
    const v = o[day];
    if (v === "closed") defaultState[day] = "closed";
    else if (
      v &&
      typeof v === "object" &&
      "open" in v &&
      "close" in v
    )
      defaultState[day] = { start: v.open, end: v.close };
  });
  return defaultState;
}

const initialWorkingHours = (): WorkingHoursState =>
  Object.fromEntries(DAYS.map((d) => [d, "closed"]));

export function usePlaceEditDraft(placeId: string) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("place_to_visit");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHoursState>(
    initialWorkingHours
  );
  const [entranceFee, setEntranceFee] = useState("");
  const [cameraFee, setCameraFee] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [bestVisitTime, setBestVisitTime] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [kidsFriendly, setKidsFriendly] = useState<boolean | null>(null);
  const [elderlyFriendly, setElderlyFriendly] = useState<boolean | null>(null);
  const [petsFriendly, setPetsFriendly] = useState<boolean | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    initialLoadDone.current = false;
    fetch(`/api/places/${placeId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.createdBy !== user.id) {
          router.replace(`/places/${placeId}`);
          return;
        }
        setName(data.title ?? "");
        setDescription(data.description ?? "");
        setType(data.type ?? "place_to_visit");
        setCategory(data.category ?? "");
        setAddress(data.location?.address ?? "");
        setCity(data.city ?? "");
        setWorkingHours(parseWorkingHours(data.workingHours));
        setEntranceFee(data.entryFees != null ? String(data.entryFees) : "");
        setCameraFee(data.cameraFees != null ? String(data.cameraFees) : "");
        setVibes(Array.isArray(data.vibe) ? data.vibe : []);
        setTags(Array.isArray(data.tags) ? data.tags : []);
        setBestVisitTime(data.bestTimeToVisit?.timeOfDay?.[0] ?? "");
        setLatitude(data.location?.lat != null ? String(data.location.lat) : "");
        setLongitude(data.location?.lng != null ? String(data.location.lng) : "");
        setImages(Array.isArray(data.images) ? data.images : []);
        setKidsFriendly(
          data.kidsFriendly === true ? true : data.kidsFriendly === false ? false : null
        );
        setElderlyFriendly(
          data.elderlyFriendly === true
            ? true
            : data.elderlyFriendly === false
              ? false
              : null
        );
        setPetsFriendly(
          data.petsFriendly === true ? true : data.petsFriendly === false ? false : null
        );
        initialLoadDone.current = true;
        const draft = getDraft(placeId);
        if (draft) {
          setName(draft.name ?? "");
          setDescription(draft.description ?? "");
          setType(draft.type ?? "place_to_visit");
          setCategory(draft.category ?? "");
          setAddress(draft.address ?? "");
          setCity(draft.city ?? "");
          setWorkingHours(draft.workingHours ?? parseWorkingHours(null));
          setEntranceFee(draft.entranceFee ?? "");
          setCameraFee(draft.cameraFee ?? "");
          setVibes(Array.isArray(draft.vibes) ? draft.vibes : []);
          setTags(Array.isArray(draft.tags) ? draft.tags : []);
          setBestVisitTime(draft.bestVisitTime ?? "");
          setLatitude(draft.latitude ?? "");
          setLongitude(draft.longitude ?? "");
          setImages(Array.isArray(draft.images) ? draft.images : []);
          setKidsFriendly(draft.kidsFriendly ?? null);
          setElderlyFriendly(draft.elderlyFriendly ?? null);
          setPetsFriendly(draft.petsFriendly ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeId, user, router]);

  const saveDraft = useCallback(() => {
    setDraft(placeId, {
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
    });
  }, [
    placeId,
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
  ]);

  useEffect(() => {
    if (!initialLoadDone.current || !placeId) return;
    const t = window.setTimeout(saveDraft, 500);
    return () => clearTimeout(t);
  }, [placeId, saveDraft]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [authLoading, user, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      const lat = latitude.trim() ? parseFloat(latitude) : null;
      const lng = longitude.trim() ? parseFloat(longitude) : null;
      if (
        lat === null ||
        lng === null ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        setError("Latitude and longitude are required.");
        return;
      }
      if (!name.trim()) {
        setError("Title is required.");
        return;
      }
      const openingHoursObj: Record<
        string,
        { open: string; close: string } | "closed"
      > = {};
      DAYS.forEach((day) => {
        const v = workingHours[day];
        if (v === "closed") openingHoursObj[day] = "closed";
        else if (v && typeof v === "object")
          openingHoursObj[day] = { open: v.start, close: v.end };
      });
      setSubmitting(true);
      try {
        const res = await fetch(`/api/places/${placeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            type,
            category: category || null,
            address: address.trim() || null,
            city: city.trim() || null,
            openingHours: JSON.stringify(openingHoursObj),
            entranceFee: entranceFee.trim() ? parseFloat(entranceFee) : null,
            cameraFee: cameraFee.trim() ? parseFloat(cameraFee) : null,
            vibes,
            tags,
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
        if (!res.ok)
          throw new Error(data.details || data.error || "Failed to update place");
        clearDraft(placeId);
        router.push(`/places/${placeId}?from=profile`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      placeId,
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
      router,
    ]
  );

  return {
    authLoading,
    user,
    loading,
    submitting,
    error,
    setError,
    name,
    setName,
    description,
    setDescription,
    type,
    setType,
    category,
    setCategory,
    address,
    setAddress,
    city,
    setCity,
    workingHours,
    setWorkingHours,
    entranceFee,
    setEntranceFee,
    cameraFee,
    setCameraFee,
    vibes,
    setVibes,
    tags,
    setTags,
    bestVisitTime,
    setBestVisitTime,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    images,
    setImages,
    kidsFriendly,
    setKidsFriendly,
    elderlyFriendly,
    setElderlyFriendly,
    petsFriendly,
    setPetsFriendly,
    moreOpen,
    setMoreOpen,
    handleSubmit,
  };
}
