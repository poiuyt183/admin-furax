export const TRUST_ICON_KEYS = [
  "truck",
  "headphones",
  "map-pin",
  "shield",
  "star",
  "badge-check",
  "clock",
  "phone",
  "wrench",
  "package",
  "award",
  "users",
  "zap",
  "heart",
  "thumbs-up",
  "sparkles",
] as const;

export type TrustIconKey = (typeof TRUST_ICON_KEYS)[number];

export type TrustItem = {
  id: string;
  icon: TrustIconKey;
  text: string;
};

export const defaultTrustItems: TrustItem[] = [
  { id: "trust-warranty", icon: "shield", text: "Bảo hành 5 năm chính hãng" },
  { id: "trust-customers", icon: "star", text: "12.000+ khách hàng tin tưởng" },
  { id: "trust-shipping", icon: "truck", text: "Giao hàng miễn phí toàn quốc" },
  { id: "trust-support", icon: "headphones", text: "Hỗ trợ kỹ thuật 24/7" },
  { id: "trust-coverage", icon: "map-pin", text: "63 tỉnh thành phủ sóng" },
];
