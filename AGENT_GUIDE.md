# FuraX Admin (`admin-furax`) — Agent Guide

> **Mục đích:** File này giúp AI agent hiểu toàn bộ dự án admin-furax khi mở phiên chat mới.
> Xem thêm tổng quan workspace tại `../AGENT_GUIDE.md`.

---

## 1. Tổng quan

- **Tên package**: `nodebase-v2` (tên lịch sử)
- **Vai trò kép**:
  1. **Back-office Console**: Dashboard quản trị cho sản phẩm, bài viết, SEO, showroom, homepage layout, review videos, bảo hành.
  2. **API Provider**: Cung cấp tRPC API nội bộ và REST API công khai cho storefront.
- **Framework**: Next.js 15.5.9 (App Router, Turbopack)
- **Language**: TypeScript 5 (strict), React 19.1.0

---

## 2. Cấu trúc dự án

```
admin-furax/
├── .env                              # DB, Cloudinary credentials
├── biome.json                        # Biome linter config
├── components.json                   # Shadcn UI config (New York, Neutral)
├── next.config.ts                    # serverExternalPackages: [@better-auth/kysely-adapter]
├── prisma.config.ts                  # Schema path, migrations, seed command
├── docs/                             # Hướng dẫn tích hợp
│   ├── cms-data-guide.md
│   ├── seo-checker-guide.md
│   └── storefront-product-guide.md
├── lib/prisma.ts                     # Prisma client singleton (adapter-pg)
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── migrations/                   # 11 migration files
└── src/
    ├── app/
    │   ├── globals.css               # Tailwind v4 theme, FuraX brand colors, Leaflet CSS
    │   ├── layout.tsx                # Root: TRPCReactProvider + Toaster
    │   ├── (auth)/                   # Login & Register (requireUnauth guarded)
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── (dashboard)/              # Protected admin pages (requireAuth guarded)
    │   │   ├── layout.tsx            # AppSidebar wrapper
    │   │   ├── page.tsx              # Overview stats
    │   │   ├── categories/page.tsx
    │   │   ├── homepage/page.tsx     # CMS layout builder
    │   │   ├── post-categories/page.tsx
    │   │   ├── posts/                # CRUD + TipTap editor
    │   │   │   ├── page.tsx
    │   │   │   ├── new/page.tsx
    │   │   │   └── [id]/edit/page.tsx
    │   │   ├── products/             # CRUD + image gallery + specs
    │   │   │   ├── page.tsx
    │   │   │   ├── new/page.tsx
    │   │   │   └── [id]/edit/page.tsx
    │   │   ├── review-videos/page.tsx
    │   │   ├── settings/page.tsx     # Branding, navbar, contact
    │   │   ├── stores/page.tsx       # Showroom + Leaflet map
    │   │   └── warranties/page.tsx   # Warranty review
    │   └── api/
    │       ├── auth/[...all]/route.ts      # Better Auth handler
    │       ├── geocode/route.ts            # OpenStreetMap Nominatim proxy
    │       ├── parse-maps-url/route.ts     # Google Maps URL parser
    │       ├── public/                     # Public REST for storefront
    │       │   ├── review-videos/route.ts
    │       │   └── site-settings/route.ts
    │       ├── trpc/[trpc]/route.ts        # tRPC HTTP handler
    │       └── upload/route.ts             # Cloudinary upload endpoint
    ├── components/
    │   ├── app-sidebar.tsx           # Admin sidebar navigation + user profile
    │   ├── navigation-progress.tsx   # Route transition loading bar
    │   ├── editor/                   # TipTap v3 Rich Text Editor
    │   │   ├── RichEditor.tsx        # Core: edit/preview/HTML modes
    │   │   ├── Toolbar.tsx
    │   │   ├── BubbleMenuBar.tsx
    │   │   ├── extensions/           # ResizableImage, ImageRow, ResizableYoutube
    │   │   ├── components/           # NodeViews (ImageNodeView, YoutubeNodeView)
    │   │   ├── modals/               # ImageModal, LinkModal, YoutubeModal
    │   │   └── hooks/useCloudinaryUpload.ts
    │   └── ui/                       # 57 Shadcn primitives
    ├── features/                     # Feature-Sliced business logic
    │   ├── auth/components/          # login-form.tsx, register-form.tsx
    │   ├── categories/               # schema, table, dialog, columns
    │   ├── pages/                    # homepage-editor, featured-selector, trust-items
    │   ├── post-categories/          # schema, table, dialog, columns
    │   ├── posts/                    # schema, form, table, seo-analyzer.ts, seo-score-modal
    │   ├── products/                 # schema, form, table, image-upload
    │   ├── review-videos/            # schema, table, dialog, columns
    │   ├── settings/                 # schema, settings-editor
    │   ├── stores/                   # schema, table, dialog, location-picker
    │   └── warranties/               # columns, table, review-dialog
    ├── hooks/use-mobile.ts           # Responsive breakpoint hook (768px)
    ├── lib/
    │   ├── auth.ts                   # Better Auth server config (Prisma adapter)
    │   ├── auth-client.ts            # Better Auth React client
    │   ├── auth-untils.ts            # requireAuth, requireUnauth, cached getSession
    │   ├── google-maps.ts            # Coordinate parsing
    │   ├── phone.ts                  # Vietnamese phone normalization
    │   ├── utils.ts                  # cn() (clsx + tailwind-merge)
    │   ├── warranty.ts               # "5 năm" → 60 months parser
    │   └── youtube.ts                # YouTube ID extractor
    └── trpc/
        ├── client.tsx                # TRPCReactProvider + useTRPC hook
        ├── init.ts                   # createTRPCRouter, baseProcedure, protectedProcedure
        ├── query-client.ts           # QueryClient factory
        ├── server.tsx                # Server caller + getQueryClient
        └── routers/
            ├── _app.ts               # Root router (aggregates all sub-routers)
            ├── category.ts           # list, getById, create, update, delete
            ├── homepage.ts           # get, update
            ├── post-category.ts      # list, getById, create, update, delete
            ├── post.ts               # list, getById, create, update, delete
            ├── product.ts            # list, getById, create, update, updateStatus, bulkUpdateStatus, delete, bulkDelete
            ├── review-video.ts       # list, getById, create, update, delete
            ├── settings.ts           # get, update
            ├── store.ts              # list, getById, create, update, delete
            └── warranty.ts           # list, getById, approve, reject
```

