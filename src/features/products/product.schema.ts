import { z } from "zod/v4"

const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(200).optional(),
})

export const createProductSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(200),
  slug: z.string().min(1, "Đường dẫn không được để trống").max(250).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Đường dẫn chỉ được chứa chữ thường và dấu gạch ngang"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  primaryImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  categoryId: z.string().optional().or(z.literal("")),
  images: z.array(productImageSchema).optional(),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
