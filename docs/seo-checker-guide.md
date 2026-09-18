# 📊 Hướng dẫn sử dụng Công cụ Kiểm tra SEO

Công cụ **Kiểm tra SEO** giúp bạn đánh giá mức độ tối ưu SEO của bài viết trước khi xuất bản. Được thiết kế theo phong cách **Yoast SEO**, công cụ phân tích bài viết theo 12 tiêu chí và chấm điểm trên thang 100.

---

## 1. Cách truy cập

1. Vào trang **Bài viết** → Nhấn **Thêm bài viết mới** hoặc **Chỉnh sửa** bài viết có sẵn.
2. Điền nội dung bài viết (tiêu đề, nội dung, tóm tắt, ảnh bìa...).
3. Nhấn nút **🔍 Kiểm tra SEO** ở góc trên bên phải (cạnh nút Lưu).
4. Modal SEO sẽ mở ra với kết quả phân tích.

> **💡 Mẹo:** Hãy điền đầy đủ nội dung trước khi kiểm tra để có kết quả chính xác nhất.

---

## 2. Các thành phần trong công cụ

### 2.1. Từ khóa trọng tâm

Nhập **từ khóa chính** mà bạn muốn bài viết xuất hiện trên Google.

Ví dụ: nếu bài viết về "máy lọc nước", nhập `máy lọc nước`.

Công cụ sẽ kiểm tra từ khóa này có xuất hiện trong:
- Tiêu đề
- Nội dung (mật độ 1–3%)
- Đường dẫn (slug)

### 2.2. Xem trước trên Google (SERP Preview)

Mô phỏng chính xác cách bài viết sẽ hiển thị trên **trang kết quả tìm kiếm Google**:

```
🌐 yoursite.com
   yoursite.com › blog › may-loc-nuoc-tot-nhat

Máy lọc nước tốt nhất 2026 - Top 10 sản phẩm đáng mua
Tổng hợp 10 máy lọc nước tốt nhất hiện nay. So sánh giá, tính năng
và đánh giá chi tiết giúp bạn chọn được sản phẩm phù hợp...
```

| Thành phần | Nguồn dữ liệu | Giới hạn hiển thị |
|------------|---------------|-------------------|
| **Tiêu đề** (xanh) | Meta Title → fallback Tiêu đề bài | 60 ký tự |
| **URL** | Slug | — |
| **Mô tả** (xám) | Meta Description → fallback Tóm tắt | 160 ký tự |

> Nếu tiêu đề/mô tả quá dài, Google sẽ tự cắt bớt và thêm "..." — preview cho bạn thấy điều này.

### 2.3. Điểm số & Xếp hạng

Vòng tròn điểm hiển thị tổng điểm SEO (0–100):

| Xếp hạng | Điểm | Ý nghĩa |
|-----------|-------|---------|
| **A** — Xuất sắc | 85–100 | Bài viết đã tối ưu rất tốt, sẵn sàng xuất bản ✅ |
| **B** — Tốt | 70–84 | Tốt nhưng còn vài điểm có thể cải thiện |
| **C** — Trung bình | 50–69 | Cần cải thiện thêm trước khi xuất bản |
| **D** — Yếu | 30–49 | Nhiều vấn đề cần xử lý |
| **F** — Kém | 0–29 | Chưa sẵn sàng, cần bổ sung nhiều nội dung |

### 2.4. Kết quả phân tích (theo nhóm)

Kết quả được chia thành 3 nhóm theo kiểu đèn giao thông:

| Nhóm | Màu | Mô tả |
|------|-----|-------|
| 🔴 **Vấn đề** | Đỏ | Các lỗi nghiêm trọng cần sửa ngay |
| 🟠 **Cần cải thiện** | Cam | Chưa tối ưu, nên cải thiện |
| 🟢 **Kết quả tốt** | Xanh | Đã đạt chuẩn, không cần chỉnh sửa |

Nhấn vào từng mục để xem **gợi ý sửa** chi tiết.

---

## 3. Bảng 12 tiêu chí kiểm tra

### Nhóm 1: Thông tin cơ bản

| # | Tiêu chí | Điểm tối đa | Tiêu chuẩn tối ưu |
|---|----------|:-----------:|-------------------|
| 1 | **Độ dài tiêu đề** | 10 | 50–60 ký tự |
| 2 | **Meta Description** | 10 | 150–160 ký tự |
| 3 | **Đường dẫn (Slug)** | 5 | 3–75 ký tự, ngắn gọn |
| 4 | **Ảnh bìa** | 5 | Có ảnh bìa |

