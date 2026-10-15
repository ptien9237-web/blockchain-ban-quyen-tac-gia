import { useState, Fragment } from 'react';
import { Check, ChevronRight, UploadCloud, Wallet, FileText } from 'lucide-react';
import { useTranslation } from '../contexts/I18nContext';
import './Register.css';

export function Register() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const STEPS = [
    t('register.step1'),
    t('register.step2'),
    t('register.step3'),
    t('register.step4'),
    t('register.step5')
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="register-root container py-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Stepper */}
        <div className="stepper mb-12">
          {STEPS.map((step, idx) => (
            <Fragment key={idx}>
              <div className={`stepper-step ${idx <= currentStep ? 'active' : ''} ${idx === currentStep ? 'current' : ''}`}>
                <div className="step-circle mono text-sm">
                  {idx < currentStep ? <Check size={14} /> : idx + 1}
                </div>
                <span className="step-label text-xs font-medium">{step}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`stepper-line ${idx < currentStep ? 'active' : ''}`} />
              )}
            </Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="register-card archival-border p-8 bg-surface">
          {currentStep === 0 && (
            <div className="step-content">
              <h2 className="serif text-2xl mb-6">{t('register.step1')}</h2>
              <div className="form-group mb-4">
                <label className="block text-sm font-medium mb-2 font-mono">{t('register.titleOfWork')}</label>
                <input type="text" className="form-input archival-border w-full p-3" placeholder={t('register.titlePlaceholder')} />
              </div>
              <div className="form-group mb-4">
                <label className="block text-sm font-medium mb-2 font-mono">{t('register.category')}</label>
                <select className="form-input archival-border w-full p-3">
                  <option>{t('register.selectCategory')}</option>
                  <option value="Fiction">{t('discover.fiction' as any) || 'Fiction'}</option>
                  <option value="Non-Fiction">{t('discover.non-fiction' as any) || 'Non-Fiction'}</option>
                  <option value="Academic">{t('discover.academic' as any) || 'Academic'}</option>
                  <option value="Poetry">{t('discover.poetry' as any) || 'Poetry'}</option>
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="block text-sm font-medium mb-2 font-mono">{t('register.descAbstract')}</label>
                <textarea className="form-input archival-border w-full p-3 h-32" placeholder={t('register.descPlaceholder')}></textarea>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="step-content">
              <h2 className="serif text-2xl mb-6">{t('register.step2')}</h2>
              <div className="bg-ground archival-border p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <Wallet size={24} className="text-interactive" />
                  <div>
                    <h4 className="font-medium">{t('register.connectedWallet')}</h4>
                    <p className="text-sm font-mono text-muted">0x71C...976F</p>
                  </div>
                </div>
                <p className="text-sm text-muted">
                  {t('register.walletDesc')}
                </p>
              </div>
              
              <div className="form-group mb-4">
                <label className="block text-sm font-medium mb-2 font-mono">{t('register.authorDisplayName')}</label>
                <input type="text" className="form-input archival-border w-full p-3" placeholder={t('register.authorPlaceholder')} />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content">
              <h2 className="serif text-2xl mb-6">{t('register.step3')}</h2>
              <p className="text-muted mb-6 text-sm">
                {t('register.uploadDesc')}
              </p>
              <div className="upload-zone border-dashed border-2 p-12 text-center rounded-sm bg-ground">
                <UploadCloud size={48} className="text-muted mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">{t('register.selectFile')}</h3>
                <p className="text-sm text-muted mb-6">{t('register.maxSize')}</p>
                <button className="btn btn-secondary">{t('verify.browseFiles')}</button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content">
              <h2 className="serif text-2xl mb-6">{t('register.reviewRegistration')}</h2>
              <div className="archival-border p-6 mb-6">
                <h4 className="serif font-medium mb-4 flex items-center gap-2 border-b pb-2"><FileText size={16}/> {t('register.workDetails')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <span className="text-muted block font-mono text-xs">{t('register.title')}</span>
                    <span>The Architecture of Decentralization</span>
                  </div>
                  <div>
                    <span className="text-muted block font-mono text-xs">{t('register.category')}</span>
                    <span>Academic</span>
                  </div>
                </div>
                
                <h4 className="serif font-medium mb-4 flex items-center gap-2 border-b pb-2"><Wallet size={16}/> {t('register.ownershipBlockchain')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted block font-mono text-xs">{t('register.ownerWallet')}</span>
                    <span className="font-mono">0x71C...976F</span>
                  </div>
                  <div>
                    <span className="text-muted block font-mono text-xs">{t('register.fileHashPreview')}</span>
                    <span className="font-mono truncate block" title="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855">e3b0c44298fc...</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted">
                {t('register.proceedNote')}
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-content text-center py-8">
              <div className="spinner mx-auto mb-6"></div>
              <h2 className="serif text-2xl mb-2">{t('register.awaiting')}</h2>
              <p className="text-muted font-mono text-sm">{t('register.confirmSig')}</p>
            </div>
          )}

          {/* Navigation */}
          {currentStep < 4 && (
            <div className="form-actions mt-8 pt-6 border-t flex justify-between">
              <button 
                className={`btn btn-secondary ${currentStep === 0 ? 'invisible' : ''}`}
                onClick={prevStep}
              >
                {t('register.back')}
              </button>
              <button 
                className="btn btn-primary flex items-center gap-2"
                onClick={nextStep}
              >
                {currentStep === 3 ? t('register.signRegister') : t('register.continue')} <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
