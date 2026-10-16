import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/types';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('CLIENT');
  const [form, setForm] = useState({ email: '', password: '', displayName: '', shopName: '', city: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { role, email: form.email, password: form.password, displayName: form.displayName };
      if (role === 'SHOP') payload.shop = { name: form.shopName, city: form.city || undefined };
      const user = await register(payload);
      navigate(user.role === 'SHOP' ? '/shop' : '/app');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card auth-card">
      <h1>Créer un compte</h1>
      <div className="segmented">
        <button type="button" className={role === 'CLIENT' ? 'active' : ''} onClick={() => setRole('CLIENT')}>Aquariophile (gratuit)</button>
        <button type="button" className={role === 'SHOP' ? 'active' : ''} onClick={() => setRole('SHOP')}>Magasin (abonnement)</button>
      </div>
      <form onSubmit={onSubmit} className="stack">
        <label>{role === 'SHOP' ? 'Nom du contact' : 'Prénom / pseudo'}<input value={form.displayName} onChange={set('displayName')} required /></label>
        <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Mot de passe (8 caractères min.)<input type="password" value={form.password} onChange={set('password')} minLength={8} required /></label>
        {role === 'SHOP' && (
          <>
            <label>Nom du magasin<input value={form.shopName} onChange={set('shopName')} required /></label>
            <label>Ville<input value={form.city} onChange={set('city')} /></label>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? '…' : 'Créer mon compte'}</button>
      </form>
      <p>Déjà inscrit ? <Link to="/login">Connexion</Link></p>
    </div>
  );
}
