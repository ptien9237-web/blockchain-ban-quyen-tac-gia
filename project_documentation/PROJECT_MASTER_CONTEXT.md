# BOOKCHAIN LIBRARY — PROJECT MASTER CONTEXT
*(Tài liệu Bối cảnh và Hồ sơ Tổng thể Dự án dành cho Nhà phát triển & AI Handoff)*

> **Phiên bản tài liệu:** 1.0.0  
> **Ngày lập hồ sơ:** 11/10/2026  
> **Phương pháp khảo sát:** Phân tích tĩnh toàn bộ mã nguồn, cấu hình, nhật ký kiểm thử và chạy thử nghiệm thực tế (Static Code Audit & Runtime Validation).

---

## 1. TỔNG QUAN DỰ ÁN & BỐI CẢNH BÀI TOÁN

### 1.1. Tên dự án
**BookChain Library** (Tên gói package: `bookchain` v0.0.0).

### 1.2. Tuyên ngôn & Tầm nhìn Cốt lõi
> **"LIBRARY FIRST, COPYRIGHT SECOND, BLOCKCHAIN UNDERNEATH."**  
> *(Ưu tiên Trải nghiệm Thư viện; Quản lý Bản quyền là Lớp thứ hai; Công nghệ Blockchain vận hành ngầm bên dưới).*

Dự án định vị là một **Thư viện số cao cấp kết hợp Sổ cái đăng ký và xác minh bản quyền tác phẩm bất biến**. Khác biệt với các dự án Web3/Crypto thông thường (vốn ngập tràn dashboard đầu cơ, giá token, kết nối ví bắt buộc), BookChain hướng tới phong cách **"Archival Reading Room"** (Phòng đọc Lưu trữ Học thuật):
- **Độc giả & Nhà nghiên cứu:** Tận hưởng trải nghiệm đọc sách số thanh lịch, tĩnh lặng, không bị phiền nhiễu bởi các thao tác Web3. Không yêu cầu kết nối ví để đọc hay tra cứu sách.
- **Tác giả & Nhà xuất bản:** Có công cụ xác lập bằng chứng công khai, không thể chối cãi về quyền tác giả thông qua băm mật mã (Cryptographic Hashing) và ghi nhận quyền sở hữu lên blockchain.
- **Lớp Blockchain:** Hoạt động âm thầm ở tầng hạ tầng, chỉ xuất hiện khi tác giả đăng ký tác phẩm hoặc khi người dùng có nhu cầu kiểm tra tính xác thực của file sách.

### 1.3. Bối cảnh bài toán Bản quyền Tác giả Sách
Trong kỷ nguyên số, các tác phẩm sách điện tử đối mặt với:
1. **Sao chép lậu và phân phối trái phép:** Dễ dàng nhân bản không giới hạn mà không để lại dấu vết.
2. **Chiếm đoạt quyền tác giả / Đạo văn:** Khó chứng minh ai là người sở hữu tác phẩm đầu tiên nếu thiếu một mốc thời gian (timestamp) đáng tin cậy.
3. **Sự tập trung và thiếu minh bạch của cơ sở dữ liệu truyền thống:** Dữ liệu bản quyền do các đơn vị tập trung lưu giữ có nguy cơ bị sửa đổi, xóa bỏ hoặc ngừng hoạt động.

BookChain giải quyết bài toán này bằng cách:
- Sử dụng hàm băm mật mã (SHA-256) để tạo "dấu vân tay số" độc nhất cho từng file sách.
- Ghi nhận `Content Hash`, địa chỉ ví của tác giả, metadata và thời gian đăng ký lên Blockchain ledger không thể sửa đổi (immutable).
- Cho phép bất kỳ ai tải file lên để tự động tính toán mã băm trong trình duyệt và kiểm tra đối soát với sổ cái công khai mà không cần tin tưởng bên thứ ba.

---

## 2. CÔNG NGHỆ VÀ KIẾN TRÚC TỔNG THỂ

