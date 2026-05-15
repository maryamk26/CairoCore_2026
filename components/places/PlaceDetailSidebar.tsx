"use client";

type WorkingHoursObj = Record<string, { open: string; close: string } | "closed">;
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface PlaceDetailSidebarProps {
  location: { address: string; lat: number; lng: number };
  entryFees: number | null;
  cameraFees: number | null;
  petsFriendly: boolean;
  kidsFriendly: boolean;
  workingHoursStr: string | null;
  workingHoursObj: WorkingHoursObj | null;
  bestTimeToVisit: string[] | null;
}

export default function PlaceDetailSidebar({
  location,
  entryFees,
  cameraFees,
  petsFriendly,
  kidsFriendly,
  workingHoursStr,
  workingHoursObj,
  bestTimeToVisit,
}: PlaceDetailSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#5d4e37] rounded-lg p-6 sticky top-4">
        <h3 className="font-cinzel text-xl font-bold text-white mb-6">Quick Info</h3>
        <div className="space-y-4">
          <div>
            <p className="font-cinzel text-white/70 text-sm mb-2">Location</p>
            <p className="font-cinzel text-white text-sm leading-relaxed">
              {location.address || "—"}
            </p>
            <p className="font-cinzel text-white/60 text-xs font-mono mt-2">
              {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
            </p>
          </div>
          {entryFees != null && (
            <div>
              <p className="font-cinzel text-white/70 text-sm mb-1">Entry</p>
              <p className="font-cinzel text-white">{entryFees} EGP</p>
            </div>
          )}
          {cameraFees != null && (
            <div>
              <p className="font-cinzel text-white/70 text-sm mb-1">Camera</p>
              <p className="font-cinzel text-white">{cameraFees} EGP</p>
            </div>
          )}
          <div className="flex gap-4">
            <div>
              <p className="font-cinzel text-white/70 text-sm mb-1">Pets</p>
              <p className="font-cinzel text-white/90">{petsFriendly ? "Allowed" : "—"}</p>
            </div>
            <div>
              <p className="font-cinzel text-white/70 text-sm mb-1">Kids</p>
              <p className="font-cinzel text-white/90">{kidsFriendly ? "Friendly" : "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {(workingHoursStr || workingHoursObj) && (
        <div className="bg-[#5d4e37] rounded-lg p-6">
          <h3 className="font-cinzel text-xl font-bold text-white mb-4">Opening hours</h3>
          {workingHoursStr ? (
            <p className="font-cinzel text-white/90">{workingHoursStr}</p>
          ) : workingHoursObj ? (
            <div className="space-y-2">
              {DAYS.map((day) => {
                const hours = workingHoursObj[day];
                if (hours === undefined) return null;
                return (
                  <div key={day} className="flex justify-between items-center">
                    <span className="font-cinzel text-white/70 capitalize">{day}</span>
                    <span className="font-cinzel text-white">
                      {hours === "closed" ? "Closed" : `${hours.open} – ${hours.close}`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      {bestTimeToVisit && bestTimeToVisit.length > 0 && (
        <div className="bg-[#5d4e37] rounded-lg p-6">
          <h3 className="font-cinzel text-xl font-bold text-white mb-4">Best time to visit</h3>
          <p className="font-cinzel text-white/90">{bestTimeToVisit.join(", ")}</p>
        </div>
      )}
    </div>
  );
}
