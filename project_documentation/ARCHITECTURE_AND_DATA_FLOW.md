# ARCHITECTURE AND DATA FLOW — BOOKCHAIN LIBRARY
*(Tài liệu Kiến trúc Hệ thống, Phân rã Module và Luồng Dữ liệu)*

> **Phiên bản tài liệu:** 1.0.0  
> **Phạm vi:** Đối chiếu giữa kiến trúc triển khai thực tế (As-Built) và kiến trúc thiết kế mục tiêu (Target Architecture).

---

## 1. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ

Biểu đồ dưới đây thể hiện ranh giới rõ ràng giữa các thành phần **đã triển khai thực tế** trong mã nguồn và các thành phần **dự kiến trong tương lai**.

```mermaid
graph TB
    subgraph Client_App ["ỨNG DỤNG CLIENT (React 19 + TypeScript + Vite) [ĐÃ TRIỂN KHAI]"]
        direction TB
        subgraph UI_Layer ["Tầng Giao Diện (Vanilla CSS)"]
            P_Home["Trang Chủ (Home.tsx)"]
            P_Discover["Khám Phá Sách (Discover.tsx)"]
            P_Detail["Chi Tiết Sách (BookDetail.tsx)"]
            P_Verify["Xác Minh Bản Quyền (Verify.tsx)"]
            P_Register["Đăng Ký Bản Quyền (Register.tsx)"]
        end

        subgraph Core_Services ["Tầng Dịch Vụ & State"]
            Ctx_I18n["I18nContext (EN/VI LocalStorage)"]
            Ctx_Theme["ThemeContext (Light/Dark LocalStorage)"]
            Svc_Mock["Mock Data Service (mockData.ts)"]
        end

        UI_Layer --> Core_Services
    end

    subgraph Future_Backend ["TẦNG BACKEND & API [CHƯA TRIỂN KHAI / DỰ KIẾN]"]
        API_Gateway["API Gateway / Node.js Server"]
        DB_Relational[("Cơ sở dữ liệu Quan hệ / PostgreSQL")]
    end

    subgraph Future_Storage ["TẦNG LƯU TRỮ PHÂN TÁN [CHƯA TRIỂN KHAI / DỰ KIẾN]"]
        IPFS_Node["IPFS / Pinata (File Sách & Metadata CIDs)"]
    end

    subgraph Future_Blockchain ["TẦNG BLOCKCHAIN [CHƯA TRIỂN KHAI / DỰ KIẾN]"]
        Wallet_Ext["Ví Web3 (MetaMask / EIP-1193)"]
        SC_Registry["Smart Contract: BookCopyrightRegistry.sol"]
        EVM_Network["Mạng EVM (Ethereum / L2 / Testnet)"]
        
        Wallet_Ext --> SC_Registry
        SC_Registry --> EVM_Network
    end

    %% Ranh giới thực tế vs tương lai
    P_Discover -. "Đọc dữ liệu mẫu" .-> Svc_Mock
    P_Detail -. "Đọc dữ liệu mẫu" .-> Svc_Mock
    P_Verify -. "Giả lập băm & kiểm tra size" .-> P_Verify
    P_Register -. "Giả lập Stepper UI" .-> P_Register

    %% Kết nối tương lai
    Client_App -. "[Tương Lai] Ethers.js / RPC Call" .-> SC_Registry
    Client_App -. "[Tương Lai] Upload File & Pin" .-> IPFS_Node
    Client_App -. "[Tương Lai] REST/GraphQL API" .-> API_Gateway
    API_Gateway -. "[Tương Lai] CRUD Sách & Tác Giả" .-> DB_Relational
```

---

## 2. PHÂN TÍCH LUỒNG DỮ LIỆU ĐĂNG KÝ BẢN QUYỀN (REGISTER FLOW)

### 2.1. Luồng thực tế hiện tại (Simulated MVP)
Hiện tại, chức năng đăng ký tại [Register.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Register.tsx) là một quy trình Stepper 5 bước chỉ có giao diện tĩnh:

