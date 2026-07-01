# 🛍️ Storefront — Product Integration Guide

> **Phiên bản:** 1.0 · **Cập nhật:** 2026-07-01  
> Tài liệu này mô tả cấu trúc dữ liệu sản phẩm và cách tích hợp vào trang storefront.

---

## Mục lục

1. [Data Model](#data-model)
2. [Database Queries](#database-queries)
3. [TypeScript Types](#typescript-types)
4. [Hiển thị sản phẩm](#hiển-thị-sản-phẩm)
5. [Thông số kỹ thuật (Specs)](#thông-số-kỹ-thuật-specs)
6. [Giá & Khuyến mãi](#giá--khuyến-mãi)
7. [SEO & Metadata](#seo--metadata)
8. [Ví dụ trang chi tiết sản phẩm](#ví-dụ-trang-chi-tiết-sản-phẩm)
9. [Checklist tích hợp](#checklist-tích-hợp)

---

## Data Model

### Bảng `product`

| Cột | Kiểu | Nullable | Mô tả |
|-----|------|----------|-------|
| `id` | `TEXT` | ❌ | CUID — primary key |
| `name` | `TEXT` | ❌ | Tên sản phẩm |
| `slug` | `TEXT` | ❌ | URL-friendly, unique — dùng cho routing |
| `description` | `TEXT` | ✅ | Mô tả HTML (rich text) |
| `price` | `DECIMAL(12,2)` | ❌ | Giá bán hiện tại (VNĐ) |
| `comparePrice` | `DECIMAL(12,2)` | ✅ | Giá gốc — nếu có → hiển thị giảm giá |
| `primaryImage` | `TEXT` | ✅ | URL ảnh đại diện chính |
| `status` | `ENUM` | ❌ | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |
| `categoryId` | `TEXT` | ✅ | FK → `category.id` |
| `brand` | `TEXT` | ✅ | Thương hiệu |
| `origin` | `TEXT` | ✅ | Xuất xứ |
| `sku` | `TEXT` | ✅ | Mã sản phẩm nội bộ |
| `warranty` | `TEXT` | ✅ | Thông tin bảo hành |
| `createdAt` | `TIMESTAMP` | ❌ | — |
| `updatedAt` | `TIMESTAMP` | ❌ | — |

> **⚠️ Storefront chỉ hiển thị sản phẩm có `status = 'PUBLISHED'`.**

---

### Bảng `product_image`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | `TEXT` | PK |
| `url` | `TEXT` | URL ảnh |
| `alt` | `TEXT?` | Alt text — dùng cho SEO & accessibility |
| `position` | `INT` | Thứ tự hiển thị (asc) |
| `productId` | `TEXT` | FK → `product.id` |

---

### Bảng `product_spec`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | `TEXT` | PK |
| `label` | `TEXT` | Tên thông số — VD: `"Bộ vi xử lý"` |
| `value` | `TEXT` | Giá trị — VD: `"Intel Core i7-1360P"` |
| `group` | `TEXT?` | Nhóm — VD: `"Hiệu năng"`, `"Màn hình"` |
| `position` | `INT` | Thứ tự trong nhóm (asc) |
| `productId` | `TEXT` | FK → `product.id` |

---

## Database Queries

### Danh sách sản phẩm (listing page)

```typescript
// lib/products.ts
import prisma from "@/lib/prisma";

export async function getPublishedProducts(options?: {
  categorySlug?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { categorySlug, search, limit = 24, offset = 0 } = options ?? {};

  return prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(categorySlug && {
        category: { slug: categorySlug },
      }),
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      primaryImage: true,
      brand: true,
      origin: true,
      category: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}
```

### Chi tiết sản phẩm (detail page)

```typescript
export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: {
        orderBy: { position: "asc" },
        select: { url: true, alt: true },
      },
      specs: {
        orderBy: { position: "asc" },
        select: { label: true, value: true, group: true },
      },
    },
  });
}
```

### Sản phẩm liên quan

```typescript
export async function getRelatedProducts(
  productId: string,
  categoryId: string | null
) {
  return prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: productId },
      ...(categoryId ? { categoryId } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      primaryImage: true,
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });
}
```

---

## TypeScript Types

```typescript
// types/product.ts

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  /** Decimal từ Prisma — serialize về string */
  price: string;
  comparePrice: string | null;
  primaryImage: string | null;
  brand: string | null;
  origin: string | null;
  category: { name: string; slug: string } | null;
};

export type ProductSpec = {
  label: string;
  value: string;
  group: string | null;
};

/** Specs đã nhóm theo group key */
export type GroupedSpecs = Record<string, ProductSpec[]>;

export type ProductDetail = ProductListItem & {
  description: string | null;
  warranty: string | null;
  sku: string | null;
  images: Array<{ url: string; alt: string | null }>;
  specs: ProductSpec[];
  category: { id: string; name: string; slug: string } | null;
};
```

---

## Hiển thị sản phẩm

### Product Card (listing)

```tsx
// components/ProductCard.tsx
import Image from "next/image";
import Link from "next/link";
import { formatPrice, calcDiscount } from "@/lib/utils";
import type { ProductListItem } from "@/types/product";

export function ProductCard({ product }: { product: ProductListItem }) {
  const discount = calcDiscount(product.price, product.comparePrice);

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
        {product.primaryImage ? (
          <Image
            src={product.primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            No image
          </div>
        )}

        {/* Badge giảm giá */}
        {discount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
            -{discount}%
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {product.brand && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {product.brand}
          </p>
        )}
        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>
        {product.origin && (
          <p className="text-xs text-muted-foreground">
            Xuất xứ: {product.origin}
          </p>
        )}
      </div>
    </Link>
  );
}
```

---

## Thông số kỹ thuật (Specs)

Specs được lưu dạng flat list nhưng có trường `group` để nhóm lại khi hiển thị.

### Utility: groupSpecs

```typescript
// lib/utils.ts
import type { ProductSpec, GroupedSpecs } from "@/types/product";

/**
 * Nhóm specs theo trường `group`.
 * Nếu group = null → xếp vào nhóm "Thông số chung".
 */
export function groupSpecs(specs: ProductSpec[]): GroupedSpecs {
  return specs.reduce<GroupedSpecs>((acc, spec) => {
    const group = spec.group ?? "Thông số chung";
    if (!acc[group]) acc[group] = [];
    acc[group].push(spec);
    return acc;
  }, {});
}

export function formatPrice(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

/**
 * Tính % giảm giá. Trả về null nếu không có comparePrice
 * hoặc comparePrice <= price.
 */
export function calcDiscount(
  price: string | number,
  comparePrice: string | number | null
): number | null {
  if (!comparePrice) return null;
  const p = parseFloat(String(price));
  const cp = parseFloat(String(comparePrice));
  if (cp <= p || cp === 0) return null;
  return Math.round(((cp - p) / cp) * 100);
}
```

### Component: SpecsTable

```tsx
// components/SpecsTable.tsx
import { groupSpecs } from "@/lib/utils";
import type { ProductSpec } from "@/types/product";

export function SpecsTable({ specs }: { specs: ProductSpec[] }) {
  if (!specs.length) return null;

  const grouped = groupSpecs(specs);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([groupName, items]) => (
        <div key={groupName}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {groupName}
          </h3>
          <div className="divide-y divide-border rounded-xl border overflow-hidden">
            {items.map((spec) => (
              <div key={spec.label} className="grid grid-cols-2 text-sm">
                <span className="px-4 py-3 bg-muted/40 font-medium text-muted-foreground">
                  {spec.label}
                </span>
                <span className="px-4 py-3">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Ví dụ dữ liệu và kết quả hiển thị:**

```
Dữ liệu specs từ DB:
[
  { group: "Hiệu năng", label: "Bộ vi xử lý", value: "Intel Core i7-1360P" },
  { group: "Hiệu năng", label: "RAM",         value: "16 GB DDR5"           },
  { group: "Màn hình",  label: "Kích thước",  value: "14 inch"              },
  { group: null,        label: "Màu sắc",     value: "Bạc"                  },
]

Kết quả nhóm sau groupSpecs():
{
  "Hiệu năng":       [...],
  "Màn hình":        [...],
  "Thông số chung":  [...]   ← group=null → fallback
}
```

---

## Giá & Khuyến mãi

| Trường | Ý nghĩa | Khi hiển thị |
|--------|---------|--------------|
| `price` | Giá bán hiện tại | Luôn hiển thị |
| `comparePrice` | Giá gốc trước giảm | Chỉ hiển thị khi `comparePrice > price` |

**Logic tính giảm giá:**

```typescript
// comparePrice = null → không có khuyến mãi
// comparePrice <= price → dữ liệu sai, bỏ qua
// comparePrice > price → hiển thị badge giảm giá

const discount = calcDiscount(product.price, product.comparePrice);
// VD: price=8_000_000, comparePrice=10_000_000 → discount=20 (%)
```

> **⚠️ Quan trọng:** `price` và `comparePrice` từ Prisma trả về kiểu `Decimal`.  
> Khi JSON serialize (API route / tRPC), bắt buộc gọi `.toString()` trước.  
> Xem pattern trong router: `price: product.price.toString()`.

---

## SEO & Metadata

### Next.js `generateMetadata`

```typescript
// app/products/[slug]/page.tsx
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/products";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };

  // Strip HTML tags từ description để dùng làm meta description
  const plainDescription = product.description
    ? product.description.replace(/<[^>]+>/g, "").slice(0, 160)
    : [
        `Mua ${product.name} chính hãng.`,
        product.brand ? `Thương hiệu: ${product.brand}.` : "",
        product.origin ? `Xuất xứ: ${product.origin}.` : "",
        product.warranty ? `Bảo hành: ${product.warranty}.` : "",
      ]
        .filter(Boolean)
        .join(" ");

  return {
    title: product.name,
    description: plainDescription,
    openGraph: {
      title: product.name,
      description: plainDescription,
      images: product.primaryImage ? [{ url: product.primaryImage }] : [],
      type: "website",
    },
  };
}
```

### JSON-LD Structured Data (Schema.org Product)

```tsx
// Đặt trong page.tsx layout
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: plainDescription,
      sku: product.sku ?? undefined,
      brand: product.brand
        ? { "@type": "Brand", name: product.brand }
        : undefined,
      countryOfOrigin: product.origin ?? undefined,
      offers: {
        "@type": "Offer",
        price: parseFloat(product.price),
        priceCurrency: "VND",
        availability: "https://schema.org/InStock",
        ...(product.comparePrice && {
          priceValidUntil: new Date(Date.now() + 30 * 86400000)
            .toISOString()
            .split("T")[0],
        }),
      },
      image: [
        product.primaryImage,
        ...product.images.map((img) => img.url),
      ].filter(Boolean),
    }),
  }}
/>
```

---

## Ví dụ trang chi tiết sản phẩm

```tsx
// app/products/[slug]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { SpecsTable } from "@/components/SpecsTable";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice, calcDiscount } from "@/lib/utils";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(
    product.id,
    product.category?.id ?? null
  );

  const discount = calcDiscount(product.price, product.comparePrice);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* ─── Main Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-100">
            {product.primaryImage && (
              <Image
                src={product.primaryImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>
          {product.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-square relative rounded-lg overflow-hidden bg-gray-100"
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.category && (
            <p className="text-sm text-muted-foreground">
              <a href={`/categories/${product.category.slug}`}>
                {product.category.name}
              </a>
            </p>
          )}

          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 text-sm">
            {product.brand && (
              <span className="px-3 py-1 bg-muted rounded-full">
                🏷️ {product.brand}
              </span>
            )}
            {product.origin && (
              <span className="px-3 py-1 bg-muted rounded-full">
                🌍 Xuất xứ: {product.origin}
              </span>
            )}
            {product.warranty && (
              <span className="px-3 py-1 bg-muted rounded-full">
                🛡️ BH: {product.warranty}
              </span>
            )}
            {product.sku && (
              <span className="px-3 py-1 bg-muted rounded-full text-muted-foreground">
                SKU: {product.sku}
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
              {discount && (
                <span className="text-sm font-semibold text-white bg-red-500 px-2 py-0.5 rounded">
                  -{discount}%
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Liên hệ mua hàng
          </button>
        </div>
      </div>

      {/* ─── Description ─── */}
      {product.description && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Mô tả sản phẩm</h2>
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </section>
      )}

      {/* ─── Specs ─── */}
      {product.specs.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Thông số kỹ thuật</h2>
          <SpecsTable specs={product.specs} />
        </section>
      )}

      {/* ─── Related Products ─── */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## Checklist tích hợp

- [ ] Chỉ fetch sản phẩm có `status = "PUBLISHED"`
- [ ] Dùng `slug` làm URL segment — không dùng `id`
- [ ] Xử lý `null` cho tất cả trường optional (`brand`, `origin`, `sku`, `warranty`, `comparePrice`, `primaryImage`)
- [ ] `price` / `comparePrice` từ Prisma là `Decimal` → `.toString()` trước khi serialize JSON
- [ ] Specs: dùng `groupSpecs()` để nhóm, fallback `"Thông số chung"` khi `group = null`
- [ ] Alt text ảnh: dùng `img.alt ?? product.name`
- [ ] SEO: implement `generateMetadata` + JSON-LD structured data (`@type: Product`)
- [ ] `notFound()` nếu không tìm thấy sản phẩm hoặc `status !== "PUBLISHED"`
- [ ] `<Image>` Next.js với `priority` cho ảnh chính
- [ ] Thêm domain ảnh vào `next.config.ts` → `images.remotePatterns`
