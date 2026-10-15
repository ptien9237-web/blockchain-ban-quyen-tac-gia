import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import './Login.css';

export function RegisterAccount() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim() || !email.trim() || !password) {
      setError(t('auth.loginFailed'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordPlaceholder'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    try {
      setLoading(true);
      await register(email.trim(), password, displayName.trim());
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page container py-16">
      <div className="login-card max-w-md mx-auto archival-border p-8 bg-surface">
        <div className="login-header text-center mb-8">
          <div className="login-icon-badge mx-auto mb-4 flex items-center justify-center">
            <UserPlus size={24} />
          </div>
          <h1 className="serif text-2xl mb-2">{t('auth.signUpTitle')}</h1>
          <p className="text-muted text-sm">{t('auth.signUpSubtitle')}</p>
        </div>

        {error && (
          <div className="login-alert error flex items-start gap-3 p-3 mb-6">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form flex flex-col gap-4">
          <div className="form-group">
            <label className="block text-xs font-mono font-medium mb-1 text-muted">
              {t('auth.displayName')}
            </label>
            <input
              type="text"
              className="form-input archival-border w-full p-3 font-sans"
              placeholder={t('auth.displayNamePlaceholder')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="block text-xs font-mono font-medium mb-1 text-muted">
              {t('auth.email')}
            </label>
            <input
              type="email"
              className="form-input archival-border w-full p-3 font-sans"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="block text-xs font-mono font-medium mb-1 text-muted">
              {t('auth.password')}
            </label>
            <input
              type="password"
              className="form-input archival-border w-full p-3 font-sans"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="block text-xs font-mono font-medium mb-1 text-muted">
              {t('auth.confirmPassword')}
            </label>
            <input
              type="password"
              className="form-input archival-border w-full p-3 font-sans"
              placeholder={t('auth.passwordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <span className="text-sm font-mono">{t('auth.saving')}</span>
            ) : (
              <>
                <UserPlus size={16} />
                <span>{t('auth.signUp')}</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer text-center mt-6 pt-6 archival-border-top text-sm text-muted">
          <span>{t('auth.alreadyHaveAccount')} </span>
          <Link to="/login" className="font-medium underline hover:text-ink">
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
