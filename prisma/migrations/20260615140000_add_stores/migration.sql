-- CreateTable
CREATE TABLE "store" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hours" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "isMainStore" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_slug_key" ON "store"("slug");

-- CreateIndex
CREATE INDEX "store_city_idx" ON "store"("city");

-- CreateIndex
CREATE INDEX "store_isActive_idx" ON "store"("isActive");

-- Seed initial stores (matching storefront-furax/src/data/stores.ts)
INSERT INTO "store" (
    "id", "slug", "name", "address", "city", "district", "phone", "hours",
    "lat", "lng", "isMainStore", "isActive", "position", "updatedAt"
) VALUES
(
    'seed-hcm-q1', 'hcm-q1', 'FuraX Showroom Quận 1',
    '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    'TP. Hồ Chí Minh', 'Quận 1', '028 3822 1234', '08:00 – 21:00',
    10.7739, 106.7030, true, true, 0, CURRENT_TIMESTAMP
),
(
    'seed-hcm-q7', 'hcm-q7', 'FuraX Showroom Quận 7',
    '456 Nguyễn Thị Thập, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh',
    'TP. Hồ Chí Minh', 'Quận 7', '028 3773 5678', '08:30 – 21:00',
    10.7380, 106.7218, false, true, 1, CURRENT_TIMESTAMP
),
(
    'seed-hcm-td', 'hcm-td', 'FuraX Showroom Thủ Đức',
    '789 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
    'TP. Hồ Chí Minh', 'Thủ Đức', '028 3720 9012', '08:00 – 20:30',
    10.8510, 106.7719, false, true, 2, CURRENT_TIMESTAMP
),
(
    'seed-hn-cg', 'hn-cg', 'FuraX Showroom Cầu Giấy',
    '321 Trần Duy Hưng, Phường Trung Hoà, Quận Cầu Giấy, Hà Nội',
    'Hà Nội', 'Cầu Giấy', '024 3795 3456', '08:00 – 21:00',
    21.0070, 105.7980, true, true, 3, CURRENT_TIMESTAMP
),
(
    'seed-hn-hbt', 'hn-hbt', 'FuraX Showroom Hai Bà Trưng',
    '98 Bà Triệu, Phường Nguyễn Du, Quận Hai Bà Trưng, Hà Nội',
    'Hà Nội', 'Hai Bà Trưng', '024 3943 7890', '08:30 – 20:30',
    21.0190, 105.8490, false, true, 4, CURRENT_TIMESTAMP
),
(
    'seed-dn-hc', 'dn-hc', 'FuraX Showroom Đà Nẵng',
    '55 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
    'Đà Nẵng', 'Hải Châu', '0236 3888 456', '08:00 – 21:00',
    16.0600, 108.2210, true, true, 5, CURRENT_TIMESTAMP
),
(
    'seed-ct-nk', 'ct-nk', 'FuraX Showroom Cần Thơ',
    '12 Đại Lộ Hoà Bình, Phường Tân An, Quận Ninh Kiều, Cần Thơ',
    'Cần Thơ', 'Ninh Kiều', '0292 3812 789', '08:00 – 20:00',
    10.0340, 105.7870, false, true, 6, CURRENT_TIMESTAMP
);
