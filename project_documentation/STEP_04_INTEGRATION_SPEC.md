# BOOKCHAIN LIBRARY — STEP 04 INTEGRATION SPECIFICATION
## Smart Contract, Backend & Frontend Integration Guide

**Contract Name:** `BookCopyrightRegistry.sol`  
**Solidity Version:** `0.8.28`  
**License:** MIT  
**Target Networks:** Localhost (Chain ID: 31337), Ethereum Sepolia Testnet (Chain ID: 11155111)

---

## 1. TỔNG QUAN KIẾN TRÚC TÍCH HỢP

Triết lý cốt lõi: **"Library First, Copyright Second, Blockchain Underneath"**.

- **SQL Server:** Là nguồn chân lý (Source of Truth) cho dữ liệu nghiệp vụ: tiêu đề, tác giả, mô tả, nội dung file nhị phân, quyền đọc/tải, lịch sử phiên bản và kiểm toán nội bộ.
- **Blockchain (Smart Contract):** Là nguồn chân lý bất biến (Immutable Proof of Existence) cho chứng chỉ bản quyền tác giả: SHA-256 byte tệp (`bytes32`), định danh bản ghi, địa chỉ ví tác giả/người ghi, mốc thời gian khối và trạng thái hiệu lực (`ACTIVE`, `DISPUTED`, `REVOKED`).
- **Nội dung sách:** Tuyệt đối KHÔNG lưu nội dung tệp trực tiếp lên blockchain.

```
+-------------------------------------------------------------------------------+
|                             CLIENT (React 19 Frontend)                        |
|   - Compute local file SHA-256 (Web Crypto API)                               |
|   - View book metadata & version history                                      |
|   - Verify file authenticity directly via /verify                             |
|   - Author submits copyright claim request                                    |
+---------------------------------------+---------------------------------------+
                                        | HTTP API
+---------------------------------------v---------------------------------------+
|                       SERVER (Express + TypeScript Backend)                   |
|   - Verify user ownership & AUTHOR role                                       |
|   - Verify file byte integrity in storage/books/ (Node.js crypto SHA-256)     |
|   - Transition dbo.CopyrightRecords ('DRAFT' -> 'SUBMITTED' -> 'QUEUED')      |
|   - Sign & broadcast on-chain transaction using REGISTRAR wallet in .env      |
|   - Poll / listen for event & confirm into dbo.BlockchainTransactions         |
+-------------------+-----------------------------------+-----------------------+
                    | SQL Connection Pool               | JSON-RPC (ethers v6)
+-------------------v-------------------+       +-------v-----------------------+
|           SQL SERVER DATABASE         |       |   ETHEREUM SEPOLIA BLOCKCHAIN |
|  - dbo.Books                          |       |   BookCopyrightRegistry.sol   |
|  - dbo.BookFiles (Sha256 CHAR(64))    |       |   - registerCopyright(...)    |
|  - dbo.CopyrightRecords               |       |   - verifyHash(bytes32)       |
|  - dbo.BlockchainTransactions         |       |   - getCopyright(bytes32)     |
+---------------------------------------+       +-------------------------------+
```

---

## 2. ÁNH XẠ DỮ LIỆU (DATA MAPPING: SQL SERVER <-> TYPESCRIPT <-> SOLIDITY)

