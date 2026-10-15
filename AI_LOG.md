# AI WORK LOG — BOOKCHAIN LIBRARY

## 1. THÔNG TIN CHUNG
- **Ngày thực hiện:** 12/10/2026
- **Kỹ sư thực hiện:** Senior Full-Stack AI Engineer
- **Giai đoạn:** BƯỚC 01: Hoàn thiện tài khoản và nền tảng nghiệp vụ (Accounts, Auth & Core Business Foundation)
- **Hệ quản trị CSDL:** Microsoft SQL Server 2025 (Local instance `localhost`, CSDL `BookChainLibrary`)

---

## 2. KHẢO SÁT BAN ĐẦU & ĐỐI CHIẾU MÃ NGUỒN

### 2.1. Hiện trạng trước khi can thiệp
1. **Frontend:** React 19 + TypeScript + Vite + React Router v7 + Lucide React.
   - Giao diện chuẩn phong cách "Archival Reading Room".
   - Chưa có các trang tài khoản: Không có Login, Register User, User Profile.
   - Trang `/copyright/register` thực chất là form Stepper 5 bước đăng ký bản quyền (chưa phải form đăng ký tài khoản).
   - Chưa có `AuthContext` hoặc cơ chế giao tiếp backend thật.
2. **Backend:** Hoàn toàn chưa có thư mục server, controller hay API endpoint nào.
3. **Database:** CSDL `BookChainLibrary` và script `BookChainLibrary_SQLServer.sql` với 15 bảng đã tồn tại trên SQL Server cục bộ, đã seed 3 vai trò (`READER`, `AUTHOR`, `ADMIN`), số lượng tài khoản người dùng ban đầu là 0.
4. **Các lỗi P0 cấp bách từ tài liệu kiểm toán:**
   - Thiếu script `"start"` trong `package.json`.
   - Các liên kết route bị hỏng (`/author/:id`, `/copyright/record/:id`).

---

## 3. DANH SÁCH TỆP TIN ĐÃ TẠO VÀ CHỈNH SỬA (BƯỚC 01)

### 3.1. Tệp tin tạo mới
1. `.env.example` — Mẫu cấu hình biến môi trường kết nối SQL Server và JWT.
2. `.env` — Cấu hình môi trường phát triển cục bộ (đã đưa vào `.gitignore`).
3. `server/tsconfig.json` — Cấu hình TypeScript cho backend Node.js (NodeNext module).
4. `server/config/env.ts` — Trình nạp và kiểm tra kiểu dữ liệu biến môi trường.
5. `server/types/index.ts` — Định nghĩa TypeScript interfaces (User, Role, Session, AuthorProfile, ApiResponse).
6. `server/db/sqlServer.ts` — Quản lý Connection Pool MSSQL và kiểm tra trạng thái CSDL (`checkDatabaseHealth`).
7. `server/utils/hash.ts` — Hàm băm mật khẩu `bcrypt`, băm token SHA-256, chuẩn hóa email.
8. `server/utils/tokens.ts` — Sinh chuỗi opaque token và ký/giải mã JWT.
9. `server/utils/response.ts` — Chuẩn hóa định dạng phản hồi API (`sendSuccess`, `sendError`).
10. `server/repositories/roleRepository.ts` — Tầng truy cập dữ liệu bảng `dbo.Roles` và `dbo.UserRoles`.
11. `server/repositories/userRepository.ts` — Tầng truy cập dữ liệu bảng `dbo.Users` bằng truy vấn tham số hóa (Parameterized SQL).
12. `server/repositories/sessionRepository.ts` — Tầng truy cập dữ liệu bảng `dbo.Sessions` quản lý phiên và thu hồi.
13. `server/repositories/authorProfileRepository.ts` — Tầng truy cập dữ liệu bảng `dbo.AuthorProfiles`.
14. `server/repositories/bookRepository.ts` — Tầng truy vấn danh sách metadata sách công khai (nhiều tác giả, tệp đính kèm).
15. `server/services/authService.ts` — Xử lý nghiệp vụ đăng ký, đăng nhập, đăng xuất, lấy người dùng hiện tại.
16. `server/services/userService.ts` — Xử lý nghiệp vụ cập nhật hồ sơ và đăng ký bút danh tác giả.
17. `server/middlewares/authMiddleware.ts` — Middleware kiểm tra token và xác thực trạng thái phiên còn hiệu lực trong database.
18. `server/middlewares/roleGuard.ts` — Middleware RBAC kiểm soát quyền truy cập theo vai trò.
19. `server/middlewares/errorHandler.ts` — Bộ xử lý lỗi tập trung an toàn, không rò rỉ stack trace ở production.
20. `server/controllers/authController.ts` — Controller xác thực người dùng.
21. `server/controllers/userController.ts` — Controller hồ sơ cá nhân và tác giả.
22. `server/controllers/healthController.ts` — Controller kiểm tra sức khỏe backend & SQL Server.
23. `server/controllers/testController.ts` — Controller kiểm thử phân quyền RBAC.
24. `server/controllers/bookController.ts` — Controller metadata sách.
25. `server/routes/authRoutes.ts` — Định nghĩa endpoint `/api/auth/*`.
26. `server/routes/userRoutes.ts` — Định nghĩa endpoint `/api/users/*`.
27. `server/routes/healthRoutes.ts` — Định nghĩa endpoint `/api/health`.
28. `server/routes/testRoutes.ts` — Định nghĩa endpoint `/api/test/*`.
29. `server/routes/bookRoutes.ts` — Định nghĩa endpoint `/api/books/*`.
30. `server/app.ts` — Khởi tạo Express app, cấu hình CORS, cookie-parser và gắn router.
31. `server/index.ts` — Điểm khởi chạy HTTP Server và xử lý tắt máy chủ an toàn (graceful shutdown).
32. `tests/api.test.ts` — Bộ 13 bài kiểm thử tích hợp API tự động với Vitest và Supertest.
33. `src/services/api.ts` — Client gọi API type-safe từ giao diện trình duyệt.
34. `src/contexts/AuthContext.tsx` — Context quản lý trạng thái đăng nhập, hồ sơ, và vai trò người dùng.
35. `src/pages/Login.tsx` & `src/pages/Login.css` — Trang Đăng nhập.
36. `src/pages/RegisterAccount.tsx` — Trang Đăng ký tài khoản thành viên.
37. `src/pages/Profile.tsx` & `src/pages/Profile.css` — Trang Quản lý hồ sơ cá nhân & Đăng ký bút danh tác giả.
38. `PROJECT_NOTES.txt` — Tài liệu tổng quan kiến trúc và hướng dẫn chạy hệ thống.
39. `STEP_01_REPORT.txt` — Báo cáo nghiệm thu kết quả Bước 01.

### 3.2. Tệp tin đã chỉnh sửa
1. `.gitignore` — Bổ sung `.env`, `.env.*` để bảo vệ thông tin mật.
2. `package.json` — Bổ sung script `"start": "vite"`, `"server"`, `"server:dev"`, `"dev:all"`, `"test"`, `"test:watch"`; cài đặt các thư viện Express, mssql, bcryptjs, jsonwebtoken, cookie-parser, cors, vitest, supertest.
3. `vite.config.ts` — Cấu hình proxy `/api` chuyển tiếp sang `http://localhost:5000`.
4. `src/main.tsx` — Bổ sung `<AuthProvider>` vào cây component.
5. `src/App.tsx` — Bổ sung các route `/login`, `/register-account`, `/register`, `/profile`, `/author/:id`, `/copyright/record/:id`.
6. `src/components/layout/Navbar.tsx` & `Navbar.css` — Hiển thị huy hiệu người dùng đăng nhập, vai trò tác giả, các nút Đăng nhập / Đăng ký.
7. `src/i18n/en.ts` & `src/i18n/vi.ts` — Bổ sung đầy đủ 36 từ khóa dịch đa ngôn ngữ cho phân hệ tài khoản.

---

## 4. QUYẾT ĐỊNH KỸ THUẬT QUAN TRỌNG (BƯỚC 01)

1. **Lựa chọn Backend Framework:**  
   Sử dụng Express + TypeScript + `mssql` (tedious driver). Đây là lựa chọn tối ưu, tương thích hoàn toàn với hệ sinh thái Node.js của dự án, hỗ trợ connection pooling và parameterized SQL chống SQL injection 100%.
2. **Cơ chế Xác thực (Authentication & Session Security):**  
   Triển khai mô hình kết hợp (Hybrid State-Token Model):
   - Khi đăng nhập thành công, tạo một bản ghi phiên trong bảng `dbo.Sessions` với mã băm SHA-256 (`TokenHash`) và thời hạn hết hạn 7 ngày.
   - Phát hành token ký cho client, thiết lập `HttpOnly` cookie và đồng thời hỗ trợ `Authorization: Bearer <token>`.
   - Mỗi yêu cầu được bảo vệ đều đối chiếu với bảng `dbo.Sessions` để đảm bảo phiên chưa bị thu hồi (`RevokedAt IS NULL`). Khi người dùng đăng xuất, bản ghi trong `dbo.Sessions` được cập nhật `RevokedAt = SYSUTCDATETIME()`.
   - Tuyệt đối không lưu token nhạy cảm trong `localStorage` làm cơ chế xác thực chính thức.
3. **Phân quyền vai trò (Role-Based Access Control):**  
   - Bảng `dbo.UserRoles` liên kết với `dbo.Roles` là nguồn dữ liệu duy nhất xác định quyền.
   - Mặc định mọi người dùng mới được gán quyền `READER`.
   - Đăng ký bút danh tác giả trong `dbo.AuthorProfiles` sẽ tự động cấp thêm quyền `AUTHOR`.
   - Quyền `ADMIN` được bảo vệ nghiêm ngặt, client không thể tự phong quyền bằng cách gửi dữ liệu request body.
4. **Bảo toàn Giao diện & Trải nghiệm:**  
   - Giữ nguyên toàn bộ Design Tokens trong `src/index.css`.
   - Các trang tài khoản mới tuân thủ nghiêm ngặt bảng màu giấy lưu trữ ("Archival Paper"), font chữ có chân `Libre Baskerville`, font đơn cách `Space Mono`.

---

## 5. LỖI ĐÃ GẶP, NGUYÊN NHÂN VÀ CÁCH KHẮC PHỤC (BƯỚC 01)

1. **Lỗi `Login failed for user 'bookchain_dev'` trong lần probe đầu tiên:**
   - *Nguyên nhân:* Mật khẩu trong file `.env` chứa ký tự `#` (`BkChain#2026!SecurePwd`), khiến thư viện nạp biến môi trường coi phần sau `#` là chú thích (comment), dẫn tới mật khẩu bị cắt ngắn thành `BkChain`.
   - *Khắc phục:* Bao bọc giá trị mật khẩu trong dấu ngoặc kép: `DB_PASSWORD="BkChain#2026!SecurePwd"`. Kết nối thành công ngay lập tức.
2. **Lỗi biên dịch TypeScript `TS6133: 'React' is declared but its value is never read`:**
   - *Nguyên nhân:* `tsconfig.app.json` bật cờ `noUnusedLocals: true`, trong khi React 19 sử dụng JSX transform tự động nên việc `import React from 'react'` bị coi là khai báo thừa.
   - *Khắc phục:* Loại bỏ `React` default import khỏi `src/contexts/AuthContext.tsx`, chỉ giữ các named imports cần thiết. Lệnh `npm run build` vượt qua 100%.

---

## 6. KẾT QUẢ KIỂM THỬ THỰC TẾ (BƯỚC 01)

| STT | Lệnh kiểm thử | Mục đích | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| 1 | `npm run lint` | Kiểm tra quy tắc mã nguồn bằng Oxlint | 0 lỗi (0 errors) | **PASS** |
| 2 | `npm run build` | Biên dịch TypeScript và đóng gói Vite | Build thành công bundle ra thư mục `dist/` | **PASS** |
| 3 | `npm run test` | 13 bài kiểm thử API tích hợp tự động với Vitest | 13/13 test cases PASSED (100%) | **PASS** |
| 4 | SQL Server Query Verification | Kiểm tra bản ghi thật trong CSDL `BookChainLibrary` | Bản ghi người dùng, vai trò, phiên và hồ sơ tác giả đã ghi nhận chính xác | **PASS** |
| 5 | Browser Subagent E2E Flow | Kiểm thử giao diện luồng đăng ký, hồ sơ, đổi theme/ngôn ngữ | Hoàn thành toàn bộ luồng, hiển thị đúng huy hiệu tác giả, theme chuyển đổi chuẩn | **PASS** |

---

## 7. TIẾP TỤC BƯỚC 02: QUẢN LÝ SÁCH & NỀN TẢNG ĐỌC SỐ (BOOK MANAGEMENT & DIGITAL READING FOUNDATION)