---

## 3. Architecture Patterns

### 3.1 Feature-Sliced Organization
Mỗi feature nằm trong `src/features/<name>/`:
- `*.schema.ts` — Zod validation schema
- `*-table.tsx` — Data table component (TanStack Table)
- `*-columns.tsx` — Column definitions
- `*-dialog.tsx` hoặc `*-form.tsx` — Create/edit UI
- Utilities riêng (vd: `seo-analyzer.ts` trong `posts/`)

### 3.2 tRPC v11 End-to-End Type Safety
- Server procedures dùng Zod input schemas
- Client dùng `useTRPC()` với inferred TypeScript types
- Không cần codegen

### 3.3 Server Prefetch + Client Hydration
```tsx
// Server Component (page.tsx)
const queryClient = getQueryClient();
await queryClient.prefetchQuery(trpc.product.list.queryOptions(filters));
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <ProductTable />
  </HydrationBoundary>
);
```
→ Render ngay không loading spinner, vẫn giữ client-side cache updating.

### 3.4 Singleton CMS Pattern
- `SiteConfig` table, `id = "singleton"`, 2 cột JSON: `homepage` và `settings`
- Validate bằng Zod (`homepageSchema`, `siteSettingsSchema`) với fallback defaults

### 3.5 Auth Context Deduplication
- `getSession()` dùng React `cache()` → tránh duplicate DB calls trong cùng một request

### 3.6 Transaction Isolation
- Mutations liên quan child records (vd: delete + re-create `ProductImage`, `ProductSpec`) dùng `prisma.$transaction(async (tx) => ...)`

