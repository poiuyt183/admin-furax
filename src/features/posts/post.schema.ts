import { z } from "zod/v4";

export const createPostSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(250),
  slug: z
    .string()
    .min(1, "Đường dẫn không được để trống")
    .max(250)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Đường dẫn chỉ được chứa chữ thường và dấu gạch ngang",
    ),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  categoryId: z.string().optional().or(z.literal("")),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
