export interface ApiUser {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  roles: Array<'READER' | 'AUTHOR' | 'ADMIN'>;
  createdAt: string;
  lastLoginAt: string | null;
  authorProfile?: {
    authorProfileId: string;
    penName: string;
    bio: string | null;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verificationNote?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
  } | null;
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Include credentials so HttpOnly cookies are automatically sent and received
  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    error: { code: 'NETWORK_ERROR', message: `Server responded with HTTP ${res.status}` },
  }));

  if (!res.ok || !data.success) {
    const errorMsg = data.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    (err as any).code = data.error?.code || 'API_ERROR';
    (err as any).status = res.status;
    throw err;
  }

  return data.data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: ApiUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, displayName: string) =>
    request<ApiUser>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<ApiUser>('/api/auth/me'),
};

export const userApi = {
  getProfile: () => request<ApiUser>('/api/users/profile'),

  updateProfile: (data: { displayName?: string; avatarUrl?: string | null }) =>
    request<ApiUser>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  registerAuthorProfile: (data: { penName: string; bio?: string | null }) =>
    request<ApiUser>('/api/users/author-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface ApiAuthor {
  authorProfileId: string;
  penName: string;
  contributionRole: 'PRIMARY_AUTHOR' | 'CO_AUTHOR' | 'EDITOR' | 'TRANSLATOR';
  displayOrder: number;
}

export interface ApiBookFile {
  bookFileId: string;
  bookId: string;
  versionNumber: number;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  accessLevel: 'PRIVATE' | 'PUBLIC_READ' | 'PUBLIC_DOWNLOAD';
  isCurrent: boolean;
  storageProvider: 'LOCAL' | 'IPFS';
  createdAt: string;
}

export interface ApiBook {
  bookId: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  languageCode: string | null;
  publicationStatus: 'DRAFT' | 'PUBLISHED' | 'UNLISTED' | 'ARCHIVED';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authors: ApiAuthor[];
  currentFile?: ApiBookFile | null;
}

export interface VerifyIntegrityResult {
  bookId: string;
  fileId: string;
  versionNumber: number;
  recordedSha256: string;
  actualSha256: string | null;
  matches: boolean;
  fileExistsOnDisk: boolean;
  status: 'MATCH' | 'MISMATCH' | 'FILE_NOT_FOUND';
  details: string;
}

export interface VerifyPublicHashResult {
  found: boolean;
  file?: ApiBookFile;
  book?: {
    bookId: string;
    title: string;
    publicationStatus: string;
  };
  integrityCheck?: {
    matches: boolean;
    fileExists: boolean;
  };
}

export interface PublicAuthorDto {
  authorProfileId: string;
  penName: string;
  bio: string | null;
  avatarUrl: string | null;
  publishedBookCount: number;
  createdAt: string;
}

export const booksApi = {
  getAll: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<ApiBook[]>(`/api/books${query}`);
  },

  getAuthors: () => request<PublicAuthorDto[]>('/api/books/authors'),

  getById: (id: string) => request<ApiBook>(`/api/books/${id}`),

  getMyBooks: () => request<ApiBook[]>('/api/books/my-books'),

  createBook: (data: {
    title: string;
    description?: string | null;
    coverUrl?: string | null;
    languageCode?: string | null;
    publicationStatus?: 'DRAFT' | 'PUBLISHED' | 'UNLISTED';
  }) =>
    request<ApiBook>('/api/books', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBook: (
    id: string,
    data: {
      title?: string;
      description?: string | null;
      coverUrl?: string | null;
      languageCode?: string | null;
    }
  ) =>
    request<ApiBook>(`/api/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: 'DRAFT' | 'PUBLISHED' | 'UNLISTED' | 'ARCHIVED') =>
    request<ApiBook>(`/api/books/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  addCoAuthor: (
    id: string,
    data: {
      authorProfileId: string;
      contributionRole: 'CO_AUTHOR' | 'EDITOR' | 'TRANSLATOR';
      displayOrder?: number;
    }
  ) =>
    request<ApiBook>(`/api/books/${id}/authors`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeCoAuthor: (id: string, authorProfileId: string) =>
    request<ApiBook>(`/api/books/${id}/authors/${authorProfileId}`, {
      method: 'DELETE',
    }),

  uploadFile: (
    bookId: string,
    file: File,
    options?: {
      accessLevel?: 'PRIVATE' | 'PUBLIC_READ' | 'PUBLIC_DOWNLOAD';
      isCurrent?: boolean;
      storageProvider?: 'LOCAL' | 'IPFS';
    }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.accessLevel) formData.append('accessLevel', options.accessLevel);
    if (options?.isCurrent !== undefined) formData.append('isCurrent', String(options.isCurrent));
    if (options?.storageProvider) formData.append('storageProvider', options.storageProvider);

    return request<ApiBookFile>(`/api/books/${bookId}/files`, {
      method: 'POST',
      body: formData,
    });
  },

  getFiles: (bookId: string) => request<ApiBookFile[]>(`/api/books/${bookId}/files`),

  verifyFileIntegrity: (bookId: string, fileId: string) =>
    request<VerifyIntegrityResult>(`/api/books/${bookId}/files/${fileId}/verify`),

  verifyHash: (sha256: string) =>
    request<VerifyPublicHashResult>('/api/books/verify-hash', {
      method: 'POST',
      body: JSON.stringify({ sha256 }),
    }),

  getReadUrl: (bookId: string, fileId: string) => `/api/books/${bookId}/files/${fileId}/read`,
  getDownloadUrl: (bookId: string, fileId: string) => `/api/books/${bookId}/files/${fileId}/download`,
};

export interface AdminInvitation {
  invitationId: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  revokedAt: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'EXHAUSTED';
  note: string | null;
  createdAt: string;
  createdByUser?: {
    userId: string;
    displayName: string;
    email: string;
  };
}

export interface CreateInvitationResult {
  invitationId: string;
  code: string;
  expiresAt: string;
  maxUses: number;
  note: string | null;
  createdAt: string;
}

export interface AdminOverviewStats {
  pendingAuthorRequests: number;
  verifiedAuthors: number;
  activeInvitations: number;
  openDisputes: number;
  resolvedDisputes: number;
  onChainRecords: number;
  publishedBooks: number;
  totalUsers: number;
}

export const adminApi = {
  getOverviewStats: () => request<AdminOverviewStats>('/api/admin/overview'),

  getInvitations: (page = 1, limit = 50) =>
    request<{ items: AdminInvitation[]; total: number; page: number; limit: number }>(
      `/api/admin/invitations?page=${page}&limit=${limit}`
    ),

  createInvitation: (data: { expiresInDays?: number; maxUses?: number; note?: string | null }) =>
    request<CreateInvitationResult>('/api/admin/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  revokeInvitation: (id: string) =>
    request<{ message: string }>(`/api/admin/invitations/${id}/revoke`, {
      method: 'PATCH',
    }),

  getReports: (params: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return request<{ items: ApiReport[]; total: number; page: number; limit: number }>(
      `/api/admin/reports?${qs.toString()}`
    );
  },

  getReportById: (id: string) => request<ApiReport>(`/api/admin/reports/${id}`),

  addReportAction: (reportId: string, data: { action: string; note?: string }) =>
    request<ApiReportAction>(`/api/admin/reports/${reportId}/actions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  executeDisputeOnChain: (
    reportId: string,
    data: {
      actionType: 'DISPUTE' | 'RESOLVE_ACTIVE' | 'RESOLVE_REVOKE' | 'REVOKE';
      reason: string;
    }
  ) =>
    request<{
      txHash: string;
      blockNumber: number;
      newStatus: string;
      report: ApiReport;
    }>(`/api/admin/reports/${reportId}/dispute-onchain`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCircuitBreakerStatus: () =>
    request<{
      isPaused: boolean;
      contractAddress: string;
      chainId: number;
      totalRecords: number;
    }>('/api/admin/circuit-breaker'),

  toggleCircuitBreaker: (pause: boolean) =>
    request<{
      isPaused: boolean;
      txHash: string;
      blockNumber: number;
    }>('/api/admin/circuit-breaker', {
      method: 'POST',
      body: JSON.stringify({ pause }),
    }),

  getAuthorRequests: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const q = searchParams.toString();
    return request<{ items: AdminAuthorRequest[]; total: number; page: number; limit: number }>(
      `/api/admin/author-requests${q ? `?${q}` : ''}`
    );
  },

  approveAuthorRequest: (id: string, note?: string) =>
    request<{ message: string; authorProfile: any }>(`/api/admin/author-requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    }),

  rejectAuthorRequest: (id: string, reason: string) =>
    request<{ message: string; authorProfile: any }>(`/api/admin/author-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
};

export interface AdminAuthorRequest {
  authorProfileId: string;
  userId: string;
  penName: string;
  bio: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationNote: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  userStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  reviewerDisplayName?: string | null;
  reviewerEmail?: string | null;
}



export const invitationsApi = {
  redeem: (code: string) =>
    request<{ success: boolean; alreadyAuthor?: boolean; message: string }>('/api/invitations/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

export interface ApiCopyrightRecord {
  copyrightRecordId: string;
  recordNumber: string;
  bookId: string;
  bookFileId: string;
  versionNumber: number;
  sha256: string;
  submittedByUserId: string;
  claimStatement: string;
  recordStatus: 'DRAFT' | 'SUBMITTED' | 'QUEUED' | 'ON_CHAIN' | 'FAILED' | 'DISPUTED' | 'WITHDRAWN';
  submittedAt: string | null;
  createdAt: string;
  transaction?: {
    txHash: string | null;
    status: 'QUEUED' | 'PENDING' | 'CONFIRMED' | 'FAILED';
    blockNumber: number | null;
    contractAddress: string | null;
    chainId: number;
    confirmedAt: string | null;
    errorMessage: string | null;
  } | null;
  onChain?: {
    exists: boolean;
    status: 'ACTIVE' | 'DISPUTED' | 'REVOKED' | null;
    authorWallet: string | null;
    registrant: string | null;
    registeredAt: number | null;
  } | null;
}

export interface PrepareCopyrightResponse {
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

export interface VerifyCopyrightResult {
  found: boolean;
  query: string;
  queryType: 'CONTENT_HASH' | 'RECORD_ID';
  onChain: {
    exists: boolean;
    recordId?: string;
    bookId?: string;
    versionNumber?: number;
    contentHash?: string;
    authorWallet?: string;
    registrant?: string;
    registeredAt?: number;
    status?: 'ACTIVE' | 'DISPUTED' | 'REVOKED';
    contractAddress: string;
    chainId: number;
  };
  database?: {
    bookId: string;
    bookTitle: string;
    versionNumber: number;
    sha256: string;
    recordNumber?: string;
    recordStatus?: string;
    submittedAt?: string | null;
    txHash?: string | null;
    blockNumber?: number | null;
  } | null;
  isConsistent: boolean;
  verifiedAt: string;
}

export const copyrightApi = {
  prepare: (data: { bookId: string; bookFileId: string; authorWallet: string }) =>
    request<PrepareCopyrightResponse>('/api/copyright/prepare', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sync: (data: { copyrightRecordId: string; txHash: string }) =>
    request<{
      synchronized: boolean;
      status: string;
      txHash: string;
      blockNumber: number | null;
      record: ApiCopyrightRecord;
    }>('/api/copyright/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  relay: (data: { copyrightRecordId: string }) =>
    request<{
      txHash: string;
      blockNumber: number;
      record: ApiCopyrightRecord;
    }>('/api/copyright/relay', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByBook: (bookId: string) =>
    request<ApiCopyrightRecord[]>(`/api/copyright/books/${bookId}/records`),

  verify: (query: string) =>
    request<VerifyCopyrightResult>(`/api/copyright/verify/${encodeURIComponent(query)}`),

  reconcile: () =>
    request<{
      scannedCount: number;
      reconciledCount: number;
      details: Array<{ copyrightRecordId: string; status: string; actionTaken: string }>;
    }>('/api/copyright/reconcile', {
      method: 'POST',
    }),
};

export interface ApiReportAction {
  reportActionId: string;
  reportId: string;
  actorUserId: string;
  actorName?: string;
  action: 'START_REVIEW' | 'RESOLVE' | 'DISMISS' | 'REQUEST_INFO' | 'NOTE';
  note: string | null;
  createdAt: string;
}

export interface ApiReport {
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
  onChainStatus?: 'ACTIVE' | 'DISPUTED' | 'REVOKED';
  reason: 'PLAGIARISM' | 'UNLICENSED_DISTRIBUTION' | 'WRONG_AUTHOR' | 'FRAUDULENT_RECORD' | 'INACCURATE_METADATA' | 'OTHER';
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  handledByUserId: string | null;
  handledByName?: string;
  createdAt: string;
  updatedAt: string;
  actions?: ApiReportAction[];
}

export const reportApi = {
  submit: (data: {
    bookId?: string | null;
    copyrightRecordId?: string | null;
    reason: string;
    description: string;
  }) =>
    request<ApiReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyReports: () => request<ApiReport[]>('/api/reports/my-reports'),

  getById: (id: string) => request<ApiReport>(`/api/reports/${id}`),
};


