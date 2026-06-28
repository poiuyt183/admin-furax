# Storefront Implementation Guide

> **For AI Agents & Developers**: This guide explains how to build a public storefront application that consumes data from the `admin-furax` backend. Read this entirely before writing any code.

---

## 1. Project Overview

The **admin-furax** is a Next.js 15 admin panel that manages:

| Domain | Description |
|---|---|
| **Products** | Items sold on the storefront (name, price, images, category) |
| **Categories** | Product groupings with slug-based navigation |
| **Posts** | Blog/news articles with categories |
| **Stores** | Physical store locations with geo-coordinates |
| **Homepage Config** | Banners, featured categories, featured products, YouTube video |
| **Site Settings** | Logo, navbar, contact info |

The storefront is a **separate Next.js application** that reads this data — it does **not** run admin mutations.

---

## 2. Tech Stack (Must Match)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| ORM | Prisma | 7.x |
| API | tRPC v11 | `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query` |
| DB Adapter | `@prisma/adapter-pg` + `pg` | — |
| Query | `@tanstack/react-query` | v5 |
| Validation | Zod v4 (`zod/v4`) | — |
| Styling | Tailwind CSS v4 | — |
| Runtime | React 19 | — |

> ⚠️ **Critical**: Import Zod as `import { z } from "zod/v4"` — NOT `from "zod"`.

---

## 3. Database Schema

The storefront shares the **same PostgreSQL database**. Use `DATABASE_URL` env variable.

### 3.1 Prisma Generator (MUST use this output path)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

### 3.2 Key Models for Storefront

```prisma
// Product catalog
model Product {
  id           String         @id @default(cuid())
  name         String
  slug         String         @unique
  description  String?        @db.Text
  price        Decimal        @db.Decimal(12, 2)
  primaryImage String?
  status       ProductStatus  @default(DRAFT)
  categoryId   String?
  category     Category?      @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  images       ProductImage[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}

model ProductImage {
  id        String  @id @default(cuid())
  url       String
  alt       String?
  position  Int     @default(0)
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  image       String?
  position    Int       @default(0)
  products    Product[]
}

// Blog
model Post {
  id          String        @id @default(cuid())
  title       String
  slug        String        @unique
  excerpt     String?
  content     String?       @db.Text
  coverImage  String?
  status      PostStatus    @default(DRAFT)
  publishedAt DateTime?
  categoryId  String?
  category    PostCategory? @relation(...)
}

model PostCategory {
  id    String @id @default(cuid())
  name  String
  slug  String @unique
  posts Post[]
}

// Physical stores
model Store {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  address     String
  city        String
  district    String
  phone       String
  hours       String
  lat         Float
  lng         Float
  isMainStore Boolean  @default(false)
  isActive    Boolean  @default(true)
  position    Int      @default(0)
}

// Singleton config
model SiteConfig {
  id       String @id @default("singleton")
  homepage Json   @default("{}")
  settings Json   @default("{}")
}

enum ProductStatus { DRAFT PUBLISHED ARCHIVED }
enum PostStatus    { DRAFT PUBLISHED ARCHIVED }
```

### 3.3 Storefront Filtering Rules

- **Always filter** `status: "PUBLISHED"` for products and posts in public-facing queries.
- **Always filter** `isActive: true` for stores.
- The admin may have `DRAFT` or `ARCHIVED` records — never show these to end users.

---

## 4. Prisma Client Setup

**`lib/prisma.ts`** — singleton pattern to prevent hot-reload connection leaks:

```typescript
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

function createPrismaClient() {
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (cached) return cached;

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

const prisma = getPrismaClient();
export default prisma;
```

---

## 5. tRPC Setup

### 5.1 Context & Router Init (`src/trpc/init.ts`)

The storefront uses **public procedures** (no auth required):

```typescript
import { initTRPC } from "@trpc/server";
import { cache } from "react";

export const createTRPCContext = cache(async () => {
  return {}; // No auth needed for public storefront
});

const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure; // Use this for all public routes
```

### 5.2 Serialization Pattern

Prisma returns `Decimal` and `Date` objects that cannot be serialized to JSON directly. Always serialize before returning:

