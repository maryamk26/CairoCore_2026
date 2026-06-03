"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCategoryIcon } from "@/components/icons/categoryIcons";
import { setLeafletDefaultIcon } from "@/lib/map/leafletDefaults";
import { fetchOrsRouteGeometry } from "@/utils/planner/fetchOrsRoute";

setLeafletDefaultIcon();

function createLocationDotIcon() {
  return L.divIcon({
    className: "custom-location-dot-marker",
    html: `<div style="
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="28" height="28" fill="#22c55e" style="display:block;">
        <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function createNumberedIcon(number: number, color: string = "#3388ff") {
  return L.divIcon({
    className: "custom-numbered-marker",
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${number}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

interface Place {
  id: string;
  title: string;
  lat: number;
  lng: number;
  address?: string;
  category?: string;
}

interface RouteMapProps {
  places: Place[];
  height?: string;
  transportMode?: string;
}

function placesRouteKey(places: Place[]): string {
  return places.map((p) => `${p.id}:${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
}

function MapBoundsUpdater({
  places,
  routeLine,
}: {
  places: Place[];
  routeLine: [number, number][] | null;
}) {
  const map = useMap();

  useEffect(() => {
    const latLngs: [number, number][] = places
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => [p.lat, p.lng]);

    if (routeLine) {
      for (const [lat, lng] of routeLine) {
        if (Number.isFinite(lat) && Number.isFinite(lng)) latLngs.push([lat, lng]);
      }
    }

    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });
      map.invalidateSize();
    }
  }, [places, routeLine, map]);

  return null;
}

export default function RouteMap({
  places,
  height = "500px",
  transportMode = "car",
}: RouteMapProps) {
  const [routeLine, setRouteLine] = useState<[number, number][] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routePartial, setRoutePartial] = useState(false);
  const [routeError, setRouteError] = useState(false);

  const placesKey = useMemo(() => placesRouteKey(places), [places]);
  const mode = transportMode?.trim() || "car";

  useEffect(() => {
    if (places.length < 2) {
      setRouteLine(null);
      setRoutePartial(false);
      setRouteError(false);
      setIsLoading(false);
      return;
    }

    const [start, ...rest] = places;
    let cancelled = false;
    setIsLoading(true);
    setRouteError(false);
    setRoutePartial(false);
    setRouteLine(null);

    fetchOrsRouteGeometry({
      start: { lat: start.lat, lng: start.lng },
      stops: rest.map((p) => ({ latitude: p.lat, longitude: p.lng })),
      transportMode: mode,
    }).then((result) => {
      if (cancelled) return;
      if (result?.routeCoordinates?.length) {
        setRouteLine(result.routeCoordinates);
        setRoutePartial(false);
        setRouteError(false);
      } else {
        setRouteLine(null);
        setRouteError(true);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [placesKey, mode]);

  if (typeof window === "undefined") {
    return (
      <div
        className="w-full bg-gray-200 flex items-center justify-center rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div
        className="w-full bg-gray-200 flex items-center justify-center rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-500">No places selected</p>
      </div>
    );
  }

  const centerLat = places.reduce((s, p) => s + p.lat, 0) / places.length;
  const centerLng = places.reduce((s, p) => s + p.lng, 0) / places.length;

  return (
    <div className="w-full rounded-lg overflow-hidden relative" style={{ height }}>
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm text-gray-700">Loading route...</p>
        </div>
      )}
      {!isLoading && routePartial && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg max-w-[90%]">
          <p className="text-sm text-gray-700 text-center">
            Part of this route could not be calculated on roads — showing the best path available.
          </p>
        </div>
      )}
      {!isLoading && routeError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg max-w-[90%]">
          <p className="text-sm text-gray-700 text-center">
            Could not load directions. Check your connection and try again.
          </p>
        </div>
      )}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routeLine && routeLine.length > 1 && (
          <Polyline
            key={`route-${placesKey}-${mode}`}
            positions={routeLine}
            pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.9 }}
          />
        )}
        {places.map((place, index) => {
          const isStart = index === 0;
          const isLastRouteStop = index === places.length - 1;
          const stopLabel = isStart ? 0 : index;
          const color = isStart ? "#22c55e" : isLastRouteStop ? "#ef4444" : "#3b82f6";
          const icon = isStart
            ? createLocationDotIcon()
            : createNumberedIcon(stopLabel, color);

          const CategoryIcon = getCategoryIcon(place.category ?? "other");
          return (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={icon}>
              <Popup>
                <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                  <CategoryIcon size={18} className="text-[#8b6f47] shrink-0" />
                  {isStart ? (
                    <>Starting point — {place.title}</>
                  ) : (
                    <>
                      {stopLabel}. {place.title}
                    </>
                  )}
                </div>
                {place.address && <div className="text-xs text-gray-600">{place.address}</div>}
              </Popup>
            </Marker>
          );
        })}
        <MapBoundsUpdater places={places} routeLine={routeLine} />
      </MapContainer>
    </div>
  );
}
