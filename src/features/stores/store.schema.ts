import { z } from "zod/v4";

export const createStoreSchema = z.object({
  slug: z
    .string()
    .min(1, "Mã cửa hàng không được để trống")
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Mã chỉ được chứa chữ thường và dấu gạch ngang",
    ),
  name: z.string().min(1, "Tên cửa hàng không được để trống").max(200),
  address: z.string().min(1, "Địa chỉ không được để trống").max(500),
  city: z.string().min(1, "Thành phố không được để trống").max(100),
  district: z.string().min(1, "Quận/Huyện không được để trống").max(100),
  phone: z.string().min(1, "Số điện thoại không được để trống").max(30),
  hours: z.string().min(1, "Giờ mở cửa không được để trống").max(50),
  lat: z.coerce
    .number()
    .min(-90, "Vĩ độ không hợp lệ")
    .max(90, "Vĩ độ không hợp lệ"),
  lng: z.coerce
    .number()
    .min(-180, "Kinh độ không hợp lệ")
    .max(180, "Kinh độ không hợp lệ"),
  isMainStore: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateStoreSchema = createStoreSchema.partial();

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