```mermaid
sequenceDiagram
    autonumber
    actor Author as Tác giả
    participant UI as Register.tsx
    
    Author->>UI: Bước 1: Nhập Tiêu đề, Thể loại, Tóm tắt (Uncontrolled Inputs)
    Author->>UI: Bấm 'Continue'
    Note over UI: Không lưu state vào bộ nhớ
    Author->>UI: Bước 2: Xem địa chỉ ví giả lập (0x71C...976F)
    Author->>UI: Bấm 'Continue'
    Author->>UI: Bước 3: Xem nút bấm Upload (Chưa có thẻ input file)
    Author->>UI: Bấm 'Continue'
    Author->>UI: Bước 4: Xem trang Review với dữ liệu hardcoded mẫu
    Author->>UI: Bấm 'Sign & Register'
    Note over UI: Bước 5: Hiển thị CSS Spinner "Awaiting Transaction..." vĩnh viễn
```

### 2.2. Luồng thiết kế chuẩn mục tiêu (Target Production Flow)
Khi tích hợp Web3 và IPFS trong giai đoạn tới, luồng đăng ký cần được triển khai như sau:

```mermaid
sequenceDiagram
    autonumber
    actor Author as Tác giả
    participant App as BookChain Client
    participant Web3 as Web3 Provider (MetaMask)
    participant IPFS as IPFS / Pinata
    participant SC as Smart Contract Registry
    
    Author->>App: 1. Kết nối ví cá nhân
    App->>Web3: eth_requestAccounts
    Web3-->>App: Trả về địa chỉ ví (Author Address)
    
    Author->>App: 2. Nhập Metadata & Chọn file sách (.pdf, .epub)
    App->>App: 3. Tính toán SHA-256 Content Hash ngay trong Browser (Web Crypto API)
    
    Author->>App: 4. Xác nhận đăng ký
    App->>IPFS: 5. Tải file sách & metadata lên IPFS
    IPFS-->>App: Trả về Content CID (ipfs://Qm...)
    
    App->>Web3: 6. Yêu cầu ký giao dịch gọi Smart Contract: registerWork(contentHash, ipfsCID, metadata)
    Web3->>Author: Hiển thị popup ký giao dịch & xác nhận Gas fee
    Author->>Web3: Ký duyệt
    Web3->>SC: Phát broadcast giao dịch lên EVM Blockchain
    SC->>SC: Kiểm tra chống trùng lặp (require hash chưa tồn tại)
    SC->>SC: Lưu struct CopyrightRecord & emit Event WorkRegistered
    SC-->>Web3: Transaction Receipt (Mã giao dịch TxHash, BlockNumber)
    Web3-->>App: Giao dịch thành công
    App->>Author: Hiển thị chứng nhận đăng ký thành công kèm On-Chain Record ID
```

---

## 3. PHÂN TÍCH LUỒNG DỮ LIỆU XÁC MINH BẢN QUYỀN (VERIFY FLOW)

### 3.1. Luồng thực tế hiện tại (Simulated MVP)
Chức năng xác minh tại [Verify.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Verify.tsx):

```mermaid
sequenceDiagram
    autonumber
    actor User as Độc giả / Người kiểm tra
    participant UI as Verify.tsx
    
    User->>UI: Chọn tệp bất kỳ từ máy tính
    UI->>UI: Bắt sự kiện onChange file
    UI->>UI: Chuyển sang bước CALCULATING (setTimeout 1500ms)
    UI->>UI: Gán cứng chuỗi SHA-256 rỗng: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    UI->>UI: Chuyển sang bước SEARCHING (setTimeout 1500ms)
    UI->>UI: Kiểm tra: selectedFile.size % 2 === 0
    alt Kích thước file chẵn
        UI->>User: Hiển thị màn hình NOT_FOUND ("No Match Found")
    else Kích thước file lẻ
        UI->>User: Hiển thị màn hình VERIFIED (Hardcoded Owner: "Elena Rostova", On-Chain ID: "0x3f...7a91")
    end
```

### 3.2. Luồng thiết kế chuẩn mục tiêu (Target Production Flow)
Khi tích hợp Smart Contract và Web Crypto API:

