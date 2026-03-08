"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PlaceRecommendation } from "@/utils/planner/recommendation";

const userLocationIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<div style="
    background-color: #3b82f6;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const destinationIcon = (color: string = "#ef4444") => L.divIcon({
  className: "custom-destination-marker",
  html: `<div style="
    background-color: ${color};
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 12px;
  ">📍</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface NavigationStep {
  distance: number;
  duration: number;
  instruction: string;
  location: [number, number];
  maneuver: {
    type: string;
    modifier?: string;
  };
}

interface NavigationMapProps {
  userLocation: [number, number];
  steps: NavigationStep[];
  currentStep: number;
  places: PlaceRecommendation[];
  routeGeometry?: [number, number][];
}

function MapFollower({ userLocation }: { userLocation: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(userLocation, 17, { animate: true });
  }, [userLocation, map]);

  return null;
}

export default function NavigationMap({ userLocation, steps, currentStep, places, routeGeometry = [] }: NavigationMapProps) {
  if (typeof window === "undefined") {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading map...</p>
      </div>
    );
  }

  const hasRoadGeometry = routeGeometry.length > 1;
  const stepCount = Math.max(steps.length, 1);
  const splitIdx = hasRoadGeometry ? Math.min(Math.floor((currentStep / stepCount) * routeGeometry.length), routeGeometry.length - 1) : 0;
  const completedRoute = hasRoadGeometry ? routeGeometry.slice(0, splitIdx + 1) : steps.map((s) => [s.location[0], s.location[1]] as [number, number]).slice(0, currentStep + 1);
  const remainingRoute = hasRoadGeometry ? routeGeometry.slice(splitIdx) : steps.map((s) => [s.location[0], s.location[1]] as [number, number]).slice(currentStep);

  return (
    <div className="w-full h-full min-h-screen" style={{ height: "100vh" }}>
      <MapContainer
        center={userLocation}
        zoom={17}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {completedRoute.length > 1 && (
          <Polyline
            positions={completedRoute}
            color="#9ca3af"
            weight={6}
            opacity={0.6}
          />
        )}
        {remainingRoute.length > 1 && (
          <Polyline
            positions={remainingRoute}
            color="#3b82f6"
            weight={6}
            opacity={0.9}
          />
        )}
        <Marker position={userLocation} icon={userLocationIcon} />
        <Circle
          center={userLocation}
          radius={20}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1,
          }}
        />
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={destinationIcon("#ef4444")}
          />
        ))}
        <MapFollower userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}

