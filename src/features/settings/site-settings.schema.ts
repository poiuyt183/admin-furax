import { z } from "zod/v4";

export const navSubLinkSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Tên link không được để trống").max(80),
  href: z.string().min(1, "Đường dẫn không được để trống").max(500),
});

export const navItemSchema = z
  .object({
    id: z.string(),
    label: z.string().min(1, "Tên menu không được để trống").max(80),
    href: z.string().max(500).default(""),
    isActive: z.boolean().default(true),
    subLinks: z.array(navSubLinkSchema).default([]),
  })
  .refine((item) => item.subLinks.length > 0 || item.href.trim().length > 0, {
    message: "Đường dẫn không được để trống khi không có sub-link",
    path: ["href"],
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
  showProductPrice: z.boolean().default(true),
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

export type NavSubLink = z.infer<typeof navSubLinkSchema>;
export type NavItem = z.infer<typeof navItemSchema>;
export type ContactSettings = z.infer<typeof contactSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const defaultNavItems: NavItem[] = [
  {
    id: "nav-home",
    label: "Trang chủ",
    href: "/",
    isActive: true,
    subLinks: [],
  },
  {
    id: "nav-video",
    label: "Video Review",
    href: "/video-review",
    isActive: true,
    subLinks: [],
  },
  {
    id: "nav-catalogue",
    label: "Catalogue",
    href: "/catalogue",
    isActive: true,
    subLinks: [],
  },
  {
    id: "nav-stores",
    label: "Cửa hàng",
    href: "/cua-hang",
    isActive: true,
    subLinks: [],
  },
  {
    id: "nav-warranty",
    label: "Bảo hành",
    href: "/bao-hanh",
    isActive: true,
    subLinks: [],
  },
  {
    id: "nav-policy",
    label: "Chính sách",
    href: "/chinh-sach",
    isActive: true,
    subLinks: [
      {
        id: "sub-policy-1",
        label: "Chính sách 1",
        href: "/tin-tuc/chinh-sach-bao-hanh-furax",
      },
      { id: "sub-policy-2", label: "Chính sách 2", href: "/" },
    ],
  },
  {
    id: "nav-news",
    label: "Tin tức",
    href: "/tin-tuc",
    isActive: true,
    subLinks: [],
  },
];

export const settingsDefault: SiteSettings = {
  logoUrl: "/logo/primary_logo.png",
  logoWhiteUrl: "/logo/white_logo.png",
  description:
    "Thương hiệu thiết bị nhà bếp cao cấp hàng đầu Việt Nam. Cam kết mang đến sản phẩm chất lượng với công nghệ tiên tiến nhất.",
  showProductPrice: true,
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