```mermaid
sequenceDiagram
    autonumber
    actor User as Độc giả / Người kiểm tra
    participant Browser as Web Crypto API
    participant RPC as Blockchain RPC Node (Alchemy/Infura)
    participant SC as Smart Contract Registry
    
    User->>Browser: Chọn file sách cần kiểm tra
    Browser->>Browser: Đọc ArrayBuffer & Tính SHA-256 = crypto.subtle.digest('SHA-256', buffer)
    Note over Browser: File không bao giờ rời khỏi thiết bị người dùng (Đảm bảo riêng tư)
    
    Browser->>RPC: Gọi view function: verifyWork(calculatedHash)
    RPC->>SC: Truy vấn mapping: copyrightRecords[calculatedHash]
    
    alt Hash tồn tại trên Smart Contract
        SC-->>RPC: Trả về struct: { author, registrationDate, ipfsCID, isVerified: true }
        RPC-->>Browser: Dữ liệu hồ sơ hợp lệ
        Browser->>User: Thông báo KHỚP BẢN QUYỀN: Hiển thị tên tác giả thực, ngày ký, CID
    else Hash chưa từng đăng ký
        SC-->>RPC: Trả về struct rỗng / false
        RPC-->>Browser: Record not found
        Browser->>User: Thông báo CHƯA ĐĂNG KÝ hoặc FILE ĐÃ BỊ CHỈNH SỬA
    end
```

---

## 4. LUỒNG TRUY CẬP VÀ HIỂN THỊ CHI TIẾT SÁCH (DISCOVER & BOOK DETAIL)

```mermaid
graph TD
    Start([Độc giả truy cập Thư viện]) --> DiscoverPage["Discover.tsx"]
    
    subgraph Discover_Logic ["Xử lý tại Discover.tsx"]
        ReadMock["Đọc danh sách MOCK_BOOKS từ mockData.ts"]
        InputSearch["Lọc theo searchTerm (title / author)"]
        SelectCategory["Lọc theo selectedCategory"]
        ReadMock --> InputSearch --> SelectCategory
        SelectCategory --> RenderGrid["Render danh sách BookCard.tsx"]
    end
    
    DiscoverPage --> Discover_Logic
    RenderGrid --> ClickBook["Độc giả click vào bìa hoặc tiêu đề sách"]
    ClickBook --> NavDetail["Điều hướng tới /book/:id"]
    
    subgraph Detail_Logic ["Xử lý tại BookDetail.tsx"]
        GetParam["useParams(): Lấy id (ví dụ 'b1')"]
        FindBook["Tìm sách trong MOCK_BOOKS theo id"]
        GetParam --> FindBook
        FindBook --> CheckStatus{"book.copyrightStatus === 'VERIFIED'?"}
        CheckStatus -- Đúng --> RenderVerified["Hiển thị Huy hiệu ON-CHAIN, Record ID, SHA-256, Chủ sở hữu"]
        CheckStatus -- Sai --> RenderUnverified["Hiển thị trạng thái Chưa xác minh & nút Đăng ký"]
    end
    
    NavDetail --> Detail_Logic
```

---

## 5. PHÂN BỔ DỮ LIỆU: ON-CHAIN VS OFF-CHAIN (MÔ HÌNH THIẾT KẾ)

Nhằm tối ưu chi phí lưu trữ (Gas optimization) và đảm bảo tính bất biến, hệ thống BookChain phân tách dữ liệu theo nguyên tắc:

| Loại Dữ liệu | Vị trí Lưu trữ | Cơ chế Đảm bảo | Lý do Kiến trúc |
|---|---|---|---|
| **Content Hash (SHA-256)** | **On-Chain (Smart Contract)** | Bất biến trên Blockchain ledger | Kích thước cố định (32 bytes / `bytes32`), chi phí gas cực thấp, chứng minh toàn vẹn tệp. |
| **Địa chỉ ví tác giả (Owner Address)** | **On-Chain (Smart Contract)** | `msg.sender` khi đăng ký | Xác định chủ sở hữu hợp đồng và người ký xác nhận bản quyền. |
| **Mốc thời gian (Block Timestamp)** | **On-Chain (Smart Contract)** | `block.timestamp` | Cung cấp bằng chứng tồn tại (Proof of Existence) độc lập với máy chủ tập trung. |
| **IPFS CID của file sách** | **On-Chain (Smart Contract)** | Lưu chuỗi CID (String / Multihash) | Cung cấp con trỏ phân tán tới nội dung sách mà không lưu cả file nặng lên blockchain. |
| **Toàn bộ nội dung file sách (PDF/EPUB)** | **Off-Chain (IPFS)** | Mã hóa định danh nội dung (Content-addressed) | Kích thước file sách lớn (vài MB đến hàng chục MB), không khả thi để lưu trực tiếp on-chain. |
| **Ảnh bìa sách & Mô tả chi tiết** | **Off-Chain (IPFS / Database)** | JSON Metadata Schema chuẩn hóa | Tối ưu hiển thị frontend và tìm kiếm văn bản đầy đủ (full-text search). |
