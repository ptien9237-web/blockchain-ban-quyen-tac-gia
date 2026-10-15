import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import './Login.css';

export function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t('auth.loginFailed'));
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page container py-16">
      <div className="login-card max-w-md mx-auto archival-border p-8 bg-surface">
        <div className="login-header text-center mb-8">
          <div className="login-icon-badge mx-auto mb-4 flex items-center justify-center">
            <LogIn size={24} />
          </div>
          <h1 className="serif text-2xl mb-2">{t('auth.signInTitle')}</h1>
          <p className="text-muted text-sm">{t('auth.signInSubtitle')}</p>
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
              autoComplete="current-password"
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
                <LogIn size={16} />
                <span>{t('auth.signIn')}</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer text-center mt-6 pt-6 archival-border-top text-sm text-muted">
          <span>{t('auth.noAccount')} </span>
          <Link to="/register-account" className="font-medium underline hover:text-ink">
            {t('auth.signUp')}
          </Link>
        </div>
      </div>
    </div>
  );
}
