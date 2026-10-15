import { Link } from 'react-router-dom';
import { Shield, ShieldAlert, ShieldQuestion } from 'lucide-react';
import type { ApiBook } from '../../services/api';
import type { Book } from '../../services/mockData';
import './BookCard.css';

interface BookCardProps {
  book: ApiBook | Book;
}

export function BookCard({ book }: BookCardProps) {

  // Handle both ApiBook and MockBook structures
  const id = 'bookId' in book ? book.bookId : book.id;
  const title = book.title;
  const description = book.description || '';
  const authorName =
    'authors' in book && book.authors.length > 0
      ? book.authors.map((a) => a.penName).join(', ')
      : 'author' in book
      ? (book as any).author
      : 'Anonymous';
  const authorId = 'authors' in book && book.authors[0] ? book.authors[0].authorProfileId : 'authorId' in book ? (book as any).authorId : '';
  const year =
    'publishedAt' in book && book.publishedAt
      ? new Date(book.publishedAt).getFullYear()
      : 'year' in book
      ? (book as any).year
      : '2026';
  const language =
    'languageCode' in book && book.languageCode
      ? book.languageCode.toUpperCase()
      : 'category' in book
      ? (book as any).category
      : 'ARCHIVE';

  const hasFile = 'currentFile' in book && Boolean(book.currentFile);
  const sha256 = 'currentFile' in book && book.currentFile ? book.currentFile.sha256 : '';

  const getStatusIcon = () => {
    if (hasFile && sha256) {
      return (
        <span title={`SHA-256: ${sha256.slice(0, 16)}...`}>
          <Shield size={16} className="text-success" />
        </span>
      );
    }
    if ('copyrightStatus' in book) {
      switch ((book as any).copyrightStatus) {
        case 'VERIFIED':
          return <Shield size={16} className="text-success" />;
        case 'PENDING':
          return <ShieldQuestion size={16} className="text-warning" />;
        default:
          return <ShieldAlert size={16} className="text-muted" />;
      }
    }
    return <ShieldQuestion size={16} className="text-warning" />;
  };

  return (
    <div className="book-card archival-border">
      <Link to={`/book/${id}`} className="book-card-cover flex items-center justify-center relative">
        {'coverUrl' in book && book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={title}
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
          />
        ) : (
          <>
            <div className="book-card-spine"></div>
            <h3 className="serif text-center px-4 book-card-title">{title}</h3>
          </>
        )}
      </Link>

      <div className="book-card-content p-4 archival-border-top">
        <div className="flex justify-between items-start mb-2">
          {authorId ? (
            <Link to={`/author/${authorId}`} className="text-sm font-medium hover:underline truncate max-w-[70%]">
              {authorName}
            </Link>
          ) : (
            <span className="text-sm font-medium truncate max-w-[70%]">{authorName}</span>
          )}
          <span className="text-xs text-muted font-mono">{year}</span>
        </div>

        <p className="text-xs text-muted mb-4 line-clamp-2">{description}</p>

        <div className="flex justify-between items-center border-t pt-3 mt-auto">
          <span className="text-xs font-mono tag-category">{language}</span>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}
