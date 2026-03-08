"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { setLeafletDefaultIcon } from "@/lib/map/leafletDefaults";

setLeafletDefaultIcon();

interface PlaceMapProps {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
  height?: string;
  zoom?: number;
}

function MapViewUpdater({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], zoom || map.getZoom());
  }, [lat, lng, zoom, map]);

  return null;
}

export default function PlaceMap({
  lat,
  lng,
  title,
  address,
  height = "400px",
  zoom = 15
}: PlaceMapProps) {
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

  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            {title && <div className="font-semibold text-sm mb-1">{title}</div>}
            {address && <div className="text-xs text-gray-600">{address}</div>}
          </Popup>
        </Marker>
        <MapViewUpdater lat={lat} lng={lng} zoom={zoom} />
      </MapContainer>
    </div>
  );
}


