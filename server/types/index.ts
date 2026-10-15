export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type RoleCode = 'READER' | 'AUTHOR' | 'ADMIN';
export type AuthorVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserRecord {
  UserId: string;
  Email: string;
  EmailNormalized: string;
  PasswordHash: string;
  DisplayName: string;
  AvatarUrl: string | null;
  Status: UserStatus;
  EmailVerifiedAt: Date | null;
  LastLoginAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface UserPublicProfile {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  roles: RoleCode[];
  createdAt: Date;
  lastLoginAt: Date | null;
  authorProfile?: AuthorProfilePublic | null;
}

export interface RoleRecord {
  RoleId: number;
  Code: RoleCode;
  Name: string;
  Description: string | null;
}

export interface SessionRecord {
  SessionId: string;
  UserId: string;
  TokenHash: string;
  ExpiresAt: Date;
  RevokedAt: Date | null;
  CreatedAt: Date;
  LastUsedAt: Date | null;
}

export interface AuthorProfileRecord {
  AuthorProfileId: string;
  UserId: string;
  PenName: string;
  Bio: string | null;
  VerificationStatus: AuthorVerificationStatus;
  VerificationNote: string | null;
  ReviewedByUserId: string | null;
  ReviewedAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface AuthorProfilePublic {
  authorProfileId: string;
  penName: string;
  bio: string | null;
  verificationStatus: AuthorVerificationStatus;
  verificationNote?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'UNLISTED' | 'ARCHIVED';
export type ContributionRole = 'PRIMARY_AUTHOR' | 'CO_AUTHOR' | 'EDITOR' | 'TRANSLATOR';
export type AccessLevel = 'PRIVATE' | 'PUBLIC_READ' | 'PUBLIC_DOWNLOAD';
export type StorageProviderType = 'LOCAL' | 'IPFS';

export interface BookRecord {
  BookId: string;
  Title: string;
  Description: string | null;
  CoverUrl: string | null;
  LanguageCode: string | null;
  PublicationStatus: PublicationStatus;
  PublishedAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface BookAuthorRecord {
  BookId: string;
  AuthorProfileId: string;
  ContributionRole: ContributionRole;
  DisplayOrder: number;
  CreatedAt: Date;
}

export interface BookFileRecord {
  BookFileId: string;
  BookId: string;
  VersionNumber: number;
  StorageProvider: StorageProviderType;
  StorageKey: string;
  OriginalFileName: string;
  MimeType: string;
  SizeBytes: number;
  Sha256: string;
  AccessLevel: AccessLevel;
  IsCurrent: boolean;
  UploadedByUserId: string;
  CreatedAt: Date;
}

export interface BookAuthorDto {
  authorProfileId: string;
  penName: string;
  contributionRole: ContributionRole;
  displayOrder: number;
}

export interface BookFileDto {
  bookFileId: string;
  bookId: string;
  versionNumber: number;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  accessLevel: AccessLevel;
  isCurrent: boolean;
  storageProvider: StorageProviderType;
  createdAt: Date;
}

export interface BookDetailDto {
  bookId: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  languageCode: string | null;
  publicationStatus: PublicationStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authors: BookAuthorDto[];
  currentFile?: BookFileDto | null;
  fileCount?: number;
}

export interface AuthTokenPayload {
  userId: string;
  sessionId: string;
  roles: RoleCode[];
}

export type InvitationStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'EXHAUSTED';

export interface AuthorInvitationRecord {
  InvitationId: string;
  CodeHash: string;
  CreatedByUserId: string;
  ExpiresAt: Date;
  MaxUses: number;
  UsedCount: number;
  RevokedAt: Date | null;
  Note: string | null;
  CreatedAt: Date;
}

export interface InvitationUseRecord {
  InvitationUseId: string;
  InvitationId: string;
  UserId: string;
  UsedAt: Date;
}

export interface AuthorInvitationDto {
  invitationId: string;
  expiresAt: Date;
  maxUses: number;
  usedCount: number;
  revokedAt: Date | null;
  status: InvitationStatus;
  note: string | null;
  createdAt: Date;
  createdByUser?: {
    userId: string;
    displayName: string;
    email: string;
  };
}

export interface CreateInvitationResultDto {
  invitationId: string;
  code: string;
  expiresAt: Date;
  maxUses: number;
  note: string | null;
  createdAt: Date;
}

export type CopyrightRecordStatus = 'DRAFT' | 'SUBMITTED' | 'QUEUED' | 'ON_CHAIN' | 'FAILED' | 'DISPUTED' | 'WITHDRAWN';
export type BlockchainTxStatus = 'QUEUED' | 'PENDING' | 'CONFIRMED' | 'FAILED';
export type OnChainRecordStatus = 'ACTIVE' | 'DISPUTED' | 'REVOKED';

export interface CopyrightRecord {
  CopyrightRecordId: string;
  RecordNumber: string;
  BookId: string;
  BookFileId: string;
  SubmittedByUserId: string;
  ClaimStatement: string;
  RecordStatus: CopyrightRecordStatus;
  SubmittedAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface BlockchainTransactionRecord {
  BlockchainTransactionId: string;
  CopyrightRecordId: string;
  WalletId: string | null;
  ChainId: number;
  TransactionType: string;
  TxHash: string | null;
  ContractAddress: string | null;
  Status: BlockchainTxStatus;
  BlockNumber: number | null;
  ErrorMessage: string | null;
  SubmittedAt: Date | null;
  ConfirmedAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface PrepareCopyrightRegistrationDto {
  copyrightRecordId: string;
  recordNumber: string;
  recordIdBytes32: string;
  bookIdBytes32: string;
  versionNumber: number;
  contentHashBytes32: string;
  rawSha256: string;
  authorWallet: string;
  metadataUri: string;
  contractAddress: string;
  chainId: number;
  contractRegistrarRole: string;
  isAlreadyOnChain: boolean;
}

export interface CopyrightRecordDto {
  copyrightRecordId: string;
  recordNumber: string;
  bookId: string;
  bookFileId: string;
  versionNumber: number;
  sha256: string;
  submittedByUserId: string;
  claimStatement: string;
  recordStatus: CopyrightRecordStatus;
  submittedAt: Date | null;
  createdAt: Date;
  transaction?: {
    txHash: string | null;
    status: BlockchainTxStatus;
    blockNumber: number | null;
    contractAddress: string | null;
    chainId: number;
    confirmedAt: Date | null;
    errorMessage: string | null;
  } | null;
  onChain?: {
    exists: boolean;
    status: OnChainRecordStatus | null;
    authorWallet: string | null;
    registrant: string | null;
    registeredAt: number | null;
  } | null;
}

export type ReportReason =
  | 'PLAGIARISM'
  | 'UNLICENSED_DISTRIBUTION'
  | 'WRONG_AUTHOR'
  | 'FRAUDULENT_RECORD'
  | 'INACCURATE_METADATA'
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

export type ReportActionType =
  | 'START_REVIEW'
  | 'RESOLVE'
  | 'DISMISS'
  | 'REQUEST_INFO'
  | 'NOTE';

export type DisputeActionType = 'DISPUTE' | 'RESOLVE_ACTIVE' | 'RESOLVE_REVOKE' | 'REVOKE';

export interface ReportRecord {
  ReportId: string;
  ReporterUserId: string | null;
  BookId: string | null;
  CopyrightRecordId: string | null;
  Reason: ReportReason | string;
  Description: string;
  Status: ReportStatus;
  HandledByUserId: string | null;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface ReportActionRecord {
  ReportActionId: string;
  ReportId: string;
  ActorUserId: string;
  Action: ReportActionType | string;
  Note: string | null;
  CreatedAt: Date;
}

export interface ReportActionDto {
  reportActionId: string;
  reportId: string;
  actorUserId: string;
  actorName?: string;
  action: ReportActionType;
  note: string | null;
  createdAt: Date;
}

export interface ReportDto {
  reportId: string;
  reporterUserId: string | null;
  reporterName?: string;
  reporterEmail?: string;
  bookId: string | null;
  bookTitle?: string;
  copyrightRecordId: string | null;
  recordNumber?: string;
  recordStatus?: string;
  contentHash?: string;
  onChainStatus?: OnChainRecordStatus;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  handledByUserId: string | null;
  handledByName?: string;
  createdAt: Date;
  updatedAt: Date;
  actions?: ReportActionDto[];
}

export interface AuthorRequestDto {
  authorProfileId: string;
  userId: string;
  penName: string;
  bio: string | null;
  verificationStatus: AuthorVerificationStatus;
  verificationNote: string | null;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userEmail: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  userStatus: UserStatus;
  reviewerDisplayName?: string | null;
  reviewerEmail?: string | null;
}

export interface AdminAuthorRequestsResult {
  items: AuthorRequestDto[];
  total: number;
  page: number;
  limit: number;
}