### 2.1. Tech Stack hiện tại (Frontend MVP)
| Tầng | Công nghệ / Thư viện | Phiên bản | Ghi chú bằng chứng (`package.json`) |
|---|---|---|---|
| **Core Framework** | React | `^19.2.8` | Sử dụng React 19 mới nhất |
| **DOM Engine** | React DOM | `^19.2.8` | |
| **Language** | TypeScript | `~6.0.2` | Strict typing, Target `es2023`, Bundler resolution |
| **Build Tool & Server** | Vite | `^8.3.0` | `@vitejs/plugin-react` `^6.1.1` |
| **Routing** | React Router DOM | `^7.18.4` | Router v7 dạng Declarative `<Routes>` / `<Route>` |
| **Icons** | Lucide React | `^1.52.0` | Thư viện icon tối giản |
| **Linter** | Oxlint | `^1.81.0` | Linter hiệu năng cao Rust-based |
| **Styling** | Vanilla CSS + Design Tokens | Custom | Không dùng TailwindCSS (tuân thủ nghiêm ngặt quy định) |
| **State Management** | React Context API | Custom | `I18nContext`, `ThemeContext` kết hợp `localStorage` |

### 2.2. Hiện trạng Backend & Database
- **Backend:** **CHƯA CÓ**. Không có máy chủ Node.js/Express, NestJS hay bất kỳ API server nào. Toàn bộ logic ứng dụng hiện chạy 100% Client-side.
- **Database:** **CHƯA CÓ**. Không có PostgreSQL, MongoDB hay SQLite.
- **Dữ liệu hiện tại:** Lưu trữ mẫu dưới dạng Mock Data trong file [mockData.ts](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/services/mockData.ts).

### 2.3. Hiện trạng Smart Contract & Blockchain
- **Smart Contract:** **CHƯA CÓ**. Trong toàn bộ workspace không có file Solidity (`.sol`), Vyper, Hardhat config, Foundry (`foundry.toml`) hay Truffle.
- **Web3 Provider / RPC:** Chưa tích hợp thư viện `ethers.js`, `viem` hay `wagmi`.
- **Thao tác Blockchain:** Toàn bộ quá trình kết nối ví, ký giao dịch on-chain, và tra cứu ID trên ledger hiện đang là **MÔ PHỎNG (MOCK)** bằng `setTimeout` và chuỗi địa chỉ giả lập (`0x71C...976F`, `0x3f...7a91`).

### 2.4. Hiện trạng IPFS / Lưu trữ phân tán
- **IPFS:** **CHƯA CÓ**. Chưa tích hợp Pinata, Infura IPFS, Web3.Storage hay `kubo`/`helia`. Đang ở mức mô tả giao diện và kế hoạch.

---

## 3. CẤU TRÚC THƯ MỤC THỰC TẾ