### 7.1. Khảo sát hiện trạng & Yêu cầu Bước 02
1. **Mục tiêu:**
   - Thay thế toàn bộ mock data trong quản lý sách bằng dữ liệu SQL Server thực tế (`dbo.Books`, `dbo.BookAuthors`, `dbo.BookFiles`).
   - Xây dựng tầng lưu trữ tệp trừu tượng (Storage Layer) với `LocalStorageProvider`, hỗ trợ tính SHA-256 từ chuỗi byte nhị phân thực tế của tệp nhận được.
   - Kiểm soát phiên bản tệp (`VersionNumber` tăng tiến, chỉ 1 bản ghi `IsCurrent = 1` mỗi sách).
   - Kiểm soát quyền truy cập tệp nhị phân (`PRIVATE`, `PUBLIC_READ`, `PUBLIC_DOWNLOAD`) tại backend.
   - Tích hợp Modal Reader PDF trực tuyến phong cách "Archival Reading Room" và công cụ Verify SHA-256 thời gian thực.
2. **Đối chiếu Schema SQL Server:**
   - Bảng `dbo.Books`: `BookId` (PK, INT IDENTITY), `Title` (NVARCHAR(255)), `Description` (NVARCHAR(MAX)), `CoverUrl` (NVARCHAR(500)), `LanguageCode` (VARCHAR(10)), `PublicationStatus` (VARCHAR(20) DEFAULT 'DRAFT').
   - Bảng `dbo.BookAuthors`: `BookAuthorId` (PK), `BookId` (FK), `AuthorProfileId` (FK), `ContributionRole` (VARCHAR(30) DEFAULT 'PRIMARY_AUTHOR'), `DisplayOrder` (INT).
   - Bảng `dbo.BookFiles`: `FileId` (PK), `BookId` (FK), `VersionNumber` (INT), `FileFormat` (VARCHAR(10)), `FileSizeBytes` (BIGINT), `StorageProvider` (VARCHAR(20)), `StorageKey` (NVARCHAR(500)), `Sha256Hash` (CHAR(64)), `AccessLevel` (VARCHAR(20)), `IsCurrent` (BIT), `CreatedAt` (DATETIME2).

### 7.2. Các tệp tin đã tạo và chỉnh sửa trong Bước 02

#### A. Tệp tin tạo mới:
1. `server/services/storage/storageProvider.ts` — Giao diện trừu tượng `IStorageProvider` và kiểu dữ liệu `StoredFileResult`, `VerifiedFileResult`.
2. `server/services/storage/localStorageProvider.ts` — Lớp triển khai lưu trữ cục bộ: tạo Safe File Key `YYYYMMDD_<uuid>.<ext>`, chặn Path Traversal, tính mã băm SHA-256 bằng byte stream thực tế của tệp, đọc byte stream, đối soát tính toàn vẹn trên đĩa.
3. `server/middlewares/uploadMiddleware.ts` — Cấu hình Multer nhận multipart/form-data, giới hạn 50MB, kiểm tra định dạng PDF/EPUB/TXT.
4. `server/repositories/bookFileRepository.ts` — Tầng truy cập dữ liệu bảng `dbo.BookFiles`: truy vấn phiên bản, giao dịch cập nhật phiên bản mới tăng tiến và thiết lập `IsCurrent = 1` an toàn.
5. `server/services/bookService.ts` — Tầng nghiệp vụ sách: CRUD sách, kiểm tra quyền sở hữu IDOR (User -> AuthorProfile -> BookAuthors), chuyển đổi trạng thái xuất bản, thêm đồng tác giả, quản lý tệp và kiểm soát luồng đọc/tải tệp theo AccessLevel.
6. `server/db/seedBooks.ts` — Script tạo dữ liệu sách mẫu với file PDF thực tế và tính hash SHA-256 thật lưu vào SQL Server.
7. `tests/step02_books.test.ts` — Bộ 22 bài kiểm thử tự động toàn diện cho Bước 02 (tạo sách, xác thực tác giả, chặn IDOR, upload file thật, kiểm soát phiên bản, đối soát byte hash, kiểm tra quyền PRIVATE/PUBLIC_READ/PUBLIC_DOWNLOAD).
8. `STEP_02_REPORT.txt` — Báo cáo nghiệm thu chi tiết Bước 02.

#### B. Tệp tin đã chỉnh sửa:
1. `server/config/env.ts` — Thêm cấu hình biến môi trường lưu trữ `STORAGE_DRIVER`, `STORAGE_LOCAL_PATH`, `MAX_UPLOAD_SIZE_MB`.
2. `server/types/index.ts` — Bổ sung các DTO và entity: `BookRecord`, `BookAuthorRecord`, `BookFileRecord`, `PublicationStatus`, `ContributionRole`, `AccessLevel`.
3. `server/repositories/bookRepository.ts` — Mở rộng truy vấn danh mục, chi tiết sách, tạo sách với Primary Author trong Transaction, kiểm tra quyền tác giả `isUserBookAuthor`, thêm đồng tác giả.
4. `server/repositories/authorProfileRepository.ts` — Bổ sung alias method `getByUserId` tương thích.
5. `server/middlewares/authMiddleware.ts` — Bổ sung middleware `optionalAuth` cho các endpoint công khai nhưng cần nhận diện người dùng nếu đã đăng nhập.
6. `server/controllers/bookController.ts` — Triển khai đầy đủ các handler: tra cứu, chi tiết, tạo sách, cập nhật, đổi trạng thái, thêm đồng tác giả, upload file, đọc file (stream inline), tải file (attachment), đối soát SHA-256 trên đĩa, tra cứu Sổ cái theo hash.
7. `server/routes/bookRoutes.ts` — Đăng ký các route bảo vệ và công khai cho phân hệ sách và tệp phiên bản.
8. `src/services/api.ts` — Bổ sung client `booksApi` với đầy đủ các phương thức type-safe cho frontend.
9. `src/components/book/BookCard.tsx` — Cập nhật hiển thị sách thật, tác giả thật, cover thật, huy hiệu mã băm SHA-256 thật.
10. `src/pages/Discover.tsx` — Chuyển đổi hoàn toàn sang lấy danh mục sách thật từ backend, tìm kiếm, lọc ngôn ngữ, trạng thái rỗng và xử lý lỗi.
11. `src/pages/BookDetail.tsx` & `BookDetail.css` — Tích hợp Modal PDF Reader trực tiếp, trình chuyển đổi phiên bản, tải sách có kiểm soát quyền, hiển thị SHA-256 thật và nút đối soát SHA-256 trên đĩa máy chủ.
12. `src/pages/Verify.tsx` — Chuyển đổi logic kiểm tra băm: tính SHA-256 từ byte tệp thật bằng Web Crypto API phía trình duyệt, tra cứu bản ghi sách trên SQL Server qua backend, đối soát toàn vẹn với file lưu trữ máy chủ.
13. `src/pages/Profile.tsx` & `Profile.css` — Bổ sung khu vực Quản lý Tác phẩm dành cho tác giả: xem danh sách sách cá nhân, Modal tạo sách mới, Modal tải lên phiên bản tệp mới (chọn AccessLevel), Modal thêm đồng tác giả, nút chuyển đổi trạng thái xuất bản.
14. `package.json` — Cài đặt `multer`, `@types/multer`; cập nhật test script `--fileParallelism=false` để chạy tuần tự các test suite tránh xung đột dữ liệu kiểm thử.
15. `PROJECT_NOTES.txt` — Cập nhật toàn bộ kiến trúc, danh sách API, và hướng dẫn vận hành Bước 02.

### 7.3. Các quyết định kỹ thuật quan trọng trong Bước 02
1. **Tính SHA-256 từ chuỗi byte nhị phân thực tế:**
   - Backend tính toán mã băm SHA-256 bằng `crypto.createHash('sha256')` trực tiếp trên chuỗi byte của tệp nhận được từ stream `fs.createReadStream`.
   - Tuyệt đối không tin mã hash do client gửi lên trong request body khi lưu trữ hồ sơ.
   - Mã băm được chuẩn hóa dưới dạng chuỗi hexa 64 ký tự chữ thường (`lowercase`) để đối soát nhất quán.
2. **Kiểm soát phiên bản tệp và tính nhất quán (ACID Transaction):**
   - Mọi thao tác tải lên tệp mới đều thực thi trong một `sql.Transaction`.
   - Truy vấn `ISNULL(MAX(VersionNumber), 0) + 1` để tăng số phiên bản tự động.
   - Cập nhật toàn bộ các bản ghi tệp cũ của sách đó thành `IsCurrent = 0` trước khi chèn bản ghi mới với `IsCurrent = 1`.
   - Đảm bảo trong mọi thời điểm chỉ có duy nhất một phiên bản hiện hành cho mỗi cuốn sách.
3. **Phân quyền và bảo mật tệp nhị phân (IDOR & Access Control):**
   - Chặn IDOR: kiểm tra quan hệ `User -> AuthorProfile -> BookAuthors` trước khi cho phép cập nhật thông tin sách, đổi trạng thái hoặc tải phiên bản mới.
   - Endpoint `/api/books/:id/files/:fileId/read`: Trả về `Content-Type: application/pdf` và `Content-Disposition: inline`. Với tệp `PRIVATE`, chỉ tác giả và admin được đọc.
   - Endpoint `/api/books/:id/files/:fileId/download`: Thiết lập `Content-Disposition: attachment`. Nếu tệp là `PUBLIC_READ`, hệ thống trả về mã lỗi HTTP 403 đối với độc giả thông thường, thông báo rõ ràng tệp chỉ được phép đọc trực tuyến và không được tải file gốc.
4. **Đối soát tính toàn vẹn (Integrity Verification API):**
   - Cung cấp endpoint GET `/api/books/:id/files/:fileId/verify`.
   - Khi được gọi, máy chủ mở tệp nhị phân trên đĩa, tính toán lại mã SHA-256 và so khớp với trường `Sha256Hash` lưu trong CSDL `dbo.BookFiles`.
   - Nếu tệp bị sửa đổi byte trên ổ đĩa, API lập tức phản hồi `verified: false`, chỉ ra sự không khớp mã băm để cảnh báo gian lận.

### 7.4. Kết quả kiểm thử thực tế (Toàn bộ Bước 01 + Bước 02)

| STT | Lệnh kiểm thử | Mục đích | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| 1 | `npm run test` | 35 bài kiểm thử tích hợp API (13 Bước 01 + 22 Bước 02) | 35/35 test cases PASSED (100%) | **PASS** |
| 2 | `npm run lint` | Kiểm tra quy tắc mã nguồn bằng Oxlint | 0 lỗi (0 errors) | **PASS** |
| 3 | `npm run build` | Biên dịch TypeScript và đóng gói Vite | Build thành công bundle ra thư mục `dist/` | **PASS** |
| 4 | Database Verification | Kiểm tra bảng `dbo.Books`, `dbo.BookAuthors`, `dbo.BookFiles` | Ghi nhận chính xác sách thật, quan hệ tác giả, phiên bản tệp và SHA-256 | **PASS** |
| 5 | Seed Verification | Nạp 3 tác phẩm kinh điển mẫu có file PDF thật | 3 cuốn sách, 3 file PDF, SHA-256 hợp lệ đã lưu vào SQL Server | **PASS** |

### 7.5. Kế hoạch tiếp theo
- Triển khai Bước 02.1: Admin Bootstrap & Author Invitation System.

---

## 8. BƯỚC 02.1: ADMIN BOOTSTRAP & AUTHOR INVITATION SYSTEM

### 8.1. Khảo sát ban đầu trước khi sửa code
1. **Vai trò trong Database:**
   - Đã kiểm tra thực tế bảng `dbo.Roles`: Tồn tại 3 vai trò `READER` (RoleId: 1), `AUTHOR` (RoleId: 2), `ADMIN` (RoleId: 3).
2. **Tài khoản ADMIN thực tế:**
   - Truy vấn `dbo.UserRoles` liên kết với `RoleId = 3` (ADMIN) ban đầu trả về `[]` (0 tài khoản). CSDL ban đầu chưa có bất kỳ tài khoản nào được cấp quyền ADMIN.
3. **Cơ chế cấp quyền khi đăng ký:**
   - Đã kiểm tra `server/services/authService.ts`: Người dùng đăng ký mới luôn được gán mặc định duy nhất vai trò `READER`. Không có backdoor tự cấp quyền ADMIN hay AUTHOR từ request client.
4. **Cơ chế xác thực và AuthContext:**
   - `authController.login` và `authController.me` truy vấn quyền từ `dbo.UserRoles JOIN dbo.Roles` qua `roleRepository.getRolesForUser`.
   - Frontend `AuthContext` lấy danh sách roles thật từ API, không phụ thuộc client storage để quyết định quyền hạn.
5. **Middleware phân quyền ADMIN:**
   - Đã có sẵn `requireRole('ADMIN')` trong `server/middlewares/roleGuard.ts`, trả về HTTP 403 Forbidden nếu thiếu quyền.
6. **Bảng dữ liệu mã mời:**
   - Kiểm tra CSDL thực tế: Chưa có bảng nào về Invitations (`AuthorInvitations`, `InvitationUses`). Cần tạo migration SQL tăng tiến an toàn.
7. **Giao diện hiện tại:**
   - Chưa có trang `/admin` hoặc giao diện quản trị Admin Dashboard.
   - Navbar chưa có liên kết Admin Dashboard cho vai trò ADMIN.
   - Trang `/profile` ban đầu cho phép mọi tài khoản điền form Author Credentials trực tiếp; đã được nâng cấp để độc giả thông thường (READER) phải nhập mã mời hợp lệ mới được cấp quyền AUTHOR.

