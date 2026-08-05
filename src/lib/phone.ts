export function normalizeVietnamPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("0")) {
    normalized = `84${normalized.slice(1)}`;
  } else if (normalized.startsWith("840")) {
    normalized = `84${normalized.slice(3)}`;
  } else if (!normalized.startsWith("84")) {
    return null;
  }

  if (normalized.length !== 11) return null;
  if (!/^84(3|5|7|8|9)\d{8}$/.test(normalized)) return null;

  return normalized;
}

export function formatPhoneDisplay(normalized: string): string {
  if (normalized.startsWith("84") && normalized.length === 11) {
    return `0${normalized.slice(2)}`;
  }
  return normalized;
}