---

## 4. Key Features chi tiết

### 4.1 Products Management (`/products`)
- Full CRUD: create, edit, publish, draft, archive, delete
- Specification matrix: dynamic key-value pairs với grouping và position
- Pricing: `price` + `comparePrice` (strikethrough sale)
- Multi-image gallery: drag-drop upload → Cloudinary, primary image designation
- Batch operations: multi-select → bulk status change / bulk delete

### 4.2 Rich Content Editor + SEO Checker (`/posts`)
- **TipTap v3 WYSIWYG**: headings, tables, code blocks, blockquotes, lists, task lists
  - Image resizing + side-by-side image rows (`ImageRow`)
  - YouTube embed với aspect ratio presets
  - Cloudinary upload trực tiếp với progress
  - 3 modes: WYSIWYG Edit, Visual Preview, Raw HTML
- **SEO Analyzer** (`seo-analyzer.ts`): 12-point scoring (0-100, grades A→F)
  - Title length, meta description, focus keyword in title/slug/excerpt/content/first paragraph
  - Keyword density (target 1-3%), word count, heading hierarchy, image alt, links
  - Live Google SERP preview

### 4.3 Store Locator (`/stores`)
- Leaflet map với OpenStreetMap tiles + draggable pin
- Nominatim geocoding (`/api/geocode`) — Vietnamese address search
- Google Maps URL resolution (`/api/parse-maps-url`) — parse shortened links

### 4.4 Homepage CMS Builder (`/homepage`)
- Hero banner slider (add/remove/reorder/toggle visibility)
- Featured categories & products (reorderable multiselect)
- Product video showcase
- Trust strip builder (16 Lucide trust icons)
- Side banners (ad slots)

### 4.5 Site Settings (`/settings`)
- Branding logos (primary + white)
- Navbar builder (add/edit/disable/reorder)
- Contact info (hotlines, email, address, Facebook, Zalo OA)

### 4.6 Review Videos (`/review-videos`)
- YouTube video manager categorized by product category
- Auto thumbnail generation + embed preview

### 4.7 Warranty Review (`/warranties`)
- Review customer submissions from storefront
- Phone normalization (0/+84/84 prefixes)
- Auto warranty period: "5 năm" → 60 months → compute `endsAt`
- Approve/reject với admin notes

---

## 5. API Endpoints

### tRPC Internal (`/api/trpc`)
| Router | Procedures |
|---|---|
| `category` | `list`, `getById`, `create`, `update`, `delete` |
| `product` | `list`, `getById`, `create`, `update`, `updateStatus`, `bulkUpdateStatus`, `delete`, `bulkDelete` |
| `homepage` | `get`, `update` |
| `settings` | `get`, `update` |
| `postCategory` | `list`, `getById`, `create`, `update`, `delete` |
| `post` | `list`, `getById`, `create`, `update`, `delete` |
| `reviewVideo` | `list`, `getById`, `create`, `update`, `delete` |
| `store` | `list`, `getById`, `create`, `update`, `delete` |
| `warranty` | `list`, `getById`, `approve`, `reject` |

### Public REST (for storefront)
| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/public/site-settings` | GET | Site settings JSON (logos, navbar, contact) |
| `/api/public/review-videos` | GET | Published videos, filter by `?categoryId=` or `?categorySlug=` |

### Utility REST
| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/upload` | POST | Multipart → Cloudinary (png/jpeg/webp/gif, folder: `editor-uploads`) |
| `/api/geocode` | GET | Nominatim proxy (`?q=...&limit=5`, country: VN) |
| `/api/parse-maps-url` | POST | Google Maps shortlink → GPS coordinates |
| `/api/auth/[...all]` | ALL | Better Auth handler |

---

## 6. Authentication

- **Library**: `better-auth` + `@better-auth/adapters/prisma`
- **Strategy**: Email/password, sessions stored in PostgreSQL
- **Server Guards**:
  - `requireAuth()` → redirect `/login` if no session (dashboard layout)
  - `requireUnauth()` → redirect `/` if already authenticated (auth pages)
  - `protectedProcedure` → throw `TRPCError("UNAUTHORIZED")` (tRPC middleware)
