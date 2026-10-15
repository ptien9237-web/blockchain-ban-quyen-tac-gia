# SOURCE CODE MAP — BOOKCHAIN LIBRARY
*(Bản đồ Chi tiết Mã nguồn Dự án BookChain Library)*

> **Phiên bản:** 1.0.0  
> **Thư mục gốc:** `c:\Users\tien\Desktop\Học\Công Nghệ BlockChain\Công nghê BlockChain\Bản Quyền Tác Giả Sách`  
> **Mục đích:** Hướng dẫn nhà phát triển và hệ thống AI tra cứu nhanh vai trò, quan hệ phụ thuộc và lưu ý khi sửa đổi từng tệp tin trong toàn bộ dự án.

---

## 1. BẢN ĐỒ TẬP TIN CẤU HÌNH & GỐC (ROOT CONFIGURATIONS)

| Đường dẫn tệp | Vai trò / Phân loại | Chức năng chính | Các tệp liên quan | Trạng thái | Lưu ý quan trọng khi sửa đổi |
|---|---|---|---|---|---|
| `package.json` | Cấu hình Dependency & Scripts | Khai báo các thư viện npm (`react`, `react-router-dom`, `lucide-react`, `vite`, `oxlint`, `typescript`) và scripts (`dev`, `build`, `lint`, `preview`). | `package-lock.json`, `vite.config.ts`, `tsconfig.json` | Đã xác minh | Hiện **thiếu script `"start"`**, dẫn đến lỗi khi người dùng gõ `npm start`. Có thể bổ sung `"start": "vite"` hoặc `"start": "vite preview"`. |
| `vite.config.ts` | Cấu hình Bundler | Cấu hình Vite với plugin `@vitejs/plugin-react`. | `package.json`, `index.html` | Đã xác minh | Cấu hình tiêu chuẩn đơn giản, chưa cấu hình alias đường dẫn `@/`. |
| `index.html` | Điểm vào ứng dụng web | Khai báo thẻ `#root`, liên kết favicon SVG và load `/src/main.tsx`. | `src/main.tsx`, `public/favicon.svg` | Đã xác minh | Thẻ `<title>` hiện để mặc định là `bookchain`. Có thể cập nhật thành `BookChain — Digital Library & Copyright Registry`. |
| `tsconfig.json` | Cấu hình TypeScript Root | Khai báo Project References trỏ tới `tsconfig.app.json` và `tsconfig.node.json`. | `tsconfig.app.json`, `tsconfig.node.json` | Đã xác minh | Quản lý phân tách cấu hình giữa client code và build script node. |
| `tsconfig.app.json` | Cấu hình TS Client | Thiết lập Target `es2023`, module `esnext`, JSX `react-jsx`, strict linting (`noUnusedLocals`, `erasableSyntaxOnly`). | `src/**/*` | Đã xác minh | Bật `noUnusedLocals` và `noUnusedParameters`, nếu khai báo biến không dùng sẽ gây lỗi compile khi chạy `npm run build`. |
| `tsconfig.node.json` | Cấu hình TS Node | Thiết lập môi trường cho `vite.config.ts`. | `vite.config.ts` | Đã xác minh | Không tác động trực tiếp tới mã nguồn `src/`. |
| `.oxlintrc.json` | Cấu hình Linter | Cấu hình rule cho Oxlint (`react/rules-of-hooks`, `react/only-export-components`). | `package.json` | Đã xác minh | Linter chạy nhanh bằng engine Rust. |
| `.gitignore` | Cấu hình Git | Khai báo loại trừ `node_modules`, `dist`, file logs, IDE files. | Toàn bộ repo | Đã xác minh | Workspace hiện chưa khởi tạo `.git`. |

---

## 2. BẢN ĐỒ TÀI LIỆU DỰ ÁN (PROJECT DOCUMENTATION)

