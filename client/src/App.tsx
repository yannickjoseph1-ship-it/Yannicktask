import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuth } from './lib/auth';
import { ConfiguratorPage } from './pages/ConfiguratorPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ShopDashboardPage } from './pages/ShopDashboardPage';
import type { Role } from './lib/types';

function Protected({ role, children }: { role: Role; children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted center">Chargement…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'SHOP' ? '/shop' : '/app'} replace />;
  return children;
}

export function App() {
  const { user } = useAuth();
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'SHOP' ? '/shop' : '/app'} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'SHOP' ? '/shop' : '/app'} replace /> : <RegisterPage />} />
        <Route path="/app" element={<Protected role="CLIENT"><ConfiguratorPage /></Protected>} />
        <Route path="/shop" element={<Protected role="SHOP"><ShopDashboardPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