### 8.2. Các tệp tin đã tạo và chỉnh sửa trong Bước 02.1

#### A. Tệp tin tạo mới:
1. `server/db/migrations/001_create_invitations.sql` — Script SQL Migration tạo các bảng `dbo.AuthorInvitations` và `dbo.InvitationUses` kèm ràng buộc khóa ngoại, chỉ mục tìm kiếm và kiểm tra tồn tại an toàn (`IF NOT EXISTS`).
2. `server/db/runMigration.ts` — Trình thực thi migration tự động trên SQL Server, tích hợp lệnh npm `npm run db:migrate`.
3. `server/scripts/bootstrapAdmin.ts` — Kịch bản CLI an toàn để nâng cấp người dùng thành ADMIN theo email: chuẩn hóa email, kiểm tra role ADMIN trong CSDL, đảm bảo idempotent không tạo trùng bản ghi `dbo.UserRoles`.
4. `server/repositories/invitationRepository.ts` — Tầng dữ liệu tương tác với `dbo.AuthorInvitations` và `dbo.InvitationUses`: tạo mã mời, thu hồi, phân trang danh sách kèm thống kê và transaction đổi mã với khóa dòng `WITH (UPDLOCK, ROWLOCK)` ngăn chặn race condition.
5. `server/services/invitationService.ts` — Tầng nghiệp vụ mã mời: sinh mã CSPRNG ngẫu nhiên (`BKC-XXXX-YYYY-ZZZZ`), băm SHA-256 (`CodeHash`), xác thực thời hạn, trạng thái, số lượt sử dụng, liên kết đổi mã và cấp quyền tác giả `AUTHOR`.
6. `server/controllers/adminController.ts` — Controller cho Quản trị viên: lấy danh sách mã mời (kèm phân trang), tạo mã mới (trả về mã thô một lần duy nhất), thu hồi mã mời.
7. `server/controllers/invitationController.ts` — Controller cho người dùng: đổi mã mời (`redeemInvitation`) nâng quyền lên AUTHOR.
8. `server/routes/adminRoutes.ts` — Khai báo các route quản trị (`GET /api/admin/invitations`, `POST /api/admin/invitations`, `PATCH /api/admin/invitations/:id/revoke`), bảo vệ bởi `authenticateToken` và `requireRole('ADMIN')`.
9. `server/routes/invitationRoutes.ts` — Khai báo route đổi mã (`POST /api/invitations/redeem`), bảo vệ bởi `authenticateToken`.
10. `src/pages/AdminDashboard.tsx` & `src/pages/AdminDashboard.css` — Trang Bảng điều khiển Quản trị: thống kê số lượng mã mời, biểu mẫu tạo mã mời với hạn sử dụng và số lượt, modal sao chép mã an toàn, danh sách mã mời với huy hiệu trạng thái và nút thu hồi.
11. `tests/step02_1_invitations.test.ts` — Bộ 19 bài kiểm thử tích hợp tự động cho Bước 02.1: xác thực bootstrap idempotent, kiểm tra RBAC 401/403, kiểm tra tính entropy mã CSPRNG, kiểm tra không lộ chuỗi gốc hay hash trong danh sách, kiểm tra từ chối mã sai/hết hạn/thu hồi/hết lượt, chống race condition và bảo toàn quyền ADMIN khi đổi mã.
12. `STEP_02_1_REPORT.txt` — Báo cáo nghiệm thu chi tiết Bước 02.1.

#### B. Tệp tin đã chỉnh sửa:
1. `server/types/index.ts` — Bổ sung các DTO và entity: `AuthorInvitationRecord`, `InvitationUseRecord`, `InvitationStatus`, `AuthorInvitationDto`, `CreateInvitationResultDto`.
2. `server/app.ts` — Đăng ký các router `/api/admin` và `/api/invitations`.
3. `src/services/api.ts` — Bổ sung API client `adminApi` và `invitationsApi` với kiểu dữ liệu TypeScript chặt chẽ.
4. `src/i18n/en.ts` & `src/i18n/vi.ts` — Bổ sung đầy đủ chuỗi ngôn ngữ cho Bảng điều khiển Quản trị và chức năng Nhập mã mời tác giả.
5. `src/components/layout/Navbar.tsx` & `Navbar.css` — Bổ sung huy hiệu và liên kết tới trang Quản trị (`/admin`) khi người dùng có vai trò `ADMIN`.
6. `src/pages/Profile.tsx` — Nâng cấp giao diện hồ sơ: độc giả READER thấy hộp nhập mã mời tác giả; khi đổi thành công tự động làm mới AuthContext và chuyển sang giao diện tác giả AUTHOR.
7. `src/App.tsx` — Đăng ký route `/admin` cho `AdminDashboard`.
8. `package.json` — Bổ sung các lệnh npm: `db:migrate`, `bootstrap:admin`.
9. `PROJECT_NOTES.txt` — Cập nhật toàn bộ kiến trúc, hướng dẫn phân quyền và vận hành Bước 02.1.

### 8.3. Các quyết định kỹ thuật quan trọng trong Bước 02.1
1. **Bảo mật sinh mã và lưu trữ (Zero Raw Code Storage):**
   - Sinh mã bằng Node.js `crypto.randomBytes(6)` tạo ra chuỗi định dạng `BKC-XXXX-YYYY-ZZZZ` (độ dài 16 ký tự, 48-bit entropy mật mã).
   - Mã thô CHỈ được trả về duy nhất một lần tại phản hồi HTTP của lệnh tạo mã (`POST /api/admin/invitations`).
   - CSDL SQL Server bảng `dbo.AuthorInvitations` chỉ lưu trữ chuỗi mã băm `CodeHash` dạng SHA-256 (64 ký tự hex).
   - Khi truy vấn danh sách (`GET /api/admin/invitations`), cả mã thô lẫn `CodeHash` đều KHÔNG được trả về frontend để phòng ngừa lộ lọt dữ liệu.
2. **Khóa dòng và chống chạy đua khi đổi mã (Concurrency Control & UPDLOCK):**
   - Nghiệp vụ đổi mã thực hiện trong một Transaction với gợi ý khóa `WITH (UPDLOCK, ROWLOCK)` trên SQL Server:
     ```sql
     SELECT TOP 1 * FROM dbo.AuthorInvitations WITH (UPDLOCK, ROWLOCK) WHERE CodeHash = @CodeHash
     ```
   - Cơ chế này ngăn chặn race condition khi nhiều request đồng thời cố gắng đổi cùng một mã mời có số lượt giới hạn (`MaxUses`).
   - Sau khi kiểm tra `UsedCount < MaxUses`, hệ thống tăng `UsedCount += 1`, cập nhật trạng thái `EXHAUSTED` nếu đạt ngưỡng, ghi nhật ký vào `dbo.InvitationUses` và thêm vai trò `AUTHOR` vào `dbo.UserRoles` trong cùng transaction an toàn.
3. **Quy trình Bootstrap ADMIN An toàn (Manual CLI Bootstrap):**
   - Tuyệt đối không tạo API HTTP công khai để gán quyền ADMIN.
   - Không tự động nâng quyền trong mỗi lần server khởi động.
   - Quản trị viên hệ thống chạy lệnh CLI: `npm run bootstrap:admin -- <email>`.
   - Script chuẩn hóa email, tìm kiếm trong `dbo.Users`, kiểm tra `dbo.UserRoles`, nếu đã là ADMIN thì báo trạng thái an toàn và không tạo bản ghi trùng lặp.

### 8.4. Lỗi đã gặp và cách khắc phục trong Bước 02.1
1. **Lỗi `AssertionError: expected 201 to be 400` trong bài test C4:**
   - *Nguyên nhân:* Tại `invitationService.ts`, biểu thức `const days = Number(input.expiresInDays) || 30;` dẫn đến trường hợp client gửi `{ expiresInDays: 0 }` thì `0` là falsy nên biểu thức rơi về mặc định `30`, không kích hoạt được điều kiện kiểm tra `days < 1`.
   - *Khắc phục:* Đổi sang kiểm tra rõ ràng `input.expiresInDays !== undefined && input.expiresInDays !== null ? Number(input.expiresInDays) : 30;` và tương tự cho `maxUses`. Kết quả: Lỗi 400 được kích hoạt chuẩn xác, toàn bộ test suite vượt qua.

### 8.5. Kết quả kiểm thử thực tế (Toàn bộ Bước 01, Bước 02 và Bước 02.1)

| STT | Lệnh kiểm thử | Mục đích | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| 1 | `npm run db:migrate` | Chạy migration SQL Server tạo bảng mã mời | Thực thi thành công `001_create_invitations.sql` | **PASS** |
| 2 | `npm run bootstrap:admin -- minhtri@bookchain.io` | Gán vai trò ADMIN đầu tiên qua CLI | Gán thành công vai trò ADMIN cho `minhtri@bookchain.io` (Idempotent) | **PASS** |
| 3 | `npm run test` | Toàn bộ 54 bài kiểm thử tích hợp (13 Step 01 + 22 Step 02 + 19 Step 02.1) | 54/54 test cases PASSED (100%) | **PASS** |
| 4 | `npm run lint` | Kiểm tra quy tắc mã nguồn bằng Oxlint | 0 lỗi (0 errors) | **PASS** |
| 5 | `npm run build` | Biên dịch TypeScript và đóng gói Vite | Đóng gói thành công bundle ra thư mục `dist/` | **PASS** |
| 6 | Database Verification | Kiểm tra bảng `dbo.AuthorInvitations`, `dbo.InvitationUses`, `dbo.UserRoles` | Ghi nhận chính xác mã mời, mã băm SHA-256, lượt sử dụng và quyền ADMIN/AUTHOR | **PASS** |

---

## 9. BƯỚC 03: SMART CONTRACT & BLOCKCHAIN COPYRIGHT REGISTRY

### 9.1. Khảo sát ban đầu & Kiểm tra kỹ thuật
1. **Kiểm tra skill:**
   - Đã khảo sát `.gemini/skills`: Chỉ có skill `impeccable`. Không có skill Solidity hay Web3 tùy chỉnh.
   - Tuân thủ quy tắc 2.1: Ghi nhận không có skill blockchain có sẵn, áp dụng quy trình phát triển smart contract an toàn, tiêu chuẩn công nghiệp (Hardhat + OpenZeppelin).
2. **Khảo sát mã nguồn & tính toán SHA-256 hiện tại:**
   - SHA-256 được tính từ byte nội dung file thực tế tại `server/services/storage/localStorageProvider.ts` bằng Node.js `crypto.createHash('sha256')`.
   - Kết quả băm được lưu trong bảng `dbo.BookFiles.Sha256` dưới dạng chuỗi hex 64 ký tự (`CHAR(64)`).
   - Frontend trang `/verify` tính toán bằng Web Crypto API `window.crypto.subtle.digest('SHA-256')`.
3. **Mô hình ánh xạ sang Blockchain:**
   - Chuẩn hóa SHA-256 sang `bytes32`: Chuỗi 64 ký tự hex được thêm tiền tố `0x` và chuẩn hóa lowercase thành chính xác 32 bytes (`bytes32`) trong Solidity.
   - Tuyệt đối không thay thế bằng `keccak256` hoặc băm gián tiếp.
   - Định danh `recordId` và `bookId` ánh xạ từ SQL Server UUID sang `bytes32` qua hàm tiện ích `uuidToBytes32`.
4. **Công cụ Blockchain đã chọn:**
   - Hardhat 2.29.1 (LTS tương thích tối ưu) cùng `@nomicfoundation/hardhat-toolbox@^5.0.0` và `@openzeppelin/contracts@^5.6.1`.

### 9.2. Danh sách tệp tin đã tạo và chỉnh sửa (Bước 03)

