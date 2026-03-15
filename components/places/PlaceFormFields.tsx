"use client";

import type { WorkingHoursState } from "@/lib/places/types";
import type { PlaceFormVariant } from "@/lib/places/placeFormStyles";
import PlaceFormBasicFields from "./PlaceFormBasicFields";
import PlaceFormMoreOptions from "./PlaceFormMoreOptions";

export type PlaceFormFieldsProps = {
  variant: PlaceFormVariant;
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  tags: string[];
  onTagsChange: (v: string[]) => void;
  vibes: string[];
  onVibesChange: (v: string[]) => void;
  address: string;
  onAddressChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  latitude: string;
  onLatitudeChange: (v: string) => void;
  longitude: string;
  onLongitudeChange: (v: string) => void;
  workingHours: WorkingHoursState;
  onWorkingHoursChange: (v: WorkingHoursState) => void;
  entranceFee: string;
  onEntranceFeeChange: (v: string) => void;
  cameraFee: string;
  onCameraFeeChange: (v: string) => void;
  bestVisitTime: string;
  onBestVisitTimeChange: (v: string) => void;
  kidsFriendly: boolean | null;
  onKidsFriendlyChange: (v: boolean | null) => void;
  elderlyFriendly: boolean | null;
  onElderlyFriendlyChange: (v: boolean | null) => void;
  petsFriendly: boolean | null;
  onPetsFriendlyChange: (v: boolean | null) => void;
  moreOpen: boolean;
  onMoreOpenChange: (v: boolean) => void;
  error?: string;
  submitLabel: string;
  submitLabelSubmitting?: React.ReactNode;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  submitExtra?: React.ReactNode;
};

export default function PlaceFormFields({
  variant,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  type,
  onTypeChange,
  category,
  onCategoryChange,
  tags,
  onTagsChange,
  vibes,
  onVibesChange,
  address,
  onAddressChange,
  city,
  onCityChange,
  latitude,
  onLatitudeChange,
  longitude,
  onLongitudeChange,
  workingHours,
  onWorkingHoursChange,
  entranceFee,
  onEntranceFeeChange,
  cameraFee,
  onCameraFeeChange,
  bestVisitTime,
  onBestVisitTimeChange,
  kidsFriendly,
  onKidsFriendlyChange,
  elderlyFriendly,
  onElderlyFriendlyChange,
  petsFriendly,
  onPetsFriendlyChange,
  moreOpen,
  onMoreOpenChange,
  error,
  submitLabel,
  submitLabelSubmitting,
  submitting,
  onSubmit,
  submitExtra,
}: PlaceFormFieldsProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PlaceFormBasicFields
        variant={variant}
        name={name}
        onNameChange={onNameChange}
        description={description}
        onDescriptionChange={onDescriptionChange}
        type={type}
        onTypeChange={onTypeChange}
        category={category}
        onCategoryChange={onCategoryChange}
        tags={tags}
        onTagsChange={onTagsChange}
        vibes={vibes}
        onVibesChange={onVibesChange}
        address={address}
        onAddressChange={onAddressChange}
        city={city}
        onCityChange={onCityChange}
        latitude={latitude}
        onLatitudeChange={onLatitudeChange}
        longitude={longitude}
        onLongitudeChange={onLongitudeChange}
      />
      <PlaceFormMoreOptions
        variant={variant}
        workingHours={workingHours}
        onWorkingHoursChange={onWorkingHoursChange}
        entranceFee={entranceFee}
        onEntranceFeeChange={onEntranceFeeChange}
        cameraFee={cameraFee}
        onCameraFeeChange={onCameraFeeChange}
        bestVisitTime={bestVisitTime}
        onBestVisitTimeChange={onBestVisitTimeChange}
        kidsFriendly={kidsFriendly}
        onKidsFriendlyChange={onKidsFriendlyChange}
        elderlyFriendly={elderlyFriendly}
        onElderlyFriendlyChange={onElderlyFriendlyChange}
        petsFriendly={petsFriendly}
        onPetsFriendlyChange={onPetsFriendlyChange}
        moreOpen={moreOpen}
        onMoreOpenChange={onMoreOpenChange}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {submitExtra}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-full bg-[#8b6f47] hover:bg-[#5d4e37] text-white font-cinzel font-semibold disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
      >
        {submitting && submitLabelSubmitting != null ? submitLabelSubmitting : submitLabel}
      </button>
    </form>
  );
}
