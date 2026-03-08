"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCategoryIcon } from "@/components/icons/categoryIcons";
import { setLeafletDefaultIcon } from "@/lib/map/leafletDefaults";

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
}

function MapBoundsUpdater({ places }: { places: Place[] }) {
  const map = useMap();

  useEffect(() => {
    if (places.length > 0) {
      const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [places, map]);

  return null;
}

async function fetchRoute(places: Place[]): Promise<L.LatLng[][] | null> {
  if (places.length < 2) return null;

  try {
    const coordinates = places.map((place) => `${place.lng},${place.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const geometry = data.routes[0].geometry.coordinates;
      const routePoints = geometry.map(([lng, lat]: [number, number]) =>
        [lat, lng] as [number, number]
      );
      return [routePoints];
    }

    return null;
  } catch {
    return null;
  }
}

export default function RouteMap({ places, height = "500px" }: RouteMapProps) {
  const [routeCoordinates, setRouteCoordinates] = useState<L.LatLng[][] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (places.length >= 2) {
      setIsLoading(true);
      fetchRoute(places).then(route => {
        setRouteCoordinates(route);
        setIsLoading(false);
      });
    } else {
      setRouteCoordinates(null);
    }
  }, [places]);

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
        {routeCoordinates && routeCoordinates.map((route, index) => (
          <Polyline
            key={index}
            positions={route}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
          />
        ))}
        {places.map((place, index) => {
          const isStart = index === 0;
          const isLastRouteStop = index === places.length - 1;
          const routeNumber = index;
          const color = isStart ? "#22c55e" : isLastRouteStop ? "#ef4444" : "#3b82f6";
          const icon = isStart
            ? createLocationDotIcon()
            : createNumberedIcon(routeNumber, color);

          const CategoryIcon = getCategoryIcon(place.category ?? "other");
          return (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={icon}>
              <Popup>
                <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                  <CategoryIcon size={18} className="text-[#8b6f47] shrink-0" />
                  {isStart ? (
                    <>Starting point — {place.title}</>
                  ) : (
                    <>{routeNumber}. {place.title}</>
                  )}
                </div>
                {place.address && (
                  <div className="text-xs text-gray-600">{place.address}</div>
                )}
              </Popup>
            </Marker>
          );
        })}
        <MapBoundsUpdater places={places} />
      </MapContainer>
    </div>
  );
}
