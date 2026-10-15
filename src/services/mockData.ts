export interface Book {
  id: string;
  title: string;
  author: string;
  authorId: string;
  coverImage?: string;
  category: string;
  year: number;
  copyrightStatus: 'VERIFIED' | 'PENDING' | 'UNREGISTERED';
  recordId?: string;
  description: string;
}

export const CATEGORIES = [
  'Fiction', 'Non-Fiction', 'Academic', 'Poetry', 'Philosophy', 'Science', 'History'
];

export const MOCK_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'The Architecture of Decentralization',
    author: 'Elena Rostova',
    authorId: 'a1',
    category: 'Academic',
    year: 2025,
    copyrightStatus: 'VERIFIED',
    recordId: '0x3f...7a91',
    description: 'A comprehensive study on how decentralized networks are reshaping traditional institutional architectures, focusing on trustless systems and distributed governance.'
  },
  {
    id: 'b2',
    title: 'Silent Consensus',
    author: 'Marcus Chen',
    authorId: 'a2',
    category: 'Fiction',
    year: 2024,
    copyrightStatus: 'VERIFIED',
    recordId: '0x9b...1c44',
    description: 'A gripping sci-fi novel about a future where every thought must reach a 51% consensus before it can be spoken aloud.'
  },
  {
    id: 'b3',
    title: 'Memories of a Paper World',
    author: 'Sarah Jenkins',
    authorId: 'a3',
    category: 'Poetry',
    year: 2026,
    copyrightStatus: 'PENDING',
    description: 'An anthology reflecting on the sensory loss of physical books in an increasingly digitized reality.'
  },
  {
    id: 'b4',
    title: 'Cryptographic Primitives in Practice',
    author: 'Dr. Alan Turing Jr.',
    authorId: 'a4',
    category: 'Science',
    year: 2023,
    copyrightStatus: 'VERIFIED',
    recordId: '0x1a...00f2',
    description: 'An essential textbook covering the mathematical foundations of modern cryptography, from RSA to elliptic curves.'
  },
  {
    id: 'b5',
    title: 'The Last Editor',
    author: 'Marcus Chen',
    authorId: 'a2',
    category: 'Fiction',
    year: 2022,
    copyrightStatus: 'UNREGISTERED',
    description: 'Before consensus, there was the Editor. A historical fiction piece tracing the last days of traditional publishing.'
  },
  {
    id: 'b6',
    title: 'Beyond the Chain: Social Implications',
    author: 'Elena Rostova',
    authorId: 'a1',
    category: 'Philosophy',
    year: 2026,
    copyrightStatus: 'VERIFIED',
    recordId: '0x5e...2b88',
    description: 'Philosophical inquiries into identity, ownership, and the right to be forgotten on an immutable ledger.'
  }
];