| Thuộc tính nghiệp vụ | SQL Server (`dbo`) | TypeScript Backend/Frontend | Smart Contract (`Solidity`) | Ghi chú chuyển đổi |
|---|---|---|---|---|
| **Mã bản ghi bản quyền** | `CopyrightRecords.CopyrightRecordId` (UNIQUEIDENTIFIER) | `recordId: string` (UUID) | `bytes32 recordId` | `uuidToBytes32(uuid)`: bỏ dấu gạch ngang, đệm zero 32 bytes |
| **Mã định danh sách** | `Books.BookId` (UNIQUEIDENTIFIER) | `bookId: string` (UUID) | `bytes32 bookId` | `uuidToBytes32(uuid)` |
| **Số thứ tự phiên bản** | `BookFiles.VersionNumber` (INT) | `versionNumber: number` | `uint32 versionNumber` | Nguyên dương (`> 0`) |
| **Mã băm nội dung tệp** | `BookFiles.Sha256` (CHAR(64)) | `sha256: string` (64 hex chars) | `bytes32 contentHash` | `sha256ToBytes32(sha256)`: chuẩn hóa lowercase, thêm tiền tố `0x` |
| **Địa chỉ ví tác giả** | `Wallets.Address` (VARCHAR(42)) | `authorWallet: string` | `address authorWallet` | Địa chỉ Ethereum 0x... 42 ký tự |
| **Địa chỉ người ghi** | N/A (Ví Backend REGISTRAR) | `registrant: string` | `address registrant` | Tự động lấy từ `msg.sender` |
| **Thời điểm ghi nhận** | `CopyrightRecords.SubmittedAt` | `registeredAt: number` | `uint64 registeredAt` | `uint64(block.timestamp)` tính theo epoch seconds |
| **Trạng thái bản ghi** | `CopyrightRecords.RecordStatus` | `status: 'ACTIVE' \| 'DISPUTED' \| 'REVOKED'` | `enum RecordStatus { ACTIVE, DISPUTED, REVOKED }` | `0 = ACTIVE`, `1 = DISPUTED`, `2 = REVOKED` |
| **Metadata URI / Tham chiếu**| N/A hoặc `BookFiles.StorageKey` | `metadataUri: string` | `string metadataUri` | IPFS CID (ví dụ `ipfs://Qm...`) hoặc URI canonical |

---

## 3. CHUẨN HÓA VÀ ĐỐI SOÁT SHA-256

1. **Tính toán SHA-256 tại nguồn:**
   - Backend tính từ chuỗi byte nhị phân của tệp đã lưu qua `crypto.createHash('sha256').update(buffer).digest('hex')`.
   - Frontend tính từ byte ArrayBuffer của tệp cục bộ qua `window.crypto.subtle.digest('SHA-256', buffer)`.
2. **Chuyển đổi sang `bytes32` trong TypeScript:**
   ```typescript
   export function sha256ToBytes32(sha256Hex: string): string {
     const clean = sha256Hex.trim().replace(/^0x/i, '').toLowerCase();
     if (clean.length !== 64 || /[^0-9a-f]/.test(clean)) {
       throw new Error(`Invalid SHA-256 hex string: length=${clean.length}`);
     }
     return `0x${clean}`;
   }
   ```
3. **Chuyển đổi ngược từ `bytes32` sang SHA-256 hex:**
   ```typescript
   export function bytes32ToSha256(bytes32Hex: string): string {
     const clean = bytes32Hex.trim().replace(/^0x/i, '').toLowerCase();
     return clean;
   }
   ```
4. **Quy tắc tuyệt đối:**
   - KHÔNG thay thế SHA-256 bằng `keccak256`.
   - Solidity lưu trực tiếp 32 bytes của SHA-256 trong kiểu `bytes32`.

---

## 4. VÒNG ĐỜI GIAO DỊCH VÀ MÁY TRẠNG THÁI (TRANSACTION LIFECYCLE)

### 4.1. Bảng trạng thái trong CSDL SQL Server

- **`dbo.CopyrightRecords`:**
  - `DRAFT`: Tác giả tạo bản ghi sơ thảo, chưa gửi xác nhận.
  - `SUBMITTED`: Tác giả đã ký/gửi yêu cầu đăng ký bản quyền.
  - `QUEUED`: Hệ thống đã đưa giao dịch vào hàng đợi chuẩn bị phát sóng blockchain.
  - `ON_CHAIN`: Giao dịch đã được xác nhận thành công trên blockchain, đã có `TxHash` và `BlockNumber`.
  - `FAILED`: Giao dịch bị revert hoặc thất bại quá số lần thử lại tối đa.
  - `DISPUTED`: Đang có khiếu nại tranh chấp sở hữu trí tuệ.
  - `WITHDRAWN`: Tác giả tự nguyện rút yêu cầu.

- **`dbo.BlockchainTransactions`:**
  - `QUEUED`: Tạo bản ghi lưu trữ trước khi phát sóng (`TxHash = NULL`).
  - `PENDING`: Đã gửi giao dịch lên RPC node (`TxHash` được ghi nhận).
  - `CONFIRMED`: Giao dịch có ít nhất 1 block confirmation.
  - `FAILED`: Giao dịch bị lỗi gas, revert hoặc rớt khỏi mempool.

### 4.2. Luồng thực thi chi tiết (Step 04 Workflow)

