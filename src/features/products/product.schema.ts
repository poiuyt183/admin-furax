import { z } from "zod/v4";

const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(200).optional(),
});

const productSpecSchema = z.object({
  label: z.string().min(1, "Label không được để trống").max(100),
  value: z.string().min(1, "Giá trị không được để trống").max(500),
  group: z.string().max(100).optional(),
  position: z.number().int().default(0),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(200),
  slug: z
    .string()
    .min(1, "Đường dẫn không được để trống")
    .max(250)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Đường dẫn chỉ được chứa chữ thường và dấu gạch ngang",
    ),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  comparePrice: z.coerce.number().min(0).optional().nullable(),
  primaryImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  categoryId: z.string().optional().or(z.literal("")),
  images: z.array(productImageSchema).optional(),
  specs: z.array(productSpecSchema).optional(),
  // Product details
  brand: z.string().max(100).optional().or(z.literal("")),
  origin: z.string().max(100).optional().or(z.literal("")),
  sku: z.string().max(100).optional().or(z.literal("")),
  warranty: z.string().max(200).optional().or(z.literal("")),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductSpecInput = z.infer<typeof productSpecSchema>;