| Đường dẫn tệp | Vai trò | Chức năng chính | Trạng thái | Lưu ý |
|---|---|---|---|---|
| `README.md` | Tài liệu giới thiệu chung | Hướng dẫn cài đặt, chạy dev, tóm tắt các tính năng MVP và danh sách hạn chế hiện tại (No Real Blockchain, No Backend). | Đã xác minh | Khẳng định rõ giai đoạn tiếp theo cần làm Smart Contract, IPFS và Ethers.js. |
| `PRODUCT.md` | Tuyên ngôn sản phẩm | Xác định tầm nhìn cốt lõi *"Library First, Copyright Second, Blockchain Underneath"*, đối tượng người dùng và phạm vi loại trừ (không làm dashboard crypto, không hiển thị giá coin). | Đã xác minh | Là kim chỉ nam nghiệp vụ cho toàn bộ các màn hình. |
| `DESIGN.md` | Hệ thống thiết kế (Design System) | Mô tả phong cách "Archival Reading Room", bảng màu Ivory/Charcoal, Typography (Libre Baskerville, Public Sans, Space Mono). | Đã xác minh | Không cho phép sử dụng phong cách Neon/Glassmorphism phổ biến của Web3. |
| `PROJECT_WORKFLOW.txt` | Nhật ký phát triển ban đầu | Ghi chép 14 bước thực hiện xây dựng giao diện, cài đặt I18n, Dark mode và kết quả build. | Đã xác minh | Tài liệu ghi nhận lịch sử của phiên phát triển trước. |

---

## 3. BẢN ĐỒ TẦNG GIAO DIỆN & ROUTING (`src/`)

### 3.1. Điểm vào ứng dụng
| Đường dẫn tệp | Vai trò | Chức năng chính | Các tệp liên quan | Trạng thái | Lưu ý khi chỉnh sửa |
|---|---|---|---|---|---|
| `src/main.tsx` | Khởi tạo React Root | Gắn `StrictMode`, lồng các Provider toàn cục (`ThemeProvider`, `I18nProvider`) và render component `<App />`. | `src/App.tsx`, `src/contexts/*`, `src/index.css` | Đã xác minh | Đảm bảo `ThemeProvider` bao bọc bên ngoài để đồng bộ theme ngay khi render. |
| `src/App.tsx` | Quản lý Router | Khai báo `BrowserRouter`, khung `<Layout>` và các Route: `/`, `/discover`, `/book/:id`, `/authors`, `/how-it-works`, `/copyright/verify`, `/copyright/register`. | `src/components/layout/Layout.tsx`, `src/pages/*` | Đã xác minh | **Thiếu route `/author/:id` và `/copyright/record/:id`**, khiến các liên kết từ thẻ sách và trang chi tiết bị đứt gãy. |
| `src/index.css` | CSS Nền tảng toàn cục | Định nghĩa các CSS Custom Properties (Tokens màu Sáng/Tối, Spacing, Radius, Shadow, Font families), CSS Reset và các Utility Classes. | Toàn bộ components và pages | Đã xác minh | Là nguồn token duy nhất cho hệ thống. Tránh định nghĩa mã màu tĩnh trong các file CSS con mà phải gọi qua `var(--color-*)`. |
| `src/App.css` | **Mã dư thừa (Dead Code)** | Chứa các class thừa từ template mặc định của Vite (`.counter`, `.hero`, `#next-steps`, `.ticks`). | **Không được import vào bất kỳ đâu** | **Dư thừa** | Nên xóa bỏ hoặc để trống để tránh gây hiểu nhầm cho các nhà phát triển sau. |

---

## 4. BẢN ĐỒ CÁC TRANG ỨNG DỤNG (`src/pages/`)

