export type LatLng = {
  lat: number;
  lng: number;
};

const COORD_PAIR =
  /(-?\d{1,3}(?:\.\d+)?)\s*[+,]\s*(-?\d{1,3}(?:\.\d+)?)/;

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function toLatLng(lat: number, lng: number): LatLng | null {
  if (!isValidCoord(lat, lng)) return null;
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

function parseCoordPair(value: string | null | undefined): LatLng | null {
  if (!value) return null;
  const normalized = value.replace(/\+/g, " ");
  const match = normalized.match(COORD_PAIR);
  if (!match) return null;
  return toLatLng(Number.parseFloat(match[1]), Number.parseFloat(match[2]));
}

/** Prefer pin marker (!3d!4d) over map center (@lat,lng). */
export function parseGoogleMapsCoords(input: string): LatLng | null {
  const text = input.trim();
  if (!text) return null;

  const bareCoords = parseCoordPair(text);
  if (bareCoords && !/[a-z]/i.test(text.replace(/https?:\/\//i, ""))) {
    // Allow bare "lat,lng" / "lat,+lng" without treating URLs as bare
    if (!text.includes("/") && !text.includes("?")) {
      return bareCoords;
    }
  }

  const pinMatch = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pinMatch) {
    const coords = toLatLng(
      Number.parseFloat(pinMatch[1]),
      Number.parseFloat(pinMatch[2]),
    );
    if (coords) return coords;
  }

  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const coords = toLatLng(
      Number.parseFloat(atMatch[1]),
      Number.parseFloat(atMatch[2]),
    );
    if (coords) return coords;
  }

  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    const candidates = [
      url.searchParams.get("q"),
      url.searchParams.get("query"),
      url.searchParams.get("ll"),
      url.searchParams.get("destination"),
      url.searchParams.get("center"),
    ];

    for (const candidate of candidates) {
      const coords = parseCoordPair(candidate);
      if (coords) return coords;
    }

    // /maps/search/18.559401,+105.676933 or /maps/place/.../@lat,lng
    const pathCoords = parseCoordPair(
      decodeURIComponent(url.pathname + url.search + url.hash),
    );
    if (pathCoords) return pathCoords;
  } catch {
    // Not a valid URL — fall through
  }

  return parseCoordPair(text);
}

export function isGoogleMapsShortLink(input: string): boolean {
  try {
    const url = new URL(
      input.trim().startsWith("http")
        ? input.trim()
        : `https://${input.trim()}`,
    );
    const host = url.hostname.replace(/^www\./, "");
    return (
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "g.co" ||
      host.endsWith(".app.goo.gl")
    );
  } catch {
    return false;
  }
}

export function looksLikeMapsLink(input: string): boolean {
  const text = input.trim().toLowerCase();
  if (!text) return false;
  return (
    text.includes("google.com/maps") ||
    text.includes("maps.google.") ||
    text.includes("maps.app.goo.gl") ||
    text.includes("goo.gl/maps") ||
    isGoogleMapsShortLink(text)
  );
}

/** Expand short maps.app.goo.gl links that no longer HTTP-redirect by default. */
export function withMapsConsentParam(url: string): string {
  try {
    const parsed = new URL(
      url.startsWith("http") ? url : `https://${url}`,
    );
    if (!parsed.searchParams.has("_imcp")) {
      parsed.searchParams.set("_imcp", "1");
    }
    return parsed.toString();
  } catch {
    return url.includes("?") ? `${url}&_imcp=1` : `${url}?_imcp=1`;
  }
}