```
Bản Quyền Tác Giả Sách/
├── .gemini/                       # Cấu hình IDE & công cụ nội bộ (.gemini/settings.json, skills/impeccable)
├── .gitignore                     # Cấu hình bỏ qua git (node_modules, dist, logs, v.v.)
├── .oxlintrc.json                 # Cấu hình Oxlint (react, typescript, oxc plugins)
├── DESIGN.md                      # Tài liệu thiết kế hệ thống "Archival Reading Room"
├── PRODUCT.md                     # Tài liệu định hướng sản phẩm & phạm vi
├── PROJECT_WORKFLOW.txt           # Nhật ký lịch sử các bước phát triển ban đầu
├── README.md                      # Tài liệu giới thiệu tổng quan dự án
├── index.html                     # HTML Entry point
├── package.json                   # Khai báo dependency và scripts
├── package-lock.json              # Lock file dependency
├── tsconfig.json                  # TS root config (project references)
├── tsconfig.app.json              # TS client config (src)
├── tsconfig.node.json             # TS node config (vite.config.ts)
├── vite.config.ts                 # Cấu hình Vite bundler
├── public/
│   ├── favicon.svg                # Favicon BookChain
│   └── icons.svg                  # Asset icons SVG
├── dist/                          # Thư mục build output (đã kiểm thử build thành công)
│   ├── assets/
│   ├── favicon.svg
│   ├── icons.svg
│   └── index.html
└── src/
    ├── main.tsx                   # React root entry (gắn Providers & render DOM)
    ├── App.tsx                    # Định nghĩa bộ định tuyến React Router
    ├── App.css                    # [DEAD CODE] CSS mặc định thừa từ template Vite (không sử dụng)
    ├── index.css                  # Toàn bộ Design Tokens, typography và utility classes
    ├── assets/                    # Hình ảnh tĩnh (hero.png, react.svg, vite.svg)
    ├── components/
    │   ├── book/
    │   │   ├── BookCard.tsx       # Component thẻ hiển thị sách trong danh mục
    │   │   └── BookCard.css       # CSS style thẻ sách
    │   ├── copyright/             # [THƯ MỤC RỖNG] Chưa chứa component nào
    │   ├── layout/
    │   │   ├── Header / Navbar:
    │   │   │   ├── Navbar.tsx     # Thanh điều hướng (Logo, NavLinks, Lang/Theme toggle, Wallet button)
    │   │   │   └── Navbar.css
    │   │   ├── Footer:
    │   │   │   ├── Footer.tsx     # Chân trang thông tin, liên kết pháp lý & bản quyền
    │   │   │   └── Footer.css
    │   │   └── Layout.tsx / .css  # Khung bao bọc layout chung (Header + Main + Footer)
    │   └── ui/                    # [THƯ MỤC RỖNG] Chưa chứa UI primitives
    ├── contexts/
    │   ├── I18nContext.tsx        # Context đa ngôn ngữ EN / VI (lưu localStorage 'bookchain_lang')
    │   └── ThemeContext.tsx       # Context giao diện Sáng / Tối (lưu localStorage 'bookchain_theme')
    ├── i18n/
    │   ├── en.ts                  # Từ điển chuỗi giao diện tiếng Anh (139 keys)
    │   ├── vi.ts                  # Từ điển chuỗi giao diện tiếng Việt (139 keys)
    │   └── index.ts               # Export map translations & TranslationKey type
    ├── lib/                       # [THƯ MỤC RỖNG] Chưa có utility library
    ├── pages/
    │   ├── Home.tsx / Home.css        # Trang chủ: Hero banner, Triết lý sản phẩm, Sách nổi bật
    │   ├── Discover.tsx / Discover.css# Trang khám phá: Tìm kiếm, lọc theo thể loại, danh sách thẻ sách
    │   ├── BookDetail.tsx / .css      # Trang chi tiết: Thông tin sách, Hồ sơ bản quyền lưu trữ
    │   ├── Verify.tsx / Verify.css    # Trang xác minh: Upload file, tính hash mô phỏng, đối chiếu ledger
    │   └── Register.tsx / Register.css# Trang đăng ký: Stepper 5 bước khai báo tác phẩm & mô phỏng ký ví
    ├── services/
    │   └── mockData.ts            # Schema dữ liệu Book, danh mục, và mảng 6 cuốn sách mẫu
    └── styles/                    # [THƯ MỤC RỖNG] Toàn bộ style đang đặt tại index.css và CSS modules
```

---

## 4. MÔ HÌNH DỮ LIỆU HIỆN TẠI

Được định nghĩa tại [src/services/mockData.ts](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/services/mockData.ts):

### 4.1. Interface `Book`
```typescript
export interface Book {
  id: string;               // Mã định danh nội bộ sách (ví dụ: 'b1', 'b2')
  title: string;            // Tiêu đề sách
  author: string;           // Tên tác giả hiển thị
  authorId: string;         // Mã định danh tác giả (ví dụ: 'a1', 'a2')
  coverImage?: string;      // Đường dẫn ảnh bìa (tùy chọn)
  category: string;         // Thể loại ('Fiction', 'Non-Fiction', 'Academic', 'Poetry', 'Philosophy', 'Science', 'History')
  year: number;             // Năm xuất bản/sáng tác
  copyrightStatus: 'VERIFIED' | 'PENDING' | 'UNREGISTERED'; // Trạng thái bản quyền
  recordId?: string;        // Mã định danh hồ sơ on-chain (ví dụ: '0x3f...7a91')
  description: string;      // Tóm tắt nội dung tác phẩm
}
```

