import { z } from "zod/v4";

export const createPostCategorySchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100),
  slug: z
    .string()
    .min(1, "Đường dẫn không được để trống")
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Đường dẫn chỉ được chứa chữ thường và dấu gạch ngang",
    ),
  description: z.string().max(500).optional(),
  image: z.string().url().optional().or(z.literal("")),
});

export const updatePostCategorySchema = createPostCategorySchema.partial();

export type CreatePostCategoryInput = z.infer<typeof createPostCategorySchema>;
export type UpdatePostCategoryInput = z.infer<typeof updatePostCategorySchema>;
