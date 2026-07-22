import { auth } from "@/lib/auth";
import {
  isGoogleMapsShortLink,
  looksLikeMapsLink,
  parseGoogleMapsCoords,
  withMapsConsentParam,
} from "@/lib/google-maps";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const BROWSER_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

async function fetchResolved(url: string): Promise<{
  finalUrl: string;
  body: string;
}> {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html,application/xhtml+xml",
    },
  });

  const body = await response.text();
  return {
    finalUrl: response.url || url,
    body,
  };
}

function extractCoordsFromHtml(html: string) {
  const candidates = [
    ...html.matchAll(
      /https:\/\/(?:www\.)?google\.com\/maps\/[^"'\\\s<>]+/gi,
    ),
    ...html.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g),
    ...html.matchAll(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g),
  ];

  for (const match of candidates) {
    const coords = parseGoogleMapsCoords(match[0]);
    if (coords) return coords;
  }

  return parseGoogleMapsCoords(html);
}

async function resolveMapsLink(url: string) {
  const attempts = isGoogleMapsShortLink(url)
    ? [withMapsConsentParam(url), url]
    : [url];

  for (const attempt of attempts) {
    const { finalUrl, body } = await fetchResolved(attempt);

    const fromUrl = parseGoogleMapsCoords(finalUrl);
    if (fromUrl) {
      return { ...fromUrl, resolvedUrl: finalUrl };
    }

    const fromBody = extractCoordsFromHtml(body);
    if (fromBody) {
      return { ...fromBody, resolvedUrl: finalUrl };
    }
  }

  return null;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    url?: string;
  } | null;

  const url = body?.url?.trim();

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const direct = parseGoogleMapsCoords(url);
  if (direct) {
    return NextResponse.json(direct);
  }

  if (!looksLikeMapsLink(url) && !isGoogleMapsShortLink(url)) {
    return NextResponse.json(
      { error: "Not a Google Maps link" },
      { status: 400 },
    );
  }

  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const resolved = await resolveMapsLink(normalized);

    if (!resolved) {
      return NextResponse.json(
        { error: "Could not extract coordinates" },
        { status: 422 },
      );
    }

    return NextResponse.json(resolved);
  } catch {
    return NextResponse.json(
      { error: "Failed to resolve maps link" },
      { status: 502 },
    );
  }
}
