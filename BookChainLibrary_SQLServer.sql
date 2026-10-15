-- ================================================================================
-- BOOKCHAIN LIBRARY - DATABASE INITIALIZATION SCRIPT (SQL SERVER)
-- File: BookChainLibrary_SQLServer.sql
-- Description: Creates Database, Tables, Primary Keys, Foreign Keys, Indexes,
--              and seeds initial system roles (READER, AUTHOR, ADMIN).
-- Safe for fresh environments. Contains no private user data or secrets.
-- ================================================================================

USE [master];
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'BookChainLibrary')
BEGIN
    CREATE DATABASE [BookChainLibrary];
END;
GO

USE [BookChainLibrary];
GO

USE [BookChainLibrary]
GO
/****** Object:  User [bookchain_dev]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'bookchain_dev')
CREATE USER [bookchain_dev] FOR LOGIN [bookchain_dev] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_ddladmin] ADD MEMBER [bookchain_dev]
GO
ALTER ROLE [db_datareader] ADD MEMBER [bookchain_dev]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [bookchain_dev]
GO
/****** Object:  Table [dbo].[AuthorInvitations]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[AuthorInvitations](
	[InvitationId] [uniqueidentifier] NOT NULL,
	[CodeHash] [char](64) NOT NULL,
	[CreatedByUserId] [uniqueidentifier] NOT NULL,
	[ExpiresAt] [datetime2](3) NOT NULL,
	[MaxUses] [int] NOT NULL,
	[UsedCount] [int] NOT NULL,
	[RevokedAt] [datetime2](3) NULL,
	[Note] [nvarchar](255) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_AuthorInvitations] PRIMARY KEY CLUSTERED 
(
	[InvitationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[AuthorProfiles]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuthorProfiles]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[AuthorProfiles](
	[AuthorProfileId] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[PenName] [nvarchar](150) NOT NULL,
	[Bio] [nvarchar](max) NULL,
	[VerificationStatus] [varchar](20) NOT NULL,
	[VerificationNote] [nvarchar](1000) NULL,
	[ReviewedByUserId] [uniqueidentifier] NULL,
	[ReviewedAt] [datetime2](3) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_AuthorProfiles] PRIMARY KEY CLUSTERED 
(
	[AuthorProfileId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[BlockchainTransactions]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[BlockchainTransactions](
	[BlockchainTransactionId] [uniqueidentifier] NOT NULL,
	[CopyrightRecordId] [uniqueidentifier] NOT NULL,
	[WalletId] [uniqueidentifier] NULL,
	[ChainId] [bigint] NOT NULL,
	[TransactionType] [varchar](30) NOT NULL,
	[TxHash] [varchar](66) NULL,
	[ContractAddress] [varchar](42) NULL,
	[Status] [varchar](20) NOT NULL,
	[BlockNumber] [bigint] NULL,
	[ErrorMessage] [nvarchar](1000) NULL,
	[SubmittedAt] [datetime2](3) NULL,
	[ConfirmedAt] [datetime2](3) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_BlockchainTransactions] PRIMARY KEY CLUSTERED 
(
	[BlockchainTransactionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[BookAuthors]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BookAuthors]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[BookAuthors](
	[BookId] [uniqueidentifier] NOT NULL,
	[AuthorProfileId] [uniqueidentifier] NOT NULL,
	[ContributionRole] [varchar](30) NOT NULL,
	[DisplayOrder] [int] NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_BookAuthors] PRIMARY KEY CLUSTERED 
(
	[BookId] ASC,
	[AuthorProfileId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[BookFiles]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BookFiles]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[BookFiles](
	[BookFileId] [uniqueidentifier] NOT NULL,
	[BookId] [uniqueidentifier] NOT NULL,
	[VersionNumber] [int] NOT NULL,
	[StorageProvider] [varchar](20) NOT NULL,
	[StorageKey] [nvarchar](1000) NOT NULL,
	[OriginalFileName] [nvarchar](255) NOT NULL,
	[MimeType] [varchar](150) NOT NULL,
	[SizeBytes] [bigint] NOT NULL,
	[Sha256] [char](64) NOT NULL,
	[AccessLevel] [varchar](20) NOT NULL,
	[IsCurrent] [bit] NOT NULL,
	[UploadedByUserId] [uniqueidentifier] NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_BookFiles] PRIMARY KEY CLUSTERED 
(
	[BookFileId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[Books]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Books]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Books](
	[BookId] [uniqueidentifier] NOT NULL,
	[Title] [nvarchar](255) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[CoverUrl] [nvarchar](500) NULL,
	[LanguageCode] [varchar](10) NULL,
	[PublicationStatus] [varchar](20) NOT NULL,
	[PublishedAt] [datetime2](3) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_Books] PRIMARY KEY CLUSTERED 
(
	[BookId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[CopyrightRecords]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CopyrightRecords](
	[CopyrightRecordId] [uniqueidentifier] NOT NULL,
	[RecordNumber] [nvarchar](40) NOT NULL,
	[BookId] [uniqueidentifier] NOT NULL,
	[BookFileId] [uniqueidentifier] NOT NULL,
	[SubmittedByUserId] [uniqueidentifier] NOT NULL,
	[ClaimStatement] [nvarchar](max) NOT NULL,
	[RecordStatus] [varchar](25) NOT NULL,
	[SubmittedAt] [datetime2](3) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_CopyrightRecords] PRIMARY KEY CLUSTERED 
(
	[CopyrightRecordId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[Favorites]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Favorites]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Favorites](
	[UserId] [uniqueidentifier] NOT NULL,
	[BookId] [uniqueidentifier] NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_Favorites] PRIMARY KEY CLUSTERED 
(
	[UserId] ASC,
	[BookId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[InvitationUses]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InvitationUses]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[InvitationUses](
	[InvitationUseId] [uniqueidentifier] NOT NULL,
	[InvitationId] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[UsedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_InvitationUses] PRIMARY KEY CLUSTERED 
(
	[InvitationUseId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[ReadingProgress]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ReadingProgress]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[ReadingProgress](
	[UserId] [uniqueidentifier] NOT NULL,
	[BookId] [uniqueidentifier] NOT NULL,
	[PositionJson] [nvarchar](max) NULL,
	[ProgressPercent] [decimal](5, 2) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_ReadingProgress] PRIMARY KEY CLUSTERED 
(
	[UserId] ASC,
	[BookId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[ReportActions]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ReportActions]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[ReportActions](
	[ReportActionId] [uniqueidentifier] NOT NULL,
	[ReportId] [uniqueidentifier] NOT NULL,
	[ActorUserId] [uniqueidentifier] NOT NULL,
	[Action] [varchar](30) NOT NULL,
	[Note] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_ReportActions] PRIMARY KEY CLUSTERED 
(
	[ReportActionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[Reports]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Reports]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Reports](
	[ReportId] [uniqueidentifier] NOT NULL,
	[ReporterUserId] [uniqueidentifier] NULL,
	[BookId] [uniqueidentifier] NULL,
	[CopyrightRecordId] [uniqueidentifier] NULL,
	[Reason] [varchar](50) NOT NULL,
	[Description] [nvarchar](max) NOT NULL,
	[Status] [varchar](20) NOT NULL,
	[HandledByUserId] [uniqueidentifier] NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_Reports] PRIMARY KEY CLUSTERED 
(
	[ReportId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[Roles]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Roles](
	[RoleId] [int] IDENTITY(1,1) NOT NULL,
	[Code] [varchar](30) NOT NULL,
	[Name] [nvarchar](80) NOT NULL,
	[Description] [nvarchar](300) NULL,
 CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED 
(
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[Sessions]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sessions]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Sessions](
	[SessionId] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[TokenHash] [nvarchar](255) NOT NULL,
	[ExpiresAt] [datetime2](3) NOT NULL,
	[RevokedAt] [datetime2](3) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[LastUsedAt] [datetime2](3) NULL,
 CONSTRAINT [PK_Sessions] PRIMARY KEY CLUSTERED 
(
	[SessionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[UserRoles]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserRoles]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[UserRoles](
	[UserId] [uniqueidentifier] NOT NULL,
	[RoleId] [int] NOT NULL,
	[GrantedByUserId] [uniqueidentifier] NULL,
	[GrantedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_UserRoles] PRIMARY KEY CLUSTERED 
(
	[UserId] ASC,
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[Users]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Users](
	[UserId] [uniqueidentifier] NOT NULL,
	[Email] [nvarchar](254) NOT NULL,
	[EmailNormalized] [nvarchar](254) NOT NULL,
	[PasswordHash] [nvarchar](255) NOT NULL,
	[DisplayName] [nvarchar](100) NOT NULL,
	[AvatarUrl] [nvarchar](500) NULL,
	[Status] [varchar](20) NOT NULL,
	[EmailVerifiedAt] [datetime2](3) NULL,
	[LastLoginAt] [datetime2](3) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED 
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO
/****** Object:  Table [dbo].[Wallets]    Script Date: 15/10/2026 12:44:52 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Wallets]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Wallets](
	[WalletId] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[ChainId] [bigint] NOT NULL,
	[Address] [varchar](42) NOT NULL,
	[IsPrimary] [bit] NOT NULL,
	[VerifiedAt] [datetime2](3) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_Wallets] PRIMARY KEY CLUSTERED 
(
	[WalletId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
END
GO

-- ================================================================================
-- SYSTEM ROLES SEED DATA
-- ================================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Code] = N'READER')
BEGIN
    SET IDENTITY_INSERT [dbo].[Roles] ON;
    INSERT [dbo].[Roles] ([RoleId], [Code], [Name], [Description]) 
    VALUES (1, N'READER', N'Độc giả', N'Có thể xem thư viện công khai và sử dụng tính năng dành cho độc giả.');
    INSERT [dbo].[Roles] ([RoleId], [Code], [Name], [Description]) 
    VALUES (2, N'AUTHOR', N'Tác giả', N'Có thể quản lý tác phẩm và gửi hồ sơ bản quyền theo quy tắc hệ thống.');
    INSERT [dbo].[Roles] ([RoleId], [Code], [Name], [Description]) 
    VALUES (3, N'ADMIN', N'Quản trị viên', N'Quản lý hệ thống và xử lý báo cáo.');
    SET IDENTITY_INSERT [dbo].[Roles] OFF;
END;
GO

SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_AuthorInvitations_CodeHash]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]') AND name = N'UQ_AuthorInvitations_CodeHash')
ALTER TABLE [dbo].[AuthorInvitations] ADD  CONSTRAINT [UQ_AuthorInvitations_CodeHash] UNIQUE NONCLUSTERED 
(
	[CodeHash] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_AuthorInvitations_CodeHash]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]') AND name = N'IX_AuthorInvitations_CodeHash')
CREATE NONCLUSTERED INDEX [IX_AuthorInvitations_CodeHash] ON [dbo].[AuthorInvitations]
(
	[CodeHash] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_AuthorInvitations_CreatedByUserId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]') AND name = N'IX_AuthorInvitations_CreatedByUserId')
CREATE NONCLUSTERED INDEX [IX_AuthorInvitations_CreatedByUserId] ON [dbo].[AuthorInvitations]
(
	[CreatedByUserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_AuthorProfiles_UserId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[AuthorProfiles]') AND name = N'UQ_AuthorProfiles_UserId')
ALTER TABLE [dbo].[AuthorProfiles] ADD  CONSTRAINT [UQ_AuthorProfiles_UserId] UNIQUE NONCLUSTERED 
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_BlockchainTransactions_Record_CreatedAt]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]') AND name = N'IX_BlockchainTransactions_Record_CreatedAt')
CREATE NONCLUSTERED INDEX [IX_BlockchainTransactions_Record_CreatedAt] ON [dbo].[BlockchainTransactions]
(
	[CopyrightRecordId] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_BlockchainTransactions_Status_CreatedAt]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]') AND name = N'IX_BlockchainTransactions_Status_CreatedAt')
CREATE NONCLUSTERED INDEX [IX_BlockchainTransactions_Status_CreatedAt] ON [dbo].[BlockchainTransactions]
(
	[Status] ASC,
	[CreatedAt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UX_BlockchainTransactions_Chain_TxHash]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]') AND name = N'UX_BlockchainTransactions_Chain_TxHash')
CREATE UNIQUE NONCLUSTERED INDEX [UX_BlockchainTransactions_Chain_TxHash] ON [dbo].[BlockchainTransactions]
(
	[ChainId] ASC,
	[TxHash] ASC
)
WHERE ([TxHash] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_BookAuthors_DisplayOrder]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BookAuthors]') AND name = N'UQ_BookAuthors_DisplayOrder')
ALTER TABLE [dbo].[BookAuthors] ADD  CONSTRAINT [UQ_BookAuthors_DisplayOrder] UNIQUE NONCLUSTERED 
(
	[BookId] ASC,
	[DisplayOrder] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_BookAuthors_AuthorProfileId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BookAuthors]') AND name = N'IX_BookAuthors_AuthorProfileId')
CREATE NONCLUSTERED INDEX [IX_BookAuthors_AuthorProfileId] ON [dbo].[BookAuthors]
(
	[AuthorProfileId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UX_BookAuthors_OnePrimaryAuthor]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BookAuthors]') AND name = N'UX_BookAuthors_OnePrimaryAuthor')
CREATE UNIQUE NONCLUSTERED INDEX [UX_BookAuthors_OnePrimaryAuthor] ON [dbo].[BookAuthors]
(
	[BookId] ASC
)
WHERE ([ContributionRole]='PRIMARY_AUTHOR')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_BookFiles_Book_Version]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BookFiles]') AND name = N'UQ_BookFiles_Book_Version')
ALTER TABLE [dbo].[BookFiles] ADD  CONSTRAINT [UQ_BookFiles_Book_Version] UNIQUE NONCLUSTERED 
(
	[BookId] ASC,
	[VersionNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_BookFiles_File_Book]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BookFiles]') AND name = N'UQ_BookFiles_File_Book')
ALTER TABLE [dbo].[BookFiles] ADD  CONSTRAINT [UQ_BookFiles_File_Book] UNIQUE NONCLUSTERED 
(
	[BookFileId] ASC,
	[BookId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_BookFiles_Sha256]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BookFiles]') AND name = N'IX_BookFiles_Sha256')
CREATE NONCLUSTERED INDEX [IX_BookFiles_Sha256] ON [dbo].[BookFiles]
(
	[Sha256] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_BookFiles_UploadedByUserId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BookFiles]') AND name = N'IX_BookFiles_UploadedByUserId')
CREATE NONCLUSTERED INDEX [IX_BookFiles_UploadedByUserId] ON [dbo].[BookFiles]
(
	[UploadedByUserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UX_BookFiles_OneCurrentVersion]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[BookFiles]') AND name = N'UX_BookFiles_OneCurrentVersion')
CREATE UNIQUE NONCLUSTERED INDEX [UX_BookFiles_OneCurrentVersion] ON [dbo].[BookFiles]
(
	[BookId] ASC
)
WHERE ([IsCurrent]=(1))
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Books_PublicationStatus_PublishedAt]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Books]') AND name = N'IX_Books_PublicationStatus_PublishedAt')
CREATE NONCLUSTERED INDEX [IX_Books_PublicationStatus_PublishedAt] ON [dbo].[Books]
(
	[PublicationStatus] ASC,
	[PublishedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_CopyrightRecords_RecordNumber]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]') AND name = N'UQ_CopyrightRecords_RecordNumber')
ALTER TABLE [dbo].[CopyrightRecords] ADD  CONSTRAINT [UQ_CopyrightRecords_RecordNumber] UNIQUE NONCLUSTERED 
(
	[RecordNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CopyrightRecords_Book_CreatedAt]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]') AND name = N'IX_CopyrightRecords_Book_CreatedAt')
CREATE NONCLUSTERED INDEX [IX_CopyrightRecords_Book_CreatedAt] ON [dbo].[CopyrightRecords]
(
	[BookId] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_CopyrightRecords_Status_CreatedAt]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]') AND name = N'IX_CopyrightRecords_Status_CreatedAt')
CREATE NONCLUSTERED INDEX [IX_CopyrightRecords_Status_CreatedAt] ON [dbo].[CopyrightRecords]
(
	[RecordStatus] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CopyrightRecords_SubmittedByUserId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]') AND name = N'IX_CopyrightRecords_SubmittedByUserId')
CREATE NONCLUSTERED INDEX [IX_CopyrightRecords_SubmittedByUserId] ON [dbo].[CopyrightRecords]
(
	[SubmittedByUserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Favorites_BookId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Favorites]') AND name = N'IX_Favorites_BookId')
CREATE NONCLUSTERED INDEX [IX_Favorites_BookId] ON [dbo].[Favorites]
(
	[BookId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_InvitationUses_User_Invitation]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[InvitationUses]') AND name = N'UQ_InvitationUses_User_Invitation')
ALTER TABLE [dbo].[InvitationUses] ADD  CONSTRAINT [UQ_InvitationUses_User_Invitation] UNIQUE NONCLUSTERED 
(
	[InvitationId] ASC,
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_InvitationUses_InvitationId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[InvitationUses]') AND name = N'IX_InvitationUses_InvitationId')
CREATE NONCLUSTERED INDEX [IX_InvitationUses_InvitationId] ON [dbo].[InvitationUses]
(
	[InvitationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_InvitationUses_UserId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[InvitationUses]') AND name = N'IX_InvitationUses_UserId')
CREATE NONCLUSTERED INDEX [IX_InvitationUses_UserId] ON [dbo].[InvitationUses]
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ReadingProgress_BookId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ReadingProgress]') AND name = N'IX_ReadingProgress_BookId')
CREATE NONCLUSTERED INDEX [IX_ReadingProgress_BookId] ON [dbo].[ReadingProgress]
(
	[BookId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ReportActions_ReportId_CreatedAt]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ReportActions]') AND name = N'IX_ReportActions_ReportId_CreatedAt')
CREATE NONCLUSTERED INDEX [IX_ReportActions_ReportId_CreatedAt] ON [dbo].[ReportActions]
(
	[ReportId] ASC,
	[CreatedAt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Reports_BookId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Reports]') AND name = N'IX_Reports_BookId')
CREATE NONCLUSTERED INDEX [IX_Reports_BookId] ON [dbo].[Reports]
(
	[BookId] ASC
)
WHERE ([BookId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Reports_CopyrightRecordId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Reports]') AND name = N'IX_Reports_CopyrightRecordId')
CREATE NONCLUSTERED INDEX [IX_Reports_CopyrightRecordId] ON [dbo].[Reports]
(
	[CopyrightRecordId] ASC
)
WHERE ([CopyrightRecordId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Reports_Status_CreatedAt]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Reports]') AND name = N'IX_Reports_Status_CreatedAt')
CREATE NONCLUSTERED INDEX [IX_Reports_Status_CreatedAt] ON [dbo].[Reports]
(
	[Status] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Roles_Code]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND name = N'UQ_Roles_Code')
ALTER TABLE [dbo].[Roles] ADD  CONSTRAINT [UQ_Roles_Code] UNIQUE NONCLUSTERED 
(
	[Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Sessions_TokenHash]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Sessions]') AND name = N'UQ_Sessions_TokenHash')
ALTER TABLE [dbo].[Sessions] ADD  CONSTRAINT [UQ_Sessions_TokenHash] UNIQUE NONCLUSTERED 
(
	[TokenHash] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Sessions_UserId_ExpiresAt]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Sessions]') AND name = N'IX_Sessions_UserId_ExpiresAt')
CREATE NONCLUSTERED INDEX [IX_Sessions_UserId_ExpiresAt] ON [dbo].[Sessions]
(
	[UserId] ASC,
	[ExpiresAt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_UserRoles_RoleId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[UserRoles]') AND name = N'IX_UserRoles_RoleId')
CREATE NONCLUSTERED INDEX [IX_UserRoles_RoleId] ON [dbo].[UserRoles]
(
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Users_EmailNormalized]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = N'UQ_Users_EmailNormalized')
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [UQ_Users_EmailNormalized] UNIQUE NONCLUSTERED 
(
	[EmailNormalized] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Wallets_UserId]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Wallets]') AND name = N'IX_Wallets_UserId')
CREATE NONCLUSTERED INDEX [IX_Wallets_UserId] ON [dbo].[Wallets]
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UX_Wallets_Chain_Address]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Wallets]') AND name = N'UX_Wallets_Chain_Address')
CREATE UNIQUE NONCLUSTERED INDEX [UX_Wallets_Chain_Address] ON [dbo].[Wallets]
(
	[ChainId] ASC,
	[Address] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UX_Wallets_OnePrimaryPerChain]    Script Date: 15/10/2026 12:44:52 CH ******/
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Wallets]') AND name = N'UX_Wallets_OnePrimaryPerChain')
CREATE UNIQUE NONCLUSTERED INDEX [UX_Wallets_OnePrimaryPerChain] ON [dbo].[Wallets]
(
	[UserId] ASC,
	[ChainId] ASC
)
WHERE ([IsPrimary]=(1))
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_AuthorInvitations_Id]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[AuthorInvitations] ADD  CONSTRAINT [DF_AuthorInvitations_Id]  DEFAULT (newsequentialid()) FOR [InvitationId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_AuthorInvitations_MaxUses]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[AuthorInvitations] ADD  CONSTRAINT [DF_AuthorInvitations_MaxUses]  DEFAULT ((1)) FOR [MaxUses]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_AuthorInvitations_UsedCount]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[AuthorInvitations] ADD  CONSTRAINT [DF_AuthorInvitations_UsedCount]  DEFAULT ((0)) FOR [UsedCount]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_AuthorInvitations_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[AuthorInvitations] ADD  CONSTRAINT [DF_AuthorInvitations_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_AuthorProfiles_Id]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[AuthorProfiles] ADD  CONSTRAINT [DF_AuthorProfiles_Id]  DEFAULT (newsequentialid()) FOR [AuthorProfileId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_AuthorProfiles_VerificationStatus]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[AuthorProfiles] ADD  CONSTRAINT [DF_AuthorProfiles_VerificationStatus]  DEFAULT ('PENDING') FOR [VerificationStatus]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_AuthorProfiles_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[AuthorProfiles] ADD  CONSTRAINT [DF_AuthorProfiles_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_AuthorProfiles_UpdatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[AuthorProfiles] ADD  CONSTRAINT [DF_AuthorProfiles_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BlockchainTransactions_Id]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BlockchainTransactions] ADD  CONSTRAINT [DF_BlockchainTransactions_Id]  DEFAULT (newsequentialid()) FOR [BlockchainTransactionId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BlockchainTransactions_Status]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BlockchainTransactions] ADD  CONSTRAINT [DF_BlockchainTransactions_Status]  DEFAULT ('QUEUED') FOR [Status]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BlockchainTransactions_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BlockchainTransactions] ADD  CONSTRAINT [DF_BlockchainTransactions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BlockchainTransactions_UpdatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BlockchainTransactions] ADD  CONSTRAINT [DF_BlockchainTransactions_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BookAuthors_ContributionRole]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BookAuthors] ADD  CONSTRAINT [DF_BookAuthors_ContributionRole]  DEFAULT ('CO_AUTHOR') FOR [ContributionRole]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BookAuthors_DisplayOrder]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BookAuthors] ADD  CONSTRAINT [DF_BookAuthors_DisplayOrder]  DEFAULT ((1)) FOR [DisplayOrder]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BookAuthors_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BookAuthors] ADD  CONSTRAINT [DF_BookAuthors_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BookFiles_BookFileId]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BookFiles] ADD  CONSTRAINT [DF_BookFiles_BookFileId]  DEFAULT (newsequentialid()) FOR [BookFileId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BookFiles_StorageProvider]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BookFiles] ADD  CONSTRAINT [DF_BookFiles_StorageProvider]  DEFAULT ('LOCAL') FOR [StorageProvider]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BookFiles_AccessLevel]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BookFiles] ADD  CONSTRAINT [DF_BookFiles_AccessLevel]  DEFAULT ('PRIVATE') FOR [AccessLevel]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BookFiles_IsCurrent]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BookFiles] ADD  CONSTRAINT [DF_BookFiles_IsCurrent]  DEFAULT ((0)) FOR [IsCurrent]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_BookFiles_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[BookFiles] ADD  CONSTRAINT [DF_BookFiles_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Books_BookId]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Books] ADD  CONSTRAINT [DF_Books_BookId]  DEFAULT (newsequentialid()) FOR [BookId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Books_PublicationStatus]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Books] ADD  CONSTRAINT [DF_Books_PublicationStatus]  DEFAULT ('DRAFT') FOR [PublicationStatus]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Books_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Books] ADD  CONSTRAINT [DF_Books_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Books_UpdatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Books] ADD  CONSTRAINT [DF_Books_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_CopyrightRecords_Id]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[CopyrightRecords] ADD  CONSTRAINT [DF_CopyrightRecords_Id]  DEFAULT (newsequentialid()) FOR [CopyrightRecordId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_CopyrightRecords_Status]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[CopyrightRecords] ADD  CONSTRAINT [DF_CopyrightRecords_Status]  DEFAULT ('DRAFT') FOR [RecordStatus]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_CopyrightRecords_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[CopyrightRecords] ADD  CONSTRAINT [DF_CopyrightRecords_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_CopyrightRecords_UpdatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[CopyrightRecords] ADD  CONSTRAINT [DF_CopyrightRecords_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Favorites_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Favorites] ADD  CONSTRAINT [DF_Favorites_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_InvitationUses_Id]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[InvitationUses] ADD  CONSTRAINT [DF_InvitationUses_Id]  DEFAULT (newsequentialid()) FOR [InvitationUseId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_InvitationUses_UsedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[InvitationUses] ADD  CONSTRAINT [DF_InvitationUses_UsedAt]  DEFAULT (sysutcdatetime()) FOR [UsedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_ReadingProgress_Percent]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[ReadingProgress] ADD  CONSTRAINT [DF_ReadingProgress_Percent]  DEFAULT ((0)) FOR [ProgressPercent]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_ReadingProgress_UpdatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[ReadingProgress] ADD  CONSTRAINT [DF_ReadingProgress_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_ReportActions_Id]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[ReportActions] ADD  CONSTRAINT [DF_ReportActions_Id]  DEFAULT (newsequentialid()) FOR [ReportActionId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_ReportActions_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[ReportActions] ADD  CONSTRAINT [DF_ReportActions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Reports_ReportId]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Reports] ADD  CONSTRAINT [DF_Reports_ReportId]  DEFAULT (newsequentialid()) FOR [ReportId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Reports_Status]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Reports] ADD  CONSTRAINT [DF_Reports_Status]  DEFAULT ('OPEN') FOR [Status]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Reports_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Reports] ADD  CONSTRAINT [DF_Reports_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Reports_UpdatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Reports] ADD  CONSTRAINT [DF_Reports_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Sessions_SessionId]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Sessions] ADD  CONSTRAINT [DF_Sessions_SessionId]  DEFAULT (newsequentialid()) FOR [SessionId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Sessions_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Sessions] ADD  CONSTRAINT [DF_Sessions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_UserRoles_GrantedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[UserRoles] ADD  CONSTRAINT [DF_UserRoles_GrantedAt]  DEFAULT (sysutcdatetime()) FOR [GrantedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Users_UserId]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_UserId]  DEFAULT (newsequentialid()) FOR [UserId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Users_Status]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_Status]  DEFAULT ('ACTIVE') FOR [Status]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Users_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Users_UpdatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_UpdatedAt]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Wallets_WalletId]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Wallets] ADD  CONSTRAINT [DF_Wallets_WalletId]  DEFAULT (newsequentialid()) FOR [WalletId]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Wallets_IsPrimary]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Wallets] ADD  CONSTRAINT [DF_Wallets_IsPrimary]  DEFAULT ((0)) FOR [IsPrimary]
END
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DF_Wallets_CreatedAt]') AND type = 'D')
BEGIN
ALTER TABLE [dbo].[Wallets] ADD  CONSTRAINT [DF_Wallets_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
END
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_AuthorInvitations_CreatedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]'))
ALTER TABLE [dbo].[AuthorInvitations]  WITH CHECK ADD  CONSTRAINT [FK_AuthorInvitations_CreatedBy] FOREIGN KEY([CreatedByUserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_AuthorInvitations_CreatedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]'))
ALTER TABLE [dbo].[AuthorInvitations] CHECK CONSTRAINT [FK_AuthorInvitations_CreatedBy]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_AuthorProfiles_ReviewedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorProfiles]'))
ALTER TABLE [dbo].[AuthorProfiles]  WITH CHECK ADD  CONSTRAINT [FK_AuthorProfiles_ReviewedBy] FOREIGN KEY([ReviewedByUserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_AuthorProfiles_ReviewedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorProfiles]'))
ALTER TABLE [dbo].[AuthorProfiles] CHECK CONSTRAINT [FK_AuthorProfiles_ReviewedBy]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_AuthorProfiles_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorProfiles]'))
ALTER TABLE [dbo].[AuthorProfiles]  WITH CHECK ADD  CONSTRAINT [FK_AuthorProfiles_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_AuthorProfiles_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorProfiles]'))
ALTER TABLE [dbo].[AuthorProfiles] CHECK CONSTRAINT [FK_AuthorProfiles_Users]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BlockchainTransactions_CopyrightRecords]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions]  WITH CHECK ADD  CONSTRAINT [FK_BlockchainTransactions_CopyrightRecords] FOREIGN KEY([CopyrightRecordId])
REFERENCES [dbo].[CopyrightRecords] ([CopyrightRecordId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BlockchainTransactions_CopyrightRecords]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions] CHECK CONSTRAINT [FK_BlockchainTransactions_CopyrightRecords]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BlockchainTransactions_Wallets]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions]  WITH CHECK ADD  CONSTRAINT [FK_BlockchainTransactions_Wallets] FOREIGN KEY([WalletId])
REFERENCES [dbo].[Wallets] ([WalletId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BlockchainTransactions_Wallets]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions] CHECK CONSTRAINT [FK_BlockchainTransactions_Wallets]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BookAuthors_AuthorProfiles]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookAuthors]'))
ALTER TABLE [dbo].[BookAuthors]  WITH CHECK ADD  CONSTRAINT [FK_BookAuthors_AuthorProfiles] FOREIGN KEY([AuthorProfileId])
REFERENCES [dbo].[AuthorProfiles] ([AuthorProfileId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BookAuthors_AuthorProfiles]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookAuthors]'))
ALTER TABLE [dbo].[BookAuthors] CHECK CONSTRAINT [FK_BookAuthors_AuthorProfiles]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BookAuthors_Books]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookAuthors]'))
ALTER TABLE [dbo].[BookAuthors]  WITH CHECK ADD  CONSTRAINT [FK_BookAuthors_Books] FOREIGN KEY([BookId])
REFERENCES [dbo].[Books] ([BookId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BookAuthors_Books]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookAuthors]'))
ALTER TABLE [dbo].[BookAuthors] CHECK CONSTRAINT [FK_BookAuthors_Books]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BookFiles_Books]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles]  WITH CHECK ADD  CONSTRAINT [FK_BookFiles_Books] FOREIGN KEY([BookId])
REFERENCES [dbo].[Books] ([BookId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BookFiles_Books]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles] CHECK CONSTRAINT [FK_BookFiles_Books]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BookFiles_UploadedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles]  WITH CHECK ADD  CONSTRAINT [FK_BookFiles_UploadedBy] FOREIGN KEY([UploadedByUserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_BookFiles_UploadedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles] CHECK CONSTRAINT [FK_BookFiles_UploadedBy]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_CopyrightRecords_Book]') AND parent_object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]'))
ALTER TABLE [dbo].[CopyrightRecords]  WITH CHECK ADD  CONSTRAINT [FK_CopyrightRecords_Book] FOREIGN KEY([BookId])
REFERENCES [dbo].[Books] ([BookId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_CopyrightRecords_Book]') AND parent_object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]'))
ALTER TABLE [dbo].[CopyrightRecords] CHECK CONSTRAINT [FK_CopyrightRecords_Book]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_CopyrightRecords_BookFile_Book]') AND parent_object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]'))
ALTER TABLE [dbo].[CopyrightRecords]  WITH CHECK ADD  CONSTRAINT [FK_CopyrightRecords_BookFile_Book] FOREIGN KEY([BookFileId], [BookId])
REFERENCES [dbo].[BookFiles] ([BookFileId], [BookId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_CopyrightRecords_BookFile_Book]') AND parent_object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]'))
ALTER TABLE [dbo].[CopyrightRecords] CHECK CONSTRAINT [FK_CopyrightRecords_BookFile_Book]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_CopyrightRecords_SubmittedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]'))
ALTER TABLE [dbo].[CopyrightRecords]  WITH CHECK ADD  CONSTRAINT [FK_CopyrightRecords_SubmittedBy] FOREIGN KEY([SubmittedByUserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_CopyrightRecords_SubmittedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]'))
ALTER TABLE [dbo].[CopyrightRecords] CHECK CONSTRAINT [FK_CopyrightRecords_SubmittedBy]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Favorites_Books]') AND parent_object_id = OBJECT_ID(N'[dbo].[Favorites]'))
ALTER TABLE [dbo].[Favorites]  WITH CHECK ADD  CONSTRAINT [FK_Favorites_Books] FOREIGN KEY([BookId])
REFERENCES [dbo].[Books] ([BookId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Favorites_Books]') AND parent_object_id = OBJECT_ID(N'[dbo].[Favorites]'))
ALTER TABLE [dbo].[Favorites] CHECK CONSTRAINT [FK_Favorites_Books]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Favorites_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[Favorites]'))
ALTER TABLE [dbo].[Favorites]  WITH CHECK ADD  CONSTRAINT [FK_Favorites_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Favorites_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[Favorites]'))
ALTER TABLE [dbo].[Favorites] CHECK CONSTRAINT [FK_Favorites_Users]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_InvitationUses_Invitation]') AND parent_object_id = OBJECT_ID(N'[dbo].[InvitationUses]'))
ALTER TABLE [dbo].[InvitationUses]  WITH CHECK ADD  CONSTRAINT [FK_InvitationUses_Invitation] FOREIGN KEY([InvitationId])
REFERENCES [dbo].[AuthorInvitations] ([InvitationId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_InvitationUses_Invitation]') AND parent_object_id = OBJECT_ID(N'[dbo].[InvitationUses]'))
ALTER TABLE [dbo].[InvitationUses] CHECK CONSTRAINT [FK_InvitationUses_Invitation]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_InvitationUses_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[InvitationUses]'))
ALTER TABLE [dbo].[InvitationUses]  WITH CHECK ADD  CONSTRAINT [FK_InvitationUses_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_InvitationUses_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[InvitationUses]'))
ALTER TABLE [dbo].[InvitationUses] CHECK CONSTRAINT [FK_InvitationUses_Users]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ReadingProgress_Books]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReadingProgress]'))
ALTER TABLE [dbo].[ReadingProgress]  WITH CHECK ADD  CONSTRAINT [FK_ReadingProgress_Books] FOREIGN KEY([BookId])
REFERENCES [dbo].[Books] ([BookId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ReadingProgress_Books]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReadingProgress]'))
ALTER TABLE [dbo].[ReadingProgress] CHECK CONSTRAINT [FK_ReadingProgress_Books]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ReadingProgress_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReadingProgress]'))
ALTER TABLE [dbo].[ReadingProgress]  WITH CHECK ADD  CONSTRAINT [FK_ReadingProgress_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ReadingProgress_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReadingProgress]'))
ALTER TABLE [dbo].[ReadingProgress] CHECK CONSTRAINT [FK_ReadingProgress_Users]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ReportActions_Reports]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReportActions]'))
ALTER TABLE [dbo].[ReportActions]  WITH CHECK ADD  CONSTRAINT [FK_ReportActions_Reports] FOREIGN KEY([ReportId])
REFERENCES [dbo].[Reports] ([ReportId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ReportActions_Reports]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReportActions]'))
ALTER TABLE [dbo].[ReportActions] CHECK CONSTRAINT [FK_ReportActions_Reports]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ReportActions_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReportActions]'))
ALTER TABLE [dbo].[ReportActions]  WITH CHECK ADD  CONSTRAINT [FK_ReportActions_Users] FOREIGN KEY([ActorUserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_ReportActions_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReportActions]'))
ALTER TABLE [dbo].[ReportActions] CHECK CONSTRAINT [FK_ReportActions_Users]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Reports_Book]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports]  WITH CHECK ADD  CONSTRAINT [FK_Reports_Book] FOREIGN KEY([BookId])
REFERENCES [dbo].[Books] ([BookId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Reports_Book]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports] CHECK CONSTRAINT [FK_Reports_Book]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Reports_CopyrightRecord]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports]  WITH CHECK ADD  CONSTRAINT [FK_Reports_CopyrightRecord] FOREIGN KEY([CopyrightRecordId])
REFERENCES [dbo].[CopyrightRecords] ([CopyrightRecordId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Reports_CopyrightRecord]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports] CHECK CONSTRAINT [FK_Reports_CopyrightRecord]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Reports_Handler]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports]  WITH CHECK ADD  CONSTRAINT [FK_Reports_Handler] FOREIGN KEY([HandledByUserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Reports_Handler]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports] CHECK CONSTRAINT [FK_Reports_Handler]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Reports_Reporter]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports]  WITH CHECK ADD  CONSTRAINT [FK_Reports_Reporter] FOREIGN KEY([ReporterUserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Reports_Reporter]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports] CHECK CONSTRAINT [FK_Reports_Reporter]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Sessions_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[Sessions]'))
ALTER TABLE [dbo].[Sessions]  WITH CHECK ADD  CONSTRAINT [FK_Sessions_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Sessions_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[Sessions]'))
ALTER TABLE [dbo].[Sessions] CHECK CONSTRAINT [FK_Sessions_Users]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_UserRoles_GrantedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[UserRoles]'))
ALTER TABLE [dbo].[UserRoles]  WITH CHECK ADD  CONSTRAINT [FK_UserRoles_GrantedBy] FOREIGN KEY([GrantedByUserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_UserRoles_GrantedBy]') AND parent_object_id = OBJECT_ID(N'[dbo].[UserRoles]'))
ALTER TABLE [dbo].[UserRoles] CHECK CONSTRAINT [FK_UserRoles_GrantedBy]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_UserRoles_Roles]') AND parent_object_id = OBJECT_ID(N'[dbo].[UserRoles]'))
ALTER TABLE [dbo].[UserRoles]  WITH CHECK ADD  CONSTRAINT [FK_UserRoles_Roles] FOREIGN KEY([RoleId])
REFERENCES [dbo].[Roles] ([RoleId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_UserRoles_Roles]') AND parent_object_id = OBJECT_ID(N'[dbo].[UserRoles]'))
ALTER TABLE [dbo].[UserRoles] CHECK CONSTRAINT [FK_UserRoles_Roles]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_UserRoles_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[UserRoles]'))
ALTER TABLE [dbo].[UserRoles]  WITH CHECK ADD  CONSTRAINT [FK_UserRoles_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_UserRoles_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[UserRoles]'))
ALTER TABLE [dbo].[UserRoles] CHECK CONSTRAINT [FK_UserRoles_Users]
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Wallets_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[Wallets]'))
ALTER TABLE [dbo].[Wallets]  WITH CHECK ADD  CONSTRAINT [FK_Wallets_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
IF  EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_Wallets_Users]') AND parent_object_id = OBJECT_ID(N'[dbo].[Wallets]'))
ALTER TABLE [dbo].[Wallets] CHECK CONSTRAINT [FK_Wallets_Users]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_AuthorInvitations_MaxUses]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]'))
ALTER TABLE [dbo].[AuthorInvitations]  WITH CHECK ADD  CONSTRAINT [CK_AuthorInvitations_MaxUses] CHECK  (([MaxUses]>(0)))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_AuthorInvitations_MaxUses]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]'))
ALTER TABLE [dbo].[AuthorInvitations] CHECK CONSTRAINT [CK_AuthorInvitations_MaxUses]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_AuthorInvitations_UsedCount]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]'))
ALTER TABLE [dbo].[AuthorInvitations]  WITH CHECK ADD  CONSTRAINT [CK_AuthorInvitations_UsedCount] CHECK  (([UsedCount]>=(0) AND [UsedCount]<=[MaxUses]))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_AuthorInvitations_UsedCount]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorInvitations]'))
ALTER TABLE [dbo].[AuthorInvitations] CHECK CONSTRAINT [CK_AuthorInvitations_UsedCount]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_AuthorProfiles_VerificationStatus]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorProfiles]'))
ALTER TABLE [dbo].[AuthorProfiles]  WITH CHECK ADD  CONSTRAINT [CK_AuthorProfiles_VerificationStatus] CHECK  (([VerificationStatus]='REJECTED' OR [VerificationStatus]='VERIFIED' OR [VerificationStatus]='PENDING'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_AuthorProfiles_VerificationStatus]') AND parent_object_id = OBJECT_ID(N'[dbo].[AuthorProfiles]'))
ALTER TABLE [dbo].[AuthorProfiles] CHECK CONSTRAINT [CK_AuthorProfiles_VerificationStatus]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_BlockNumber]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions]  WITH CHECK ADD  CONSTRAINT [CK_BlockchainTransactions_BlockNumber] CHECK  (([BlockNumber] IS NULL OR [BlockNumber]>=(0)))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_BlockNumber]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions] CHECK CONSTRAINT [CK_BlockchainTransactions_BlockNumber]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_ChainId]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions]  WITH CHECK ADD  CONSTRAINT [CK_BlockchainTransactions_ChainId] CHECK  (([ChainId]>(0)))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_ChainId]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions] CHECK CONSTRAINT [CK_BlockchainTransactions_ChainId]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_ContractAddress]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions]  WITH CHECK ADD  CONSTRAINT [CK_BlockchainTransactions_ContractAddress] CHECK  (([ContractAddress] IS NULL OR len([ContractAddress])=(42) AND [ContractAddress] like '0x%'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_ContractAddress]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions] CHECK CONSTRAINT [CK_BlockchainTransactions_ContractAddress]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_Status]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions]  WITH CHECK ADD  CONSTRAINT [CK_BlockchainTransactions_Status] CHECK  (([Status]='FAILED' OR [Status]='CONFIRMED' OR [Status]='PENDING' OR [Status]='QUEUED'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_Status]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions] CHECK CONSTRAINT [CK_BlockchainTransactions_Status]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_TxHash]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions]  WITH CHECK ADD  CONSTRAINT [CK_BlockchainTransactions_TxHash] CHECK  (([TxHash] IS NULL OR len([TxHash])=(66) AND [TxHash] like '0x%'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BlockchainTransactions_TxHash]') AND parent_object_id = OBJECT_ID(N'[dbo].[BlockchainTransactions]'))
ALTER TABLE [dbo].[BlockchainTransactions] CHECK CONSTRAINT [CK_BlockchainTransactions_TxHash]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookAuthors_ContributionRole]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookAuthors]'))
ALTER TABLE [dbo].[BookAuthors]  WITH CHECK ADD  CONSTRAINT [CK_BookAuthors_ContributionRole] CHECK  (([ContributionRole]='TRANSLATOR' OR [ContributionRole]='EDITOR' OR [ContributionRole]='CO_AUTHOR' OR [ContributionRole]='PRIMARY_AUTHOR'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookAuthors_ContributionRole]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookAuthors]'))
ALTER TABLE [dbo].[BookAuthors] CHECK CONSTRAINT [CK_BookAuthors_ContributionRole]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookAuthors_DisplayOrder]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookAuthors]'))
ALTER TABLE [dbo].[BookAuthors]  WITH CHECK ADD  CONSTRAINT [CK_BookAuthors_DisplayOrder] CHECK  (([DisplayOrder]>=(1)))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookAuthors_DisplayOrder]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookAuthors]'))
ALTER TABLE [dbo].[BookAuthors] CHECK CONSTRAINT [CK_BookAuthors_DisplayOrder]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_AccessLevel]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles]  WITH CHECK ADD  CONSTRAINT [CK_BookFiles_AccessLevel] CHECK  (([AccessLevel]='PUBLIC_DOWNLOAD' OR [AccessLevel]='PUBLIC_READ' OR [AccessLevel]='PRIVATE'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_AccessLevel]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles] CHECK CONSTRAINT [CK_BookFiles_AccessLevel]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_Sha256]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles]  WITH CHECK ADD  CONSTRAINT [CK_BookFiles_Sha256] CHECK  ((NOT [Sha256] like '%[^0-9A-Fa-f]%'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_Sha256]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles] CHECK CONSTRAINT [CK_BookFiles_Sha256]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_SizeBytes]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles]  WITH CHECK ADD  CONSTRAINT [CK_BookFiles_SizeBytes] CHECK  (([SizeBytes]>(0)))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_SizeBytes]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles] CHECK CONSTRAINT [CK_BookFiles_SizeBytes]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_StorageProvider]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles]  WITH CHECK ADD  CONSTRAINT [CK_BookFiles_StorageProvider] CHECK  (([StorageProvider]='IPFS' OR [StorageProvider]='LOCAL'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_StorageProvider]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles] CHECK CONSTRAINT [CK_BookFiles_StorageProvider]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_VersionNumber]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles]  WITH CHECK ADD  CONSTRAINT [CK_BookFiles_VersionNumber] CHECK  (([VersionNumber]>(0)))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_BookFiles_VersionNumber]') AND parent_object_id = OBJECT_ID(N'[dbo].[BookFiles]'))
ALTER TABLE [dbo].[BookFiles] CHECK CONSTRAINT [CK_BookFiles_VersionNumber]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Books_PublicationStatus]') AND parent_object_id = OBJECT_ID(N'[dbo].[Books]'))
ALTER TABLE [dbo].[Books]  WITH CHECK ADD  CONSTRAINT [CK_Books_PublicationStatus] CHECK  (([PublicationStatus]='ARCHIVED' OR [PublicationStatus]='UNLISTED' OR [PublicationStatus]='PUBLISHED' OR [PublicationStatus]='DRAFT'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Books_PublicationStatus]') AND parent_object_id = OBJECT_ID(N'[dbo].[Books]'))
ALTER TABLE [dbo].[Books] CHECK CONSTRAINT [CK_Books_PublicationStatus]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_CopyrightRecords_Status]') AND parent_object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]'))
ALTER TABLE [dbo].[CopyrightRecords]  WITH CHECK ADD  CONSTRAINT [CK_CopyrightRecords_Status] CHECK  (([RecordStatus]='WITHDRAWN' OR [RecordStatus]='DISPUTED' OR [RecordStatus]='FAILED' OR [RecordStatus]='ON_CHAIN' OR [RecordStatus]='QUEUED' OR [RecordStatus]='SUBMITTED' OR [RecordStatus]='DRAFT'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_CopyrightRecords_Status]') AND parent_object_id = OBJECT_ID(N'[dbo].[CopyrightRecords]'))
ALTER TABLE [dbo].[CopyrightRecords] CHECK CONSTRAINT [CK_CopyrightRecords_Status]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_ReadingProgress_Percent]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReadingProgress]'))
ALTER TABLE [dbo].[ReadingProgress]  WITH CHECK ADD  CONSTRAINT [CK_ReadingProgress_Percent] CHECK  (([ProgressPercent]>=(0) AND [ProgressPercent]<=(100)))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_ReadingProgress_Percent]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReadingProgress]'))
ALTER TABLE [dbo].[ReadingProgress] CHECK CONSTRAINT [CK_ReadingProgress_Percent]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_ReadingProgress_PositionJson]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReadingProgress]'))
ALTER TABLE [dbo].[ReadingProgress]  WITH CHECK ADD  CONSTRAINT [CK_ReadingProgress_PositionJson] CHECK  (([PositionJson] IS NULL OR isjson([PositionJson])=(1)))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_ReadingProgress_PositionJson]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReadingProgress]'))
ALTER TABLE [dbo].[ReadingProgress] CHECK CONSTRAINT [CK_ReadingProgress_PositionJson]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_ReportActions_Action]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReportActions]'))
ALTER TABLE [dbo].[ReportActions]  WITH CHECK ADD  CONSTRAINT [CK_ReportActions_Action] CHECK  (([Action]='NOTE' OR [Action]='REQUEST_INFO' OR [Action]='DISMISS' OR [Action]='RESOLVE' OR [Action]='START_REVIEW'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_ReportActions_Action]') AND parent_object_id = OBJECT_ID(N'[dbo].[ReportActions]'))
ALTER TABLE [dbo].[ReportActions] CHECK CONSTRAINT [CK_ReportActions_Action]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Reports_Status]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports]  WITH CHECK ADD  CONSTRAINT [CK_Reports_Status] CHECK  (([Status]='DISMISSED' OR [Status]='RESOLVED' OR [Status]='IN_REVIEW' OR [Status]='OPEN'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Reports_Status]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports] CHECK CONSTRAINT [CK_Reports_Status]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Reports_Target]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports]  WITH CHECK ADD  CONSTRAINT [CK_Reports_Target] CHECK  (([BookId] IS NOT NULL OR [CopyrightRecordId] IS NOT NULL))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Reports_Target]') AND parent_object_id = OBJECT_ID(N'[dbo].[Reports]'))
ALTER TABLE [dbo].[Reports] CHECK CONSTRAINT [CK_Reports_Target]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Users_Status]') AND parent_object_id = OBJECT_ID(N'[dbo].[Users]'))
ALTER TABLE [dbo].[Users]  WITH CHECK ADD  CONSTRAINT [CK_Users_Status] CHECK  (([Status]='PENDING' OR [Status]='SUSPENDED' OR [Status]='ACTIVE'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Users_Status]') AND parent_object_id = OBJECT_ID(N'[dbo].[Users]'))
ALTER TABLE [dbo].[Users] CHECK CONSTRAINT [CK_Users_Status]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Wallets_Address]') AND parent_object_id = OBJECT_ID(N'[dbo].[Wallets]'))
ALTER TABLE [dbo].[Wallets]  WITH CHECK ADD  CONSTRAINT [CK_Wallets_Address] CHECK  ((len([Address])=(42) AND [Address] like '0x%'))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Wallets_Address]') AND parent_object_id = OBJECT_ID(N'[dbo].[Wallets]'))
ALTER TABLE [dbo].[Wallets] CHECK CONSTRAINT [CK_Wallets_Address]
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Wallets_ChainId]') AND parent_object_id = OBJECT_ID(N'[dbo].[Wallets]'))
ALTER TABLE [dbo].[Wallets]  WITH CHECK ADD  CONSTRAINT [CK_Wallets_ChainId] CHECK  (([ChainId]>(0)))
GO
IF  EXISTS (SELECT * FROM sys.check_constraints WHERE object_id = OBJECT_ID(N'[dbo].[CK_Wallets_ChainId]') AND parent_object_id = OBJECT_ID(N'[dbo].[Wallets]'))
ALTER TABLE [dbo].[Wallets] CHECK CONSTRAINT [CK_Wallets_ChainId]
GO
USE [master]
GO
ALTER DATABASE [BookChainLibrary] SET  READ_WRITE 
GO


PRINT N'BookChainLibrary schema script completed.';
GO