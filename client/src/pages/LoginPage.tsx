import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('client@demo.fr');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(user.role === 'SHOP' ? '/shop' : '/app');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card auth-card">
      <h1>Connexion</h1>
      <form onSubmit={onSubmit} className="stack">
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? '…' : 'Se connecter'}</button>
      </form>
      <p className="muted small">
        Comptes démo : <code>client@demo.fr</code> (client), <code>aqualyon@demo.fr</code> (magasin premium), <code>recif@demo.fr</code> (magasin standard), <code>nord@demo.fr</code> (sans abonnement). Mot de passe <code>password123</code>.
      </p>
      <p>Pas de compte ? <Link to="/register">Créer un compte</Link></p>
    </div>
  );
}
