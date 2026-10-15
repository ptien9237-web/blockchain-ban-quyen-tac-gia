import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, ShieldCheck, Sun, Moon, User as UserIcon, Key, Menu, X, Feather } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { WalletButton } from './WalletButton';
import './Navbar.css';

export function Navbar() {
  const location = useLocation();
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { isConnected } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isAuthor = Boolean(user && (user.roles?.includes('AUTHOR') || user.authorProfile));
  const isAdmin = Boolean(user && user.roles?.includes('ADMIN'));
  const isAuthorOrAdmin = isAuthor || isAdmin;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="navbar-header archival-border-bottom">
      <div className="container flex items-center justify-between navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo flex items-center gap-2">
          <Book className="logo-icon" size={24} />
          <span className="logo-text serif">BOOKCHAIN</span>
        </Link>
        
        {/* Desktop Primary Navigation */}
        <nav className="navbar-nav flex items-center gap-6">
          <Link to="/discover" className={`nav-link ${isActive('/discover') ? 'active' : ''}`}>
            {t('nav.discover')}
          </Link>
          <Link to="/authors" className={`nav-link ${isActive('/authors') ? 'active' : ''}`}>
            {t('nav.authors')}
          </Link>
          <Link to="/how-it-works" className={`nav-link ${isActive('/how-it-works') ? 'active' : ''}`}>
            {t('nav.howItWorks')}
          </Link>
          {isAuthor && (
            <Link to="/author/studio" className={`nav-link ${isActive('/author/studio') ? 'active' : ''}`}>
              {t('nav.authorStudio') || 'Studio Tác giả'}
            </Link>
          )}
        </nav>

        {/* Action Controls & User Suite */}
        <div className="navbar-actions flex items-center gap-3">
          {/* Theme & Language Switcher */}
          <div className="nav-controls flex items-center gap-3 archival-border px-3 py-1 rounded-sm">
            <button 
              className="theme-toggle flex items-center justify-center"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <div className="control-divider"></div>
            <div className="lang-toggle flex items-center gap-2 text-xs font-mono">
              <button 
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <span className="text-muted">|</span>
              <button 
                className={`lang-btn ${language === 'vi' ? 'active' : ''}`}
                onClick={() => setLanguage('vi')}
              >
                VI
              </button>
            </div>
          </div>

          {/* Desktop Independent Verify Link */}
          <Link to="/copyright/verify" className="nav-action-verify flex items-center gap-2 hidden-desktop-only">
            <ShieldCheck size={18} />
            <span className="text-sm font-medium">{t('nav.verify')}</span>
          </Link>

          {/* Desktop Admin Quick Access */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-action-admin flex items-center gap-1.5 text-xs font-mono font-bold hidden-desktop-only ${
                isActive('/admin') ? 'active' : ''
              }`}
            >
              <Key size={14} />
              <span>{t('nav.admin')}</span>
            </Link>
          )}

          {/* Desktop User Profile / Auth Links */}
          {user ? (
            <Link
              to="/profile"
              className={`nav-user-badge flex items-center gap-2 px-3 py-1.5 archival-border rounded-sm hidden-desktop-only ${
                isActive('/profile') ? 'active' : ''
              }`}
            >
              <div className="nav-avatar-mini flex items-center justify-center font-serif text-xs">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium max-w-[120px] truncate">{user.displayName}</span>
              {user.roles.includes('AUTHOR') && (
                <span className="badge badge-warning text-[10px] py-0.5 px-1.5">
                  AUTHOR
                </span>
              )}
              {user.roles.includes('ADMIN') && (
                <span className="badge text-[10px] py-0.5 px-1.5 text-purple-700 bg-purple-500/10 border-purple-500/30">
                  ADMIN
                </span>
              )}
            </Link>
          ) : (
            <div className="auth-buttons flex items-center gap-2 hidden-desktop-only">
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
              >
                <UserIcon size={14} />
                <span>{t('auth.signIn')}</span>
              </Link>
              <Link
                to="/register-account"
                className="btn btn-primary btn-sm"
              >
                <span>{t('auth.signUp')}</span>
              </Link>
            </div>
          )}

          {/* Desktop Contextual Wallet Button */}
          {(isConnected || isAuthorOrAdmin) && (
            <div className="hidden-desktop-only">
              <WalletButton />
            </div>
          )}

          {/* Mobile Hamburger / Close Button */}
          <button
            type="button"
            className="mobile-nav-toggle flex items-center justify-center p-2 archival-border rounded-sm text-ink"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer archival-border-bottom animate-fade-in">
          <div className="container py-4 flex flex-col gap-4">
            {/* Nav Links */}
            <div className="flex flex-col gap-1 border-b pb-3">
              <Link
                to="/discover"
                className={`mobile-nav-link ${isActive('/discover') ? 'active' : ''}`}
              >
                {t('nav.discover')}
              </Link>
              <Link
                to="/authors"
                className={`mobile-nav-link ${isActive('/authors') ? 'active' : ''}`}
              >
                {t('nav.authors')}
              </Link>
              <Link
                to="/how-it-works"
                className={`mobile-nav-link ${isActive('/how-it-works') ? 'active' : ''}`}
              >
                {t('nav.howItWorks')}
              </Link>
              <Link
                to="/copyright/verify"
                className={`mobile-nav-link flex items-center gap-2 ${isActive('/copyright/verify') ? 'active' : ''}`}
              >
                <ShieldCheck size={16} />
                <span>{t('nav.verify')}</span>
              </Link>
              {isAuthor && (
                <Link
                  to="/author/studio"
                  className={`mobile-nav-link flex items-center gap-2 ${isActive('/author/studio') ? 'active' : ''}`}
                >
                  <Feather size={16} className="text-accent" />
                  <span>{t('nav.authorStudio') || 'Studio Tác giả'}</span>
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`mobile-nav-link flex items-center gap-2 ${isActive('/admin') ? 'active' : ''}`}
                >
                  <Key size={16} className="text-purple-600" />
                  <span>{t('nav.admin')}</span>
                </Link>
              )}
            </div>

            {/* User Section in Mobile Drawer */}
            <div className="flex flex-col gap-3 pt-1">
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center justify-between p-3 archival-border rounded-sm bg-ground hover:bg-surface"
                  >
                    <div className="flex items-center gap-3">
                      <div className="nav-avatar-mini flex items-center justify-center font-serif text-sm w-7 h-7">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-ink">{user.displayName}</span>
                        <span className="text-xs text-muted font-mono">{user.email}</span>
                      </div>
                    </div>
                    <span className="text-xs text-interactive font-medium">Hồ sơ →</span>
                  </Link>
                  {(isConnected || isAuthorOrAdmin) && (
                    <div className="pt-2">
                      <WalletButton />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="btn btn-secondary w-full justify-center"
                  >
                    <UserIcon size={16} />
                    <span>{t('auth.signIn')}</span>
                  </Link>
                  <Link
                    to="/register-account"
                    className="btn btn-primary w-full justify-center"
                  >
                    <span>{t('auth.signUp')}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
