"use client";

import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("@/components/places/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-200 flex items-center justify-center rounded-lg">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export type MapPlace = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  address?: string;
  category?: string;
};

interface RouteBuilderMapSectionProps {
  places: MapPlace[];
}

export default function RouteBuilderMapSection({ places }: RouteBuilderMapSectionProps) {
  if (places.length === 0) return null;
  return (
    <div className="bg-[#5d4e37] rounded-lg p-6">
      <RouteMap places={places} height="600px" />
    </div>
  );
}