#### A. Tệp tin tạo mới:
1. `contracts/BookCopyrightRegistry.sol` — Smart contract lưu trữ bản ghi bản quyền số, liên kết phiên bản, bảo vệ quyền tác giả, kiểm tra trùng lặp và tra cứu băm SHA-256. Kế thừa `AccessControl` và `Pausable` từ OpenZeppelin v5.
2. `hardhat.config.cjs` — Cấu hình Hardhat với Solidity 0.8.28 (optimizer 200 runs), mạng hardhat (31337), localhost (8545), và Sepolia (11155111) tích hợp biến môi trường an toàn.
3. `vitest.config.ts` — Cấu hình Vitest phân tách phạm vi kiểm thử ứng dụng (`tests/**/*.test.ts`) độc lập với Hardhat Mocha tests.
4. `test/contracts/BookCopyrightRegistry.test.cjs` — Bộ 29 bài kiểm thử đơn vị Smart Contract bao phủ toàn bộ 14 trường hợp bắt buộc và các trường hợp bảo mật biên.
5. `scripts/deploy.cjs` — Kịch bản triển khai hợp đồng thông minh, ghi nhận Contract Address, Transaction Hash, Block Number, Chain ID và tự động cập nhật metadata sang frontend/backend.
6. `scripts/interact.cjs` — Kịch bản tương tác minh họa toàn bộ vòng đời on-chain: deploy, đăng ký bản quyền v1, xác minh `verifyHash`, tra cứu `getCopyright`, đăng ký phiên bản v2 độc lập, khiếu nại (dispute) và giải quyết khiếu nại (resolve).
7. `scripts/exportArtifacts.cjs` — Kịch bản xuất ABI và TypeScript metadata tự động sang thư mục `server/contracts` và `src/contracts`.
8. `server/contracts/BookCopyrightRegistry.json` & `BookCopyrightRegistry.ts` — ABI và Type-safe const metadata cho backend.
9. `src/contracts/BookCopyrightRegistry.json` & `BookCopyrightRegistry.ts` — ABI và Type-safe const metadata cho frontend.
10. `server/blockchain/utils.ts` — Thư viện tiện ích chuyển đổi `sha256ToBytes32`, `bytes32ToSha256`, `uuidToBytes32`, `stringIdToBytes32`.
11. `src/utils/blockchain.ts` — Tiện ích blockchain phía client (`sha256ToBytes32`, `bytes32ToSha256`, `shortenAddress`, `uuidToBytes32`).
12. `tests/step03_blockchain_utils.test.ts` — Bộ 7 bài kiểm thử Vitest kiểm tra tính toàn vẹn và nhất quán của các tiện ích mật mã.
13. `project_documentation/STEP_04_INTEGRATION_SPEC.md` — Tài liệu đặc tả kỹ thuật chi tiết chuẩn bị tích hợp Bước 04 (ánh xạ dữ liệu, máy trạng thái giao dịch, chống gửi trùng lặp và đối soát phục hồi).
14. `STEP_03_REPORT.txt` — Báo cáo nghiệm thu kết quả Bước 03.

#### B. Tệp tin đã chỉnh sửa:
1. `package.json` — Bổ sung các lệnh npm: `contracts:compile`, `contracts:test`, `contracts:node`, `contracts:deploy:local`, `contracts:deploy:sepolia`; cài đặt `hardhat`, `@nomicfoundation/hardhat-toolbox`, `@openzeppelin/contracts`.
2. `.env.example` — Bổ sung mẫu cấu hình biến môi trường Sepolia (`SEPOLIA_RPC_URL`, `SEPOLIA_PRIVATE_KEY`).
3. `.gitignore` — Bổ sung các mẫu bỏ qua thư mục cache và artifacts của Hardhat (`cache`, `artifacts`, `typechain`, `storage/books/*`).
4. `PROJECT_NOTES.txt` — Cập nhật toàn bộ kiến trúc blockchain, hợp đồng thông minh, quy tắc phân quyền, hướng dẫn vận hành và thông tin triển khai Bước 03.

### 9.3. Lỗi phát sinh và cách giải quyết (Bước 03)
1. **Xung đột phiên bản Hardhat 3 và Toolbox:**
   - *Nguyên nhân:* Lệnh `npm install hardhat` cài phiên bản thử nghiệm Hardhat 3 không tương thích với `@nomicfoundation/hardhat-toolbox`.
   - *Khắc phục:* Cài đặt phiên bản tiêu chuẩn công nghiệp ổn định `hardhat@^2.22.18` và `@nomicfoundation/hardhat-toolbox@^5.0.0`.
2. **Xung đột runner kiểm thử giữa Vitest và Hardhat Mocha:**
   - *Nguyên nhân:* Vitest quét mặc định toàn bộ file `**/*.test.*`, cố gắng chạy file test Mocha của Hardhat và báo lỗi `ReferenceError: describe is not defined`.
   - *Khắc phục:* Tạo file `vitest.config.ts` cô lập phạm vi kiểm thử Vitest strictly tại `tests/**/*.test.ts`, đồng thời cấu hình `paths.tests: "./test/contracts"` trong `hardhat.config.cjs` cho Hardhat Mocha.
3. **Lỗi TypeScript khi build cấu hình Vite:**
   - *Nguyên nhân:* Khai báo trường `test` trực tiếp trong `vite.config.ts` gây lỗi kiểu `TS2769: Object literal may only specify known properties, and 'test' does not exist in type 'UserConfigExport'`.
   - *Khắc phục:* Tách cấu hình test sang `vitest.config.ts` riêng biệt sử dụng `defineConfig` từ `vitest/config`, giữ `vite.config.ts` hoàn toàn sạch cho Vite client bundle.

### 9.4. Kết quả kiểm thử thực tế (Toàn bộ Bước 01, 02, 02.1 và 03)

| STT | Lệnh kiểm thử | Mục đích | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| 1 | `npm run contracts:compile` | Biên dịch Smart Contract bằng Solc 0.8.28 | Compiled 7 Solidity files successfully (evm target: paris) | **PASS** |
| 2 | `npm run contracts:test` | Bộ 29 unit tests Smart Contract (14 ca bắt buộc + edge cases) | 29/29 test cases PASSED (100%) | **PASS** |
| 3 | `npm run test` | Bộ 61 bài kiểm thử tích hợp hệ thống (Vitest) | 61/61 test cases PASSED (100%) | **PASS** |
| 4 | `npm run lint` | Kiểm tra quy tắc mã nguồn bằng Oxlint | 0 lỗi (0 errors) | **PASS** |
| 5 | `npm run build` | Biên dịch TypeScript và đóng gói Vite | Đóng gói thành công bundle ra thư mục `dist/` | **PASS** |
| 6 | `npm run contracts:deploy:local` | Triển khai hợp đồng lên mạng Hardhat local | Deployed tại địa chỉ `0x5FbDB2315678afecb367f032d93F642f64180aa3` (Block 1) | **PASS** |
| 7 | `npx hardhat run scripts/interact.cjs` | Tương tác toàn diện: deploy, register v1, verifyHash, register v2, dispute, resolve | 100% các cuộc gọi đọc/ghi on-chain thành công | **PASS** |
| 8 | Sepolia Testnet Assessment | Đánh giá điều kiện triển khai Sepolia | Đã chuẩn bị đầy đủ cấu hình và kịch bản; chưa triển khai do thiếu RPC/ETH testnet | **Hoàn thành Local, Chưa deploy Sepolia** |

---

## 10. BƯỚC 03.1: KIỂM TRA VÀ HOÀN THIỆN KẾT NỐI METAMASK (HARDHAT LOCAL)

### 10.1. Nguyên nhân gốc rễ khiến nút Connect Wallet không phản hồi
1. **Nút bấm không có trình xử lý sự kiện (Unattached DOM Handler):**
   - Trong `src/components/layout/Navbar.tsx` (dòng 115-118), phần tử `<button className="nav-action-wallet flex items-center gap-2">` hoàn toàn không có thuộc tính `onClick`. Nút chỉ là một thẻ tĩnh hiển thị chữ và icon, không kích hoạt bất kỳ logic JavaScript nào khi người dùng nhấn chuột.
2. **Thiếu tầng State/Context quản lý ví Web3 (No Wallet Context):**
   - Trong `src/contexts/`, dự án chỉ có `AuthContext`, `I18nContext`, và `ThemeContext`. Chưa từng có `WalletContext` để quản lý `window.ethereum`, trạng thái tài khoản, chain ID, hay sự kiện chuyển mạng/đổi ví.
3. **Mã máy Smart Contract trên Node Local bị reset khi Node khởi động lại:**
   - Tiến trình `npm run contracts:node` đang chạy trên cổng 8545 là một phiên bản node mới khởi động. Khi kiểm tra thực tế bằng `eth_getCode` trên địa chỉ `0x5FbDB2315678afecb367f032d93F642f64180aa3`, kết quả trả về `0x` (rỗng), do in-memory state của Hardhat node bị xóa khi restart.
   - *Khắc phục:* Đã chạy ngay `npm run contracts:deploy:local` lên mạng `localhost` (Chain ID 31337). Mã máy đã được triển khai đầy đủ (độ dài bytecode: 14,494 hex chars) và hàm `totalRecords()` trả về kết quả thành công.

### 10.2. Các tệp tin đã tạo và chỉnh sửa
1. **Tạo mới:**
   - `src/types/ethereum.d.ts` — Khai báo kiểu dữ liệu TypeScript an toàn cho `window.ethereum` và `EthereumProvider`.
   - `src/contexts/WalletContext.tsx` — Context quản lý toàn diện kết nối MetaMask, chuẩn hóa địa chỉ, phát hiện sai mạng, ngắt kết nối, chuyển mạng sang Hardhat Local (`0x7a69`), dọn dẹp event listeners (`accountsChanged`, `chainChanged`), và tự động xác minh hợp đồng on-chain.
   - `src/components/layout/WalletButton.tsx` — Component nút bấm kết nối thông minh:
     * Trạng thái chưa kết nối: Nút "Kết nối ví" kèm loader chống bấm nhiều lần.
     * Trạng thái sai mạng: Nút cảnh báo màu hổ phách "Sai mạng" cho phép nhấn để chuyển ngay sang Hardhat Local.
     * Trạng thái đã kết nối: Nút hiển thị chấm xanh pulse, địa chỉ rút gọn, kèm dropdown popover xem đầy đủ địa chỉ, trạng thái xác minh hợp đồng trực tiếp, Chain ID và nút ngắt kết nối.
   - `tests/step03_1_wallet.test.ts` — Bộ 9 bài kiểm thử Vitest kiểm tra tiện ích rút gọn địa chỉ, hằng số cấu hình, ABI hợp đồng và kết nối trực tiếp đến node Hardhat Local đang chạy.
   - `WALLET_CONNECTION_REPORT.txt` — Báo cáo nghiệm thu kỹ thuật kết nối ví.
2. **Chỉnh sửa:**
   - `package.json` — Bổ sung `"ethers": "^6.17.0"` vào `dependencies` để phục vụ Vite client bundle.
   - `src/main.tsx` — Bọc `<WalletProvider>` trong cây component ứng dụng.
   - `src/components/layout/Navbar.tsx` — Thay thế nút bấm tĩnh bằng component `<WalletButton />`.
   - `src/components/layout/Navbar.css` — Bổ sung styles cho nút trạng thái kết nối, chấm pulse xanh, dropdown popover và hộp thoại thông tin hợp đồng theo chuẩn thẩm mỹ Archival.
   - `src/i18n/en.ts` & `src/i18n/vi.ts` — Bổ sung 14 từ khóa dịch song ngữ cho phân hệ ví.
   - `PROJECT_NOTES.txt` — Cập nhật tài liệu phân hệ kết nối ví và trạng thái triển khai node local.

### 10.3. Kết quả kiểm thử thực tế
- `npm run test`: **70/70 bài kiểm thử PASSED (100%)** (bao gồm 9 bài test ví mới).
- `npm run contracts:test`: **29/29 bài kiểm thử Smart Contract PASSED (100%)**.
- `npm run lint`: **0 errors**.
- `npm run build`: **Biên dịch TypeScript và Vite bundle thành công 100% (1.29s)**.
- `Live Node & Contract Verification`: Đã gửi lệnh JSON-RPC đến `http://127.0.0.1:8545`, xác nhận Chain ID `31337`, bytecode hợp đồng tại `0x5FbDB2315678afecb367f032d93F642f64180aa3` có kích thước 14,494 ký tự hex và gọi hàm `totalRecords()` thành công.

---

## 11. BƯỚC 04: HOÀN THIỆN TÍCH HỢP BLOCKCHAIN VÀO BOOKCHAIN LIBRARY

### 11.1. Các thay đổi theo từng nhóm
1. **Tầng Blockchain Client & Smart Contract Connector (Backend):**
   - Tạo mới `server/blockchain/contractClient.ts`:
     * Khởi tạo `ethers.JsonRpcProvider` kết nối tới Hardhat Local node `http://127.0.0.1:8545` (Chain ID `31337`).
     * Tự động tải địa chỉ hợp đồng đã triển khai (`0x5FbDB2315678afecb367f032d93F642f64180aa3`) từ `server/contracts/deployedAddresses.json`.
     * Cung cấp các hàm tương tác an toàn: `verifyHash(sha256Hex)`, `getCopyright(recordIdBytes32)`, `hasRole(roleBytes32, account)`, `getTransactionReceipt(txHash)`, `totalRecords()`, và `registerCopyrightViaRegistrar(...)`.
     * Tự động ánh xạ kiểu dữ liệu enum `RecordStatus` từ Solidity (0: ACTIVE, 1: DISPUTED, 2: REVOKED) sang chuỗi trạng thái tiêu chuẩn TypeScript.
2. **Tầng Lưu trữ & Truy vấn CSDL SQL Server (Backend Repository):**
   - Tạo mới `server/repositories/copyrightRepository.ts`:
     * Quản lý bảng `dbo.CopyrightRecords` và `dbo.BlockchainTransactions`.
     * Tự động sinh mã nghiệp vụ chuẩn hóa `RecordNumber` định dạng `BCR-YYYYMMDD-XXXX` theo cơ chế đếm tuần tự an toàn (`WITH (UPDLOCK, HOLDLOCK)`).
     * Ràng buộc tính nhất quán dữ liệu: khóa ngoại phức hợp `(BookId, BookFileId)` đảm bảo tệp bản quyền thuộc đúng cuốn sách.
     * Cập nhật máy trạng thái giao dịch: `QUEUED` -> `PENDING` -> `CONFIRMED` / `FAILED`.
