const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

export function parseYoutubeVideoId(url: string): string | null {
  if (!url.trim()) return null;

  const match = url.trim().match(YOUTUBE_ID_PATTERN);
  return match?.[1] ?? null;
}

export function isValidYoutubeUrl(url: string): boolean {
  if (!url.trim()) return true;
  return parseYoutubeVideoId(url) !== null;
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const videoId = parseYoutubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYoutubeThumbnailUrl(url: string): string | null {
  const videoId = parseYoutubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