### 4.2. Dữ liệu mẫu (6 tác phẩm tiêu biểu)
1. `b1`: *The Architecture of Decentralization* — Elena Rostova (`VERIFIED`, Record `0x3f...7a91`)
2. `b2`: *Silent Consensus* — Marcus Chen (`VERIFIED`, Record `0x9b...1c44`)
3. `b3`: *Memories of a Paper World* — Sarah Jenkins (`PENDING`)
4. `b4`: *Cryptographic Primitives in Practice* — Dr. Alan Turing Jr. (`VERIFIED`, Record `0x1a...00f2`)
5. `b5`: *The Last Editor* — Marcus Chen (`UNREGISTERED`)
6. `b6`: *Beyond the Chain: Social Implications* — Elena Rostova (`VERIFIED`, Record `0x5e...2b88`)

---

## 5. CÁC HỆ THỐNG TOÀN CỤC ĐÃ HOÀN THÀNH

### 5.1. Hệ thống Đa ngôn ngữ (Bilingual System EN/VI)
- **Tệp nguồn:** [I18nContext.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/contexts/I18nContext.tsx), [en.ts](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/i18n/en.ts), [vi.ts](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/i18n/vi.ts).
- Khả năng: Chuyển đổi qua lại giữa tiếng Anh và tiếng Việt qua nút bấm trên Navbar; lưu trạng thái vào `localStorage` key `'bookchain_lang'`.
- Hỗ trợ tham số nội suy (ví dụ `{year}`, `{count}`).
- **Nguyên tắc biên giới dữ liệu:** Toàn bộ chuỗi giao diện được dịch đầy đủ 100%. Tuy nhiên dữ liệu sách nguyên bản (tiêu đề, tên tác giả, mô tả chi tiết, hash) được giữ nguyên không dịch nhằm bảo toàn tính toàn vẹn văn bản.

### 5.2. Hệ thống Giao diện Sáng/Tối (Theme System)
- **Tệp nguồn:** [ThemeContext.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/contexts/ThemeContext.tsx), [index.css](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/index.css).
- Khả năng: Đổi chủ đề Sáng (Ivory Paper) và Tối (Archival Reading Room at Night) bằng cách toggle class `.dark` trên thẻ `<html>` (`document.documentElement`). Lưu cấu hình vào `localStorage` key `'bookchain_theme'`.
- Hệ màu được kiểm soát độ tương phản chặt chẽ, sử dụng biến CSS token chuẩn hóa.

---

## 6. CÁC QUYẾT ĐỊNH KỸ THUẬT QUAN TRỌNG ĐÃ XÁC MINH

1. **Từ chối thẩm mỹ Crypto sặc sỡ:** Giao diện được xây dựng theo phong cách "Học thuật/Lưu trữ" với font có chân `Libre Baskerville` cho tiêu đề, `Public Sans` cho nội dung, và `Space Mono` cho mã băm và ID blockchain.
2. **Không dùng Tailwind CSS:** Tuân thủ triệt để Vanilla CSS kết hợp CSS variables và component-scoped CSS.
3. **Phân tách rạch ròi giữa Reader và Author:** Độc giả bình thường không bắt buộc phải có ví Web3 để đọc, tìm kiếm hay xác minh sách. Ví chỉ được dùng khi tác giả đăng ký bản quyền.
4. **Build & Type Check sạch sẽ:** `tsc -b && vite build` tạo bundle production hoàn chỉnh (0 lỗi TypeScript, 0 lỗi build).

---

## 7. CÁC VẤN ĐỀ TỒN TẠI VÀ LỖI CẦN LƯU Ý

