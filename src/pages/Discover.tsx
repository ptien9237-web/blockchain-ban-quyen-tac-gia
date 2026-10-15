import { useState, useEffect } from 'react';
import { Search, Filter, Book, RefreshCw, AlertCircle } from 'lucide-react';
import { BookCard } from '../components/book/BookCard';
import { booksApi, type ApiBook } from '../services/api';
import { useTranslation } from '../contexts/I18nContext';
import './Discover.css';

export function Discover() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const fetchBooks = async (query?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await booksApi.getAll(query);
      setBooks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load library catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(searchTerm.trim() || undefined);
  };

  const filteredBooks = books.filter((b) => {
    if (selectedLanguage && b.languageCode !== selectedLanguage) {
      return false;
    }
    return true;
  });

  return (
    <div className="discover-root">
      <div className="discover-header archival-border-bottom py-8">
        <div className="container">
          <h1 className="serif text-4xl mb-6">{t('discover.title')}</h1>

          <form onSubmit={handleSearchSubmit} className="search-bar-container flex gap-4">
            <div className="search-input-wrapper flex-1 archival-border">
              <Search size={20} className="search-icon text-muted" />
              <input
                type="text"
                className="search-input mono"
                placeholder={t('discover.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary flex items-center gap-2">
              <Search size={18} />
              {t('discover.filters')}
            </button>
            <button
              type="button"
              className="btn btn-secondary flex items-center gap-2"
              onClick={() => {
                setSearchTerm('');
                setSelectedLanguage(null);
                fetchBooks();
              }}
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </form>
        </div>
      </div>

      <div className="container py-8 discover-layout">
        <aside className="discover-sidebar">
          <div className="filter-group mb-8">
            <h3 className="serif font-medium mb-4 flex items-center gap-2">
              <Filter size={16} /> {t('discover.categories')}
            </h3>
            <div className="filter-options flex flex-col gap-2">
              <button
                className={`filter-btn text-sm text-left ${selectedLanguage === null ? 'active' : ''}`}
                onClick={() => setSelectedLanguage(null)}
              >
                {t('discover.allCategories')}
              </button>
              <button
                className={`filter-btn text-sm text-left ${selectedLanguage === 'vi' ? 'active' : ''}`}
                onClick={() => setSelectedLanguage('vi')}
              >
                Tiếng Việt (VI)
              </button>
              <button
                className={`filter-btn text-sm text-left ${selectedLanguage === 'en' ? 'active' : ''}`}
                onClick={() => setSelectedLanguage('en')}
              >
                English (EN)
              </button>
            </div>
          </div>
        </aside>

        <main className="discover-main">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-muted mono">
              {t('discover.results', { count: filteredBooks.length })}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="font-mono text-muted text-sm">{t('auth.saving')}</div>
            </div>
          ) : error ? (
            <div className="archival-border p-8 bg-surface text-center flex flex-col items-center">
              <AlertCircle size={40} className="text-warning mb-3" />
              <h3 className="serif text-lg mb-2">Error Loading Catalog</h3>
              <p className="text-muted text-sm mb-4">{error}</p>
              <button className="btn btn-secondary" onClick={() => fetchBooks()}>
                Try Again
              </button>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="book-grid">
              {filteredBooks.map((book) => (
                <BookCard key={book.bookId} book={book} />
              ))}
            </div>
          ) : (
            <div className="empty-state archival-border p-8 text-center flex flex-col items-center justify-center">
              <Book size={48} className="text-muted mb-4" />
              <h3 className="serif text-xl mb-2">{t('discover.noWorks')}</h3>
              <p className="text-sm text-muted">{t('discover.adjustSearch')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