1. **Bước 1: Tác giả kích hoạt đăng ký bản quyền:**
   - Gửi yêu cầu `POST /api/copyright/register` kèm `bookId` và `bookFileId`.
   - Backend xác thực tác giả sở hữu (`PRIMARY_AUTHOR` hoặc `CO_AUTHOR`).
   - Tạo bản ghi trong `dbo.CopyrightRecords` với trạng thái `QUEUED`.
2. **Bước 2: Chuẩn bị giao dịch Blockchain:**
   - Mở Transaction SQL Server: Chèn bản ghi vào `dbo.BlockchainTransactions` (`Status = 'QUEUED'`, `TransactionType = 'REGISTER_COPYRIGHT'`).
   - Lấy `sha256` từ `dbo.BookFiles`, chuyển đổi sang `bytes32`.
   - Lấy ví tác giả từ `dbo.Wallets` (nếu đã liên kết, hoặc truyền địa chỉ rỗng nếu chưa liên kết).
3. **Bước 3: Phát sóng giao dịch (Broadcast):**
   - Backend khởi tạo ethers Contract instance với Signer từ biến môi trường `REGISTRAR_PRIVATE_KEY` / `SEPOLIA_PRIVATE_KEY`.
   - Kiểm tra trước trên smart contract:
     - `verifyHash(contentHash)`: Nếu đã tồn tại trên blockchain -> Cập nhật `CopyrightRecords.RecordStatus = 'ON_CHAIN'`, đối soát lại thông tin.
   - Gửi giao dịch: `contract.registerCopyright(recordId, bookId, versionNumber, contentHash, authorWallet, metadataUri)`.
   - Cập nhật ngay lập tức `dbo.BlockchainTransactions`: `TxHash = tx.hash`, `Status = 'PENDING'`, `SubmittedAt = GETDATE()`.
4. **Bước 4: Chờ xác nhận (Mining & Confirmation):**
   - Gọi `await tx.wait(1)`.
   - Khi có biên lai giao dịch (Receipt):
     - `BlockNumber = receipt.blockNumber`.
     - `Status = 'CONFIRMED'`, `ConfirmedAt = GETDATE()`.
     - Cập nhật `dbo.CopyrightRecords`: `RecordStatus = 'ON_CHAIN'`.
5. **Bước 5: Xử lý ngoại lệ và Đối soát phục hồi (Reconciliation):**
   - **Trường hợp lỗi mạng RPC hoặc Timeout:**
     - Giữ nguyên `Status = 'PENDING'`, ghi `ErrorMessage`.
     - Worker định kỳ (Reconciliation Cron) tra cứu `provider.getTransactionReceipt(TxHash)`.
     - Nếu receipt thành công: cập nhật hoàn tất `CONFIRMED`.
   - **Trường hợp Blockchain đã ghi nhận nhưng SQL Server crash:**
     - Trước khi gửi lại, luôn gọi `contract.verifyHash(contentHash)`.
     - Nếu đã `exists == true`: cập nhật ngay SQL Server về trạng thái `ON_CHAIN` dựa trên dữ liệu on-chain, KHÔNG gửi lại transaction lặp (chống lãng phí gas và tránh lỗi `HashAlreadyRegistered`).
   - **Trường hợp Revert (ví dụ vi phạm quyền):**
     - Cập nhật `BlockchainTransactions.Status = 'FAILED'`, `CopyrightRecords.RecordStatus = 'FAILED'`.
     - Thông báo lỗi chi tiết cho người dùng.

---

## 5. TÀI NGUYÊN SMART CONTRACT CÓ SẴN CHO BƯỚC 04

- **Smart Contract ABI:**
  - `server/contracts/BookCopyrightRegistry.json`
  - `server/contracts/BookCopyrightRegistry.ts` (Type-safe const ABI)
  - `src/contracts/BookCopyrightRegistry.json`
  - `src/contracts/BookCopyrightRegistry.ts`
- **Địa chỉ đã triển khai:**
  - `deployments/hardhat.json` (Local)
  - `src/contracts/deployedAddresses.json`
  - `server/contracts/deployedAddresses.json`
- **Hàm tiện ích mật mã:**
  - `server/blockchain/utils.ts` (`sha256ToBytes32`, `bytes32ToSha256`, `uuidToBytes32`, `stringIdToBytes32`)
  - `src/utils/blockchain.ts` (`sha256ToBytes32`, `bytes32ToSha256`, `shortenAddress`, `uuidToBytes32`)
