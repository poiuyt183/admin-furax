# CMS Data Guide — Cập nhật dữ liệu mới

> **Phiên bản:** 1.0 · **Cập nhật:** 2026-06-17  
> Tài liệu mô tả các model, cấu hình JSON, API và cách tích hợp storefront cho các tính năng CMS mới.

---

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Database & Migrations](#database--migrations)
3. [Site Config (`site_config`)](#site-config-site_config)
4. [Cửa hàng (`store`)](#cửa-hàng-store)
5. [Video Review (`review_video`)](#video-review-review_video)
6. [Bài viết & Danh mục bài viết](#bài-viết--danh-mục-bài-viết)
7. [Admin tRPC API](#admin-trpc-api)
8. [Public REST API (cho Storefront)](#public-rest-api-cho-storefront)
9. [Tích hợp Storefront](#tích-hợp-storefront)
10. [Breaking changes](#breaking-changes)
11. [Checklist triển khai](#checklist-triển-khai)

---

## Tổng quan

| Tính năng | Admin page | Lưu trữ | Storefront |
|-----------|------------|---------|------------|
| Trang chủ (banner, featured, video) | `/homepage` | `site_config.homepage` (JSON) | tRPC `homepage.get` |
| Cài đặt website (logo, navbar, liên hệ) | `/settings` | `site_config.settings` (JSON) | REST `/api/public/site-settings` |
| Cửa hàng / showroom | `/stores` | Bảng `store` | tRPC `store.list` |
| Video review | `/review-videos` | Bảng `review_video` | tRPC `reviewVideo.getFeatured` + REST |
| Bài viết | `/posts` | Bảng `post` | tRPC `post.list` |
| Danh mục bài viết | `/post-categories` | Bảng `post_category` | tRPC `postCategory.list` |

Tất cả cấu hình CMS dùng chung **một bản ghi** `site_config` với `id = "singleton"`.

---

## Database & Migrations

### Migrations liên quan

| Migration | Nội dung |
|-----------|----------|
| `20260615120000_add_posts_and_post_categories` | `post`, `post_category`, enum `PostStatus` |
| `20260615140000_add_stores` | Bảng `store` + seed 7 cửa hàng |
| `20260616033550_store_management` | Bảng `site_config` |
| `20260616120000_add_site_settings` | Cột `settings` JSONB trên `site_config` |
| `20260617120000_add_review_videos` | Bảng `review_video` |

### Lệnh sau khi pull code

```bash
pnpm exec prisma generate
pnpm exec prisma migrate deploy   # production
# hoặc
pnpm exec prisma migrate dev      # local

# Restart dev server sau khi đổi schema
pnpm run dev
```

> **Lưu ý:** Prisma client được generate vào `src/generated/prisma` (gitignored). Build script đã có `prisma generate` trong `postinstall` và `build`.

---

## Site Config (`site_config`)

### Cấu trúc bảng

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | `TEXT` | Luôn là `"singleton"` |
| `homepage` | `JSONB` | Cấu hình trang chủ |
| `settings` | `JSONB` | Logo, navbar, liên hệ |
| `createdAt` / `updatedAt` | `TIMESTAMP` | Metadata |

### `homepage` — JSON schema

```json
{
  "banners": [
    {
      "id": "abc123",
      "imageUrl": "https://res.cloudinary.com/...",
      "link": "/san-pham",
      "isActive": true
    }
  ],
  "featuredCategoryIds": ["cuid-category-1", "cuid-category-2"],
  "featuredProductIds": ["cuid-product-1"],
  "productVideoIds": ["cuid-video-1", "cuid-video-2"]
}
```

| Field | Kiểu | Mô tả |
|-------|------|-------|
| `banners` | `Banner[]` | Slider hero trang chủ |
| `featuredCategoryIds` | `string[]` | ID danh mục sản phẩm ghim lên trang chủ (theo thứ tự) |
| `featuredProductIds` | `string[]` | ID sản phẩm nổi bật (theo thứ tự) |
| `productVideoIds` | `string[]` | ID video review hiển thị ở section **Video sản phẩm** |

**Nguồn code:** `src/trpc/routers/homepage.ts`

#### Video sản phẩm trên trang chủ

- Trước đây dùng **1 link YouTube** (`productVideoUrl`) — **đã bỏ**.
- Hiện tại chọn **nhiều video** từ module **Video Review** (`/review-videos`).
- Chỉ video có `isActive: true` mới xuất hiện trong picker admin.
- Storefront resolve video qua `reviewVideo.getFeatured({ ids })` theo đúng thứ tự trong `productVideoIds`.

### `settings` — JSON schema

```json
{
  "logoUrl": "/logo/primary_logo.png",
  "logoWhiteUrl": "/logo/white_logo.png",
  "description": "Thương hiệu thiết bị nhà bếp cao cấp...",
  "navbar": [
    {
      "id": "nav-home",
      "label": "Trang chủ",
      "href": "/",
      "isActive": true
    }
  ],
  "contact": {
    "address": "123 Nguyễn Huệ, Quận 1, TP.HCM",
    "hotline": "1900 xxxx",
    "email": "info@furax.vn",
    "technicalPhone": "1900 xxxx",
    "facebookUrl": "https://facebook.com/furax",
    "zaloUrl": "https://zalo.me/furax"
  }
}
```

| Field | Mô tả |
|-------|-------|
| `logoUrl` | Logo header (Cloudinary URL hoặc path tĩnh) |
| `logoWhiteUrl` | Logo footer nền tối |
| `description` | Đoạn giới thiệu footer |
| `navbar` | Menu điều hướng chính |
| `contact.address` | Địa chỉ |
| `contact.hotline` | Hotline (`tel:` link) |
| `contact.email` | Email |
| `contact.technicalPhone` | Số kỹ thuật |
| `contact.facebookUrl` | Fanpage Facebook |
| `contact.zaloUrl` | Link Zalo |

**Nguồn code:** `src/features/settings/site-settings.schema.ts`, `src/trpc/routers/settings.ts`

---

## Cửa hàng (`store`)

### Bảng `store`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | `TEXT` | CUID |
| `slug` | `TEXT` | Unique — dùng cho URL/API |
| `name` | `TEXT` | Tên cửa hàng |
| `address` | `TEXT` | Địa chỉ đầy đủ |
| `city` | `TEXT` | Thành phố |
| `district` | `TEXT` | Quận/huyện |
| `phone` | `TEXT` | Số điện thoại |
| `hours` | `TEXT` | Giờ mở cửa |
| `lat` / `lng` | `FLOAT` | Tọa độ (chọn trên bản đồ Leaflet) |
| `isMainStore` | `BOOLEAN` | Cửa hàng chính (icon vương miện) |
| `isActive` | `BOOLEAN` | Hiển thị trên trang `/cua-hang` |
| `position` | `INT` | Thứ tự sắp xếp |

**Admin:** `/stores`  
**tRPC:** `store.list`, `store.create`, `store.update`, `store.delete`  
**Schema:** `src/features/stores/store.schema.ts`

Migration `20260615140000_add_stores` có seed 7 cửa hàng từ dữ liệu storefront cũ.

---

## Video Review (`review_video`)

### Bảng `review_video`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | `TEXT` | CUID |
| `title` | `TEXT?` | Tiêu đề tuỳ chọn |
| `youtubeUrl` | `TEXT` | Link YouTube (watch, youtu.be, shorts, embed) |
| `categoryId` | `TEXT` | FK → `category.id` (danh mục **sản phẩm**) |
| `isActive` | `BOOLEAN` | Hiển thị công khai |
| `position` | `INT` | Thứ tự mặc định |

**Quan hệ:** `category` → `Category` (on delete cascade)

**Admin:** `/review-videos`  
**tRPC:** `reviewVideo.list`, `reviewVideo.create`, `reviewVideo.update`, `reviewVideo.delete`  
**Schema:** `src/features/review-videos/review-video.schema.ts`

### Validate YouTube URL

Dùng helper chung: `src/lib/youtube.ts`

```ts
parseYoutubeVideoId(url)      // → video ID hoặc null
getYoutubeEmbedUrl(url)       // → embed URL
getYoutubeThumbnailUrl(url)   // → thumbnail hqdefault
isValidYoutubeUrl(url)        // → boolean
```

---

## Bài viết & Danh mục bài viết

### `post_category`

| Cột chính | Mô tả |
|-----------|-------|
| `name`, `slug` | Tên và đường dẫn |
| `description`, `image` | Mô tả, ảnh |
| `position` | Thứ tự |

### `post`

| Cột chính | Mô tả |
|-----------|-------|
| `title`, `slug` | Tiêu đề, URL |
| `excerpt`, `content` | Tóm tắt, nội dung HTML (rich text) |
| `coverImage` | Ảnh bìa |
| `status` | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |
| `publishedAt` | Ngày xuất bản |
| `categoryId` | FK → `post_category` |

**Admin:** `/posts`, `/post-categories`

---

## Admin tRPC API

Router gốc: `src/trpc/routers/_app.ts`

| Namespace | Procedures | Auth |
|-----------|------------|------|
| `homepage` | `get`, `update` | Protected |
| `settings` | `get`, `update` | Protected |
| `store` | `list`, `getById`, `create`, `update`, `delete` | Protected |
| `reviewVideo` | `list`, `getById`, `create`, `update`, `delete` | Protected |
| `post` | CRUD + list | Protected |
| `postCategory` | CRUD + list | Protected |
| `category` | CRUD + list | Protected |
| `product` | CRUD + list | Protected |

Tất cả `protectedProcedure` yêu cầu session đăng nhập admin.

---

## Public REST API (cho Storefront)

Các endpoint **không cần auth**, dùng khi storefront gọi qua HTTP:

### `GET /api/public/site-settings`

Trả về object `SiteSettings` (logo, navbar, contact...).

```bash
curl https://admin.example.com/api/public/site-settings
```

### `GET /api/public/review-videos`

Trả về danh sách video đang active.

| Query | Mô tả |
|-------|-------|
| `categoryId` | Lọc theo ID danh mục sản phẩm |
| `categorySlug` | Lọc theo slug danh mục |

```bash
curl "https://admin.example.com/api/public/review-videos?categorySlug=bep-tu"
```

**Response mẫu:**

```json
[
  {
    "id": "clx...",
    "title": "Review bếp từ IH-400",
    "youtubeUrl": "https://www.youtube.com/watch?v=xxxxx",
    "categoryId": "clx...",
    "category": { "id": "...", "name": "Bếp Từ", "slug": "bep-tu" },
    "createdAt": "2026-06-17T00:00:00.000Z"
  }
]
```

---

## Tích hợp Storefront

Storefront (`storefront-furax`) dùng **cùng database** và tRPC riêng.

### Trang chủ (`page.tsx`)

Luồng load dữ liệu:

```
homepage.get()
  ├── banners (filter isActive)     → HeroBanner
  ├── featuredCategoryIds           → ProductCategories
  ├── featuredProductIds            → product.getFeatured()
  ├── productVideoIds               → reviewVideo.getFeatured()
  └── (posts)                       → post.list({ limit: 3 })
```

### Section Video sản phẩm

- Component: `src/components/home/product-video.tsx`
- **1 video:** embed full width
- **Nhiều video:** carousel (Embla) với prev/next và dots
- Thứ tự theo `productVideoIds` trong homepage config

### Header / Footer

- Load `settings` từ root layout qua `getSiteSettings()`
- Context: `SiteSettingsProvider`
- Cần env trên storefront:

```env
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3000
```

(Thay bằng URL admin production khi deploy. Cache ~60 giây.)

### Storefront tRPC routers liên quan

| Router | Procedure | Mô tả |
|--------|-----------|-------|
| `homepage` | `get` | Đọc `site_config.homepage` |
| `reviewVideo` | `getFeatured({ ids })` | Resolve video theo ID, giữ thứ tự |
| `store` | `list` | Cửa hàng active |
| `settings` | `get` | (nếu dùng tRPC thay REST) |

### Prisma storefront

Storefront schema cần có các model: `SiteConfig`, `Store`, `ReviewVideo`, `Post`, `PostCategory`, `Product`, `Category`...

Sau khi admin thêm migration mới, chạy trên storefront:

```bash
cd storefront-furax
pnpm exec prisma generate
```

---

## Breaking changes

| Trước | Sau | Hành động |
|-------|-----|-----------|
| `homepage.productVideoUrl` (string) | `homepage.productVideoIds` (string[]) | Chọn lại video trong admin `/homepage` |
| Không có `site_config.settings` | Cột `settings` JSONB | Migration tự apply; dùng default nếu chưa cấu hình |
| Cửa hàng hardcode trong storefront | Bảng `store` | Dữ liệu seed trong migration; quản lý tại `/stores` |

---

## Checklist triển khai

### Admin (Vercel / server)

- [ ] `DATABASE_URL` đã cấu hình
- [ ] Build chạy `prisma generate` (đã có trong `package.json`)
- [ ] Deploy chạy `prisma migrate deploy`
- [ ] Cloudinary env cho upload ảnh/logo/banner

### Storefront

- [ ] `DATABASE_URL` trỏ cùng DB (hoặc read replica)
- [ ] `NEXT_PUBLIC_ADMIN_API_URL` trỏ admin (cho site settings REST)
- [ ] `pnpm exec prisma generate` sau khi sync schema
- [ ] Kiểm tra `/` — banner, featured, video carousel
- [ ] Kiểm tra header/footer — logo, navbar, contact
- [ ] Kiểm tra `/cua-hang` — danh sách cửa hàng từ DB

### Nội dung cần nhập sau deploy

1. **Cài đặt** (`/settings`) — logo, mô tả, navbar, liên hệ
2. **Video Review** (`/review-videos`) — thêm video theo danh mục
3. **Trang chủ** (`/homepage`) — chọn video sản phẩm, banner, featured
4. **Cửa hàng** (`/stores`) — xác nhận vị trí bản đồ

---

## File tham chiếu nhanh

| Mục | Đường dẫn |
|-----|-----------|
| Prisma schema | `prisma/schema.prisma` |
| Homepage router | `src/trpc/routers/homepage.ts` |
| Settings router | `src/trpc/routers/settings.ts` |
| Store router | `src/trpc/routers/store.ts` |
| Review video router | `src/trpc/routers/review-video.ts` |
| Homepage editor UI | `src/features/pages/components/homepage-editor.tsx` |
| Settings editor UI | `src/features/settings/components/settings-editor.tsx` |
| YouTube helpers | `src/lib/youtube.ts` |
| Public APIs | `src/app/api/public/` |

---

*Tài liệu liên quan: [storefront-product-guide.md](./storefront-product-guide.md) — hướng dẫn tích hợp sản phẩm chi tiết.*
