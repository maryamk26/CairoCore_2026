"use client";

import { DAYS, TIME_OPTIONS } from "@/lib/constants/places";
import type { WorkingHoursState } from "@/lib/places/types";
import { getPlaceFormClasses, type PlaceFormVariant } from "@/lib/places/placeFormStyles";

export interface PlaceFormMoreOptionsProps {
  variant: PlaceFormVariant;
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
}

export default function PlaceFormMoreOptions({
  variant,
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
}: PlaceFormMoreOptionsProps) {
  const { labelCls } = getPlaceFormClasses(variant);
  const isEdit = variant === "edit";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onMoreOpenChange(!moreOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium ${isEdit ? "text-[#5d4e37]" : "text-gray-700"}`}
      >
        More options
        <span className={moreOpen ? "rotate-180" : ""}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {moreOpen && (
        <div className="p-4 space-y-4 bg-white border-t border-gray-200">
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelCls}`}>Working hours (per day)</label>
            <div className="space-y-3">
              {DAYS.map((day) => {
                const val = workingHours[day];
                const isClosed = val === "closed";
                return (
                  <div key={day} className="flex flex-wrap items-center gap-2">
                    <span className={`capitalize w-24 text-sm ${labelCls}`}>{day}</span>
                    <label className="inline-flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={(e) =>
                          onWorkingHoursChange({
                            ...workingHours,
                            [day]: e.target.checked ? "closed" : { start: TIME_OPTIONS[0], end: TIME_OPTIONS[TIME_OPTIONS.length - 1] },
                          })
                        }
                      />
                      Closed
                    </label>
                    {!isClosed && (
                      <>
                        <select
                          value={typeof val === "object" ? val.start : TIME_OPTIONS[0]}
                          onChange={(e) =>
                            onWorkingHoursChange({
                              ...workingHours,
                              [day]:
                                typeof workingHours[day] === "object"
                                  ? { ...(workingHours[day] as { start: string; end: string }), start: e.target.value }
                                  : { start: e.target.value, end: TIME_OPTIONS[TIME_OPTIONS.length - 1] },
                            })
                          }
                          className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-500">to</span>
                        <select
                          value={typeof val === "object" ? val.end : TIME_OPTIONS[TIME_OPTIONS.length - 1]}
                          onChange={(e) =>
                            onWorkingHoursChange({
                              ...workingHours,
                              [day]:
                                typeof workingHours[day] === "object"
                                  ? { ...(workingHours[day] as { start: string; end: string }), end: e.target.value }
                                  : { start: TIME_OPTIONS[0], end: e.target.value },
                            })
                          }
                          className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Entrance fee (EGP)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={entranceFee}
                onChange={(e) => onEntranceFeeChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Camera fee (EGP)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={cameraFee}
                onChange={(e) => onCameraFeeChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${labelCls}`}>Best time to visit</label>
            <input
              type="text"
              value={bestVisitTime}
              onChange={(e) => onBestVisitTimeChange(e.target.value)}
              placeholder={isEdit ? undefined : "e.g. Morning, Evening"}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className={`flex items-center gap-2 text-sm ${labelCls}`}>
              <input
                type="checkbox"
                checked={kidsFriendly === true}
                onChange={(e) => onKidsFriendlyChange(e.target.checked ? true : null)}
              />
              Kids friendly
            </label>
            <label className={`flex items-center gap-2 text-sm ${labelCls}`}>
              <input
                type="checkbox"
                checked={elderlyFriendly === true}
                onChange={(e) => onElderlyFriendlyChange(e.target.checked ? true : null)}
              />
              Elderly friendly
            </label>
            <label className={`flex items-center gap-2 text-sm ${labelCls}`}>
              <input
                type="checkbox"
                checked={petsFriendly === true}
                onChange={(e) => onPetsFriendlyChange(e.target.checked ? true : null)}
              />
              Pets friendly
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