3. **Tầng Nghiệp vụ Bản quyền (Backend Service):**
   - Tạo mới `server/services/copyrightService.ts`:
     * `prepareRegistration`: Xác thực quyền tác giả (`PRIMARY_AUTHOR` hoặc `CO_AUTHOR`) hoặc quyền `ADMIN`. Xác minh tệp tồn tại thực tế trên đĩa và kiểm tra mã băm byte nhị phân SHA-256 khớp 100%. Kiểm tra trước trạng thái on-chain qua `verifyHash()`. Khởi tạo bản ghi `QUEUED` trong CSDL và trả về các tham số đã chuẩn hóa `bytes32` (`recordIdBytes32`, `bookIdBytes32`, `contentHashBytes32`, `authorWallet`, `metadataUri`).
     * `syncTransaction`: Nhận `txHash` từ MetaMask sau khi đào block, kiểm tra biên lai on-chain thực tế bằng JSON-RPC. Nếu thành công (`status === 1`), cập nhật `dbo.BlockchainTransactions` sang `CONFIRMED` kèm `BlockNumber`, cập nhật `dbo.CopyrightRecords` sang `ON_CHAIN`. Nếu revert (`status === 0`), cập nhật `FAILED` có lý do chi tiết.
     * `relayRegistration`: Giải pháp an toàn khi tác giả kết nối ví không có `REGISTRAR_ROLE`: Hệ thống Registrar Relay ký và phát sóng thay mặt tác giả; địa chỉ ví tác giả vẫn được ghi vĩnh viễn vào trường `authorWallet` trên blockchain.
     * `verifyCopyright`: Cung cấp API tra cứu công khai đối chiếu đa nguồn (Cross-check Dual Proof). Nhận diện truy vấn theo SHA-256 (64 hex) hoặc Record ID (UUID / bytes32), đọc dữ liệu trực tiếp từ Smart Contract và đối chiếu với CSDL thư viện.
4. **Tầng HTTP Controller & Routes (Backend API):**
   - Tạo mới `server/controllers/copyrightController.ts` & `server/routes/copyrightRoutes.ts`:
     * `POST /api/copyright/prepare` (Bảo vệ bởi `requireAuth`)
     * `POST /api/copyright/sync` (Bảo vệ bởi `requireAuth`)
     * `POST /api/copyright/relay` (Bảo vệ bởi `requireAuth`)
     * `GET  /api/copyright/books/:bookId/records` (Công khai / Tác giả)
     * `GET  /api/copyright/verify/:query` (Tra cứu công khai)
   - Cập nhật `server/app.ts` đăng ký endpoint `/api/copyright`.
5. **Tầng Frontend & Web3 Context:**
   - Cập nhật `src/contexts/WalletContext.tsx`:
     * Bổ sung `getSigner()`: Trả về `JsonRpcSigner` từ MetaMask `BrowserProvider`.
     * Bổ sung `checkHasRole(role, account)`: Kiểm tra quyền trực tiếp trên contract.
     * Bổ sung `getBrowserProvider()`: Hỗ trợ truy vấn Web3 an toàn.
   - Cập nhật `src/services/api.ts`: Bổ sung API client `copyrightApi` với đầy đủ định nghĩa TypeScript.
   - Tạo mới `src/components/copyright/RegisterCopyrightModal.tsx` & `RegisterCopyrightModal.css`:
     * Modal xem trước đăng ký bản quyền: Hiển thị tiêu đề sách, phiên bản, tên tệp, dung lượng, mã băm SHA-256 thực tế, địa chỉ ví tác giả, địa chỉ hợp đồng và mạng lưới.
     * Nhận diện vai trò `REGISTRAR_ROLE`:
       - Nếu có quyền: Cung cấp nút "Ký & Phát sóng trên MetaMask" trực tiếp.
       - Nếu không có quyền: Giải thích rõ ràng nguyên nhân bảo mật và cung cấp 2 phương án (chuyển sang tài khoản Registrar trong MetaMask hoặc dùng dịch vụ Registrar Relay).
     * Theo dõi vòng đời: REVIEW -> SIGNING (chờ ký MetaMask) -> SYNCING (đồng bộ CSDL) -> SUCCESS (chứng nhận thành công kèm TxHash, số khối và nút xác minh).
   - Nâng cấp `src/pages/BookDetail.tsx`:
     * Tự động tải lịch sử bản quyền của cuốn sách qua `copyrightApi.getByBook(id)`.
     * Bổ sung bảng thông tin "Sổ cái Bản quyền Blockchain (Smart Contract)": hiển thị trạng thái `ON_CHAIN (ACTIVE)`, mã bản ghi `RecordNumber`, `TxHash` rút gọn có nút sao chép, số khối, và nút "Xem chứng chỉ On-Chain".
     * Nút "Đăng ký bản quyền On-chain" hiển thị cho tác giả cuốn sách đối với các phiên bản chưa đưa lên blockchain.
   - Nâng cấp `src/pages/Verify.tsx`:
     * Hỗ trợ 2 chế độ: Xác minh bằng tệp tin (tính SHA-256 qua Web Crypto API) và Tra cứu bằng chuỗi SHA-256 hoặc Record ID.
     * Đọc trực tiếp từ Smart Contract và đối chiếu CSDL.
     * Hiển thị Chứng chỉ Bản quyền Kỹ thuật số (Archival Certificate) với huy hiệu trạng thái xanh ngọc/hổ phách/đỏ, các trường dữ liệu mật mã và cam kết pháp lý/toán học.
   - Bổ sung 35 từ khóa song ngữ mới vào `src/i18n/en.ts` và `src/i18n/vi.ts`.

### 11.2. Danh sách file thêm/sửa/xóa

#### A. File tạo mới:
1. `server/blockchain/contractClient.ts`
2. `server/repositories/copyrightRepository.ts`
3. `server/services/copyrightService.ts`
4. `server/controllers/copyrightController.ts`
5. `server/routes/copyrightRoutes.ts`
6. `src/components/copyright/RegisterCopyrightModal.tsx`
7. `src/components/copyright/RegisterCopyrightModal.css`
8. `tests/step04_copyright_integration.test.ts`
9. `STEP_04_REPORT.txt`

#### B. File chỉnh sửa:
1. `server/app.ts` (Mount `/api/copyright`)
2. `server/config/env.ts` (Bổ sung cấu hình blockchain, rpcUrl, chainId, registrarPrivateKey)
3. `server/types/index.ts` (Bổ sung kiểu CopyrightRecord, BlockchainTransactionRecord, DTOs)
4. `src/contexts/WalletContext.tsx` (Bổ sung getSigner, getBrowserProvider, checkHasRole)
5. `src/services/api.ts` (Bổ sung copyrightApi, ApiCopyrightRecord, VerifyCopyrightResult)
6. `src/pages/BookDetail.tsx` (Tích hợp panel bản quyền blockchain và modal đăng ký)
7. `src/pages/Verify.tsx` & `src/pages/Verify.css` (Nâng cấp dual-mode on-chain verification)
8. `src/App.tsx` (Hỗ trợ các route /verify, /verify/:query, /copyright/verify/:query)
9. `src/i18n/en.ts` & `src/i18n/vi.ts` (Bổ sung toàn bộ từ khóa Bước 04)
10. `PROJECT_NOTES.txt` (Cập nhật tài liệu kiến trúc Bước 04)

### 11.3. Lỗi đã phát hiện và cách khắc phục
1. **Lỗi không khớp chữ hoa/chữ thường mã băm SHA-256 giữa SQL Server và TypeScript:**
   - *Phát hiện:* Bài test `step04_copyright_integration.test.ts` ban đầu thất bại do SQL Server trả về chuỗi băm in hoa `EB1D...`, trong khi Web Crypto API và Node.js crypto trả về in thường `eb1d...`.
   - *Khắc phục:* Đã bổ sung `.toLowerCase().trim()` khi xử lý chuỗi băm trong `copyrightService.ts`, `copyrightRepository.ts`, và `step04_copyright_integration.test.ts`. Kết quả đối soát 100% khớp.
2. **Lỗi cảnh báo biến chưa sử dụng (TypeScript strict unused vars):**
   - *Phát hiện:* Lệnh `npm run build` cảnh báo biến `preparedData` và các icon chưa dùng trong `Verify.tsx`.
   - *Khắc phục:* Đã dọn dẹp các biến và import thừa. Kết quả `npm run build` thành công 100%.

### 11.4. Kết quả kiểm thử thực tế

