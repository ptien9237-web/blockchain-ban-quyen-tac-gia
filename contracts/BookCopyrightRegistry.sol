// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BookCopyrightRegistry
 * @notice Immutable on-chain registry for book copyright evidence, versioning, and SHA-256 verification.
 * @dev Conforms to the BookChain Library principle:
 *      "Library First, Copyright Second, Blockchain Underneath".
 *      Physical book content is kept off-chain; this contract holds cryptographic proof (SHA-256 bytes32),
 *      version linkages, author wallet credentials, and immutable registration timestamps.
 */
contract BookCopyrightRegistry is AccessControl, Pausable {
    // -------------------------------------------------------------------------
    // Roles & Constants
    // -------------------------------------------------------------------------

    /// @notice Role authorized to submit copyright registrations (e.g. Admin or verified Registrar nodes)
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    // -------------------------------------------------------------------------
    // Types & Enums
    // -------------------------------------------------------------------------

    /// @notice Operational status of a copyright record
    enum RecordStatus {
        ACTIVE,    // 0: Valid, active copyright claim
        DISPUTED,  // 1: Under investigation or dispute
        REVOKED    // 2: Revoked due to confirmed infringement, fraud, or legal judgment
    }

    /// @notice Struct holding immutable copyright registration evidence
    struct CopyrightRecord {
        bytes32 recordId;        // Unique on-chain record identifier (derived from CSDL CopyrightRecordId)
        bytes32 bookId;          // Stable identifier of the book (derived from CSDL BookId)
        uint32 versionNumber;    // Monotonically increasing version number (1, 2, 3...)
        bytes32 contentHash;     // SHA-256 hash of the exact file content (32 bytes)
        address authorWallet;    // Wallet address of the primary author / creator
        address registrant;      // Address that submitted the on-chain transaction
        uint64 registeredAt;     // Timestamp of the block when registration was confirmed
        RecordStatus status;     // Current operational status
        string metadataUri;      // URI, IPFS CID, or canonical metadata pointer
    }

    // -------------------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------------------

    /// @notice Total count of records ever registered
    uint256 public totalRecords;

    /// @notice Mapping from recordId => CopyrightRecord
    mapping(bytes32 => CopyrightRecord) private _records;

    /// @notice Mapping from contentHash (SHA-256) => recordId
    mapping(bytes32 => bytes32) private _hashToRecordId;

    /// @notice Mapping from bookId => (versionNumber => recordId)
    mapping(bytes32 => mapping(uint32 => bytes32)) private _bookVersionToRecordId;

    /// @notice Mapping from bookId => array of registered version numbers
    mapping(bytes32 => uint32[]) private _bookVersions;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event CopyrightRegistered(
        bytes32 indexed recordId,
        bytes32 indexed bookId,
        uint32 indexed versionNumber,
        bytes32 contentHash,
        address authorWallet,
        address registrant,
        uint64 registeredAt,
        string metadataUri
    );

    event CopyrightStatusUpdated(
        bytes32 indexed recordId,
        RecordStatus previousStatus,
        RecordStatus newStatus,
        string reason,
        address indexed updatedBy,
        uint64 timestamp
    );

    // -------------------------------------------------------------------------
    // Custom Errors (Gas-efficient)
    // -------------------------------------------------------------------------

    error InvalidRecordId();
    error InvalidBookId();
    error InvalidVersionNumber();
    error InvalidContentHash();
    error RecordAlreadyExists(bytes32 recordId);
    error HashAlreadyRegistered(bytes32 contentHash);
    error VersionAlreadyRegistered(bytes32 bookId, uint32 versionNumber);
    error RecordNotFound(bytes32 recordId);
    error HashNotRegistered(bytes32 contentHash);
    error RecordAlreadyRevoked(bytes32 recordId);
    error InvalidStatusTransition(RecordStatus currentStatus, RecordStatus targetStatus);
    error EmptyReasonRequired();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param defaultAdmin Address to be granted DEFAULT_ADMIN_ROLE and REGISTRAR_ROLE
     */
    constructor(address defaultAdmin) {
        require(defaultAdmin != address(0), "Default admin cannot be zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(REGISTRAR_ROLE, defaultAdmin);
    }

    // -------------------------------------------------------------------------
    // Core Registration Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Registers a new copyright record on-chain.
     * @dev Enforces:
     *      - Only callable by accounts with REGISTRAR_ROLE
     *      - Contract is not paused
     *      - Mandatory non-zero identifiers and contentHash
     *      - No duplicate recordId, no duplicate contentHash, no duplicate (bookId, versionNumber)
     * @param recordId Unique identifier for this copyright record
     * @param bookId Stable identifier for the book
     * @param versionNumber Version sequence number (must be > 0)
     * @param contentHash SHA-256 byte digest of the file content
     * @param authorWallet Verified wallet address of the author
     * @param metadataUri Canonical metadata reference or IPFS URI
     */
    function registerCopyright(
        bytes32 recordId,
        bytes32 bookId,
        uint32 versionNumber,
        bytes32 contentHash,
        address authorWallet,
        string calldata metadataUri
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        if (recordId == bytes32(0)) revert InvalidRecordId();
        if (bookId == bytes32(0)) revert InvalidBookId();
        if (versionNumber == 0) revert InvalidVersionNumber();
        if (contentHash == bytes32(0)) revert InvalidContentHash();

        if (_records[recordId].registeredAt != 0) {
            revert RecordAlreadyExists(recordId);
        }
        if (_hashToRecordId[contentHash] != bytes32(0)) {
            revert HashAlreadyRegistered(contentHash);
        }
        if (_bookVersionToRecordId[bookId][versionNumber] != bytes32(0)) {
            revert VersionAlreadyRegistered(bookId, versionNumber);
        }

        uint64 currentTime = uint64(block.timestamp);

        _records[recordId] = CopyrightRecord({
            recordId: recordId,
            bookId: bookId,
            versionNumber: versionNumber,
            contentHash: contentHash,
            authorWallet: authorWallet,
            registrant: msg.sender,
            registeredAt: currentTime,
            status: RecordStatus.ACTIVE,
            metadataUri: metadataUri
        });

        _hashToRecordId[contentHash] = recordId;
        _bookVersionToRecordId[bookId][versionNumber] = recordId;
        _bookVersions[bookId].push(versionNumber);

        totalRecords += 1;

        emit CopyrightRegistered(
            recordId,
            bookId,
            versionNumber,
            contentHash,
            authorWallet,
            msg.sender,
            currentTime,
            metadataUri
        );
    }

    // -------------------------------------------------------------------------
    // View & Verification Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Retrieves full copyright record by its unique recordId.
     */
    function getCopyright(bytes32 recordId) external view returns (CopyrightRecord memory) {
        CopyrightRecord memory rec = _records[recordId];
        if (rec.registeredAt == 0) {
            revert RecordNotFound(recordId);
        }
        return rec;
    }

    /**
     * @notice Retrieves full copyright record by content SHA-256 hash.
     */
    function getCopyrightByHash(bytes32 contentHash) external view returns (CopyrightRecord memory) {
        bytes32 recId = _hashToRecordId[contentHash];
        if (recId == bytes32(0)) {
            revert HashNotRegistered(contentHash);
        }
        return _records[recId];
    }

    /**
     * @notice Verifies whether a given SHA-256 hash is registered on-chain.
     * @dev Pure/safe lookup for public verification without reverting if missing.
     * @param contentHash SHA-256 bytes32 hash to verify
     * @return exists True if the hash exists in the registry
     * @return recordId Unique record identifier
     * @return bookId Book identifier
     * @return versionNumber Version number
     * @return authorWallet Author's wallet address
     * @return registrant Registrant address that performed registration
     * @return registeredAt Block timestamp of registration
     * @return status Operational status (ACTIVE, DISPUTED, REVOKED)
     */
    function verifyHash(bytes32 contentHash)
        external
        view
        returns (
            bool exists,
            bytes32 recordId,
            bytes32 bookId,
            uint32 versionNumber,
            address authorWallet,
            address registrant,
            uint64 registeredAt,
            RecordStatus status
        )
    {
        bytes32 recId = _hashToRecordId[contentHash];
        if (recId == bytes32(0)) {
            return (false, bytes32(0), bytes32(0), 0, address(0), address(0), 0, RecordStatus.ACTIVE);
        }

        CopyrightRecord memory rec = _records[recId];
        return (
            true,
            rec.recordId,
            rec.bookId,
            rec.versionNumber,
            rec.authorWallet,
            rec.registrant,
            rec.registeredAt,
            rec.status
        );
    }

    /**
     * @notice Retrieves the copyright record for a specific version of a book.
     */
    function getRecordByBookVersion(bytes32 bookId, uint32 versionNumber)
        external
        view
        returns (CopyrightRecord memory)
    {
        bytes32 recId = _bookVersionToRecordId[bookId][versionNumber];
        if (recId == bytes32(0)) {
            revert RecordNotFound(bytes32(0));
        }
        return _records[recId];
    }

    /**
     * @notice Returns total number of registered versions for a given bookId.
     */
    function getBookVersionCount(bytes32 bookId) external view returns (uint256) {
        return _bookVersions[bookId].length;
    }

    /**
     * @notice Returns all version numbers registered for a given bookId.
     */
    function getBookVersions(bytes32 bookId) external view returns (uint32[] memory) {
        return _bookVersions[bookId];
    }

    // -------------------------------------------------------------------------
    // Status & Dispute Management (Admin Only)
    // -------------------------------------------------------------------------

    /**
     * @notice Flags a copyright record as DISPUTED.
     * @dev Only callable by DEFAULT_ADMIN_ROLE.
     */
    function disputeCopyright(bytes32 recordId, string calldata reason)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (bytes(reason).length == 0) revert EmptyReasonRequired();
        CopyrightRecord storage rec = _records[recordId];
        if (rec.registeredAt == 0) revert RecordNotFound(recordId);
        if (rec.status == RecordStatus.REVOKED) revert RecordAlreadyRevoked(recordId);
        if (rec.status == RecordStatus.DISPUTED) {
            revert InvalidStatusTransition(rec.status, RecordStatus.DISPUTED);
        }

        RecordStatus prev = rec.status;
        rec.status = RecordStatus.DISPUTED;

        emit CopyrightStatusUpdated(recordId, prev, RecordStatus.DISPUTED, reason, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Resolves an existing dispute by setting the record to ACTIVE or REVOKED.
     * @dev Only callable by DEFAULT_ADMIN_ROLE on a DISPUTED record.
     */
    function resolveDispute(
        bytes32 recordId,
        RecordStatus newStatus,
        string calldata reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bytes(reason).length == 0) revert EmptyReasonRequired();
        CopyrightRecord storage rec = _records[recordId];
        if (rec.registeredAt == 0) revert RecordNotFound(recordId);
        if (rec.status != RecordStatus.DISPUTED) {
            revert InvalidStatusTransition(rec.status, newStatus);
        }
        if (newStatus != RecordStatus.ACTIVE && newStatus != RecordStatus.REVOKED) {
            revert InvalidStatusTransition(rec.status, newStatus);
        }

        rec.status = newStatus;

        emit CopyrightStatusUpdated(recordId, RecordStatus.DISPUTED, newStatus, reason, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Directly revokes a copyright record (e.g. invalidation or confirmed plagiarism).
     * @dev Only callable by DEFAULT_ADMIN_ROLE. Cannot re-revoke an already REVOKED record.
     */
    function revokeCopyright(bytes32 recordId, string calldata reason)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (bytes(reason).length == 0) revert EmptyReasonRequired();
        CopyrightRecord storage rec = _records[recordId];
        if (rec.registeredAt == 0) revert RecordNotFound(recordId);
        if (rec.status == RecordStatus.REVOKED) revert RecordAlreadyRevoked(recordId);

        RecordStatus prev = rec.status;
        rec.status = RecordStatus.REVOKED;

        emit CopyrightStatusUpdated(recordId, prev, RecordStatus.REVOKED, reason, msg.sender, uint64(block.timestamp));
    }

    // -------------------------------------------------------------------------
    // Circuit Breaker (Pause / Unpause)
    // -------------------------------------------------------------------------

    /**
     * @notice Pauses registration activities in case of critical emergency.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Resumes registration activities.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