- **Client**:
  - `authClient.signIn.email()` — Login
  - `authClient.signUp.email()` — Register
  - `authClient.signOut()` — Logout (AppSidebar)

---

## 7. Data Models

### Auth (Better Auth standard)
- `User` (`id`, `name`, `email` unique, `emailVerified`, `image`)
- `Session` (`token` unique, `expiresAt`, `ipAddress`, `userAgent`, `userId`)
- `Account` (`accountId`, `providerId`, `userId`, `accessToken`, `refreshToken`, `password`)
- `Verification` (`identifier`, `value`, `expiresAt`)

### Catalog
- **`Category`**: `id`, `name`, `slug` (unique), `description`, `image`, `position` → `products[]`, `reviewVideos[]`
- **`Product`**: `id`, `name`, `slug` (unique), `description` (Text), `price` (Decimal 12,2), `comparePrice`, `primaryImage`, `status` (DRAFT/PUBLISHED/ARCHIVED), `brand`, `origin`, `sku`, `warranty`, `categoryId` → `images[]`, `specs[]`, `warrantyActivations[]`
- **`ProductImage`**: `id`, `url`, `alt`, `position`, `productId` (cascade delete)
- **`ProductSpec`**: `id`, `label`, `value`, `group`, `position`, `productId` (cascade delete)

### Content
- **`PostCategory`**: `id`, `name`, `slug` (unique), `description`, `image`, `position` → `posts[]`
- **`Post`**: `id`, `title`, `slug` (unique), `excerpt`, `content` (Text), `coverImage`, `metaTitle`, `metaDescription`, `status` (DRAFT/PUBLISHED/ARCHIVED), `publishedAt`, `categoryId`
- **`SiteConfig`**: `id` ("singleton"), `homepage` (Json), `settings` (Json)

### Operations
- **`Store`**: `id`, `slug` (unique), `name`, `address`, `city`, `district`, `phone`, `hours`, `lat`, `lng`, `isMainStore`, `isActive`, `position`
- **`ReviewVideo`**: `id`, `title`, `youtubeUrl`, `categoryId` (cascade), `isActive`, `position`
- **`WarrantyActivation`**: `id`, `customerName`, `customerPhone`, `customerAddress`, `productId` (restrict), `productSku`, `productName`, `status` (PENDING/APPROVED/REJECTED), `adminNote`, `reviewedAt`, `reviewedById`, `startsAt`, `endsAt`

---

## 8. Styling & UI

- **Tailwind CSS v4** với `@tailwindcss/postcss`
- **Brand Colors**: `--color-furax-blue: #007ac1`, `--color-furax-red: #ed1c24`
- **Font**: Geist Sans + Geist Mono
- **57 Shadcn UI components** trong `src/components/ui/`
- **Custom**: `NavigationProgress` (top loading bar khi navigate)
- **Dark/Light theme**: `next-themes`

---

## 9. Environment Variables

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
CLOUDINARY_CLOUD_NAME="bedding-shop"
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

---

## 10. Development Commands

```bash
pnpm install              # Install + prisma generate
pnpm dev                  # next dev --turbopack (localhost:3000)
pnpm build                # prisma generate && next build --turbopack
pnpm start                # Production server
pnpm lint                 # biome check
pnpm format               # biome format --write
pnpm exec prisma migrate dev      # Dev migration
pnpm exec prisma migrate deploy   # Prod migration
```

---

## 11. Lưu ý quan trọng

- **Không có automated tests** (không Jest, Vitest, Playwright, Cypress).
- Prisma client output tại `src/generated/prisma` (auto-generate via postinstall).
- `path alias`: `@/*` → `./src/*`.
- `cn()` utility tại `src/lib/utils.ts` = `clsx` + `tailwind-merge`.
- Mọi tRPC router đều aggregate qua `src/trpc/routers/_app.ts`.
