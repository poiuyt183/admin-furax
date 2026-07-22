import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city_district?: string;
    district?: string;
    county?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
  };
};

function pickAddressLine(address: NominatimResult["address"]): string {
  if (!address) return "";

  const street = [address.house_number, address.road].filter(Boolean).join(" ");
  const area =
    address.suburb ??
    address.neighbourhood ??
    address.quarter ??
    address.city_district;

  return [street, area].filter(Boolean).join(", ");
}

function pickDistrict(address: NominatimResult["address"]): string {
  if (!address) return "";

  return (
    address.city_district ??
    address.district ??
    address.county ??
    address.suburb ??
    ""
  );
}

function pickCity(address: NominatimResult["address"]): string {
  if (!address) return "";

  return (
    address.city ??
    address.town ??
    address.municipality ??
    address.village ??
    address.state ??
    ""
  );
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "5", 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 8)
    : 5;

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&countrycodes=vn&addressdetails=1`,
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

  const results = (await response.json()) as NominatimResult[];

  if (results.length === 0) {
    return NextResponse.json({ error: "Not found", results: [] }, { status: 404 });
  }

  const mapped = results.map((result) => ({
    lat: Number.parseFloat(result.lat),
    lng: Number.parseFloat(result.lon),
    displayName: result.display_name,
    address: pickAddressLine(result.address) || result.display_name.split(",")[0]?.trim() || "",
    district: pickDistrict(result.address),
    city: pickCity(result.address),
  }));

  // Keep single-result shape for older callers that only need the first match
  return NextResponse.json({
    ...mapped[0],
    results: mapped,
  });
}