1. **Thiếu script `npm start`:** Lệnh `npm start` của người dùng thất bại vì `package.json` chỉ có `"dev"`, `"build"`, `"lint"`, `"preview"`.
2. **Các Route liên kết bị hỏng (Broken Routing / Dead Links):**
   - `<Link to="/author/${book.authorId}">` trong [BookCard.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/components/book/BookCard.tsx#L35) và [BookDetail.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/BookDetail.tsx#L61) trỏ tới `/author/:id`, nhưng `App.tsx` chỉ có route `/authors` (hiển thị Coming Soon), dẫn đến hiển thị trang trống.
   - `<Link to="/copyright/record/${book.recordId}">` trong [BookDetail.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/BookDetail.tsx#L124) không có route tương ứng trong `App.tsx`.
3. **Các nút giao diện không có Event Handler (Dummy UI Buttons):**
   - Nút "Connect Wallet" trên Navbar không có `onClick`.
   - Nút "Read Work" và "Download PDF" trên `BookDetail.tsx` không có `onClick` và không có file đính kèm.
   - Checkbox "Verified Only" và "Pending" trên `Discover.tsx` không có `onChange`, không liên kết với `filter()`.
   - Dropdown sắp xếp trên `Discover.tsx` không có `onChange`.
   - Nút "Filters" trên `Discover.tsx` không có `onClick`.
   - Nút "View Full Ledger Record" và "Register This Work" trên màn hình kết quả của `Verify.tsx` không có `onClick`.
4. **Mô phỏng Băm và Xác minh Giả lập (Mocked Hashing):**
   - [Verify.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Verify.tsx#L24) không đọc file buffer thực tế mà gán cứng chuỗi `e3b0c442...` (chính là SHA-256 của chuỗi rỗng `""`).
   - Logic xác minh dựa vào tính chẵn lẻ của kích thước file (`selectedFile.size % 2 === 0 ? 'NOT_FOUND' : 'VERIFIED'`).
5. **Form Đăng ký Stepper chưa có State Binding (Uncontrolled Form):**
   - Form trong [Register.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Register.tsx) không lưu trữ giá trị nhập của người dùng qua các bước.
   - Nút upload file ở Bước 3 không có thẻ `<input type="file">`.
   - Bước 5 (Ký ví) hiển thị spinner vô tận mà không có điểm dừng, không có thông báo thành công hoặc thất bại.
6. **Mã nguồn dư thừa (Dead Code) & Thư mục rỗng:**
   - File [src/App.css](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/App.css) là mã dư thừa từ template Vite ban đầu, không được import vào bất kỳ đâu.
   - Các thư mục rỗng: `src/components/copyright/`, `src/components/ui/`, `src/lib/`, `src/styles/`.
7. **Workspace chưa khởi tạo Git:** Workspace hiện tại không nằm trong git repository.

---

## 8. HƯỚNG DẪN DÀNH CHO AI TIẾP THEO

Khi tiếp nhận dự án này để phát triển các giai đoạn tiếp theo:
1. **Tuân thủ phân tầng:** Luôn ưu tiên trải nghiệm Thư viện số (`Library First`) trước khi mở rộng chức năng Bản quyền (`Copyright Second`), sau đó mới đến Hạ tầng Blockchain (`Blockchain Underneath`).
2. **Không tự ý cài đặt Tailwind CSS:** Dự án sử dụng hệ thống Design Token trong `src/index.css`. Mọi style mới phải tuân theo cấu trúc biến màu và font đã định nghĩa.
3. **Phương án nâng cấp Web3:**
   - Khi triển khai Smart Contract, nên tạo một thư mục độc lập (ví dụ `contracts/` hoặc workspace Hardhat/Foundry riêng) hoặc cấu hình monorepo, tránh làm xáo trộn cấu trúc Vite frontend.
   - Thay thế việc giả lập hash trong `Verify.tsx` bằng Web Crypto API tiêu chuẩn của trình duyệt (`window.crypto.subtle.digest('SHA-256', buffer)`).
4. **Kiểm tra tác động trước khi sửa:** Mỗi khi bổ sung Route mới trong `App.tsx`, hãy kiểm tra các liên kết tương ứng trong `Navbar.tsx`, `Footer.tsx`, `BookCard.tsx`, và `BookDetail.tsx`.
