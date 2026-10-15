const { ethers, network } = require("hardhat");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("================================================================================");
  console.log(`INTERACTION DEMO: BOOK COPYRIGHT REGISTRY (${network.name.toUpperCase()})`);
  console.log("================================================================================");

  const [admin, author] = await ethers.getSigners();
  console.log(`Admin / Registrar : ${admin.address}`);
  console.log(`Author Wallet     : ${author.address}`);

  // Deploy fresh instance for demonstration
  console.log("\n[1] Deploying fresh instance of BookCopyrightRegistry...");
  const Factory = await ethers.getContractFactory("BookCopyrightRegistry");
  const registry = await Factory.deploy(admin.address);
  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();
  console.log(`-> Contract deployed at: ${contractAddress}`);

  // Prepare test book & content
  const bookTitle = "Dế Mèn Phiêu Lưu Ký (Tô Hoài)";
  const bookFileContent = "Nội dung tệp sách số: Dế Mèn Phiêu Lưu Ký - Bản in kỹ thuật số 2026";
  const sha256Hex = crypto.createHash("sha256").update(bookFileContent).digest("hex");
  const contentHash = "0x" + sha256Hex;

  const recordId = ethers.keccak256(ethers.toUtf8Bytes("RECORD-DEMO-001"));
  const bookId = ethers.keccak256(ethers.toUtf8Bytes("BOOK-DEMO-001"));
  const versionNumber = 1;
  const metadataUri = "ipfs://QmDeMenPhieuLuuKy2026Metadata";

  console.log("\n[2] Registering Copyright for Book Version 1...");
  console.log(`-> Book Title   : ${bookTitle}`);
  console.log(`-> SHA-256 Hash : ${sha256Hex}`);
  console.log(`-> bytes32 Hash : ${contentHash}`);
  console.log(`-> Version      : ${versionNumber}`);
  console.log(`-> Metadata URI : ${metadataUri}`);

  const regTx = await registry.registerCopyright(
    recordId,
    bookId,
    versionNumber,
    contentHash,
    author.address,
    metadataUri
  );
  const regReceipt = await regTx.wait();
  console.log(`-> Registration Tx Hash: ${regReceipt.hash}`);
  console.log(`-> Gas Used            : ${regReceipt.gasUsed.toString()}`);

  console.log("\n[3] Verifying Hash via contract.verifyHash(contentHash)...");
  const [exists, rId, bId, vNum, aWallet, reg, time, status] = await registry.verifyHash(contentHash);
  console.log(`-> Exists        : ${exists}`);
  console.log(`-> RecordId      : ${rId}`);
  console.log(`-> BookId        : ${bId}`);
  console.log(`-> Version Number: ${vNum}`);
  console.log(`-> Author Wallet : ${aWallet}`);
  console.log(`-> Registrant    : ${reg}`);
  console.log(`-> Registered At : ${new Date(Number(time) * 1000).toISOString()}`);
  console.log(`-> Status Code   : ${status} (0 = ACTIVE)`);

  console.log("\n[4] Querying full record via contract.getCopyright(recordId)...");
  const record = await registry.getCopyright(recordId);
  console.log(`-> Metadata URI  : ${record.metadataUri}`);
  console.log(`-> Content Hash  : ${record.contentHash}`);

  console.log("\n[5] Registering Version 2 of the same book...");
  const v2Content = "Nội dung tệp sách số: Dế Mèn Phiêu Lưu Ký - Tái bản có minh họa màu 2026";
  const v2Sha256 = crypto.createHash("sha256").update(v2Content).digest("hex");
  const v2ContentHash = "0x" + v2Sha256;
  const v2RecordId = ethers.keccak256(ethers.toUtf8Bytes("RECORD-DEMO-002"));

  const v2Tx = await registry.registerCopyright(
    v2RecordId,
    bookId,
    2,
    v2ContentHash,
    author.address,
    "ipfs://QmDeMenV2Illustrated"
  );
  await v2Tx.wait();
  console.log(`-> Version 2 registered with hash: ${v2Sha256}`);

  const versionCount = await registry.getBookVersionCount(bookId);
  const allVersions = await registry.getBookVersions(bookId);
  console.log(`-> Total book versions count : ${versionCount.toString()}`);
  console.log(`-> Registered version numbers: [${allVersions.join(", ")}]`);

  console.log("\n[6] Testing status transition: Dispute and Resolution...");
  const disputeTx = await registry.disputeCopyright(recordId, "Báo cáo nghi vấn trùng lặp bản dịch");
  await disputeTx.wait();
  let updatedRec = await registry.getCopyright(recordId);
  console.log(`-> Status after dispute: ${updatedRec.status} (1 = DISPUTED)`);

  const resolveTx = await registry.resolveDispute(recordId, 0, "Xác minh tài liệu gốc thành công, khôi phục ACTIVE");
  await resolveTx.wait();
  updatedRec = await registry.getCopyright(recordId);
  console.log(`-> Status after resolution: ${updatedRec.status} (0 = ACTIVE)`);

  console.log("\n================================================================================");
  console.log("INTERACTION DEMO COMPLETED SUCCESSFULLY WITH 100% SUCCESSFUL ON-CHAIN CALLS!");
  console.log("================================================================================");
}

main().catch((error) => {
  console.error("Interaction demo failed:", error);
  process.exit(1);
});
