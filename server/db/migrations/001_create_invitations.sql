-- =========================================================
-- BOOKCHAIN LIBRARY - MIGRATION 001: AUTHOR INVITATIONS
-- Purpose:
--   - Create dbo.AuthorInvitations (Invitation codes management)
--   - Create dbo.InvitationUses (Audit log of redemptions)
-- Idempotent script: Safe to re-run multiple times.
-- =========================================================

USE [BookChainLibrary];
GO

-- 1. Table: dbo.AuthorInvitations
IF OBJECT_ID(N'dbo.AuthorInvitations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthorInvitations
    (
        InvitationId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_AuthorInvitations_Id DEFAULT NEWSEQUENTIALID(),
        CodeHash CHAR(64) NOT NULL,
        CreatedByUserId UNIQUEIDENTIFIER NOT NULL,
        ExpiresAt DATETIME2(3) NOT NULL,
        MaxUses INT NOT NULL
            CONSTRAINT DF_AuthorInvitations_MaxUses DEFAULT (1),
        UsedCount INT NOT NULL
            CONSTRAINT DF_AuthorInvitations_UsedCount DEFAULT (0),
        RevokedAt DATETIME2(3) NULL,
        Note NVARCHAR(255) NULL,
        CreatedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_AuthorInvitations_CreatedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_AuthorInvitations PRIMARY KEY (InvitationId),
        CONSTRAINT UQ_AuthorInvitations_CodeHash UNIQUE (CodeHash),
        CONSTRAINT FK_AuthorInvitations_CreatedBy
            FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_AuthorInvitations_MaxUses CHECK (MaxUses > 0),
        CONSTRAINT CK_AuthorInvitations_UsedCount CHECK (UsedCount >= 0 AND UsedCount <= MaxUses)
    );
END;
GO

-- Index on CodeHash
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AuthorInvitations_CodeHash' AND object_id = OBJECT_ID(N'dbo.AuthorInvitations')
)
BEGIN
    CREATE INDEX IX_AuthorInvitations_CodeHash
        ON dbo.AuthorInvitations(CodeHash);
END;
GO

-- Index on CreatedByUserId
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AuthorInvitations_CreatedByUserId' AND object_id = OBJECT_ID(N'dbo.AuthorInvitations')
)
BEGIN
    CREATE INDEX IX_AuthorInvitations_CreatedByUserId
        ON dbo.AuthorInvitations(CreatedByUserId);
END;
GO

-- 2. Table: dbo.InvitationUses
IF OBJECT_ID(N'dbo.InvitationUses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InvitationUses
    (
        InvitationUseId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_InvitationUses_Id DEFAULT NEWSEQUENTIALID(),
        InvitationId UNIQUEIDENTIFIER NOT NULL,
        UserId UNIQUEIDENTIFIER NOT NULL,
        UsedAt DATETIME2(3) NOT NULL
            CONSTRAINT DF_InvitationUses_UsedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_InvitationUses PRIMARY KEY (InvitationUseId),
        CONSTRAINT FK_InvitationUses_Invitation
            FOREIGN KEY (InvitationId) REFERENCES dbo.AuthorInvitations(InvitationId),
        CONSTRAINT FK_InvitationUses_Users
            FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT UQ_InvitationUses_User_Invitation UNIQUE (InvitationId, UserId)
    );
END;
GO

-- Indexes on InvitationUses
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_InvitationUses_InvitationId' AND object_id = OBJECT_ID(N'dbo.InvitationUses')
)
BEGIN
    CREATE INDEX IX_InvitationUses_InvitationId
        ON dbo.InvitationUses(InvitationId);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_InvitationUses_UserId' AND object_id = OBJECT_ID(N'dbo.InvitationUses')
)
BEGIN
    CREATE INDEX IX_InvitationUses_UserId
        ON dbo.InvitationUses(UserId);
END;
GO
