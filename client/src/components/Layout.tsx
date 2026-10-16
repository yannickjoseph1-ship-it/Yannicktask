import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const BETA = import.meta.env.VITE_BETA !== 'false';
const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL ?? 'mailto:beta@aqu.app?subject=Retour%20b%C3%AAta%20Aqu.app';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/brand/logo.webp" alt="" width={36} height={36} className="brand-logo" /> Aqu.app
          {BETA && <span className="beta-badge" title="Version bêta : vos retours sont les bienvenus">Bêta</span>}
        </Link>
        <nav>
          {user?.role === 'CLIENT' && <NavLink to="/app">Configurateur</NavLink>}
          {user?.role === 'SHOP' && <NavLink to="/shop">Espace magasin</NavLink>}
          {!user && <NavLink to="/login">Connexion</NavLink>}
          {!user && <NavLink to="/register" className="btn btn-sm">Créer un compte</NavLink>}
          {user && (
            <>
              <span className="muted">{user.displayName}{user.shop && user.shop.name !== user.displayName ? ` · ${user.shop.name}` : ''}</span>
              <button className="btn btn-sm btn-ghost" onClick={logout}>Déconnexion</button>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
      {BETA && <a className="beta-feedback" href={FEEDBACK_URL} target="_blank" rel="noreferrer">Un retour sur la bêta ?</a>}
    </div>
  );
}
