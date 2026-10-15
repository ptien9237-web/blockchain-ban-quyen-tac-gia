import { getPool, sql } from './sqlServer.js';
import { storageService } from '../services/storage/localStorageProvider.js';
import { authorProfileRepository } from '../repositories/authorProfileRepository.js';

export async function seedInitialBooks(): Promise<void> {
  const pool = await getPool();

  // Check if books already exist
  const countRes = await pool.request().query('SELECT COUNT(*) AS Cnt FROM dbo.Books;');
  if (countRes.recordset[0].Cnt > 0) {
    return; // Already seeded
  }

  console.log('[Seed] Seeding initial digital books with real files and SHA-256 hashes...');

  // Find or use an existing author
  let authorProfile = (
    await pool.request().query(`
      SELECT TOP 1 ap.AuthorProfileId, ap.UserId, ap.PenName
      FROM dbo.AuthorProfiles ap;
    `)
  ).recordset[0];

  if (!authorProfile) {
    // Check if any user exists
    let user = (
      await pool.request().query('SELECT TOP 1 UserId FROM dbo.Users;')
    ).recordset[0];

    if (!user) {
      console.log('[Seed] No user available to attach author profile. Skipping book seeding.');
      return;
    }

    const createdAp = await authorProfileRepository.createOrUpdate(user.UserId, {
      penName: 'Ban Biên Tập Thư Viện Sách Cổ',
      bio: 'Hội đồng Khảo cứu và Lưu trữ Di sản Văn bản Thư viện Số BookChain.',
    });
    authorProfile = {
      AuthorProfileId: createdAp.AuthorProfileId,
      UserId: createdAp.UserId,
      PenName: createdAp.PenName,
    };
  }

  const booksToSeed = [
    {
      title: 'Đại Việt Sử Ký Toàn Thư — Bản Khảo Dị Quốc Sử Quán',
      description: 'Bộ chính sử vô giá của Việt Nam ghi chép từ thời Hồng Bàng đến triều Hậu Lê. Bản điện tử học thuật được đối chiếu và phục dựng bản khắc Nội các quan bản Chính Hòa 1697.',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      languageCode: 'vi',
      category: 'History',
      content: '%PDF-1.4\n1 0 obj\n<< /Title (Dai Viet Su Ky Toan Thu - Vien Su Hoc) /Author (Ngo Si Lien) >>\nendobj\n2 0 obj\n<< /Length 204 >>\nstream\nDAI VIET SU KY TOAN THU\nBan Luu Tru Hoc Thuat BookChain Library 2026.\nBo chinh su ghi chep toan dien van hieng lich su Dai Viet tu thoi Hong Bang den Nam 1675.\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
      accessLevel: 'PUBLIC_READ' as const,
    },
    {
      title: 'Truyện Kiều — Khảo Luận Văn Bản Nôm Liễu Văn Đường 1871',
      description: 'Kiệt tác thi ca của Nguyễn Du qua bản in mộc bản Liễu Văn Đường năm Tự Đức thứ 24. Chú giải chữ Nôm cổ, phiên âm La-tinh và đối chiếu dị bản quốc tế.',
      coverUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80',
      languageCode: 'vi',
      category: 'Literature',
      content: '%PDF-1.4\n1 0 obj\n<< /Title (Truyen Kieu - Lieu Van Duong 1871) /Author (Nguyen Du) >>\nendobj\n2 0 obj\n<< /Length 186 >>\nstream\nDOAN TRUONG TAN THANH - TRUYEN KIEU\nKhao Luan Van Ban Nom Lieu Van Duong 1871.\nTram nam trong coi nguoi ta, Chu tai chu menh kheo la ghet nhau.\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
      accessLevel: 'PUBLIC_DOWNLOAD' as const,
    },
    {
      title: 'The Architecture of Trustless Digital Archives',
      description: 'Chuyên khảo kỹ thuật về bảo toàn tính toàn vẹn của thư viện số thông qua mã băm SHA-256 mật mã học và sổ cái bất biến. Hướng dẫn thiết kế kho lưu trữ tài liệu vĩnh cửu.',
      coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
      languageCode: 'en',
      category: 'Technology',
      content: '%PDF-1.4\n1 0 obj\n<< /Title (The Architecture of Trustless Digital Archives) /Author (BookChain Research Group) >>\nendobj\n2 0 obj\n<< /Length 238 >>\nstream\nTHE ARCHITECTURE OF TRUSTLESS DIGITAL ARCHIVES\nCryptographic Fingerprints, Content Addressability, and Long-Term Preservation.\nPrinciples: Library First, Copyright Second, Blockchain Underneath.\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
      accessLevel: 'PUBLIC_READ' as const,
    },
  ];

  for (const b of booksToSeed) {
    // 1. Save file to storage
    const fileBuffer = Buffer.from(b.content, 'utf-8');
    const storageRes = await storageService.saveFile(
      fileBuffer,
      `${b.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      'application/pdf'
    );

    // 2. Insert into Books
    const bookRes = await pool
      .request()
      .input('title', sql.NVarChar(255), b.title)
      .input('description', sql.NVarChar(sql.MAX), b.description)
      .input('coverUrl', sql.NVarChar(500), b.coverUrl)
      .input('languageCode', sql.VarChar(10), b.languageCode)
      .query(`
        INSERT INTO dbo.Books (Title, Description, CoverUrl, LanguageCode, PublicationStatus, PublishedAt)
        OUTPUT INSERTED.BookId
        VALUES (@title, @description, @coverUrl, @languageCode, 'PUBLISHED', SYSUTCDATETIME());
      `);

    const bookId = bookRes.recordset[0].BookId;

    // 3. Insert BookAuthor
    await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .input('authorProfileId', sql.UniqueIdentifier, authorProfile.AuthorProfileId)
      .query(`
        INSERT INTO dbo.BookAuthors (BookId, AuthorProfileId, ContributionRole, DisplayOrder)
        VALUES (@bookId, @authorProfileId, 'PRIMARY_AUTHOR', 1);
      `);

    // 4. Insert BookFile
    await pool
      .request()
      .input('bookId', sql.UniqueIdentifier, bookId)
      .input('versionNumber', sql.Int, 1)
      .input('storageKey', sql.NVarChar(1000), storageRes.storageKey)
      .input('originalFileName', sql.NVarChar(255), `${b.title}.pdf`)
      .input('mimeType', sql.VarChar(150), 'application/pdf')
      .input('sizeBytes', sql.BigInt, storageRes.sizeBytes)
      .input('sha256', sql.Char(64), storageRes.sha256.toUpperCase())
      .input('accessLevel', sql.VarChar(20), b.accessLevel)
      .input('uploadedByUserId', sql.UniqueIdentifier, authorProfile.UserId)
      .query(`
        INSERT INTO dbo.BookFiles (
          BookId, VersionNumber, StorageProvider, StorageKey, OriginalFileName,
          MimeType, SizeBytes, Sha256, AccessLevel, IsCurrent, UploadedByUserId
        )
        VALUES (
          @bookId, @versionNumber, 'LOCAL', @storageKey, @originalFileName,
          @mimeType, @sizeBytes, @sha256, @accessLevel, 1, @uploadedByUserId
        );
      `);

    console.log(`[Seed] Seeded book: "${b.title}" with SHA-256: ${storageRes.sha256}`);
  }

  console.log('[Seed] Finished seeding initial digital books.');
}
