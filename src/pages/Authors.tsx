import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Feather, BookOpen, Search, ArrowRight, Calendar } from 'lucide-react';
import { booksApi, type PublicAuthorDto } from '../services/api';
import { useTranslation } from '../contexts/I18nContext';
import './Authors.css';

export function Authors() {
  const { t } = useTranslation();
  const [authors, setAuthors] = useState<PublicAuthorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await booksApi.getAuthors();
        setAuthors(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load authors directory.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  const filteredAuthors = authors.filter((a) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      a.penName.toLowerCase().includes(query) ||
      (a.bio && a.bio.toLowerCase().includes(query))
    );
  });

  return (
    <div className="authors-page-root">
      {/* Header */}
      <section className="authors-hero py-12 archival-border-bottom bg-ground">
        <div className="container max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 archival-border rounded-sm text-xs font-mono mb-4 bg-surface text-muted">
                <Feather size={14} className="text-interactive" />
                <span>ARCHIVAL REGISTRY</span>
              </div>
              <h1 className="serif text-3xl md:text-4xl font-bold text-ink mb-3">
                {t('authors.pageTitle')}
              </h1>
              <p className="text-muted text-sm max-w-xl">
                {t('authors.pageSubtitle')}
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder={t('authors.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm archival-border rounded-sm bg-surface text-ink focus:outline-none focus:border-interactive"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="authors-content py-12 bg-surface min-h-[50vh]">
        <div className="container max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center py-16 text-muted font-mono text-sm">
              <div className="spinner mx-auto mb-4"></div>
              <span>{t('auth.saving')}</span>
            </div>
          ) : error ? (
            <div className="text-center py-16 archival-border bg-ground p-8 rounded-sm">
              <p className="text-sm text-muted mb-4">{error}</p>
              <button
                className="btn btn-secondary text-xs"
                onClick={() => window.location.reload()}
              >
                {t('common.retry') || 'Thử lại'}
              </button>
            </div>
          ) : filteredAuthors.length === 0 ? (
            <div className="text-center py-16 archival-border bg-ground p-12 rounded-sm max-w-xl mx-auto">
              <Feather size={32} className="mx-auto mb-4 text-muted" />
              <h3 className="serif text-lg font-bold text-ink mb-2">
                {t('authors.noAuthorsFound')}
              </h3>
              <p className="text-sm text-muted mb-6">
                {search ? t('authors.noSearchResults') : t('authors.noRegisteredAuthors')}
              </p>
              {search && (
                <button
                  className="btn btn-secondary text-xs"
                  onClick={() => setSearch('')}
                >
                  {t('authors.clearSearch')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuthors.map((author) => (
                <div
                  key={author.authorProfileId}
                  className="author-card archival-border bg-ground p-6 rounded-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="author-avatar w-12 h-12 rounded-sm bg-surface archival-border flex items-center justify-center font-serif text-lg text-ink font-bold shrink-0">
                        {author.avatarUrl ? (
                          <img
                            src={author.avatarUrl}
                            alt={author.penName}
                            className="w-full h-full object-cover rounded-sm"
                          />
                        ) : (
                          author.penName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="serif text-lg font-bold text-ink truncate">
                          {author.penName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted font-mono mt-0.5">
                          <Calendar size={12} />
                          <span>{new Date(author.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-6 min-h-[3rem]">
                      {author.bio || t('authors.noBioProvided')}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-color flex items-center justify-between text-xs">
                    <span className="font-mono text-muted flex items-center gap-1.5">
                      <BookOpen size={14} className="text-interactive" />
                      <strong>{author.publishedBookCount}</strong> {t('authors.publishedWorks')}
                    </span>

                    <Link
                      to={`/discover?search=${encodeURIComponent(author.penName)}`}
                      className="text-interactive hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <span>{t('authors.viewWorks')}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
