import { z } from "zod/v4";

export const navItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Tên menu không được để trống").max(80),
  href: z.string().min(1, "Đường dẫn không được để trống").max(500),
  isActive: z.boolean().default(true),
});

export const contactSchema = z.object({
  address: z.string().max(500).default(""),
  hotline: z.string().max(50).default(""),
  email: z
    .string()
    .max(200)
    .default("")
    .refine(
      (value) => !value.trim() || z.email().safeParse(value.trim()).success,
      "Email không hợp lệ",
    ),
  technicalPhone: z.string().max(50).default(""),
  facebookUrl: z.string().max(500).default(""),
  zaloUrl: z.string().max(500).default(""),
});

export const siteSettingsSchema = z.object({
  logoUrl: z.string().default(""),
  logoWhiteUrl: z.string().default(""),
  description: z.string().max(1000).default(""),
  navbar: z.array(navItemSchema).default([]),
  contact: contactSchema.default({
    address: "",
    hotline: "",
    email: "",
    technicalPhone: "",
    facebookUrl: "",
    zaloUrl: "",
  }),
});

export type NavItem = z.infer<typeof navItemSchema>;
export type ContactSettings = z.infer<typeof contactSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const defaultNavItems: NavItem[] = [
  { id: "nav-home", label: "Trang chủ", href: "/", isActive: true },
  {
    id: "nav-video",
    label: "Video Review",
    href: "/video-review",
    isActive: true,
  },
  {
    id: "nav-catalogue",
    label: "Catalogue",
    href: "/catalogue",
    isActive: true,
  },
  { id: "nav-stores", label: "Cửa hàng", href: "/cua-hang", isActive: true },
  { id: "nav-warranty", label: "Bảo hành", href: "/bao-hanh", isActive: true },
  {
    id: "nav-policy",
    label: "Chính sách",
    href: "/chinh-sach",
    isActive: true,
  },
  { id: "nav-news", label: "Tin tức", href: "/tin-tuc", isActive: true },
];

export const settingsDefault: SiteSettings = {
  logoUrl: "/logo/primary_logo.png",
  logoWhiteUrl: "/logo/white_logo.png",
  description:
    "Thương hiệu thiết bị nhà bếp cao cấp hàng đầu Việt Nam. Cam kết mang đến sản phẩm chất lượng với công nghệ tiên tiến nhất.",
  navbar: defaultNavItems,
  contact: {
    address: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    hotline: "1900 xxxx",
    email: "info@furax.vn",
    technicalPhone: "1900 xxxx",
    facebookUrl: "https://facebook.com/furax",
    zaloUrl: "https://zalo.me/furax",
  },
};

export function parseSiteSettings(value: unknown): SiteSettings {
  const parsed = siteSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : settingsDefault;
}
