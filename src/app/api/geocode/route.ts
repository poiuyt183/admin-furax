import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn`,
    {
      headers: {
        "User-Agent": "FuraX Admin/1.0 (store-location-picker)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Geocoding failed" },
      { status: response.status },
    );
  }

  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  const match = results[0];

  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    lat: Number.parseFloat(match.lat),
    lng: Number.parseFloat(match.lon),
    displayName: match.display_name,
  });
}