```typescript
// For products (Decimal price + Date fields)
function serializeProduct<
  TProduct extends {
    price: { toString: () => string };
    createdAt: Date;
    updatedAt: Date;
  },
>(product: TProduct) {
  return {
    ...product,
    price: product.price.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

// For posts (Date + nullable publishedAt)
function serializePost<
  TPost extends {
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
  },
>(post: TPost) {
  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };
}

// For stores (Date fields only)
function serializeStore<TStore extends { createdAt: Date; updatedAt: Date }>(
  store: TStore,
) {
  return {
    ...store,
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };
}
```

### 5.3 Storefront Routers

#### Products Router

```typescript
// src/trpc/routers/product.ts
import { z } from "zod/v4";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, baseProcedure } from "../init";

export const productRouter = createTRPCRouter({
  // List published products (optionally filter by category slug)
  list: baseProcedure
    .input(
      z.object({
        categorySlug: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(), // for pagination
      }).optional(),
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {
        status: "PUBLISHED", // ALWAYS filter published only
      };

      if (input?.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }
      if (input?.categorySlug) {
        where.category = { slug: input.categorySlug };
      }

      const products = await prisma.product.findMany({
        where,
        take: input?.limit ?? 20,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: "asc" } },
        },
      });

      return products.map(serializeProduct);
    }),

  // Get single product by slug (for product detail page)
  getBySlug: baseProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const product = await prisma.product.findFirst({
        where: { slug: input.slug, status: "PUBLISHED" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: "asc" } },
        },
      });

      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      return serializeProduct(product);
    }),

  // Featured products (for homepage — driven by admin config)
  getFeatured: baseProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ input }) => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: input.ids },
          status: "PUBLISHED",
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: "asc" } },
        },
      });

      // Preserve the order from admin config
      const map = new Map(products.map((p) => [p.id, p]));
      return input.ids.flatMap((id) => {
        const p = map.get(id);
        return p ? [serializeProduct(p)] : [];
      });
    }),
});
```

#### Categories Router

```typescript
// src/trpc/routers/category.ts
import { z } from "zod/v4";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, baseProcedure } from "../init";

export const categoryRouter = createTRPCRouter({
  // All categories ordered by position
  list: baseProcedure.query(async () => {
    const categories = await prisma.category.findMany({
      orderBy: { position: "asc" },
      include: {
        _count: { select: { products: { where: { status: "PUBLISHED" } } } },
      },
    });
    return categories.map(serializeCategory);
  }),

  // Get category + its products by slug (for category listing page)
  getBySlug: baseProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const category = await prisma.category.findUnique({
        where: { slug: input.slug },
        include: {
          products: {
            where: { status: "PUBLISHED" },
            orderBy: { createdAt: "desc" },
            include: { images: { orderBy: { position: "asc" } } },
          },
        },
      });

      if (!category) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        ...serializeCategory(category),
        products: category.products.map(serializeProduct),
      };
    }),
});
```

#### Posts Router (Blog)

```typescript
// src/trpc/routers/post.ts
import { z } from "zod/v4";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, baseProcedure } from "../init";

export const postRouter = createTRPCRouter({
  list: baseProcedure
    .input(
      z.object({
        categorySlug: z.string().optional(),
        limit: z.number().default(10),
        cursor: z.string().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = { status: "PUBLISHED" };
      if (input?.categorySlug) {
        where.category = { slug: input.categorySlug };
      }

      const posts = await prisma.post.findMany({
        where,
        take: input?.limit ?? 10,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { publishedAt: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      return posts.map(serializePost);
    }),

  getBySlug: baseProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const post = await prisma.post.findFirst({
        where: { slug: input.slug, status: "PUBLISHED" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return serializePost(post);
    }),
});
```

#### Stores Router

```typescript
// src/trpc/routers/store.ts
import { z } from "zod/v4";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, baseProcedure } from "../init";

export const storeRouter = createTRPCRouter({
  list: baseProcedure
    .input(z.object({ city: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const stores = await prisma.store.findMany({
        where: {
          isActive: true, // ALWAYS filter active only
          ...(input?.city ? { city: input.city } : {}),
        },
        orderBy: [{ isMainStore: "desc" }, { position: "asc" }],
      });
      return stores.map(serializeStore);
    }),

  getMain: baseProcedure.query(async () => {
    return prisma.store.findFirst({
      where: { isMainStore: true, isActive: true },
    });
  }),
});
```

