import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search?" +
  "countrycodes=eg&viewbox=29.5,29.5,32.5,31.5&bounded=1&limit=5&format=json&addressdetails=1";

type NominatimResult = {
  place_id: number;
  lon: string;
  lat: string;
  display_name: string;
  name?: string;
};

export async function GET(request: NextRequest) {
  try {
    const q = new URL(request.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const response = await fetch(`${NOMINATIM_URL}&q=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent": "CairoCore/1.0",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [] }, { status: 502 });
    }

    const data = (await response.json()) as NominatimResult[];
    const results = data.map((item) => ({
      id: item.place_id.toString(),
      place_name: item.display_name,
      center: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number],
      text: item.name || item.display_name.split(",")[0],
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
