import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Cpu, ArrowRight, CheckCircle, FileCheck, Search, Users } from 'lucide-react';
import { useTranslation } from '../contexts/I18nContext';
import './HowItWorks.css';

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <div className="how-it-works-root">
      {/* Hero Header */}
      <section className="how-hero archival-border-bottom py-16 bg-ground">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 archival-border rounded-sm text-xs font-mono mb-6 bg-surface">
            <BookOpen size={14} className="text-interactive" />
            <span>ARCHITECTURE &amp; PRINCIPLES</span>
          </div>
          <h1 className="serif text-3xl md:text-5xl mb-6 font-bold text-ink leading-tight">
            {t('howItWorks.title')}
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed prose-reading">
            {t('howItWorks.subtitle')}
          </p>
        </div>
      </section>

      {/* Core Philosophy Banner */}
      <section className="philosophy-section py-12 archival-border-bottom bg-surface">
        <div className="container max-w-3xl mx-auto text-center">
          <blockquote className="serif text-xl md:text-2xl italic text-ink mb-4 leading-snug">
            "{t('howItWorks.philosophyQuote')}"
          </blockquote>
          <p className="text-sm text-muted font-mono uppercase tracking-wider">
            {t('howItWorks.philosophyAuthor')}
          </p>
        </div>
      </section>

      {/* The Three Pillars */}
      <section className="pillars-section py-16 bg-ground">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="serif text-2xl md:text-3xl mb-3 text-ink font-bold">
              {t('howItWorks.threePillarsTitle')}
            </h2>
            <p className="text-muted text-sm max-w-xl mx-auto">
              {t('howItWorks.threePillarsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="pillar-card archival-border bg-surface p-8 rounded-sm flex flex-col justify-between">
              <div>
                <div className="pillar-icon-box mb-6 text-interactive">
                  <BookOpen size={32} />
                </div>
                <h3 className="serif text-xl font-bold mb-3 text-ink">
                  {t('howItWorks.pillar1Title')}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  {t('howItWorks.pillar1Desc')}
                </p>
              </div>
              <ul className="text-xs text-muted space-y-2 border-t pt-4 border-color">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success" />
                  <span>{t('howItWorks.pillar1Point1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success" />
                  <span>{t('howItWorks.pillar1Point2')}</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="pillar-card archival-border bg-surface p-8 rounded-sm flex flex-col justify-between">
              <div>
                <div className="pillar-icon-box mb-6 text-interactive">
                  <FileCheck size={32} />
                </div>
                <h3 className="serif text-xl font-bold mb-3 text-ink">
                  {t('howItWorks.pillar2Title')}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  {t('howItWorks.pillar2Desc')}
                </p>
              </div>
              <ul className="text-xs text-muted space-y-2 border-t pt-4 border-color">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success" />
                  <span>{t('howItWorks.pillar2Point1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success" />
                  <span>{t('howItWorks.pillar2Point2')}</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="pillar-card archival-border bg-surface p-8 rounded-sm flex flex-col justify-between">
              <div>
                <div className="pillar-icon-box mb-6 text-interactive">
                  <Cpu size={32} />
                </div>
                <h3 className="serif text-xl font-bold mb-3 text-ink">
                  {t('howItWorks.pillar3Title')}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-6">
                  {t('howItWorks.pillar3Desc')}
                </p>
              </div>
              <ul className="text-xs text-muted space-y-2 border-t pt-4 border-color">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success" />
                  <span>{t('howItWorks.pillar3Point1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-success" />
                  <span>{t('howItWorks.pillar3Point2')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Reader vs Author Workflows */}
      <section className="workflows-section py-16 archival-border-top bg-surface">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Readers */}
            <div className="workflow-col p-8 archival-border bg-ground rounded-sm">
              <div className="flex items-center gap-3 mb-6">
                <Search className="text-interactive" size={24} />
                <h3 className="serif text-2xl font-bold text-ink">
                  {t('howItWorks.forReadersTitle')}
                </h3>
              </div>
              <ol className="space-y-4 text-sm text-muted mb-8 list-decimal list-inside">
                <li className="leading-relaxed">
                  <strong className="text-ink">{t('howItWorks.readerStep1Bold')}</strong>: {t('howItWorks.readerStep1Desc')}
                </li>
                <li className="leading-relaxed">
                  <strong className="text-ink">{t('howItWorks.readerStep2Bold')}</strong>: {t('howItWorks.readerStep2Desc')}
                </li>
                <li className="leading-relaxed">
                  <strong className="text-ink">{t('howItWorks.readerStep3Bold')}</strong>: {t('howItWorks.readerStep3Desc')}
                </li>
              </ol>
              <Link to="/discover" className="btn btn-primary inline-flex items-center gap-2">
                <span>{t('howItWorks.browseLibraryAction')}</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* For Authors */}
            <div className="workflow-col p-8 archival-border bg-ground rounded-sm">
              <div className="flex items-center gap-3 mb-6">
                <Users className="text-interactive" size={24} />
                <h3 className="serif text-2xl font-bold text-ink">
                  {t('howItWorks.forAuthorsTitle')}
                </h3>
              </div>
              <ol className="space-y-4 text-sm text-muted mb-8 list-decimal list-inside">
                <li className="leading-relaxed">
                  <strong className="text-ink">{t('howItWorks.authorStep1Bold')}</strong>: {t('howItWorks.authorStep1Desc')}
                </li>
                <li className="leading-relaxed">
                  <strong className="text-ink">{t('howItWorks.authorStep2Bold')}</strong>: {t('howItWorks.authorStep2Desc')}
                </li>
                <li className="leading-relaxed">
                  <strong className="text-ink">{t('howItWorks.authorStep3Bold')}</strong>: {t('howItWorks.authorStep3Desc')}
                </li>
              </ol>
              <Link to="/author/studio" className="btn btn-secondary inline-flex items-center gap-2">
                <span>{t('howItWorks.authorStudioAction')}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Verify CTA */}
      <section className="verify-cta py-16 archival-border-top bg-ground text-center">
        <div className="container max-w-3xl mx-auto">
          <ShieldCheck size={40} className="mx-auto mb-4 text-interactive" />
          <h2 className="serif text-2xl md:text-3xl font-bold text-ink mb-4">
            {t('howItWorks.verifyCtaTitle')}
          </h2>
          <p className="text-muted text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            {t('howItWorks.verifyCtaDesc')}
          </p>
          <Link to="/verify" className="btn btn-primary px-8 py-3 text-base inline-flex items-center gap-2">
            <span>{t('nav.verify')}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