#### Homepage Config Router

```typescript
// src/trpc/routers/homepage.ts
import { z } from "zod/v4";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, baseProcedure } from "../init";

const homepageDefault = {
  banners: [],
  featuredCategoryIds: [],
  featuredProductIds: [],
  productVideoUrl: "",
};

const bannerSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  link: z.string(),
  isActive: z.boolean(),
});

const homepageSchema = z.object({
  banners: z.array(bannerSchema).default([]),
  featuredCategoryIds: z.array(z.string()).default([]),
  featuredProductIds: z.array(z.string()).default([]),
  productVideoUrl: z.string().default(""),
});

export type HomepageConfig = z.infer<typeof homepageSchema>;

export const homepageRouter = createTRPCRouter({
  get: baseProcedure.query(async () => {
    const config = await prisma.siteConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", homepage: homepageDefault },
      update: {},
    });

    const parsed = homepageSchema.safeParse(config.homepage);
    return parsed.success ? parsed.data : homepageDefault;
  }),
});
```

#### Site Settings Router

```typescript
// src/trpc/routers/settings.ts
import { z } from "zod/v4";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, baseProcedure } from "../init";

// Re-use the same schema from admin (or copy it)
const siteSettingsSchema = z.object({
  logoUrl: z.string().default(""),
  logoWhiteUrl: z.string().default(""),
  description: z.string().default(""),
  navbar: z.array(z.object({
    id: z.string(),
    label: z.string(),
    href: z.string(),
    isActive: z.boolean(),
  })).default([]),
  contact: z.object({
    address: z.string().default(""),
    hotline: z.string().default(""),
    email: z.string().default(""),
    technicalPhone: z.string().default(""),
    facebookUrl: z.string().default(""),
    zaloUrl: z.string().default(""),
  }).default({}),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const settingsRouter = createTRPCRouter({
  get: baseProcedure.query(async () => {
    const config = await prisma.siteConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", homepage: {}, settings: {} },
      update: {},
    });

    const parsed = siteSettingsSchema.safeParse(config.settings);
    return parsed.success ? parsed.data : siteSettingsSchema.parse({});
  }),
});
```

#### Root Router

```typescript
// src/trpc/routers/_app.ts
import { createTRPCRouter } from "../init";
import { productRouter } from "./product";
import { categoryRouter } from "./category";
import { postRouter } from "./post";
import { storeRouter } from "./store";
import { homepageRouter } from "./homepage";
import { settingsRouter } from "./settings";

export const appRouter = createTRPCRouter({
  product: productRouter,
  category: categoryRouter,
  post: postRouter,
  store: storeRouter,
  homepage: homepageRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
```

---

## 6. tRPC HTTP Handler

```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc/routers/_app";
import { createTRPCContext } from "@/trpc/init";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

---

## 7. Client-Side tRPC Setup

### 7.1 Query Client (`src/trpc/query-client.ts`)

```typescript
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 60s — adjust for storefront caching needs
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}
```

### 7.2 Client Provider (`src/trpc/client.tsx`)

```typescript
"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();
  return `${base}/api/trpc`;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: getUrl() })],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

### 7.3 Server Caller (`src/trpc/server.tsx`)

For Server Components that need to call tRPC directly (SSR/prefetch):

```typescript
import "server-only";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

// Direct caller for non-query usage
export const caller = appRouter.createCaller(createTRPCContext);
```

---

## 8. Using tRPC in Components

### 8.1 Server Component (preferred — zero waterfall)

```typescript
// src/app/san-pham/page.tsx
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { trpc, getQueryClient } from "@/trpc/server";
import { ProductList } from "@/components/ProductList";

export default async function ProductsPage() {
  const queryClient = getQueryClient();

  // Prefetch on server — data arrives with the HTML
  await queryClient.prefetchQuery(
    trpc.product.list.queryOptions(),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductList />
    </HydrationBoundary>
  );
}
```

### 8.2 Client Component (interactive filtering, search)

```typescript
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function ProductList() {
  const trpc = useTRPC();
  const { data: products } = useSuspenseQuery(
    trpc.product.list.queryOptions({ status: "PUBLISHED" }),
  );

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          <a href={`/san-pham/${product.slug}`}>{product.name}</a>
          <span>{Number(product.price).toLocaleString("vi-VN")} ₫</span>
        </li>
      ))}
    </ul>
  );
}
```

