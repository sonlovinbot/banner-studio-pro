# Banner Studio Pro

Ứng dụng web tạo banner bằng AI từ ảnh cảm hứng và ảnh sản phẩm. Ứng dụng sử dụng GPT Image 2 thông qua Coachio API, hỗ trợ tạo nhiều phong cách banner, trò chuyện với trợ lý AI và lưu lịch sử ngay trên trình duyệt.

## Tính năng

- Tải lên ảnh cảm hứng và ảnh sản phẩm.
- Tạo đồng thời 5 phong cách banner.
- Chọn tỷ lệ khung hình và độ phân giải.
- Tạo lại từng kết quả với yêu cầu bổ sung.
- Trợ lý AI hỗ trợ nội dung và ý tưởng thiết kế.
- Lưu API key và tối đa 50 phiên làm việc trong `localStorage`.
- Giao diện chính bằng tiếng Việt.

## Công nghệ

- React 19
- TanStack Start và TanStack Router
- Vite 7
- Tailwind CSS 4
- Cloudflare Workers
- Coachio API (`gpt_image_2`)

## Yêu cầu

- [Bun](https://bun.sh/) 1.3 trở lên
- Coachio API key để sử dụng chức năng AI

## Cài đặt và chạy

```bash
git clone https://github.com/sonlovinbot/banner-studio-pro.git
cd banner-studio-pro
bun install --frozen-lockfile
bun run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Cổng mặc định của cấu hình hiện tại là `8080`; nếu cổng đã được sử dụng, Vite sẽ tự chọn cổng tiếp theo.

Vào **Cấu hình API**, nhập Coachio API key rồi chọn **Kiểm tra kết nối**. Sau đó mở **Tạo Banner** để bắt đầu.

## Các lệnh chính

```bash
bun run dev       # Chạy môi trường phát triển
bun run build     # Build bản production
bun run preview   # Xem thử bản build
bun run lint      # Kiểm tra ESLint và Prettier
bun run format    # Định dạng mã nguồn
```

## Dữ liệu và bảo mật

- API key và lịch sử được lưu lâu dài trong `localStorage`, có thể được JavaScript cùng origin đọc. Chỉ sử dụng ứng dụng trên thiết bị và trình duyệt đáng tin cậy; xóa dữ liệu trình duyệt hoặc thu hồi API key sau khi dùng trên thiết bị dùng chung.
- API key, ảnh, nội dung thương hiệu, prompt và tin nhắn trợ lý được gửi đến Coachio API khi người dùng sử dụng chức năng AI.
- Không commit API key, `.dev.vars` hoặc tệp bí mật vào repository.

## Build và triển khai

Tạo bản production:

```bash
bun run build
```

Kết quả build nằm trong `dist/`. Dự án đã có cấu hình `wrangler.jsonc` cho Cloudflare Workers.

## Giấy phép

Chưa có giấy phép nguồn mở được khai báo. Việc repository ở chế độ public không mặc nhiên cấp quyền sao chép, sửa đổi hoặc phân phối lại mã nguồn.
