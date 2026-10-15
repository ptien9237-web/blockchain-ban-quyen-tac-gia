# BLOCKCHAIN AND COPYRIGHT — BOOKCHAIN LIBRARY
*(Chuyên khảo về Nghiệp vụ Bản quyền Tác phẩm và Ứng dụng Công nghệ Blockchain)*

> **Phiên bản:** 1.0.0  
> **Tác giả tài liệu:** Senior Blockchain Architect & Software Engineer  
> **Cảnh báo cốt lõi:** *Việc lưu một mã băm (hash) lên sổ cái blockchain chỉ chứng minh sự tồn tại của tệp tại một thời điểm nhất định (Proof of Existence). Nó không đồng nghĩa và không tự động thay thế thủ tục pháp lý công nhận tư cách tác giả hợp pháp.*

---

## 1. THỰC TRẠNG TRIỂN KHAI BLOCKCHAIN TRONG DỰ ÁN

Qua khảo sát toàn diện mã nguồn, **HIỆN TẠI DỰ ÁN CHƯA CÓ SMART CONTRACT HOẶC MÃ NGUỒN BLOCKCHAIN NÀO ĐƯỢC TRIỂN KHAI**.
- **Mã nguồn Smart Contract (`.sol`, `.vy`):** Không tồn tại trong workspace.
- **Thư viện Web3 (`ethers`, `web3.js`, `viem`, `wagmi`):** Chưa được cài đặt trong `package.json`.
- **Mạng thử nghiệm (Testnet / Mainnet):** Chưa cấu hình chain ID, RPC endpoint hay deployment script.
- **Tương tác Blockchain trên giao diện:** Toàn bộ là **mô phỏng giao diện (Mock UI)** bằng cách hiển thị các chuỗi địa chỉ tĩnh (ví dụ: `0x71C...976F`, `0x3f...7a91`, `Ethereum (Mock)`).

Dưới đây là phân tích chi tiết về cơ chế hiện tại, khoảng cách kỹ thuật và thiết kế kiến trúc chuẩn mực để nhóm phát triển tiếp tục thực hiện.

---

## 2. CƠ CHẾ BĂM MẬT MÃ (CRYPTOGRAPHIC HASHING) & XÁC MINH BẢN QUYỀN