### 8.3 Direct Server Caller (no client overhead)

```typescript
// For simple Server Components that don't need client hydration
import { caller } from "@/trpc/server";

export default async function StorePage() {
  const stores = await caller.store.list({ isActive: true });
  // render directly
}
```

---

## 9. Homepage Data Assembly

The homepage config contains IDs. Resolve them to real data:

```typescript
// src/app/page.tsx
import { trpc, getQueryClient, caller } from "@/trpc/server";

export default async function HomePage() {
  // 1. Get homepage config (banners, featuredCategoryIds, featuredProductIds, videoUrl)
  const config = await caller.homepage.get();

  // 2. Resolve featured products by ID (preserve admin's order)
  const featuredProducts = config.featuredProductIds.length
    ? await caller.product.getFeatured({ ids: config.featuredProductIds })
    : [];

  // 3. Resolve featured categories by ID
  const allCategories = await caller.category.list();
  const featuredCategories = config.featuredCategoryIds
    .map((id) => allCategories.find((c) => c.id === id))
    .filter(Boolean);

  // 4. Filter active banners
  const activeBanners = config.banners.filter((b) => b.isActive);

  return (
    <>
      {/* Banners slideshow */}
      {/* Featured categories */}
      {/* Featured products */}
      {/* YouTube embed: config.productVideoUrl */}
    </>
  );
}
```

---

## 10. Routing Conventions

Follow Vietnamese slug conventions used in the admin default navbar:

| Route | Data source |
|---|---|
| `/` | homepage config + featured data |
| `/san-pham` | product list (all published) |
| `/san-pham/[slug]` | product detail by slug |
| `/danh-muc/[slug]` | category + its products |
| `/tin-tuc` | post list (all published) |
| `/tin-tuc/[slug]` | post detail by slug |
| `/cua-hang` | all active stores (with map) |
| `/video-review` | YouTube embed from homepage config |

---

## 11. Data Types Reference

### Product (serialized)

```typescript
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;            // Decimal → stringified (format with toLocaleString)
  primaryImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: Array<{ id: string; url: string; alt: string | null; position: number }>;
  createdAt: string;        // ISO 8601
  updatedAt: string;
};
```

### Category

```typescript
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};
```

### Post (serialized)

```typescript
type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;    // HTML from Tiptap editor
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null; // ISO 8601
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
};
```

### Store

```typescript
type Store = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  hours: string;
  lat: number;   // Latitude for map
  lng: number;   // Longitude for map
  isMainStore: boolean;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};
```

### Homepage Config

```typescript
type HomepageConfig = {
  banners: Array<{
    id: string;
    imageUrl: string;
    link: string;     // internal path or external URL
    isActive: boolean;
  }>;
  featuredCategoryIds: string[];  // ordered list of category IDs
  featuredProductIds: string[];   // ordered list of product IDs
  productVideoUrl: string;        // YouTube URL
};
```

### Site Settings

```typescript
type SiteSettings = {
  logoUrl: string;
  logoWhiteUrl: string;
  description: string;
  navbar: Array<{
    id: string;
    label: string;
    href: string;
    isActive: boolean;
  }>;
  contact: {
    address: string;
    hotline: string;
    email: string;
    technicalPhone: string;
    facebookUrl: string;
    zaloUrl: string;
  };
};
```

---

## 12. Critical Rules & Gotchas

### ❌ Never Do This

```typescript
// 1. Never expose DRAFT/ARCHIVED items
prisma.product.findMany() // missing status: "PUBLISHED" filter

// 2. Never return raw Decimal/Date from tRPC
return product; // price is Decimal, createdAt is Date — will crash

// 3. Never use "zod" import
import { z } from "zod"; // WRONG

// 4. Never use protectedProcedure from admin codebase
// The storefront has no auth — create its own baseProcedure
```

### ✅ Always Do This

```typescript
// 1. Filter published only
where: { status: "PUBLISHED" }

// 2. Serialize before returning
return serializeProduct(product);

// 3. Use the correct Zod import
import { z } from "zod/v4";

// 4. Use baseProcedure for all storefront routes
export const baseProcedure = t.procedure; // no auth middleware
```

