import { Link } from 'react-router-dom';
import { Book } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';
import './Footer.css';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer-root archival-border-top">
      <div className="container footer-container">
        <div className="footer-brand">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <Book className="logo-icon" size={24} />
            <span className="logo-text serif">{t('footer.brand')}</span>
          </Link>
          <p className="text-sm text-muted max-w-sm">
            {t('footer.description')}
          </p>
        </div>
        
        <div className="footer-links">
          <div className="footer-group">
            <h4 className="serif font-medium mb-4 text-sm">{t('footer.library')}</h4>
            <Link to="/discover">{t('footer.discoverBooks')}</Link>
            <Link to="/authors">{t('footer.authorsDirectory')}</Link>
            <Link to="/categories">{t('footer.categories')}</Link>
          </div>
          
          <div className="footer-group">
            <h4 className="serif font-medium mb-4 text-sm">{t('footer.copyright')}</h4>
            <Link to="/copyright/verify">{t('footer.verifyWork')}</Link>
            <Link to="/copyright/register">{t('footer.registerCopyright')}</Link>
            <Link to="/how-it-works">{t('footer.howBlockchainWorks')}</Link>
          </div>
          
          <div className="footer-group">
            <h4 className="serif font-medium mb-4 text-sm">{t('footer.aboutGroup')}</h4>
            <Link to="/about">{t('footer.about')}</Link>
            <Link to="/faq">{t('footer.faq')}</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">{t('footer.openSource')}</a>
          </div>
        </div>
      </div>
      
      <div className="container footer-bottom text-sm text-muted flex justify-between items-center archival-border-top">
        <span>{t('footer.rights', { year: new Date().getFullYear() })}</span>
        <div className="flex gap-4">
          <Link to="/terms">{t('footer.terms')}</Link>
          <Link to="/privacy">{t('footer.privacy')}</Link>
        </div>
      </div>
    </footer>
  );
}
