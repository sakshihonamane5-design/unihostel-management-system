import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Button, Card, Field, Input, StatusBanner } from '../components/ui.jsx';

export default function LoginPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [institutionCode, setInstitutionCode] = useState('SPIT');
  const [brand, setBrand] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get(`/institutions/public/${institutionCode}`)
      .then((data) => setBrand(data.institution))
      .catch(() => setBrand(null));
  }, [institutionCode]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password, institutionCode });
      await refresh();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-page">
      <div
        className="h-48 w-full bg-slate-200 bg-cover bg-center sm:h-64"
        style={{ backgroundImage: brand?.loginBannerUrl ? `url(${brand.loginBannerUrl})` : undefined }}
        role="img"
        aria-label="Campus hostel banner"
      />
      <div className="mx-auto -mt-16 max-w-md px-4 pb-12">
        <Card>
          <div className="mb-4 flex items-center gap-3">
            {brand?.logoUrl ? (
              <img src={brand.logoUrl} alt="" className="h-12 w-12 object-contain" />
            ) : null}
            <div>
              <h1 className="text-2xl">Sign in to UniHostel</h1>
              <p className="text-sm">{brand?.name || 'Select your institution'}</p>
            </div>
          </div>
          {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <Field label="Institution code">
              <Input value={institutionCode} onChange={(e) => setInstitutionCode(e.target.value)} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-sm">
            New student? <Link to="/register">Request an account</Link>
          </p>
          {brand ? (
            <p className="mt-3 text-xs">
              Support: {brand.supportEmail} · {brand.supportPhone}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
