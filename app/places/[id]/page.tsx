import { notFound } from "next/navigation";
import PlaceDetailPageClient from "@/components/places/PlaceDetailPageClient";
import { getPlaceDetailById } from "@/lib/places/detail";

export default async function PlaceProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = await getPlaceDetailById(id);

  if (!place) notFound();

  return <PlaceDetailPageClient place={place} />;
}
