import { Link } from 'react-router-dom';
import { BookOpen, Shield, Library } from 'lucide-react';
import { useTranslation } from '../contexts/I18nContext';
import './Home.css';

export function Home() {
  const { t } = useTranslation();

  return (
    <div className="home-root">
      {/* Hero Section */}
      <section className="hero-section archival-border-bottom">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title serif">
              {t('home.title1')} <br/>
              <span className="text-muted">{t('home.title2')}</span>
            </h1>
            <p className="hero-subtitle text-lg">
              {t('home.subtitle')}
            </p>
            <div className="hero-actions flex items-center gap-4 mt-8">
              <Link to="/discover" className="btn btn-primary flex items-center gap-2">
                <BookOpen size={18} />
                {t('home.explore')}
              </Link>
              <Link to="/how-it-works" className="btn btn-secondary">
                {t('home.learnArchitecture')}
              </Link>
            </div>
          </div>
          
          <div className="hero-featured-book archival-border">
            <div className="featured-book-cover flex items-center justify-center">
              <div className="book-spine"></div>
              <h2 className="serif text-center px-4">The Theory of <br/> Immutable Trust</h2>
              <span className="book-author text-sm mono">{t('home.author')}: J.D. SALINGER</span>
            </div>
            <div className="featured-book-metadata archival-border-top p-4 bg-surface">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{t('home.verifiedRecord')}</span>
                <Shield size={16} className="text-success" />
              </div>
              <div className="metadata-row">
                <span className="text-xs text-muted mono">{t('home.id')}: 0x8f...4e21</span>
                <span className="text-xs text-muted mono">{t('home.date')}: 2026.10.05</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="philosophy-section py-16">
        <div className="container">
          <div className="philosophy-grid">
            <div className="philosophy-card archival-border p-8">
              <Library size={32} className="mb-6 text-interactive" />
              <h3 className="serif text-xl mb-4">{t('home.libraryFirst')}</h3>
              <p className="text-sm text-muted">
                {t('home.libraryFirstDesc')}
              </p>
            </div>
            <div className="philosophy-card archival-border p-8">
              <Shield size={32} className="mb-6 text-accent" />
              <h3 className="serif text-xl mb-4">{t('home.copyrightSecond')}</h3>
              <p className="text-sm text-muted">
                {t('home.copyrightSecondDesc')}
              </p>
            </div>
            <div className="philosophy-card archival-border p-8">
              <div className="mb-6 flex gap-2">
                <span className="mono text-xl font-bold">0x</span>
              </div>
              <h3 className="serif text-xl mb-4">{t('home.blockchainUnderneath')}</h3>
              <p className="text-sm text-muted">
                {t('home.blockchainUnderneathDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
