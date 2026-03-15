"use client";

import Link from "next/link";
import { use } from "react";
import { usePlaceEditDraft } from "@/lib/places/usePlaceEditDraft";
import PlaceFormFields from "@/components/places/PlaceFormFields";

export default function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    authLoading,
    user,
    loading,
    submitting,
    error,
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
    kidsFriendly,
    setKidsFriendly,
    elderlyFriendly,
    setElderlyFriendly,
    petsFriendly,
    setPetsFriendly,
    moreOpen,
    setMoreOpen,
    handleSubmit,
  } = usePlaceEditDraft(id);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5d4e37]/70">Loading...</div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5d4e37]/70">Loading place...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-6">
          <Link
            href={`/places/${id}`}
            className="inline-flex items-center gap-1 text-[#5d4e37] hover:text-[#8b6f47]"
          >
            <span className="text-xl">←</span>
            <span className="font-cinzel text-sm">Back to place</span>
          </Link>
        </div>
        <h1 className="text-2xl font-cinzel font-bold text-[#5d4e37] mb-8">
          Edit place
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-[#5d4e37] mb-2">
              Images
            </label>
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 min-h-[200px] p-4 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              <p className="text-xs text-gray-500 w-full">
                Images are saved when you submit.
              </p>
            </div>
          </div>
          <div className="lg:col-span-3">
            <PlaceFormFields
              variant="edit"
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
              submitLabel="Save changes"
              submitLabelSubmitting={
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Saving…</span>
                </>
              }
              submitting={submitting}
              onSubmit={handleSubmit}
              submitExtra={
                submitting ? (
                  <p className="text-sm text-[#5d4e37]/80">Saving your changes…</p>
                ) : undefined
              }
            />
          </div>
        </div>
        {submitting && (
          <div
            className="fixed inset-0 bg-black/20 z-40 pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