### Price Formatting

The `price` field is serialized as a string. Format for Vietnamese locale:

```typescript
const formatted = Number(product.price).toLocaleString("vi-VN", {
  style: "currency",
  currency: "VND",
});
// → "1.500.000 ₫"
```

### Post Content Rendering

Post `content` is **Tiptap HTML**. Render it safely:

```tsx
<div
  className="prose prose-lg max-w-none"
  dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
/>
```

### Store Map

Stores have `lat` and `lng` coordinates. Use `react-leaflet` (already installed in admin, install in storefront too):

```typescript
// Already used in admin-furax — same package
"leaflet": "^1.9.4",
"react-leaflet": "^5.0.0",
```

---

## 13. Environment Variables

```env
# Required
DATABASE_URL="postgresql://..."

# Optional (for Vercel deployments)
VERCEL_URL="your-app.vercel.app"
```

---

## 14. package.json Minimum Dependencies

```json
{
  "dependencies": {
    "@prisma/adapter-pg": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "@tanstack/react-query": "^5.90.2",
    "@trpc/client": "^11.16.0",
    "@trpc/server": "^11.16.0",
    "@trpc/tanstack-react-query": "^11.16.0",
    "next": "15.x",
    "pg": "^8.20.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "zod": "^4.x"
  },
  "devDependencies": {
    "prisma": "^7.8.0",
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5"
  },
  "scripts": {
    "dev": "next dev --turbopack",
    "postinstall": "prisma generate",
    "build": "prisma generate && next build --turbopack"
  }
}
```

---

## 15. File Structure Recommendation

```
storefront/
├── lib/
│   └── prisma.ts                    # Prisma singleton (copy from admin)
├── prisma/
│   └── schema.prisma                # Same schema as admin (read-only models only needed)
├── src/
│   ├── app/
│   │   ├── layout.tsx               # TRPCReactProvider wrapping
│   │   ├── page.tsx                 # Homepage
│   │   ├── san-pham/
│   │   │   ├── page.tsx             # Product listing
│   │   │   └── [slug]/page.tsx      # Product detail
│   │   ├── danh-muc/[slug]/page.tsx # Category page
│   │   ├── tin-tuc/
│   │   │   ├── page.tsx             # Blog listing
│   │   │   └── [slug]/page.tsx      # Blog post
│   │   ├── cua-hang/page.tsx        # Store locator
│   │   └── api/trpc/[trpc]/route.ts # tRPC HTTP handler
│   ├── trpc/
│   │   ├── init.ts                  # createTRPCContext, baseProcedure
│   │   ├── client.tsx               # TRPCReactProvider, useTRPC
│   │   ├── server.tsx               # trpc (server options proxy), caller
│   │   ├── query-client.ts          # makeQueryClient
│   │   └── routers/
│   │       ├── _app.ts              # appRouter, AppRouter type
│   │       ├── product.ts
│   │       ├── category.ts
│   │       ├── post.ts
│   │       ├── store.ts
│   │       ├── homepage.ts
│   │       └── settings.ts
│   └── components/
│       ├── layout/
│       │   ├── Header.tsx           # Uses settings.navbar + settings.logoUrl
│       │   └── Footer.tsx           # Uses settings.contact
│       ├── products/
│       │   ├── ProductCard.tsx
│       │   └── ProductGrid.tsx
│       ├── posts/
│       │   └── PostCard.tsx
│       └── stores/
│           └── StoreMap.tsx         # Leaflet map with store markers
```

---

## 16. SEO Considerations

Each page should export metadata using Next.js `generateMetadata`:

```typescript
// src/app/san-pham/[slug]/page.tsx
import type { Metadata } from "next";
import { caller } from "@/trpc/server";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await caller.product.getBySlug({ slug: params.slug });
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: {
      images: product.primaryImage ? [{ url: product.primaryImage }] : [],
    },
  };
}
```

Use `generateStaticParams` for product/post detail pages for optimal performance:

```typescript
export async function generateStaticParams() {
  const products = await caller.product.list();
  return products.map((p) => ({ slug: p.slug }));
}
```

---

*This guide is based on `admin-furax` codebase as of 2026-06. Always verify field names against the live Prisma schema before building.*