| Đường dẫn tệp | Vai trò | Chức năng chính | Tệp liên quan | Trạng thái | Lưu ý kỹ thuật & Vấn đề tồn tại |
|---|---|---|---|---|---|
| `src/pages/Home.tsx` + `Home.css` | Trang chủ (Landing Page) | Hiển thị Hero banner, Sách nổi bật mẫu (*The Theory of Immutable Trust*), 3 cột giá trị triết lý dự án. | `src/contexts/I18nContext.tsx`, `src/pages/Home.css` | Đã xác minh | Sử dụng dữ liệu tĩnh cứng cho thẻ sách nổi bật thay vì lấy từ `mockData.ts`. |
| `src/pages/Discover.tsx` + `Discover.css` | Trang khám phá Thư viện | Tìm kiếm sách theo tiêu đề/tác giả qua ô `input`, lọc danh mục sách qua `CATEGORIES`, hiển thị danh sách `BookCard`. | `src/components/book/BookCard.tsx`, `src/services/mockData.ts` | Một phần hoàn thiện | 1. Checkbox "Verified Only" và "Pending" **chưa có `onChange`**, không hoạt động.<br>2. Dropdown sắp xếp **chưa có event listener**.<br>3. Nút bấm "Filters" không có handler. |
| `src/pages/BookDetail.tsx` + `BookDetail.css` | Trang chi tiết tác phẩm | Lấy `id` từ URL qua `useParams()`, tìm sách trong `MOCK_BOOKS`. Hiển thị thông tin sách và bảng thông số lưu trữ bản quyền (Record ID, Mạng, Ngày đăng ký, Content Hash). | `src/services/mockData.ts`, `src/contexts/I18nContext.tsx` | Một phần hoàn thiện | 1. Nút "Read Work" và "Download PDF" **chưa có logic đọc/tải**.<br>2. Link `to="/author/${book.authorId}"` và `to="/copyright/record/${book.recordId}"` **bị lỗi 404/trang trắng** do thiếu route trong `App.tsx`.<br>3. Mã Content Hash đang gán cứng chuỗi SHA-256 rỗng. |
| `src/pages/Verify.tsx` + `Verify.css` | Trang xác minh bản quyền | Cung cấp giao diện kéo thả file, chuyển đổi trạng thái UPLOAD → CALCULATING → RESULT. | `src/contexts/I18nContext.tsx`, `src/pages/Verify.css` | Mới là giao diện mô phỏng (Mock UI) | 1. **Chưa tính toán hash thực tế:** Gán chuỗi cố định `e3b0c442...` qua `setTimeout`.<br>2. **Logic đối soát giả lập:** Dựa vào `file.size % 2 === 0` để trả về VERIFIED hoặc NOT_FOUND.<br>3. Các nút "View Full Ledger Record" và "Register This Work" ở màn hình kết quả **chưa có `onClick`**. |
| `src/pages/Register.tsx` + `Register.css` | Trang đăng ký bản quyền tác phẩm | Stepper 5 bước: 1. Thông tin tác phẩm → 2. Sở hữu/Ví → 3. Upload file → 4. Review → 5. Ký giao dịch. | `src/contexts/I18nContext.tsx`, `src/pages/Register.css` | Mới là bản mẫu (Prototype UI) | 1. Các ô input ở Bước 1 & Bước 2 **không lưu state** (Uncontrolled).<br>2. Nút chọn file ở Bước 3 **không có thẻ `<input type="file">`**.<br>3. Bước 4 hiển thị thông tin cứng mẫu.<br>4. Bước 5 chạy spinner vô tận mà không có điểm kết thúc. |

---

## 5. BẢN ĐỒ COMPONENTS VÀ LAYOUT (`src/components/`)

| Đường dẫn tệp | Vai trò | Chức năng chính | Tệp liên quan | Trạng thái | Lưu ý kỹ thuật |
|---|---|---|---|---|---|
| `src/components/layout/Navbar.tsx` + `Navbar.css` | Thanh điều hướng toàn cục | Hiển thị thương hiệu BookChain, menu trang, công cụ chuyển đổi giao diện Sáng/Tối, nút chuyển ngôn ngữ EN/VI, nút Xác minh và nút Kết nối ví. | `src/contexts/*`, `Navbar.css` | Một phần hoàn thiện | Nút "Connect Wallet" **chưa có `onClick` handler**, hiện chỉ là nút bấm minh họa. |
| `src/components/layout/Footer.tsx` + `Footer.css` | Chân trang toàn cục | Điều hướng danh mục, liên kết bản quyền, giới thiệu, thông tin pháp lý và bản quyền năm hiện tại. | `src/contexts/I18nContext.tsx`, `Footer.css` | Đã xác minh | Đã hỗ trợ đa ngôn ngữ đầy đủ. Các đường dẫn như `/terms`, `/privacy`, `/about`, `/faq` hiện trỏ tới route chưa khai báo (placeholder). |
| `src/components/layout/Layout.tsx` + `Layout.css` | Khung bố cục chung | Đóng gói cấu trúc trang với `<Navbar />` ở trên, thẻ `<main>` ở giữa, và `<Footer />` ở dưới. | `Navbar.tsx`, `Footer.tsx` | Đã xác minh | Giữ cấu trúc sticky footer chuẩn mực. |
| `src/components/book/BookCard.tsx` + `BookCard.css` | Thẻ hiển thị sách | Render thẻ sách trong danh mục: ảnh bìa giả lập phong cách gáy sách, tiêu đề, tác giả, năm, thể loại và icon trạng thái bản quyền (Shield xanh/vàng/xám). | `src/services/mockData.ts`, `src/contexts/I18nContext.tsx` | Một phần hoàn thiện | Liên kết tác giả `to="/author/${book.authorId}"` trỏ tới route chưa tồn tại trong `App.tsx`. |
| `src/components/copyright/` | **Thư mục rỗng** | Được tạo dự kiến chứa các component chuyên trách về bản quyền (ví dụ: `CopyrightBadge`, `CertificateModal`, `ProofViewer`). | - | **Chưa triển khai** | Hiện không có file nào bên trong. |
| `src/components/ui/` | **Thư mục rỗng** | Được tạo dự kiến chứa các UI primitives tái sử dụng (Button, Modal, Input, Badge). | - | **Chưa triển khai** | Hiện không có file nào bên trong. |

