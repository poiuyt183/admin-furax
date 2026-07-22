import { z } from "zod/v4";
import { isValidYoutubeUrl } from "@/lib/youtube";

export const createReviewVideoSchema = z.object({
  title: z.string().max(200).optional().or(z.literal("")),
  youtubeUrl: z
    .string()
    .min(1, "Link YouTube không được để trống")
    .refine(isValidYoutubeUrl, "Link YouTube không hợp lệ"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục sản phẩm"),
  isActive: z.boolean().default(true),
});

export const updateReviewVideoSchema = createReviewVideoSchema.partial();

export type CreateReviewVideoInput = z.infer<typeof createReviewVideoSchema>;
export type UpdateReviewVideoInput = z.infer<typeof updateReviewVideoSchema>;
