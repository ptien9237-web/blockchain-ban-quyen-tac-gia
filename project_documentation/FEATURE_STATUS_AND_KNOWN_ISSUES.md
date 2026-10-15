# FEATURE STATUS AND KNOWN ISSUES — BOOKCHAIN LIBRARY
*(Bảng Đánh giá Trạng thái Tính năng, Lỗi Kỹ thuật và Kế hoạch Xử lý)*

> **Phiên bản:** 1.0.0  
> **Ngày cập nhật:** 11/10/2026  
> **Phương pháp xác minh:** Đọc trực tiếp mã nguồn, phân tích linter, đối chiếu router và chạy thử nghiệm thực tế.

---

## 1. BẢNG TRẠNG THÁI TOÀN BỘ CÁC HẠNG MỤC DỰ ÁN

| Hạng mục | Trạng thái | Bằng chứng thực tế trong mã nguồn | Vấn đề & Khoảng cách còn lại |
|---|---|---|---|
| **Giao diện Thư viện & Duyệt sách** | **Đã xác minh (Verified)** | [Home.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Home.tsx), [Discover.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Discover.tsx), [BookCard.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/components/book/BookCard.tsx) | Bộ lọc bản quyền (checkboxes) và dropdown sắp xếp chưa có logic xử lý; nút Filters không có sự kiện click. |
| **Hệ thống Đa ngôn ngữ (EN/VI)** | **Đã xác minh (Verified)** | [I18nContext.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/contexts/I18nContext.tsx), [en.ts](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/i18n/en.ts), [vi.ts](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/i18n/vi.ts) | Hoàn thiện 100% các chuỗi giao diện (139 key dịch đồng bộ, lưu `localStorage`). |
| **Hệ thống Giao diện Sáng/Tối** | **Đã xác minh (Verified)** | [ThemeContext.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/contexts/ThemeContext.tsx), [index.css](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/index.css) | Hoàn thiện 100%, chuyển đổi class `.dark` mượt mà, lưu `localStorage`. |
| **Xem Chi tiết Sách & Hồ sơ Bản quyền** | **Một phần (Partial)** | [BookDetail.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/BookDetail.tsx) | Nút "Read Work" và "Download PDF" không có action; link tới tác giả và hồ sơ ledger bị lỗi 404 (thiếu route); mã băm đang gán cứng. |
| **Xác minh Bản quyền (Verify)** | **Mới có giao diện mẫu (Mock UI)** | [Verify.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Verify.tsx) | Băm SHA-256 là giả lập (chuỗi rỗng), kết quả tính theo chẵn lẻ kích thước file, các nút chuyển tiếp không có handler. |
| **Đăng ký Bản quyền (Register)** | **Mới có giao diện mẫu (Mock UI)** | [Register.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Register.tsx) | Form uncontrolled, không lưu dữ liệu nhập; nút chọn file không có input file; bước 5 spinner chạy vĩnh viễn không bao giờ kết thúc. |
| **Kết nối Ví Blockchain** | **Chưa có (Not Implemented)** | [Navbar.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/components/layout/Navbar.tsx#L60) | Nút "Connect Wallet" trên header là giao diện tĩnh, không có thư viện Web3, không có sự kiện click. |
| **Smart Contract** | **Chưa có (Not Implemented)** | Toàn bộ repo (không có file `.sol`) | Chưa có hợp đồng đăng ký, tra cứu hay tiêu chuẩn NFT nào. |
| **Lưu trữ IPFS** | **Chưa có (Not Implemented)** | Toàn bộ repo | Chưa tích hợp dịch vụ lưu trữ phân tán, tệp sách chưa được lưu trữ thực tế. |
| **Backend & Cơ sở dữ liệu** | **Chưa có (Not Implemented)** | Toàn bộ repo | Không có API server hay hệ quản trị CSDL, đang dùng mảng tĩnh `MOCK_BOOKS`. |
| **Bộ kiểm thử tự động (Tests)** | **Chưa có (Not Implemented)** | `package.json` | Không có file kiểm thử (`.test.ts`, `.spec.tsx`), không có thư viện kiểm thử (Vitest, Jest). |
| **Build & Linting Pipeline** | **Đã xác minh (Verified)** | `npm run lint` (0 lỗi), `npm run build` (build thành công ra `dist/`) | Đạt chuẩn chất lượng mã nguồn TypeScript và Vite bundler. |

---

## 2. DANH SÁCH CHI TIẾT CÁC LỖI & VẤN ĐỀ KỸ THUẬT CẦN KHẮC PHỤC

### 2.1. Lỗi Thực thi Scripts (Nghiêm trọng cấp Runtime)
- **Thiếu script `"start"` trong `package.json`:**  
  *Nguyên nhân:* Vite mặc định sử dụng `"dev"` để chạy máy chủ phát triển, trong khi nhiều người dùng hoặc hệ thống CI/CD gõ lệnh `npm start`.  
  *Hậu quả:* Gây lỗi `npm error Missing script: "start"`.  
  *Giải pháp:* Thêm `"start": "vite"` vào phần scripts của `package.json`.

### 2.2. Lỗi Bộ định tuyến & Đứt gãy liên kết (Broken Routing)
1. **Liên kết tác giả bị hỏng:**  
   - Thẻ sách [BookCard.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/components/book/BookCard.tsx#L35) và trang chi tiết [BookDetail.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/BookDetail.tsx#L61) sử dụng `<Link to={/author/${book.authorId}}>`.  
   - Tuy nhiên, trong [App.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/App.tsx#L18) chỉ khai báo route `/authors` (không có tham số `:authorId`).  
   - *Hậu quả:* Độc giả bấm vào tên tác giả sẽ bị dẫn tới một màn hình trắng (không khớp route nào).
2. **Liên kết xem sổ cái on-chain bị hỏng:**  
   - Trong [BookDetail.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/BookDetail.tsx#L124) có link `<Link to={/copyright/record/${book.recordId}}>`.  
   - `App.tsx` không có route nào cho `/copyright/record/:id`.  
   - *Hậu quả:* Dẫn tới màn hình trống.
3. **Các trang danh mục & giới thiệu mới chỉ là Coming Soon hoặc thiếu route:**  
   - `/authors` và `/how-it-works` hiển thị thông báo "Coming Soon".  
   - Các liên kết ở chân trang (`/about`, `/faq`, `/terms`, `/privacy`, `/categories`) chưa có Route tương ứng trong `App.tsx`.

### 2.3. Lỗi Giao diện không có Logic (Dummy UI Components)
1. **Nút "Connect Wallet" trên Navbar:** Nằm tại [Navbar.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/components/layout/Navbar.tsx#L60), không có `onClick`, hoàn toàn không phản hồi khi bấm.
2. **Nút đọc sách "Read Work" & "Download PDF":** Trên [BookDetail.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/BookDetail.tsx#L47-L52), không có logic mở trình đọc sách (Epub/PDF reader) và không có file PDF đính kèm.
3. **Bộ lọc bản quyền trên Discover:** Hai thẻ `<input type="checkbox">` cho "Verified Only" và "Pending" tại [Discover.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Discover.tsx#L74-L77) không gắn state `checked` và không có sự kiện `onChange`. Danh sách sách lọc hiện chỉ chạy theo từ khóa tìm kiếm và danh mục thể loại.
4. **Bộ chọn sắp xếp (Sort Select):** Dropdown tại [Discover.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Discover.tsx#L86) không có `onChange` và không có hàm sắp xếp mảng.
5. **Nút chuyển hướng ở màn hình kết quả xác minh:** Nút "View Full Ledger Record" và "Register This Work" tại [Verify.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Verify.tsx#L115) và [#L133](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Verify.tsx#L133) không có handler điều hướng.

### 2.4. Khiếm khuyết Logic Nghiệp vụ & Dữ liệu
1. **Hàm băm giả lập SHA-256 chuỗi rỗng:**  
   [Verify.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Verify.tsx#L24) trả về hash cố định `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (là hash của chuỗi rỗng `""`) mà không đọc tệp người dùng chọn.
2. **Quy trình Đăng ký Stepper không duy trì State:**  
   [Register.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Register.tsx) không lưu các giá trị người dùng nhập vào React State. Khi ấn "Continue" sang bước sau, toàn bộ dữ liệu ở bước Review là văn bản cứng. Nút tải file ở bước 3 không có thẻ `<input type="file">`. Bước 5 hiển thị spinner xoay tròn vô tận không kết thúc.

### 2.5. Vấn đề Cấu trúc Tệp tin (Hygiene & Organization)
1. **Tệp CSS dư thừa:** [src/App.css](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/App.css) chứa 185 dòng CSS mặc định của template Vite, không được import vào dự án.
2. **Các thư mục rỗng chưa sử dụng:**
   - `src/components/copyright/`
   - `src/components/ui/`
   - `src/lib/`
   - `src/styles/`
3. **Chưa có Git Repository:** Thư mục dự án chưa khởi tạo git (`.git` không tồn tại), tiềm ẩn nguy cơ mất lịch sử sửa đổi mã nguồn nếu không quản lý phiên bản.

---

## 3. MA TRẬN PHÂN LOẠI MỨC ĐỘ ƯU TIÊN ĐỀ XUẤT (PRIORITY MATRIX)

Nhóm phát triển và AI tiếp nhận nên xử lý các hạng mục theo thứ tự ưu tiên sau:

| Mức độ | Hạng mục công việc | Mô tả hành động cụ thể |
|---|---|---|
| **P0 (Khẩn cấp)** | Khắc phục script khởi chạy | Bổ sung `"start": "vite"` vào `package.json` để lệnh `npm start` không bị crash. |
| **P0 (Khẩn cấp)** | Sửa lỗi Routing đứt gãy | Bổ sung route `/author/:id` và route `/copyright/record/:id` trong `App.tsx` hoặc tạm thời chuyển hướng về trang danh sách để không bị trang trắng. |
| **P1 (Quan trọng)** | Hoàn thiện Form State & Upload trong Register | Thêm `useState` quản lý dữ liệu form trong `Register.tsx`, thêm thẻ `<input type="file">`, tính hash thật cho file và hiển thị trạng thái hoàn tất thành công. |
| **P1 (Quan trọng)** | Tích hợp Web Crypto API thật trong Verify | Sử dụng `window.crypto.subtle.digest('SHA-256', buffer)` trong `Verify.tsx` để tính toán mã băm thực sự của file người dùng tải lên. |
| **P1 (Quan trọng)** | Kích hoạt bộ lọc & sắp xếp trong Discover | Gắn state và event handler cho Checkbox "Verified Only", "Pending" và Dropdown Sort trong `Discover.tsx`. |
| **P2 (Trung hạn)** | Triển khai Smart Contract & Web3 Connection | Viết hợp đồng `BookCopyrightRegistry.sol`, triển khai lên Sepolia testnet; tích hợp `ethers.js` hoặc `wagmi` để kết nối ví MetaMask thực tế trên Navbar và Register page. |
| **P2 (Trung hạn)** | Trình đọc sách số (Reader Viewer) | Tích hợp component đọc sách cơ bản (PDF Viewer / EPUB Viewer) khi người dùng bấm "Read Work" trên `BookDetail.tsx`. |
| **P3 (Dài hạn)** | Tích hợp IPFS Pinning | Sử dụng SDK Pinata hoặc Web3.Storage để lưu trữ file sách và metadata lên mạng IPFS phân tán. |
| **P3 (Dài hạn)** | Xây dựng Bộ kiểm thử (Automated Tests) | Thiết lập Vitest và React Testing Library để kiểm thử tự động các luồng tính hash, i18n, theme và lọc sách. |
| **P3 (Dọn dẹp)** | Dọn dẹp mã nguồn dư thừa | Xóa bỏ file `src/App.css` và quản lý phiên bản bằng `git init`. |