---

## 6. BẢN ĐỒ TẦNG DỊCH VỤ, DỮ LIỆU & CONTEXT (`src/services/`, `src/contexts/`, `src/i18n/`)

| Đường dẫn tệp | Vai trò | Chức năng chính | Tệp liên quan | Trạng thái | Lưu ý kỹ thuật |
|---|---|---|---|---|---|
| `src/services/mockData.ts` | Tầng Dữ liệu Mẫu | Định nghĩa TypeScript interface `Book`, mảng danh mục `CATEGORIES` và danh sách 6 cuốn sách mẫu `MOCK_BOOKS`. | `src/pages/*`, `src/components/book/BookCard.tsx` | Đã xác minh | Dữ liệu in-memory, reset mỗi khi tải lại trang web. |
| `src/contexts/ThemeContext.tsx` | Quản lý Theme | Khởi tạo `ThemeContext`, quản lý state `'light' \| 'dark'`, ghi đè class `.dark` lên thẻ `<html>`, lưu trữ vào `localStorage('bookchain_theme')`. | `src/index.css`, `src/components/layout/Navbar.tsx` | Đã xác minh | Hoạt động trơn tru, ổn định. |
| `src/contexts/I18nContext.tsx` | Quản lý Ngôn ngữ | Khởi tạo `I18nContext`, cung cấp hàm `t(key, params)` để tra cứu từ điển theo ngôn ngữ hiện tại (`'en' \| 'vi'`), lưu vào `localStorage('bookchain_lang')`. | `src/i18n/*`, `src/components/*`, `src/pages/*` | Đã xác minh | Hỗ trợ fallback về tiếng Anh nếu không tìm thấy key trong tiếng Việt. |
| `src/i18n/en.ts` | Từ điển Tiếng Anh | Chứa 139 chuỗi giao diện tiếng Anh. | `src/i18n/index.ts` | Đã xác minh | Đã đồng bộ đầy đủ key với `vi.ts`. |
| `src/i18n/vi.ts` | Từ điển Tiếng Việt | Chứa 139 chuỗi giao diện tiếng Việt. | `src/i18n/index.ts` | Đã xác minh | Đã đồng bộ đầy đủ key với `en.ts`. |
| `src/i18n/index.ts` | Export I18n | Export đối tượng translations và các kiểu dữ liệu `Language`, `TranslationKey`. | `src/contexts/I18nContext.tsx` | Đã xác minh | Sử dụng keyof typeof en để đảm bảo type safety cho mọi key dịch. |
| `src/lib/` | **Thư mục rỗng** | Dự kiến chứa các module tiện ích (ví dụ: `crypto.ts`, `ipfs.ts`, `ethers.ts`). | - | **Chưa triển khai** | Hiện không có file nào bên trong. |
| `src/styles/` | **Thư mục rỗng** | Dự kiến chứa các file style toàn cục bổ sung. | - | **Chưa triển khai** | Toàn bộ style hiện tập trung tại `src/index.css`. |