### Nhóm 2: Nội dung

| # | Tiêu chí | Điểm tối đa | Tiêu chuẩn tối ưu |
|---|----------|:-----------:|-------------------|
| 5 | **Độ dài nội dung** | 15 | Tối thiểu 300 từ, tốt nhất 1000+ từ |
| 6 | **Cấu trúc heading** | 10 | Có ít nhất 2 H2 và 1 H3 |
| 7 | **Alt text ảnh** | 10 | Tất cả ảnh trong bài có alt text |
| 8 | **Tính dễ đọc** | 15 | Câu ≤25 từ, đoạn ≤150 từ |

### Nhóm 3: Từ khóa

| # | Tiêu chí | Điểm tối đa | Tiêu chuẩn tối ưu |
|---|----------|:-----------:|-------------------|
| 9 | **Từ khóa trong tiêu đề** | 5 | Từ khóa xuất hiện trong tiêu đề |
| 10 | **Từ khóa trong nội dung** | 5 | Mật độ 1–3% |
| 11 | **Từ khóa trong slug** | 5 | Slug chứa từ khóa |
| 12 | **Liên kết nội bộ** | 5 | Có ít nhất 2 liên kết nội bộ |

> **Tổng điểm tối đa: 100**

---

## 4. Trường SEO trên form bài viết

Ở sidebar bên phải của form chỉnh sửa bài viết, có card **SEO** với 2 trường:

### Meta Title
- Tiêu đề SEO riêng, hiển thị trên Google thay cho tiêu đề bài viết.
- **Để trống** → hệ thống sẽ dùng tiêu đề bài viết.
- Giới hạn: **70 ký tự** (bộ đếm hiển thị bên phải).
- Tối ưu: **50–60 ký tự**.

### Meta Description
- Mô tả ngắn hiển thị dưới tiêu đề trên Google.
- **Để trống** → hệ thống sẽ dùng phần Tóm tắt.
- Giới hạn: **200 ký tự** (bộ đếm hiển thị bên phải).
- Tối ưu: **150–160 ký tự**.

---

## 5. Quy trình kiểm tra SEO khuyến nghị

```
Bước 1: Viết bài viết hoàn chỉnh
         ↓
Bước 2: Điền Meta Title + Meta Description (card SEO)
         ↓
Bước 3: Nhấn "Kiểm tra SEO"
         ↓
Bước 4: Nhập từ khóa trọng tâm
         ↓
Bước 5: Xem SERP Preview → tiêu đề/mô tả có bị cắt không?
         ↓
Bước 6: Xem nhóm "Vấn đề" (🔴) → sửa trước
         ↓
Bước 7: Xem nhóm "Cần cải thiện" (🟠) → tối ưu thêm
         ↓
Bước 8: Đạt điểm B trở lên → Xuất bản ✅
```

---

## 6. Mẹo đạt điểm cao

### ✍️ Tiêu đề
- Đặt **từ khóa ở đầu** tiêu đề.
- Giữ trong **50–60 ký tự**.
- Ví dụ: ❌ `Bài viết hay về máy lọc nước` → ✅ `Máy lọc nước tốt nhất 2026 — Top 10 đáng mua`

### 📝 Nội dung
- Viết ít nhất **600 từ** (lý tưởng 1000+).
- Chia bài thành **các mục với H2, H3**.
- Giữ câu ngắn (≤25 từ), đoạn ngắn (≤150 từ).

### 🔗 Liên kết
- Thêm ít nhất **2 liên kết nội bộ** đến bài viết hoặc sản phẩm khác.
- Sử dụng đường dẫn tương đối: `/products/may-loc-nuoc`

### 🖼️ Hình ảnh
- Thêm **ảnh bìa** cho mọi bài viết.
- Mọi ảnh trong nội dung cần có **alt text mô tả**.

### 🎯 Từ khóa
- Chọn **1 từ khóa trọng tâm** cho mỗi bài viết.
- Đảm bảo từ khóa xuất hiện trong: tiêu đề, slug, và nội dung (1–3%).
- **Không nhồi từ khóa** — viết tự nhiên, vì người đọc.