| Lệnh | Mục đích | Kết quả thực tế |
|---|---|---|
| `npm run test` | 6 test files (Tích hợp API, CSDL, Ví, Mật mã, Hardhat Local) | **6/6 passed, 84/84 tests PASSED (100%)** |
| `npm run contracts:test` | 29 Unit Tests Smart Contract | **29/29 tests PASSED (100%)** |
| `npm run lint` | Oxlint linter toàn dự án | **0 errors** |
| `npm run build` | Biên dịch TypeScript & Vite bundle | **Build thành công 100% (5.75s, 0 errors)** |
| `Live Local Node Execution` | Ký giao dịch & ghi nhận vào Hardhat Local | **Thành công (Mã băm SHA-256 thật, Block #2..#7)** |
| `Database Synchronization` | Đối soát bản ghi `dbo.CopyrightRecords` và `dbo.BlockchainTransactions` | **Đã ghi nhận 6 bản ghi ON_CHAIN, TxHash thật, Status = CONFIRMED** |

---

## 12. BƯỚC 05: QUẢN LÝ TRANH CHẤP BẢN QUYỀN, NHẬT KÝ KIỂM TOÁN VÀ QUẢN TRỊ SMART CONTRACT

### 12.1. Thời điểm & Mục tiêu
- **Thời điểm:** 2026-10-15
- **Mục tiêu:**
  * Xây dựng luồng khiếu nại vi phạm bản quyền trọn vẹn từ bạn đọc đến quản trị viên thư viện.
  * Tích hợp máy trạng thái tranh chấp trên Smart Contract (`disputeCopyright`, `resolveDispute`, `revokeCopyright`).
  * Lưu trữ hồ sơ khiếu nại và tiến trình kiểm toán minh bạch trong SQL Server (`dbo.Reports`, `dbo.ReportActions`).
  * Đồng bộ trạng thái 2 chiều giữa Smart Contract và bảng `dbo.CopyrightRecords` (`DISPUTED`, `ON_CHAIN`, `WITHDRAWN`).
  * Tích hợp Cầu dao khẩn cấp (Emergency Circuit Breaker - `pause` / `unpause`) trên Smart Contract do Admin quản trị.
  * Thiết kế lại Admin Dashboard (`/admin`) với cấu trúc 3 tab: `INVITATIONS`, `DISPUTES`, `GOVERNANCE`.
  * Hiển thị cảnh báo trực quan cho bạn đọc tại trang chi tiết sách (`/book/:id`) và trang xác minh (`/verify`).

### 12.2. Danh sách file thêm/sửa/xóa

#### A. File tạo mới:
1. `server/repositories/reportRepository.ts` — Tầng truy cập dữ liệu quản lý `dbo.Reports` và `dbo.ReportActions` (tạo khiếu nại, đổi trạng thái, ghi audit trail).
2. `server/services/reportService.ts` — Nghiệp vụ xử lý khiếu nại, phân quyền, kiểm tra hợp lệ, thêm ghi chú nội bộ và phát sóng giao dịch giải quyết tranh chấp on-chain.
3. `server/controllers/reportController.ts` — Controller xử lý API khiếu nại của người dùng và quản trị viên.
4. `server/routes/reportRoutes.ts` — Route `/api/reports` cho người dùng đăng ký khiếu nại.
5. `src/components/dispute/ReportModal.tsx` & `src/components/dispute/ReportModal.css` — Modal khiếu nại bản quyền cho bạn đọc theo chuẩn Archival Reading Room.
6. `tests/step05_dispute_management.test.ts` — 18 bài kiểm thử tự động toàn diện kiểm tra quy trình khiếu nại, kiểm toán, on-chain dispute/resolve/revoke và circuit breaker.
7. `STEP_05_REPORT.txt` — Báo cáo nghiệm thu kỹ thuật chi tiết Bước 05.

#### B. File chỉnh sửa:
1. `server/blockchain/contractClient.ts`:
   * Bổ sung các phương thức: `disputeCopyright`, `resolveDispute`, `revokeCopyright`, `pauseContract`, `unpauseContract`, `isPaused`.
   * Khắc phục độ trễ nonce khi test: gọi `eth_getTransactionCount('latest')` trực tiếp qua JSON-RPC để ngăn lỗi "Nonce too low".
   * Tự động điều hướng `RESOLVE_REVOKE`: nếu hồ sơ đang ở `ACTIVE`, chuyển sang `revokeCopyright` để tuân thủ điều kiện require của hợp đồng.
   * Ưu tiên nạp địa chỉ contract động từ file `server/contracts/deployedAddresses.json`.
2. `server/repositories/copyrightRepository.ts`:
   * Bổ sung `getCopyrightRecordById(id)`.
   * Làm cho `createBlockchainTransaction` an toàn (idempotent), kiểm tra trùng lặp `TxHash` để tránh vi phạm khóa unique `UX_BlockchainTransactions_Chain_TxHash`.
3. `server/routes/adminRoutes.ts`:
   * Bổ sung endpoints quản lý khiếu nại: `GET /api/admin/reports`, `GET /api/admin/reports/:id`, `POST /api/admin/reports/:id/actions`.
   * Bổ sung endpoints quản trị Smart Contract: `GET /api/admin/circuit-breaker`, `POST /api/admin/circuit-breaker`.
4. `server/app.ts`: Đăng ký router `/api/reports`.
5. `src/services/api.ts`: Bổ sung `reportApi` và `adminApi` (hỗ trợ đầy đủ kiểu TypeScript cho reports, report actions, circuit breaker).
6. `src/pages/AdminDashboard.tsx` & `AdminDashboard.css`:
   * Tái cấu trúc thành 3 tab điều hành: `INVITATIONS`, `DISPUTES`, `GOVERNANCE`.
   * Tab `DISPUTES`: Danh sách lọc theo trạng thái, modal chi tiết xem bằng chứng, thêm ghi chú nội bộ, và nút thao tác on-chain trực tiếp.
   * Tab `GOVERNANCE`: Thống kê contract, trạng thái kết nối node, và nút tạm dừng / khôi phục đăng ký Smart Contract (Pausable Circuit Breaker).
7. `src/pages/BookDetail.tsx`:
   * Hiển thị banner cảnh báo nổi bật màu hổ phách khi sách đang bị tranh chấp (`DISPUTED`), hoặc màu đỏ khi bản quyền đã bị thu hồi (`REVOKED`).
   * Bổ sung nút "Khiếu nại bản quyền" để mở `ReportModal`.
   * Hiển thị huy hiệu trạng thái on-chain trong bảng lịch sử đăng ký.
8. `src/pages/Verify.tsx`:
   * Cập nhật nhận diện trạng thái `DISPUTED` và `REVOKED` trên chứng chỉ bản quyền điện tử.
   * Bổ sung nút mở `ReportModal` trực tiếp từ trang xác minh.
9. `src/i18n/vi.ts` & `src/i18n/en.ts`: Bổ sung toàn bộ từ khóa song ngữ cho hệ thống khiếu nại, cảnh báo tranh chấp, modal báo cáo và quản trị contract.
10. `PROJECT_NOTES.txt`: Cập nhật tài liệu kiến trúc, luồng vận hành và trạng thái nghiệm thu Bước 05.

### 12.3. Lỗi đã phát hiện và cách khắc phục
1. **Lỗi `Nonce too low` do cache nonce nội bộ của `ethers.Wallet`:**
   * *Nguyên nhân:* Khi chạy test với nhiều giao dịch liên tiếp trên cùng tài khoản Hardhat Account #0, nonce được cache bởi ethers provider bị lệch so với nonce thực tế trên node khi đào block tự động.
   * *Khắc phục:* Viết hàm `getNextNonce()` gửi trực tiếp RPC `eth_getTransactionCount` với thẻ `'latest'` ngay trước mỗi giao dịch write. Loại bỏ hoàn toàn lỗi lệch nonce.
2. **Lỗi vi phạm ràng buộc require của hàm `resolveDispute` trên Smart Contract:**
   * *Nguyên nhân:* Smart Contract `BookCopyrightRegistry.sol` quy định `require(rec.status == RecordStatus.DISPUTED)` khi gọi `resolveDispute`. Nếu Admin chọn phán quyết "REVOKE" cho một bản ghi chưa qua bước chuyển `DISPUTED`, giao dịch sẽ bị revert.
   * *Khắc phục:* Trong `reportService.executeDisputeOnChain()`, hệ thống kiểm tra trạng thái on-chain hiện tại: nếu mục tiêu là thu hồi và trạng thái là `ACTIVE`, gọi `contract.revokeCopyright()`; nếu trạng thái là `DISPUTED`, gọi `contract.resolveDispute(recordId, RecordStatus.REVOKED)`.
3. **Lỗi vi phạm khóa duy nhất `UX_BlockchainTransactions_Chain_TxHash`:**
   * *Nguyên nhân:* Khi kiểm thử hoặc đồng bộ giao dịch, nếu một TxHash đã được lưu trước đó, lệnh insert trực tiếp sẽ ném lỗi SQL Server duplicate key.
   * *Khắc phục:* Cập nhật `createBlockchainTransaction` trong `copyrightRepository.ts` để kiểm tra tồn tại trước; nếu đã có, thực hiện cập nhật `updateBlockchainTransaction` thay vì chèn mới, đảm bảo tính idempotent.

### 12.4. Kết quả kiểm thử thực tế

| Bộ kiểm thử / Lệnh | Mục đích | Kết quả thực tế |
|---|---|---|
| `npm run test` | 7 test suites (Tích hợp Hệ thống, API, CSDL, Ví, Blockchain, Tranh chấp Bước 05) | **7/7 files passed, 102/102 tests PASSED (100%)** |
| `npm run contracts:test` | 29 Unit Tests Smart Contract (Hardhat Mocha) | **29/29 tests PASSED (100%)** |
| `npm run lint` | Oxlint toàn dự án | **0 errors (129 warnings kiểu react hook thông thường)** |
| `npm run build` | TypeScript compile (`tsc -b`) & Vite production bundle | **Build thành công 100% trong 593ms (0 errors)** |
| `On-chain Dispute & Resolution` | Test tương tác thực tế với `BookCopyrightRegistry.sol` | **Chuyển trạng thái ACTIVE -> DISPUTED -> REVOKED thành công, TxHash & Block thật** |
| `Circuit Breaker Verification` | Test tạm dừng hợp đồng khi có sự cố | **Pause ngăn chặn đăng ký mới với lỗi EnforcedPause; Unpause khôi phục bình thường** |

---

## 13. HOÀN THIỆN TOÀN BỘ 5 GIAI ĐOẠN, IPFS STORAGE & CHUẨN BỊ SEPOLIA

### 13.1. Thời điểm & Mục tiêu
- **Thời điểm:** 2026-10-15
- **Mục tiêu:**
  * Thực hiện audit toàn diện 5 giai đoạn theo lộ trình dự án BOOKCHAIN LIBRARY.
  * Tích hợp động cơ lưu trữ IPFS thực tế (`IpfsStorageProvider`) với thuật toán băm chuẩn hóa CIDv0 (`Qm...`), bộ đệm local IPFS cache và hỗ trợ kết nối Pinata API / IPFS Gateway.
  * Triển khai bộ điều phối lưu trữ `StorageManager` hỗ trợ linh hoạt cả `LOCAL` và `IPFS`.
  * Xây dựng cơ chế phục hồi và đối soát giao dịch blockchain (`reconcilePendingTransactions`, `POST /api/copyright/reconcile`) giải quyết dứt điểm rủi ro mất đồng bộ giữa SQL Server và Smart Contract khi gặp sự cố mạng hoặc timeout.
  * Phân biệt rõ ràng giao dịch người dùng ký trực tiếp (`REGISTER_DIRECT_METAMASK`) với giao dịch relay qua backend registrar (`REGISTER_RELAY_SIGNER`).
  * Mở rộng cấu hình đa mạng song song: hỗ trợ Hardhat Local (31337) và Ethereum Sepolia (11155111) tại `contractClient.ts` và `WalletContext.tsx`.
  * Xây dựng script quản trị `scripts/grantRole.cjs` cấp vai trò `REGISTRAR_ROLE` trên mọi mạng.
  * Lập báo cáo nghiệm thu kỹ thuật `ROADMAP_ACCEPTANCE_REPORT.txt` và báo cáo đánh giá triển khai `SEPOLIA_DEPLOYMENT_REPORT.txt`.

### 13.2. Danh sách file thêm/sửa/xóa

#### A. File tạo mới:
1. `server/services/storage/ipfsStorageProvider.ts` — Động cơ lưu trữ IPFS, tính toán mã băm mật mã Base58 CIDv0, lưu trữ cache nhị phân, kiểm tra toàn vẹn byte và tích hợp Pinata API.
2. `server/services/storage/storageManager.ts` — Bộ điều phối lưu trữ đa nguồn (Local & IPFS) kiêm nhiệm kiểm tra toàn vẹn và streaming tệp.
3. `scripts/grantRole.cjs` — Kịch bản cấp vai trò `REGISTRAR_ROLE` cho tài khoản ví trên mạng Local hoặc Sepolia, kiểm tra trạng thái trước tránh lặp giao dịch (idempotent).
4. `tests/step06_storage_reconciliation.test.ts` — Bộ 8 bài kiểm thử tích hợp tự động kiểm tra tính toán CID, động cơ IPFS, upload API đa nguồn, reconciliation endpoint và kịch bản cấu hình mạng.
5. `ROADMAP_ACCEPTANCE_REPORT.txt` — Báo cáo nghiệm thu kỹ thuật tổng thể 5 giai đoạn.
6. `SEPOLIA_DEPLOYMENT_REPORT.txt` — Báo cáo đánh giá và hướng dẫn triển khai mạng Ethereum Sepolia.

#### B. File chỉnh sửa:
1. `server/config/env.ts` — Nhận diện linh hoạt RPC URL và Chain ID dựa trên biến môi trường `BLOCKCHAIN_NETWORK` (localhost / sepolia).
2. `server/blockchain/contractClient.ts` — Hỗ trợ nạp địa chỉ hợp đồng Sepolia từ `deployedAddresses.json` khi chạy ở chế độ Sepolia.
3. `server/repositories/copyrightRepository.ts`:
   * Bổ sung trường `transactionType` vào `updateBlockchainTransaction`.
   * Bổ sung phương thức `getPendingTransactions()` hỗ trợ quét các bản ghi chưa đồng bộ.
4. `server/services/copyrightService.ts`:
   * Phân biệt rõ ràng `REGISTER_DIRECT_METAMASK` và `REGISTER_RELAY_SIGNER`.
   * Bổ sung phương thức `reconcilePendingTransactions()`.
   * Chuyển sang sử dụng `unifiedStorageService` để xác minh tính toàn vẹn tệp trên cả đĩa vật lý và IPFS.
5. `server/controllers/copyrightController.ts` & `server/routes/copyrightRoutes.ts`:
   * Bổ sung route và handler `POST /api/copyright/reconcile` cho việc đối soát tự động.
6. `server/services/bookService.ts` & `server/controllers/bookController.ts`:
   * Chuyển sang sử dụng `unifiedStorageService`.
   * Hỗ trợ tham số `storageProvider: 'LOCAL' | 'IPFS'` khi upload phiên bản sách mới.
7. `hardhat.config.cjs`:
   * Cập nhật fallback RPC Sepolia sang `https://ethereum-sepolia-rpc.publicnode.com`.
   * Cấu hình Etherscan API key phục vụ xác minh hợp đồng trên explorer.
8. `src/contexts/WalletContext.tsx`:
   * Bổ sung hằng số và hỗ trợ nhận diện mạng Sepolia (`0xaa36a7` / `11155111`).
   * Cập nhật `switchNetwork` hỗ trợ chuyển mạng sang Hardhat Local hoặc Sepolia.
   * Khắc phục kiểu tham số tương thích với React `MouseEventHandler`.
9. `src/services/api.ts`:
   * Bổ sung phương thức `reconcile` vào `copyrightApi`.
10. `PROJECT_NOTES.txt`:
    * Cập nhật tài liệu kiến trúc toàn diện 5 giai đoạn và kết quả kiểm thử.

### 13.3. Lỗi đã phát hiện và cách khắc phục
1. **Lỗi TypeScript type mismatch khi truyền `switchNetwork` vào thuộc tính `onClick`:**
   * *Phát hiện:* Lệnh `npm run build` báo lỗi `Type '(targetChain?: "hardhat" | "sepolia" | undefined) => Promise<void>' is not assignable to type 'MouseEventHandler<HTMLButtonElement>'` tại `RegisterCopyrightModal.tsx` và `WalletButton.tsx`.
   * *Nguyên nhân:* React `onClick` truyền `MouseEvent` vào hàm xử lý, gây xung đột kiểu với tham số chuỗi `'hardhat' | 'sepolia'`.
   * *Khắc phục:* Mở rộng kiểu tham số `targetChain?: 'hardhat' | 'sepolia' | unknown = 'hardhat'` và kiểm tra `targetChain === 'sepolia'`, đảm bảo tương thích 100% với React SyntheticEvent. Build production thành công 100%.
2. **Lỗi 404 Endpoint Sepolia RPC cũ (`rpc.sepolia.org`):**
   * *Phát hiện:* Kịch bản kiểm tra Sepolia báo lỗi HTTP 404 khi cố kết nối tới `https://rpc.sepolia.org`.
   * *Nguyên nhân:* Endpoint công khai cũ `rpc.sepolia.org` đã ngừng hoạt động trực tiếp.
   * *Khắc phục:* Cập nhật fallback RPC endpoint sang `https://ethereum-sepolia-rpc.publicnode.com` (endpoint công khai hoạt động ổn định).
3. **Lỗi `AssignedAt` trong bảng `dbo.UserRoles` khi chạy test:**
   * *Phát hiện:* Test `step06` báo lỗi `Invalid column name 'AssignedAt'`.
   * *Khắc phục:* Sử dụng trực tiếp API `POST /api/users/author-profile` của ứng dụng thay vì chèn trực tiếp bằng raw SQL, bảo đảm tuân thủ đúng quy trình nghiệp vụ và cấu trúc bảng thực tế.

### 13.4. Kết quả kiểm thử thực tế

| Lệnh kiểm thử | Mục đích | Kết quả thực tế |
|---|---|---|
| `npm run test` | 8 test suites (Tích hợp Hệ thống, API, CSDL, Ví, Blockchain, Tranh chấp, IPFS Storage & Reconciliation) | **8/8 files passed, 110/110 tests PASSED (100%)** |
| `npm run contracts:test` | 29 Unit Tests Smart Contract (Hardhat Mocha) | **29/29 tests PASSED (100%)** |
| `npm run lint` | Oxlint linter toàn bộ dự án | **0 errors (130 warnings thông thường)** |
| `npm run build` | TypeScript compile (`tsc -b`) & Vite production bundle | **Build thành công 100% trong 580ms (0 errors)** |
| `grantRole.cjs Live Execution` | Cấp `REGISTRAR_ROLE` trên node Local cho Account #1 | **Giao dịch xác nhận thành công tại Block 78, TxHash 0x7166...11d5** |
| `Sepolia Deploy Safety Guard` | Kiểm tra điều kiện tiên quyết trước khi phát sóng Sepolia | **Phát hiện chính xác thiếu ví/ETH testnet và dừng lại an toàn, không gửi giao dịch rác** |

---

## 14. BẢO TRÌ & SỬA LỖI: QUY TRÌNH ĐĂNG KÝ VÀ DUYỆT BÚT DANH TÁC GIẢ (STEP 07 — AUTHOR APPROVAL SYSTEM)

### 14.1. Hiện trạng & Nguyên nhân gốc rễ
1. **Hiện trạng phản ánh:**
   - Người dùng đăng nhập với vai trò Reader hoặc Author đăng ký bút danh mới qua form thông tin cá nhân.
   - Hệ thống hiển thị trạng thái `PENDING`.
   - Trong giao diện Admin không tìm thấy nơi xem và duyệt yêu cầu này; người dùng không biết cách nào để được duyệt đăng sách.
2. **Nguyên nhân chính xác được chứng minh từ mã nguồn:**
   - **Chưa có API Admin duyệt/từ chối:** CSDL `dbo.AuthorProfiles` có sẵn các trường `VerificationStatus`, `VerificationNote`, `ReviewedByUserId`, `ReviewedAt`, nhưng `adminController.ts` và `adminRoutes.ts` hoàn toàn không có endpoint nào để tra cứu danh sách, phê duyệt hoặc từ chối các yêu cầu này.
   - **Giao diện Admin thiếu mục xử lý:** `AdminDashboard.tsx` chỉ có 3 tab (`INVITATIONS`, `DISPUTES`, `GOVERNANCE`), hoàn toàn không có tab hiển thị các yêu cầu đăng ký tác giả.
   - **Lỗ hổng logic xuất bản sách khi bị từ chối:** `bookService.createBook` chỉ kiểm tra `if (!authorProfile)` mà không kiểm tra trạng thái `REJECTED`, dẫn đến rủi ro hồ sơ bị từ chối vẫn có thể gọi API tạo sách nếu không có cơ chế thu hồi quyền `AUTHOR` và chặn tạo sách ở backend.
   - **Giao diện Profile của độc giả chưa tối ưu:** Trước đây, nếu `!isAuthor`, giao diện ẩn form đăng ký bút danh và chỉ hiển thị form đổi mã mời, khiến độc giả không có nơi gửi yêu cầu đăng ký bút danh mới hoặc xem tình trạng xét duyệt.

### 14.2. Các tệp tin đã tạo và chỉnh sửa

#### A. Tệp tin tạo mới:
1. `tests/step07_author_approval.test.ts` — Bộ 19 bài kiểm thử tích hợp tự động đầu-cuối:
   - Đăng ký bút danh mới đưa vào trạng thái `PENDING`.
   - Độc giả chưa có hồ sơ bị chặn đăng sách (`AUTHOR_PROFILE_REQUIRED`, 403).
   - Kiểm tra RBAC nghiêm ngặt: người dùng không phải Admin gọi API duyệt/từ chối bị chặn (`FORBIDDEN`, 403).
   - Admin duyệt yêu cầu: Cập nhật `VERIFIED`, ghi nhận ghi chú kiểm toán, cấp vai trò `AUTHOR` vào `dbo.UserRoles`, người dùng tạo sách thành công (201 Created).
   - Cơ chế Idempotency Guard: Chống duyệt hoặc từ chối lặp trên yêu cầu đã được xử lý (`REQUEST_ALREADY_PROCESSED`, 400).
   - Admin từ chối yêu cầu: Bắt buộc lý do, cập nhật `REJECTED`, thu hồi vai trò `AUTHOR`, chặn đăng sách (`AUTHOR_PROFILE_REJECTED`, 403).
   - Khả năng nộp lại hồ sơ: Cho phép cập nhật thông tin bút danh sau khi bị từ chối, tự động reset trạng thái về `PENDING` để Admin xét duyệt lại.
   - Bộ lọc trạng thái (`ALL`, `PENDING`, `VERIFIED`, `REJECTED`) và tìm kiếm từ khóa theo bút danh, email.
2. `PEN_NAME_APPROVAL_FIX_REPORT.txt` — Báo cáo kỹ thuật chi tiết toàn diện về nguyên nhân, giải pháp, API, thay đổi database và hướng dẫn kiểm tra thủ công.

#### B. Tệp tin đã chỉnh sửa:
1. `server/types/index.ts`:
   - Bổ sung `AuthorRequestDto` và `AdminAuthorRequestsResult`.
   - Bổ sung `verificationNote?: string | null` và `reviewedAt?: Date | null` vào `AuthorProfilePublic`.
2. `server/repositories/authorProfileRepository.ts`:
   - Thêm `findById(authorProfileId: string)`.
   - Thêm `getAuthorRequests(options)`: Lọc theo trạng thái, tìm kiếm, phân trang và join thông tin tài khoản + người duyệt.
   - Thêm `approveAuthorRequest(authorProfileId, adminUserId, note)`: Transaction an toàn với `UPDLOCK, ROWLOCK`, kiểm tra trạng thái `PENDING`, cập nhật `VERIFIED`, gán vai trò `AUTHOR` vào `dbo.UserRoles`.
   - Thêm `rejectAuthorRequest(authorProfileId, adminUserId, reason)`: Transaction an toàn với `UPDLOCK, ROWLOCK`, kiểm tra trạng thái `PENDING`, cập nhật `REJECTED`, ghi nhận lý do, thu hồi vai trò `AUTHOR`.
   - Cập nhật `createOrUpdate()`: Đặt lại trạng thái `PENDING` và xóa lý do từ chối cũ khi người dùng gửi lại.
3. `server/services/userService.ts` & `server/services/authService.ts`:
   - Bổ sung đầy đủ `verificationNote` và `reviewedAt` trong thông tin `authorProfile` trả về ở `/profile`, `/auth/me` và `/auth/login`.
4. `server/controllers/adminController.ts`:
   - Thêm `listAuthorRequests`, `approveAuthorRequest`, `rejectAuthorRequest` với kiểm tra đầu vào và mã lỗi chuẩn (`NOT_FOUND`, `VALIDATION_ERROR`, `REQUEST_ALREADY_PROCESSED`).
5. `server/routes/adminRoutes.ts`:
   - Mount các route được bảo vệ bởi `requireAuth` và `requireRole('ADMIN')`:
     * `GET /api/admin/author-requests`
     * `POST|PATCH /api/admin/author-requests/:id/approve`
     * `POST|PATCH /api/admin/author-requests/:id/reject`
6. `server/services/bookService.ts` & `server/controllers/bookController.ts`:
   - Bổ sung kiểm tra `AUTHOR_PROFILE_REQUIRED` và `AUTHOR_PROFILE_REJECTED` trước khi kiểm tra vai trò tác giả, bảo đảm thông báo lỗi rõ ràng kèm lý do từ chối.
7. `src/services/api.ts`:
   - Mở rộng kiểu dữ liệu `ApiUser` và thêm interface `AdminAuthorRequest`.
   - Bổ sung các hàm gọi API phía client: `adminApi.getAuthorRequests`, `approveAuthorRequest`, `rejectAuthorRequest`.
8. `src/pages/AdminDashboard.tsx`:
   - Thêm Tab `AUTHOR_REQUESTS` với huy hiệu số lượng yêu cầu `PENDING`.
   - Thêm 4 thẻ tóm tắt số liệu (Tổng, Chờ duyệt, Đã duyệt, Đã từ chối).
   - Thêm bộ lọc trạng thái và thanh tìm kiếm từ khóa.
   - Thêm Modal Phê duyệt (nhập ghi chú) và Modal Từ chối (bắt buộc nhập lý do).
9. `src/pages/Profile.tsx`:
   - Cho phép độc giả chưa có hồ sơ đăng ký bút danh hoặc đổi mã mời.
   - Hiển thị thẻ trạng thái hồ sơ tác giả trực quan: `PENDING`, `VERIFIED`, `REJECTED` (hiển thị lý do và cho phép gửi lại).
10. `src/i18n/vi.ts` & `src/i18n/en.ts`:
    - Thêm đầy đủ nhãn giao diện, thông báo xác nhận và thông điệp lỗi cho cả tiếng Việt và tiếng Anh.
11. `tests/step04_copyright_integration.test.ts`:
    - Cập nhật địa chỉ ví không có quyền sang Account #2 tránh xung đột quyền registrar đã cấp trên node Hardhat.

### 14.3. Kết quả kiểm thử thực tế

| Lệnh kiểm thử | Mục đích | Kết quả thực tế |
|---|---|---|
| `npx vitest run tests/step07_author_approval.test.ts` | 19 Unit/Integration Tests luồng đăng ký bút danh & duyệt Admin | **19/19 tests PASSED (100%)** |
| `npm test` | Toàn bộ 9 Vitest Suites (API, Books, Invitations, Blockchain, Dispute, Storage, Author Approval) | **9/9 files passed, 129/129 tests PASSED (100%)** |
| `npm run contracts:test` | 29 Unit Tests Smart Contract trên Hardhat | **29/29 tests PASSED (100%)** |
| `npm run lint` | Oxlint linter toàn bộ dự án | **0 errors (132 warnings thông thường)** |
| `npm run build` | TypeScript compile (`tsc -b`) & Vite production bundle | **Build thành công 100% trong 684ms (0 errors)** |
| `DB Record Check (cuongstore@gmail.com)` | Kiểm tra dữ liệu thực tế người dùng trong SQL Server | **Bản ghi bút danh 'Lời nói gió bay' (PENDING) bảo toàn nguyên vẹn, xuất hiện tại Admin** |

---

## 15. TỔNG RÀ SOÁT VÀ TÁI CẤU TRÚC TOÀN DIỆN HỆ THỐNG — BUSINESS LOGIC, CODE ARCHITECTURE & IMPECCABLE UI/UX (BƯỚC 08)

### 15.1. Triết lý chỉ đạo & Mục tiêu thực hiện
- **Triết lý bắt buộc:** **LIBRARY FIRST, COPYRIGHT SECOND, BLOCKCHAIN UNDERNEATH.**
  BookChain Library là một thư viện số có hệ thống quản lý bản quyền minh bạch, sử dụng blockchain làm lớp xác minh và lưu trữ bằng chứng bất biến — tuyệt đối không biến sản phẩm thành dashboard giao dịch crypto.
- **Kỹ sư thực hiện:** Senior Software Architect, Senior Full-Stack Engineer, UX Architect & QA Engineer.
- **Áp dụng bộ kỹ năng Impeccable Design Director (`.gemini/skills/impeccable/`):**
  1. Nạp bối cảnh thiết kế sản phẩm qua lệnh: `.gemini/skills/impeccable/scripts/impeccable.cmd context` (nạp `PRODUCT.md` và `DESIGN.md`).
  2. Chạy công cụ rà soát khuyết tật cơ học:
     - Phát hiện lỗi anti-pattern `side-tab` (sử dụng đường kẻ dày đơn độc `border-left: 3px solid ...`) tại `src/components/dispute/ReportModal.css` (dòng 36).
     - Khắc phục triệt để: Chuyển sang viền chuẩn mực `border: 1px solid var(--color-border)` với nền trung tính `background-color: var(--color-ground)`.
     - Chạy lại detector: Kết quả trả về `[]` (0 defects cơ học).

### 15.2. Tái cấu trúc 3 phân khu chức năng & Điều hướng

#### A. Phân khu Độc giả & Thư viện (Reader / Library Zone)
- **Trang chủ & Khám phá:** Giữ trọn vẹn phong cách phòng đọc lưu trữ ("Archival Reading Room"), tập trung vào sách, tác giả và nội dung học thuật.
- **Trang Giới thiệu nguyên lý (`/how-it-works`):** Thay thế hoàn toàn trang placeholder "(Coming Soon)" bằng trang tương tác học thuật chuyên sâu, giải thích rõ ràng 3 trụ cột: Thư viện lưu trữ số, Mã băm SHA-256 vân tay số, và Sổ cái Blockchain bất biến.
- **Trang Danh bạ tác giả công khai (`/authors`):** Thay thế placeholder "(Coming Soon)" bằng danh bạ thực tế kết nối API `GET /api/books/authors`, hiển thị danh sách các tác giả đã được thẩm định (`VERIFIED`), số lượng đầu sách đã xuất bản, và liên kết lọc trực tiếp đến các tác phẩm của từng tác giả.
- **Công cụ Xác minh độc lập (`/verify`):** Cho phép bất kỳ độc giả hoặc tổ chức nào kiểm tra tính toàn vẹn của tệp sách (SHA-256) hoặc tra cứu Work ID mà không bắt buộc cài đặt MetaMask hay kết nối ví crypto.
- **Nút kết nối ví (`WalletButton`):** Tái cấu trúc hiển thị theo ngữ cảnh — chỉ hiển thị trên thanh điều hướng chính khi người dùng là Tác giả/Admin hoặc khi ví đã được kết nối trước đó; ẩn đối với độc giả vãng lai để giữ không gian đọc thanh lịch và chuyên nghiệp.

#### B. Phân khu Tác giả (Author Studio Zone)
- **Xây dựng Author Studio (`/author/studio`):** Gom toàn bộ nghiệp vụ tác giả vào một trung tâm làm việc thống nhất với 3 tab:
  1. `WORKS` (Quản lý tác phẩm): Danh sách sách đã tạo, thêm sách mới, tải lên phiên bản mới (hỗ trợ lưu trữ Cục bộ / IPFS Pinata), thêm đồng tác giả.
  2. `COPYRIGHT` (Bản quyền số & Blockchain): Đăng ký bản quyền on-chain, tra cứu hồ sơ bản quyền, kiểm tra đối soát mã băm tính toàn vẹn (SHA-256 Integrity Verification).
  3. `REPORTS` (Báo cáo & Tranh chấp): Theo dõi các báo cáo vi phạm liên quan đến tác phẩm của mình và trạng thái giải quyết tranh chấp.
- **Cơ chế kiểm soát trạng thái bút danh:**
  - Hiển thị banner trạng thái trực quan: `PENDING` (chờ Admin duyệt), `REJECTED` (kèm lý do bị từ chối và nút cập nhật gửi lại), `VERIFIED` (đã duyệt).
  - Khóa quyền xuất bản sách và đăng ký bản quyền khi bút danh chưa được duyệt (`PENDING` hoặc `REJECTED`).
- **Dọn dẹp code giả lập:** Điều hướng `/copyright/register` về `/author/studio`, loại bỏ trang stepper giả lập tĩnh cũ `Register.tsx`.

#### C. Phân khu Quản trị (Admin Console Zone)
- **Tái cấu trúc Admin Dashboard (`/admin`) với 5 tab chức năng:**
  1. `OVERVIEW` (Tổng quan & Trung tâm phân loại): Kết nối trực tiếp API thời gian thực `GET /api/admin/overview`, hiển thị 4 thẻ tác vụ cần xử lý ngay (Hồ sơ chờ duyệt, Mã mời khả dụng, Tranh chấp đang mở, Tranh chấp đã giải quyết) với nút điều hướng trực tiếp đến tab tương ứng; cùng biểu đồ giám sát hạ tầng blockchain và phân phối kho sách số.
  2. `AUTHOR_REQUESTS`: Danh sách, lọc, tìm kiếm, duyệt và từ chối yêu cầu đăng ký bút danh tác giả.
  3. `INVITATIONS`: Quản lý và phát hành mã mời tác giả độc quyền.
  4. `DISPUTES`: Tiếp nhận, thụ lý và phân giải các báo cáo vi phạm bản quyền sách.
  5. `GOVERNANCE`: Cầu dao khẩn cấp Circuit Breaker (Pause/Unpause Smart Contract) và kiểm tra địa chỉ hợp đồng.

### 15.3. Nâng cấp Typography & Chuẩn hóa Trải nghiệm người dùng
- **Hỗ trợ tiếng Việt hoàn hảo:**
  - Cập nhật Google Fonts `@import` bổ sung `&subset=vietnamese,latin-ext`.
  - Bổ sung font fallback chuẩn mực trong `src/index.css`:
    * Serif: `var(--font-serif): "Libre Baskerville", "Merriweather", "Georgia", "Times New Roman", serif;`
    * Sans: `var(--font-sans): "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`
    * Mono: `var(--font-mono): "Space Mono", "Consolas", "Monaco", "Courier New", monospace;`
  - Bổ sung lớp `.prose-reading` giới hạn độ rộng đọc sách từ 65ch đến 72ch theo chuẩn công thái học đọc văn bản số.
- **Loại bỏ anti-pattern & Chuẩn hóa Design System:**
  - Toàn bộ form, modal, bảng, badge, input đều sử dụng nhất quán CSS custom properties trong `src/index.css`.
  - Xóa bỏ hoàn toàn các đường viền lệch quy chuẩn (`border-left: 3px solid ...`).

### 15.4. Danh mục tệp tin đã tạo và chỉnh sửa

#### A. Tệp tin tạo mới:
1. `src/pages/HowItWorks.tsx` & `src/pages/HowItWorks.css` — Trang giải thích chi tiết nguyên lý hoạt động 3 tầng.
2. `src/pages/Authors.tsx` & `src/pages/Authors.css` — Trang danh bạ tác giả công khai kết nối dữ liệu thật từ SQL Server.
3. `src/pages/AuthorStudio.tsx` & `src/pages/AuthorStudio.css` — Trung tâm quản lý tác phẩm và bản quyền dành cho tác giả.
4. `COMPREHENSIVE_REFACTOR_REPORT.txt` — Báo cáo tổng kết toàn diện quá trình rà soát và tái cấu trúc hệ thống.

#### B. Tệp tin đã chỉnh sửa:
1. `index.html` — Bổ sung metadata học thuật, preconnect tới Google Fonts và tiêu đề chuẩn hóa.
2. `src/index.css` — Bổ sung subset tiếng Việt, chuẩn hóa font fallback, bổ sung lớp `.prose-reading`.
3. `src/components/dispute/ReportModal.css` — Khắc phục anti-pattern `side-tab` (thay border-left 3px bằng viền 1px chuẩn mực).
4. `server/repositories/authorProfileRepository.ts` — Thêm hàm `getPublicAuthors()` truy vấn tác giả đã xác minh và số lượng sách xuất bản.
5. `server/services/bookService.ts` & `server/controllers/bookController.ts` — Bổ sung phương thức lấy danh sách tác giả công khai.
6. `server/routes/bookRoutes.ts` — Mount endpoint `GET /api/books/authors`.
7. `server/controllers/adminController.ts` — Bổ sung hàm `getOverviewStats()` tổng hợp số liệu trực tiếp từ SQL Server.
8. `server/routes/adminRoutes.ts` — Mount endpoint `GET /api/admin/overview`.
9. `src/services/api.ts` — Bổ sung interface `PublicAuthorDto`, `AdminOverviewStats`, hàm gọi API `booksApi.getAuthors()` và `adminApi.getOverviewStats()`.
10. `src/App.tsx` — Đăng ký các route `/authors`, `/how-it-works`, `/author/studio`; chuyển hướng `/copyright/register` sang `/author/studio`.
11. `src/components/layout/Navbar.tsx` — Cập nhật menu điều hướng 3 phân khu; ẩn nút kết nối ví đối với độc giả thông thường.
12. `src/pages/AdminDashboard.tsx` — Bổ sung tab `OVERVIEW` làm tab hạ cánh mặc định với các số liệu và thẻ phân loại trực tiếp.
13. `src/i18n/vi.ts` & `src/i18n/en.ts` — Bổ sung toàn diện từ khóa dịch đa ngôn ngữ cho HowItWorks, Authors, Author Studio, Admin Overview.
14. `package.json` — Cập nhật script `"lint": "oxlint src server tests"` đảm bảo kiểm tra mã nguồn nhanh và chuẩn xác.
15. `PROJECT_NOTES.txt` — Cập nhật tài liệu kiến trúc, danh mục trang và hướng dẫn vận hành.

### 15.5. Kết quả kiểm thử thực tế

| Lệnh kiểm thử | Mục đích kiểm tra | Kết quả thực tế |
|---|---|---|
| `Impeccable Mechanical Detector` | Rà soát lỗi anti-pattern UI/UX theo tiêu chuẩn Impeccable | **0 defects cơ học (`[]`)** |
| `npm run lint` | Kiểm tra cú pháp và chất lượng mã nguồn với Oxlint | **0 errors (132 warnings thông thường)** |
| `npm run build` | Biên dịch TypeScript (`tsc -b`) và đóng gói Vite production bundle | **Build thành công 100% trong 839ms (0 errors)** |
| `npm test` | Toàn bộ 9 Vitest Suites (API, Books, Blockchain, Storage, Invitations, Disputes, Author Approval) | **9/9 test suites passed, 129/129 tests PASSED (100%)** |
| `npm run contracts:test` | 29 Unit Tests Smart Contract trên Hardhat | **29/29 tests PASSED (100%)** |
| `Live API: GET /api/books/authors` | Kiểm tra API danh bạ tác giả trên database SQL Server | **200 OK — Trả về đúng danh sách tác giả VERIFIED cùng số sách** |
| `Live API: GET /api/admin/overview` | Kiểm tra API thống kê tổng quan quản trị trên SQL Server | **200 OK — Trả về số liệu sống (pendingRequests, activeUsers, onChainRecords...)** |

---

## 16. BƯỚC 09: TOÀN DIỆN AUDIT, SỬA LỖI VÀ HOÀN THIỆN UI/UX BOOKCHAIN LIBRARY

### 16.1. Mục tiêu và Triết lý
- Tuân thủ triệt để: **"LIBRARY FIRST, COPYRIGHT SECOND, BLOCKCHAIN UNDERNEATH."**
- Thực thi định hướng giao diện **Archival Reading Room**: học thuật, thanh lịch, tinh tế, tối ưu cho đọc sách và bản quyền.
- Áp dụng các quy chuẩn thiết kế từ bộ skill `.gemini/skills/impeccable/`.

### 16.2. Các cải tiến và sửa lỗi chính
1. **Thiết lập Design System & Button System (`src/index.css`):**
   - Chuẩn hóa toàn bộ design tokens (Ground, Surface, Border, Ink, Accent, Transitions).
   - Thiết lập Button System gốc: `.btn` (inline-flex, white-space: nowrap, line-height: 1.25, flex-shrink: 0, visible focus ring), các kích thước `.btn-xs`, `.btn-sm`, `.btn-lg`, `.btn-icon` và các biến thể `.btn-primary`, `.btn-secondary`, `.btn-accent`, `.btn-subtle`.
   - Bổ sung các utilities layout: `.pills-group`, `.pill-btn`, `.table-responsive-wrapper`, `.table-action-group`.
2. **Khắc phục lỗi Mobile Navigation (`Navbar.tsx` & `Navbar.css`):**
   - Bổ sung nút hamburger toggle và Mobile Slide Drawer hiển thị trọn vẹn danh mục điều hướng, tài khoản và trạng thái ví trên viewport < 992px.
3. **Đại tu Admin Dashboard (`AdminDashboard.tsx` & `AdminDashboard.css`):**
   - Loại bỏ kicker bị cấm `ROOT CONTROL ROOM`.
   - Cung cấp thanh cuộn ngang mượt cho các tab quản trị (`.admin-tabs`).
   - Sửa lỗi vỡ hàng và dính chữ trong thanh tìm kiếm & bộ lọc trạng thái (`.admin-filter-bar`, `.pills-group`).
   - Nâng cấp nhóm nút hành động trong bảng tác giả, khiếu nại và mã mời không bị ngắt dòng.
4. **Cải tiến Author Studio & Profile (`AuthorStudio.tsx`, `AuthorStudio.css`, `Profile.tsx`):**
   - Loại bỏ kicker bị cấm `AUTHOR STUDIO & COPYRIGHT DESK`.
   - Tối ưu hóa các nút thao tác sách đáp ứng tốt trên mobile.
   - Bổ sung điều hướng liên kết trực tiếp từ Profile sang Author Studio hoàn chỉnh.
5. **Dọn dẹp mã nguồn:**
   - Xóa bỏ an toàn tệp demo template `src/App.css`.

### 16.3. Kết quả kiểm thử thực tế
- **Impeccable Mechanical Detector:** 0 defects (`[]`).
- **Oxlint Linting:** 0 errors (Pass).
- **TypeScript & Vite Build:** `tsc -b && vite build` hoàn thành trong 871ms (0 errors).
- **Vitest Suites:** 9/9 test suites, 129/129 tests PASSED (100%).
- **Hardhat Smart Contract Tests:** 29/29 tests PASSED (100%).
- **Kiểm thử trực quan Browser Subagent:** Đã chụp và xác thực thành công các ảnh chụp màn hình trên 390px Mobile và 1440px Desktop (`mobile_home_with_nav`, `mobile_drawer_open`, `mobile_author_studio`, `desktop_admin_author_tab`, `desktop_admin_disputes_tab`, `desktop_profile_page`).

---

