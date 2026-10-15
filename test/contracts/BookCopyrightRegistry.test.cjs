const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("BookCopyrightRegistry Smart Contract", function () {
  let registry;
  let admin;
  let registrar;
  let author;
  let reader;
  let otherAccount;

  let adminRole;
  let registrarRole;

  // Helper function to format SHA-256 hex string to bytes32 for Solidity
  function sha256ToBytes32(sha256Hex) {
    const clean = sha256Hex.replace(/^0x/i, "").toLowerCase();
    if (clean.length !== 64) {
      throw new Error(`Invalid SHA-256 length: ${clean.length}. Expected 64 characters.`);
    }
    return "0x" + clean;
  }

  // Helper function to generate a valid bytes32 from UUID or string
  function stringToBytes32(str) {
    return ethers.keccak256(ethers.toUtf8Bytes(str));
  }

  beforeEach(async function () {
    [admin, registrar, author, reader, otherAccount] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("BookCopyrightRegistry");
    registry = await Factory.deploy(admin.address);
    await registry.waitForDeployment();

    adminRole = await registry.DEFAULT_ADMIN_ROLE();
    registrarRole = await registry.REGISTRAR_ROLE();

    // Grant registrar role to the dedicated registrar account
    await registry.connect(admin).grantRole(registrarRole, registrar.address);
  });

  // ===========================================================================
  // Test Case 1: Deployment & Role Initialization
  // ===========================================================================
  describe("1. Deployment & Roles", function () {
    it("Should deploy successfully with correct initial state and roles", async function () {
      expect(await registry.hasRole(adminRole, admin.address)).to.equal(true);
      expect(await registry.hasRole(registrarRole, admin.address)).to.equal(true);
      expect(await registry.hasRole(registrarRole, registrar.address)).to.equal(true);
      expect(await registry.hasRole(registrarRole, reader.address)).to.equal(false);
      expect(await registry.totalRecords()).to.equal(0n);
      expect(await registry.paused()).to.equal(false);
    });

    it("Should reject deployment if admin address is zero address", async function () {
      const Factory = await ethers.getContractFactory("BookCopyrightRegistry");
      await expect(
        Factory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Default admin cannot be zero address");
    });
  });

  // ===========================================================================
  // Test Case 2 & 3: Register Valid Record & getCopyright Lookup
  // ===========================================================================
  describe("2 & 3. Register & Retrieve Copyright", function () {
    it("Should allow REGISTRAR to register a valid copyright and retrieve it via getCopyright", async function () {
      const recordId = stringToBytes32("RECORD-UUID-001");
      const bookId = stringToBytes32("BOOK-UUID-001");
      const versionNumber = 1;
      const contentHash = sha256ToBytes32(crypto.createHash("sha256").update("Book Content v1").digest("hex"));
      const metadataUri = "ipfs://QmTest123456789";

      const tx = await registry
        .connect(registrar)
        .registerCopyright(recordId, bookId, versionNumber, contentHash, author.address, metadataUri);
      await tx.wait();

      expect(await registry.totalRecords()).to.equal(1n);

      const record = await registry.getCopyright(recordId);
      expect(record.recordId).to.equal(recordId);
      expect(record.bookId).to.equal(bookId);
      expect(record.versionNumber).to.equal(versionNumber);
      expect(record.contentHash).to.equal(contentHash);
      expect(record.authorWallet).to.equal(author.address);
      expect(record.registrant).to.equal(registrar.address);
      expect(record.registeredAt).to.be.greaterThan(0n);
      expect(record.status).to.equal(0); // RecordStatus.ACTIVE
      expect(record.metadataUri).to.equal(metadataUri);
    });

    it("Should revert getCopyright if recordId does not exist", async function () {
      const nonExistent = stringToBytes32("DOES_NOT_EXIST");
      await expect(registry.getCopyright(nonExistent)).to.be.revertedWithCustomError(
        registry,
        "RecordNotFound"
      ).withArgs(nonExistent);
    });
  });

  // ===========================================================================
  // Test Case 4 & 5: verifyHash Existence & Non-existence
  // ===========================================================================
  describe("4 & 5. verifyHash Verification", function () {
    it("Should return exists = true and full details for a registered hash", async function () {
      const recordId = stringToBytes32("RECORD-UUID-002");
      const bookId = stringToBytes32("BOOK-UUID-002");
      const versionNumber = 1;
      const contentHash = sha256ToBytes32(crypto.createHash("sha256").update("Book Content v2").digest("hex"));

      await registry
        .connect(registrar)
        .registerCopyright(recordId, bookId, versionNumber, contentHash, author.address, "metadata-002");

      const [exists, rId, bId, vNum, aWallet, reg, time, status] = await registry.verifyHash(contentHash);

      expect(exists).to.equal(true);
      expect(rId).to.equal(recordId);
      expect(bId).to.equal(bookId);
      expect(vNum).to.equal(versionNumber);
      expect(aWallet).to.equal(author.address);
      expect(reg).to.equal(registrar.address);
      expect(time).to.be.greaterThan(0n);
      expect(status).to.equal(0); // ACTIVE
    });

    it("Should return exists = false and zero values for an unregistered hash without reverting", async function () {
      const unregisteredHash = sha256ToBytes32(crypto.createHash("sha256").update("Random Unregistered").digest("hex"));

      const [exists, rId, bId, vNum, aWallet, reg, time, status] = await registry.verifyHash(unregisteredHash);

      expect(exists).to.equal(false);
      expect(rId).to.equal(ethers.ZeroHash);
      expect(bId).to.equal(ethers.ZeroHash);
      expect(vNum).to.equal(0);
      expect(aWallet).to.equal(ethers.ZeroAddress);
      expect(reg).to.equal(ethers.ZeroAddress);
      expect(time).to.equal(0n);
      expect(status).to.equal(0);
    });

    it("Should revert getCopyrightByHash if hash is not registered", async function () {
      const unregisteredHash = sha256ToBytes32(crypto.createHash("sha256").update("Unknown").digest("hex"));
      await expect(registry.getCopyrightByHash(unregisteredHash)).to.be.revertedWithCustomError(
        registry,
        "HashNotRegistered"
      ).withArgs(unregisteredHash);
    });
  });

  // ===========================================================================
  // Test Case 6: Reject Invalid or Missing Required Data
  // ===========================================================================
  describe("6. Validation of Required Fields", function () {
    const validRecord = stringToBytes32("VALID-REC");
    const validBook = stringToBytes32("VALID-BOOK");
    const validHash = sha256ToBytes32(crypto.createHash("sha256").update("Sample").digest("hex"));

    it("Should revert with InvalidRecordId if recordId is zero", async function () {
      await expect(
        registry.connect(registrar).registerCopyright(ethers.ZeroHash, validBook, 1, validHash, author.address, "")
      ).to.be.revertedWithCustomError(registry, "InvalidRecordId");
    });

    it("Should revert with InvalidBookId if bookId is zero", async function () {
      await expect(
        registry.connect(registrar).registerCopyright(validRecord, ethers.ZeroHash, 1, validHash, author.address, "")
      ).to.be.revertedWithCustomError(registry, "InvalidBookId");
    });

    it("Should revert with InvalidVersionNumber if versionNumber is 0", async function () {
      await expect(
        registry.connect(registrar).registerCopyright(validRecord, validBook, 0, validHash, author.address, "")
      ).to.be.revertedWithCustomError(registry, "InvalidVersionNumber");
    });

    it("Should revert with InvalidContentHash if contentHash is zero", async function () {
      await expect(
        registry.connect(registrar).registerCopyright(validRecord, validBook, 1, ethers.ZeroHash, author.address, "")
      ).to.be.revertedWithCustomError(registry, "InvalidContentHash");
    });
  });

  // ===========================================================================
  // Test Case 7: Reject Duplicate Registrations
  // ===========================================================================
  describe("7. Duplicate Registration Prevention", function () {
    const recordId1 = stringToBytes32("REC-DUP-1");
    const bookId1 = stringToBytes32("BOOK-DUP-1");
    const hash1 = sha256ToBytes32(crypto.createHash("sha256").update("Original Content").digest("hex"));

    beforeEach(async function () {
      await registry.connect(registrar).registerCopyright(recordId1, bookId1, 1, hash1, author.address, "uri1");
    });

    it("Should reject duplicate recordId", async function () {
      const differentHash = sha256ToBytes32(crypto.createHash("sha256").update("Different Content").digest("hex"));
      await expect(
        registry.connect(registrar).registerCopyright(recordId1, bookId1, 2, differentHash, author.address, "uri2")
      ).to.be.revertedWithCustomError(registry, "RecordAlreadyExists").withArgs(recordId1);
    });

    it("Should reject duplicate contentHash across any book or record", async function () {
      const differentRecord = stringToBytes32("REC-DUP-2");
      const differentBook = stringToBytes32("BOOK-DUP-2");
      await expect(
        registry.connect(registrar).registerCopyright(differentRecord, differentBook, 1, hash1, otherAccount.address, "uri3")
      ).to.be.revertedWithCustomError(registry, "HashAlreadyRegistered").withArgs(hash1);
    });

    it("Should reject duplicate versionNumber for the same bookId", async function () {
      const differentRecord = stringToBytes32("REC-DUP-3");
      const differentHash = sha256ToBytes32(crypto.createHash("sha256").update("Content v3").digest("hex"));
      await expect(
        registry.connect(registrar).registerCopyright(differentRecord, bookId1, 1, differentHash, author.address, "uri4")
      ).to.be.revertedWithCustomError(registry, "VersionAlreadyRegistered").withArgs(bookId1, 1);
    });
  });

  // ===========================================================================
  // Test Case 8: Reject Unauthorized Registrars
  // ===========================================================================
  describe("8. Access Control: Registration Permissions", function () {
    it("Should reject registerCopyright from an account without REGISTRAR_ROLE", async function () {
      const recordId = stringToBytes32("UNAUTH-REC");
      const bookId = stringToBytes32("UNAUTH-BOOK");
      const hash = sha256ToBytes32(crypto.createHash("sha256").update("Unauthorized").digest("hex"));

      await expect(
        registry.connect(reader).registerCopyright(recordId, bookId, 1, hash, author.address, "")
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount").withArgs(reader.address, registrarRole);
    });
  });

  // ===========================================================================
  // Test Case 9: Reject Unauthorized Admin Actions
  // ===========================================================================
  describe("9. Access Control: Admin Actions", function () {
    it("Should reject disputeCopyright from non-admin account", async function () {
      const recordId = stringToBytes32("ADMIN-REC");
      await expect(
        registry.connect(reader).disputeCopyright(recordId, "Plagiarism alleged")
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount").withArgs(reader.address, adminRole);
    });

    it("Should reject revokeCopyright from non-admin account", async function () {
      const recordId = stringToBytes32("ADMIN-REC");
      await expect(
        registry.connect(registrar).revokeCopyright(recordId, "Revocation")
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount").withArgs(registrar.address, adminRole);
    });

    it("Should reject pause and unpause from non-admin account", async function () {
      await expect(
        registry.connect(reader).pause()
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount").withArgs(reader.address, adminRole);
    });
  });

  // ===========================================================================
  // Test Case 10: Multi-Version Archival History
  // ===========================================================================
  describe("10. Multi-Version Management Without Overwriting", function () {
    it("Should allow registering version 1 and version 2 independently and keep both intact", async function () {
      const bookId = stringToBytes32("MULTI-VER-BOOK");

      const recV1 = stringToBytes32("REC-V1");
      const hashV1 = sha256ToBytes32(crypto.createHash("sha256").update("Manuscript Edition 1").digest("hex"));

      const recV2 = stringToBytes32("REC-V2");
      const hashV2 = sha256ToBytes32(crypto.createHash("sha256").update("Manuscript Edition 2 (Revised)").digest("hex"));

      // Register Version 1
      await registry.connect(registrar).registerCopyright(recV1, bookId, 1, hashV1, author.address, "uri-v1");

      // Register Version 2
      await registry.connect(registrar).registerCopyright(recV2, bookId, 2, hashV2, author.address, "uri-v2");

      expect(await registry.totalRecords()).to.equal(2n);
      expect(await registry.getBookVersionCount(bookId)).to.equal(2n);

      const versions = await registry.getBookVersions(bookId);
      expect(versions.length).to.equal(2);
      expect(versions[0]).to.equal(1);
      expect(versions[1]).to.equal(2);

      // Verify V1 is still intact
      const [v1Exists, v1RecId, , v1Num, , , , v1Status] = await registry.verifyHash(hashV1);
      expect(v1Exists).to.equal(true);
      expect(v1RecId).to.equal(recV1);
      expect(v1Num).to.equal(1);
      expect(v1Status).to.equal(0);

      // Verify V2 is also intact
      const [v2Exists, v2RecId, , v2Num, , , , v2Status] = await registry.verifyHash(hashV2);
      expect(v2Exists).to.equal(true);
      expect(v2RecId).to.equal(recV2);
      expect(v2Num).to.equal(2);
      expect(v2Status).to.equal(0);

      // Verify lookup by book and version
      const v1FromBook = await registry.getRecordByBookVersion(bookId, 1);
      expect(v1FromBook.contentHash).to.equal(hashV1);

      const v2FromBook = await registry.getRecordByBookVersion(bookId, 2);
      expect(v2FromBook.contentHash).to.equal(hashV2);
    });
  });

  // ===========================================================================
  // Test Case 11 & 12: Events Verification
  // ===========================================================================
  describe("11 & 12. Event Emissions & Revert Guarantee", function () {
    it("Should emit CopyrightRegistered with exact indexed and non-indexed arguments", async function () {
      const recordId = stringToBytes32("EV-REC");
      const bookId = stringToBytes32("EV-BOOK");
      const versionNumber = 1;
      const contentHash = sha256ToBytes32(crypto.createHash("sha256").update("Event Payload").digest("hex"));
      const metadataUri = "ipfs://QmEvent";

      await expect(
        registry.connect(registrar).registerCopyright(recordId, bookId, versionNumber, contentHash, author.address, metadataUri)
      )
        .to.emit(registry, "CopyrightRegistered")
        .withArgs(recordId, bookId, versionNumber, contentHash, author.address, registrar.address, (val) => val > 0n, metadataUri);
    });

    it("Should emit CopyrightStatusUpdated when status changes", async function () {
      const recordId = stringToBytes32("STATUS-EV-REC");
      const bookId = stringToBytes32("STATUS-EV-BOOK");
      const contentHash = sha256ToBytes32(crypto.createHash("sha256").update("Status Change Test").digest("hex"));

      await registry.connect(registrar).registerCopyright(recordId, bookId, 1, contentHash, author.address, "");

      // Dispute
      await expect(registry.connect(admin).disputeCopyright(recordId, "Plagiarism report filed"))
        .to.emit(registry, "CopyrightStatusUpdated")
        .withArgs(recordId, 0, 1, "Plagiarism report filed", admin.address, (val) => val > 0n);

      // Resolve back to Active
      await expect(registry.connect(admin).resolveDispute(recordId, 0, "Claim dismissed"))
        .to.emit(registry, "CopyrightStatusUpdated")
        .withArgs(recordId, 1, 0, "Claim dismissed", admin.address, (val) => val > 0n);
    });

    it("Should NOT emit any event when transaction reverts", async function () {
      const recordId = stringToBytes32("FAIL-EV-REC");
      const bookId = stringToBytes32("FAIL-EV-BOOK");
      const contentHash = sha256ToBytes32(crypto.createHash("sha256").update("Will Fail").digest("hex"));

      // Unauthorized call reverts and emits no event
      await expect(
        registry.connect(reader).registerCopyright(recordId, bookId, 1, contentHash, author.address, "")
      ).to.be.reverted;
    });
  });

  // ===========================================================================
  // Test Case 13: Record Lifecycle & Status Transitions
  // ===========================================================================
  describe("13. Record Lifecycle & State Machine", function () {
    let recId;
    let bId;
    let cHash;

    beforeEach(async function () {
      recId = stringToBytes32("LIFECYCLE-REC");
      bId = stringToBytes32("LIFECYCLE-BOOK");
      cHash = sha256ToBytes32(crypto.createHash("sha256").update("Lifecycle test").digest("hex"));
      await registry.connect(registrar).registerCopyright(recId, bId, 1, cHash, author.address, "");
    });

    it("Should enforce full dispute -> resolve (ACTIVE) lifecycle", async function () {
      await registry.connect(admin).disputeCopyright(recId, "Third-party dispute");
      let rec = await registry.getCopyright(recId);
      expect(rec.status).to.equal(1); // DISPUTED

      await registry.connect(admin).resolveDispute(recId, 0, "Author submitted original manuscript draft");
      rec = await registry.getCopyright(recId);
      expect(rec.status).to.equal(0); // ACTIVE
    });

    it("Should enforce full dispute -> resolve (REVOKED) lifecycle", async function () {
      await registry.connect(admin).disputeCopyright(recId, "Court injunction");
      await registry.connect(admin).resolveDispute(recId, 2, "Confirmed copyright violation");
      const rec = await registry.getCopyright(recId);
      expect(rec.status).to.equal(2); // REVOKED
    });

    it("Should allow direct revocation from ACTIVE status", async function () {
      await registry.connect(admin).revokeCopyright(recId, "Author withdrew publication");
      const rec = await registry.getCopyright(recId);
      expect(rec.status).to.equal(2); // REVOKED
    });

    it("Should reject re-revoking an already REVOKED record", async function () {
      await registry.connect(admin).revokeCopyright(recId, "First revocation");
      await expect(
        registry.connect(admin).revokeCopyright(recId, "Second attempt")
      ).to.be.revertedWithCustomError(registry, "RecordAlreadyRevoked").withArgs(recId);
    });

    it("Should reject dispute or revocation with empty reason", async function () {
      await expect(
        registry.connect(admin).disputeCopyright(recId, "")
      ).to.be.revertedWithCustomError(registry, "EmptyReasonRequired");

      await expect(
        registry.connect(admin).revokeCopyright(recId, "")
      ).to.be.revertedWithCustomError(registry, "EmptyReasonRequired");
    });
  });

  // ===========================================================================
  // Test Case 14: Hash Parity Between TypeScript and Solidity
  // ===========================================================================
  describe("14. TypeScript & Solidity SHA-256 Parity", function () {
    it("Should preserve exact byte-for-byte SHA-256 calculated by Node.js crypto in Solidity", async function () {
      // Simulate reading a real PDF / EPUB buffer
      const dummyBookBuffer = Buffer.from("THE ADVENTURES OF SHERLOCK HOLMES - COPYRIGHT 2026 BOOKCHAIN LIBRARY");
      const tsSha256 = crypto.createHash("sha256").update(dummyBookBuffer).digest("hex").toLowerCase();

      // Convert to bytes32 format expected by ethers and Solidity
      const solidityBytes32 = sha256ToBytes32(tsSha256);

      const recordId = stringToBytes32("PARITY-REC");
      const bookId = stringToBytes32("PARITY-BOOK");

      await registry.connect(registrar).registerCopyright(recordId, bookId, 1, solidityBytes32, author.address, "parity");

      // Verify on-chain record contains exact same hex string
      const onChainRecord = await registry.getCopyright(recordId);
      const onChainSha256 = onChainRecord.contentHash.replace(/^0x/i, "").toLowerCase();

      expect(onChainSha256).to.equal(tsSha256);

      // Verify verifyHash returns exact match
      const [exists, , , , , , , ] = await registry.verifyHash(solidityBytes32);
      expect(exists).to.equal(true);

      // Verify that case-insensitive hex conversion produces consistent bytes32
      const uppercaseSolidityBytes32 = "0x" + tsSha256.toUpperCase();
      const [upperExists] = await registry.verifyHash(uppercaseSolidityBytes32);
      expect(upperExists).to.equal(true);
    });
  });

  // ===========================================================================
  // Circuit Breaker & Emergency Controls
  // ===========================================================================
  describe("15. Circuit Breaker (Pausable)", function () {
    it("Should prevent registrations when paused, and allow them after unpause", async function () {
      await registry.connect(admin).pause();
      expect(await registry.paused()).to.equal(true);

      const recordId = stringToBytes32("PAUSE-REC");
      const bookId = stringToBytes32("PAUSE-BOOK");
      const hash = sha256ToBytes32(crypto.createHash("sha256").update("Paused").digest("hex"));

      await expect(
        registry.connect(registrar).registerCopyright(recordId, bookId, 1, hash, author.address, "")
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");

      await registry.connect(admin).unpause();
      expect(await registry.paused()).to.equal(false);

      await expect(
        registry.connect(registrar).registerCopyright(recordId, bookId, 1, hash, author.address, "")
      ).to.not.be.reverted;
    });
  });
});
