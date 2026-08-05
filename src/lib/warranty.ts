const DEFAULT_WARRANTY_MONTHS = 60;

/** Parse Product.warranty text like "5 năm" / "12 tháng". Defaults to 60 months. */
export function parseWarrantyMonths(
  warranty: string | null | undefined,
): number {
  if (!warranty) return DEFAULT_WARRANTY_MONTHS;

  const text = warranty.trim().toLowerCase();
  const yearMatch = text.match(/(\d+)\s*(năm|year|years|y)/i);
  if (yearMatch) {
    const years = Number(yearMatch[1]);
    if (Number.isFinite(years) && years > 0) return years * 12;
  }

  const monthMatch = text.match(/(\d+)\s*(tháng|thang|month|months|m)/i);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    if (Number.isFinite(months) && months > 0) return months;
  }

  return DEFAULT_WARRANTY_MONTHS;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