### 2.1. Đánh giá thuật toán hiện tại trong mã nguồn
Trong tệp [Verify.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Verify.tsx#L24) và [BookDetail.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/BookDetail.tsx#L111):
- Mã nguồn đang sử dụng chuỗi hash gán cứng:
  `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- **Phát hiện chuyên môn:** Chuỗi hex 64 ký tự này là **mã băm SHA-256 của chuỗi rỗng (`""`)**. Điều này chứng minh chức năng băm hiện tại là bản mẫu tĩnh (placeholder), chưa hề đọc luồng byte thực tế của file người dùng tải lên.
- **Quy tắc xác minh giả lập:** [Verify.tsx](file:///c:/Users/tien/Desktop/H%E1%BB%8Dc/C%C3%B4ng%20Ngh%E1%BB%87%20BlockChain/C%C3%B4ng%20ngh%C3%AA%20BlockChain/B%E1%BA%A3n%20Quy%E1%BB%81n%20T%C3%A1c%20Gi%E1%BA%A3%20S%C3%A1ch/src/pages/Verify.tsx#L27) sử dụng điều kiện `selectedFile.size % 2 === 0 ? 'NOT_FOUND' : 'VERIFIED'`.

### 2.2. Giải pháp kỹ thuật chuẩn hóa (Web Crypto API)
Để băm file thực tế mà không cần gửi file sách lên server (đảm bảo quyền riêng tư của tác giả), frontend cần sử dụng `SubtleCrypto` tích hợp sẵn trong trình duyệt:

```typescript
// Triển khai chuẩn trong src/lib/crypto.ts
export async function calculateFileSha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

## 3. THIẾT KẾ SMART CONTRACT ĐỀ XUẤT (BOOKCHAIN COPYRIGHT REGISTRY)

Để hiện thực hóa mục tiêu đã nêu trong tài liệu dự án, smart contract cần được xây dựng theo chuẩn Solidity v0.8.20+ với mô hình đăng ký bản quyền tối giản và hiệu quả chi phí (Gas-efficient).

### 3.1. Cấu trúc dữ liệu đề xuất (Proposed On-Chain Data Model)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BookCopyrightRegistry {
    struct CopyrightRecord {
        bytes32 contentHash;      // Mã băm SHA-256 của tệp sách (32 bytes)
        address authorWallet;     // Địa chỉ ví của tác giả đăng ký
        uint256 timestamp;        // Mốc thời gian khối (Block timestamp)
        string ipfsCid;           // Địa chỉ định danh phân tán trên IPFS (Multihash CID)
        string title;             // Tiêu đề tác phẩm
        string authorDisplayName; // Tên tác giả hiển thị
        bool isRevoked;           // Đánh dấu nếu hồ sơ bị thu hồi hoặc tranh chấp
    }

    // Tra cứu bản ghi theo Content Hash độc nhất
    mapping(bytes32 => CopyrightRecord) public recordsByHash;
    
    // Tra cứu danh sách hash của một tác giả
    mapping(address => bytes32[]) public authorWorks;

    event CopyrightRegistered(
        bytes32 indexed contentHash,
        address indexed authorWallet,
        uint256 timestamp,
        string ipfsCid,
        string title
    );

    event CopyrightTransferred(
        bytes32 indexed contentHash,
        address indexed previousOwner,
        address indexed newOwner
    );

    /// @notice Đăng ký bản quyền tác phẩm mới
    function registerWork(
        bytes32 _contentHash,
        string calldata _ipfsCid,
        string calldata _title,
        string calldata _authorDisplayName
    ) external {
        require(_contentHash != bytes32(0), "Invalid content hash");
        require(recordsByHash[_contentHash].timestamp == 0, "Work already registered on-chain");
        require(bytes(_ipfsCid).length > 0, "IPFS CID required");

        recordsByHash[_contentHash] = CopyrightRecord({
            contentHash: _contentHash,
            authorWallet: msg.sender,
            timestamp: block.timestamp,
            ipfsCid: _ipfsCid,
            title: _title,
            authorDisplayName: _authorDisplayName,
            isRevoked: false
        });

        authorWorks[msg.sender].push(_contentHash);

        emit CopyrightRegistered(_contentHash, msg.sender, block.timestamp, _ipfsCid, _title);
    }

    /// @notice Tra cứu và xác minh bản quyền
    function verifyWork(bytes32 _contentHash) external view returns (
        bool exists,
        address authorWallet,
        uint256 timestamp,
        string memory ipfsCid,
        string memory title,
        string memory authorDisplayName
    ) {
        CopyrightRecord memory r = recordsByHash[_contentHash];
        if (r.timestamp == 0 || r.isRevoked) {
            return (false, address(0), 0, "", "", "");
        }
        return (true, r.authorWallet, r.timestamp, r.ipfsCid, r.title, r.authorDisplayName);
    }
}
```

---

## 4. VAI TRÒ CỦA NFT TRONG QUẢN LÝ BẢN QUYỀN SÁCH

### 4.1. Thực tế trong mã nguồn
Trong codebase hiện tại, **KHÔNG CÓ TIÊU CHUẨN NFT NÀO (ERC-721, ERC-1155) ĐƯỢC ÁP DỤNG HOẶC ĐỀ CẬP TRONG MÃ NGUỒN**.

### 4.2. Phân tích kiến trúc: Có nên dùng NFT để đại diện bản quyền tác giả không?
1. **Sự nhầm lẫn phổ biến giữa NFT và Quyền tác giả:**
   - Việc nắm giữ một NFT token **không mặc nhiên đồng nghĩa với việc sở hữu bản quyền tác phẩm** theo luật sở hữu trí tuệ quốc tế (ví dụ: Công ước Berne).
   - Nếu mint NFT cho cuốn sách, NFT đó thường chỉ đại diện cho một ấn bản kỹ thuật số (Digital Edition) hoặc chứng chỉ số hóa (Digital Certificate), tương tự như việc mua một cuốn sách giấy có chữ ký tác giả chứ không phải sở hữu quyền tác giả của cuốn sách.
2. **Khuyến nghị kiến trúc cho BookChain:**
   - **Tầng cốt lõi:** Nên sử dụng sổ cái đăng ký dạng Registry (như hợp đồng `BookCopyrightRegistry` ở mục 3), trong đó bản quyền được gắn trực tiếp với `contentHash` và chữ ký mã hóa của tác giả.
   - **Tầng mở rộng (Giai đoạn sau):** Nếu muốn thương mại hóa, có thể phát hành NFT dạng **ERC-721 Bản quyền độc bản (Master Copyright NFT)** để cho phép tác giả chuyển nhượng quyền khai thác thương mại, hoặc **ERC-1155 (Ấn bản độc giả)** để độc giả mua quyền truy cập sách có giới hạn.

---

## 5. PHÂN BIỆT GIỮA XÁC THỰC MẬT MÃ VÀ PHÁP LÝ BẢN QUYỀN

Một trong những nguyên tắc cốt lõi của việc kiểm toán dự án này là **không được thần thánh hóa khả năng của blockchain**.

| Khía cạnh | Khả năng thực tế của Blockchain | Giới hạn & Điểm mù thực tế |
|---|---|---|
| **Bằng chứng tồn tại (Proof of Existence)** | Tuyệt đối: Chứng minh tệp cụ thể đã tồn tại trước khối `B` tại thời điểm `T`. | Không thể chứng minh ai là người thực sự viết ra nội dung của tệp đó. |
| **Tính toàn vẹn tệp (Integrity)** | Tuyệt đối: Phát hiện ngay lập tức bất kỳ sự thay đổi nào dù chỉ 1 dấu chấm, 1 ký tự (nhờ hàm băm SHA-256). | Nếu kẻ xấu đổi một dấu cách trong bản thảo, mã băm sẽ thay đổi hoàn toàn (Hash mismatch), khiến hệ thống không thể so sánh nội dung tương đồng. |
| **Chống giả mạo (Anti-tamper)** | Tuyệt đối: Không ai (kể cả ban quản trị) sửa được bản ghi đã ghi lên blockchain. | Vấn đề "Rác vào - Rác ra" (Garbage In, Garbage Out): Nếu kẻ đạo văn đăng ký tác phẩm của người khác lên trước, blockchain sẽ ghi nhận kẻ đạo văn là người đăng ký đầu tiên. |
| **Giá trị pháp lý** | Là chứng cứ kỹ thuật điện tử bổ trợ (Digital timestamp evidence). | Quyền tác giả phát sinh từ thời điểm tác phẩm được sáng tạo và thể hiện dưới dạng vật chất nhất định (không phụ thuộc vào việc đã ghi lên blockchain hay chưa). |

---

## 6. CÁC RỦI RO BẢO MẬT & THÁCH THỨC CẦN GIẢI QUYẾT

1. **Rủi ro Chiếm đoạt đăng ký trước (Front-running / First-to-register):**
   - Kẻ xấu có thể lấy một file sách chưa đăng ký và gửi giao dịch đăng ký trước tác giả thực sự.
   - *Biện pháp giảm thiểu:* Cần có cơ chế xác minh danh tính tác giả (Author Verification / KYC nhẹ), liên kết chữ ký số cá nhân (PGP/DID), hoặc thời gian ân hạn phản đối (Dispute period).
2. **Rủi ro Thay đổi định dạng file:**
   - Cùng một nội dung sách nhưng chuyển từ `.docx` sang `.pdf`, hoặc sửa lại bố cục trang in, mã băm SHA-256 sẽ hoàn toàn khác nhau.
   - *Biện pháp giảm thiểu:* Tương lai cần nghiên cứu băm ngữ nghĩa (Locality-Sensitive Hashing / Perceptual Hashing) hoặc băm nội dung văn bản thuần túy (Normalized Text Hashing) thay vì băm tệp nhị phân nguyên khối.
3. **Quản lý Khóa cá nhân (Private Key Management):**
   - Nếu tác giả làm mất Private Key của ví đã dùng để đăng ký, họ sẽ mất vĩnh viễn khả năng chứng minh mình là chủ nhân của bản ghi on-chain đó.
   - Cần hướng dẫn người dùng sử dụng ví cứng hoặc cơ chế Account Abstraction (ERC-4337) để hỗ trợ khôi phục qua mạng xã hội (Social Recovery).
