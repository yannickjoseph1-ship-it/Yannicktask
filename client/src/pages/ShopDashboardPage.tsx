import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORY_LABELS, euros, type SubscriptionTier } from '../lib/types';

interface Shop { id: string; name: string; city: string | null; description: string | null; subscriptionTier: SubscriptionTier; subscriptionStatus: string; currentPeriodEnd: string | null }
interface Plan { tier: 'STANDARD' | 'PREMIUM'; label: string; priceEur: number; features: string[] }
interface Product { id: string; externalRef: string; name: string; category: string; price: string; currency: string; stockQty: number; tags: string[]; speciesSlug: string | null; attributes: Record<string, unknown> }
interface Lead { id: string; label: string; quantity: number; unitPriceCents: number | null; product: { name: string } | null; quote: { id: string; createdAt: string; totalCents: number; aquarium: { name: string; volumeL: number; waterType: string } } }
interface Report { total: number; imported: number; errors: { row: number; message: string }[] }

export function ShopDashboardPage() {
  const { refresh } = useAuth();
  const [params] = useSearchParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [stats, setStats] = useState({ productCount: 0, leadCount: 0 });
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<{ products: Product[]; total: number; page: number; pageSize: number }>({ products: [], total: 0, page: 1, pageSize: 25 });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'catalog' | 'leads'>('catalog');

  const load = useCallback(async (page = 1) => {
    try {
      const [me, sub, prod, ld] = await Promise.all([
        api<{ shop: Shop; stats: { productCount: number; leadCount: number }; stripeEnabled: boolean }>('/shop/me'),
        api<{ plans: Plan[] }>('/shop/subscription'),
        api<typeof products>(`/shop/products?page=${page}&pageSize=25`),
        api<{ leads: Lead[] }>('/shop/leads'),
      ]);
      setShop(me.shop);
      setStats(me.stats);
      setStripeEnabled(me.stripeEnabled);
      setPlans(sub.plans);
      setProducts(prod);
      setLeads(ld.leads);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('file') as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { report } = await api<{ report: Report }>('/shop/catalog/upload', { method: 'POST', body: fd });
      setReport(report);
      await load();
      input.value = '';
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function subscribe(tier: 'STANDARD' | 'PREMIUM') {
    setBusy(true);
    setError(null);
    try {
      if (stripeEnabled) {
        const { url } = await api<{ url: string }>('/shop/subscription/checkout', { method: 'POST', json: { tier } });
        window.location.href = url;
      } else {
        await api('/shop/subscription/dev', { method: 'POST', json: { tier } });
        await Promise.all([load(), refresh()]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function manage() {
    setBusy(true);
    try {
      if (stripeEnabled) {
        const { url } = await api<{ url: string }>('/shop/subscription/portal', { method: 'POST' });
        window.location.href = url;
      } else {
        await api('/shop/subscription/dev', { method: 'POST', json: { tier: 'NONE' } });
        await Promise.all([load(), refresh()]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct(id: string) {
    await api(`/shop/products/${id}`, { method: 'DELETE' });
    await load(products.page);
  }

  if (!shop) return <p className="muted center">{error ?? 'Chargement…'}</p>;
  const active = shop.subscriptionStatus === 'ACTIVE' && shop.subscriptionTier !== 'NONE';
  const pages = Math.max(1, Math.ceil(products.total / products.pageSize));

  return (
    <div className="dashboard stack">
      {params.get('checkout') === 'success' && <p className="notice">Paiement reçu : votre abonnement sera actif dès confirmation par Stripe.</p>}
      {params.get('checkout') === 'cancel' && <p className="error">Paiement annulé.</p>}
      <header className="row space">
        <div>
          <h1>{shop.name}</h1>
          <p className="muted">{shop.city ?? '—'} · {stats.productCount} produits actifs · {stats.leadCount} leads</p>
        </div>
        <span className={`pill ${active ? 'ok' : 'bad'}`}>{active ? `Abonnement ${shop.subscriptionTier}` : 'Pas d\'abonnement actif'}</span>
      </header>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h3>Abonnement</h3>
        {!active && <p className="muted">Sans abonnement actif, votre catalogue n'apparaît pas dans les recommandations clients.</p>}
        {!stripeEnabled && <p className="muted small">Stripe n'est pas configuré sur ce serveur : l'activation est simulée (mode développement).</p>}
        <div className="plans">
          {plans.map((p) => (
            <div key={p.tier} className={`card-inner plan ${shop.subscriptionTier === p.tier && active ? 'current' : ''}`}>
              <div className="row space"><strong>{p.label}</strong><strong>{p.priceEur} € / mois</strong></div>
              <ul className="compact">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              {shop.subscriptionTier === p.tier && active ? (
                <button type="button" className="btn btn-ghost" onClick={manage} disabled={busy}>{stripeEnabled ? 'Gérer / résilier' : 'Résilier (simulation)'}</button>
              ) : (
                <button type="button" className="btn" onClick={() => subscribe(p.tier)} disabled={busy}>{active ? 'Changer pour ce plan' : 'Souscrire'}</button>
              )}
            </div>
          ))}
        </div>
        {shop.currentPeriodEnd && active && <p className="muted small">Période en cours jusqu'au {new Date(shop.currentPeriodEnd).toLocaleDateString('fr-FR')}.</p>}
      </section>

      <div className="segmented">
        <button type="button" className={tab === 'catalog' ? 'active' : ''} onClick={() => setTab('catalog')}>Catalogue ({products.total})</button>
        <button type="button" className={tab === 'leads' ? 'active' : ''} onClick={() => setTab('leads')}>Leads clients ({leads.length})</button>
      </div>

      {tab === 'catalog' && (
        <>
          <section className="card">
            <h3>Importer un catalogue (CSV ou JSON)</h3>
            <p className="muted small">
              Colonnes : <code>ref, name, category, price</code> (obligatoires), <code>currency, stock, brand, tags, compatible_species, species_slug, water_types, min_volume_l, max_volume_l, attr_*</code>.
              Les tags sont séparés par <code>|</code>. Les produits existants (même <code>ref</code>) sont mis à jour.
              Exemples : <a href="/samples/catalog-sample.csv" download>catalogue.csv</a> · <a href="/samples/catalog-sample.json" download>catalogue.json</a>
            </p>
            <form onSubmit={upload} className="row">
              <input type="file" name="file" accept=".csv,.json,text/csv,application/json" required />
              <button className="btn" disabled={busy}>{busy ? 'Import…' : 'Importer'}</button>
            </form>
            {report && (
              <div className={`notice ${report.errors.length ? 'warn' : ''}`}>
                {report.imported} / {report.total} produits importés.
                {report.errors.length > 0 && (
                  <ul className="compact">{report.errors.slice(0, 20).map((e) => <li key={e.row}>Ligne {e.row} : {e.message}</li>)}</ul>
                )}
              </div>
            )}
          </section>
          <section className="card">
            <table className="table">
              <thead><tr><th>Réf.</th><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Tags / espèce</th><th /></tr></thead>
              <tbody>
                {products.products.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.externalRef}</td>
                    <td>{p.name}</td>
                    <td>{CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td>{euros(Math.round(Number(p.price) * 100))}</td>
                    <td>{p.stockQty}</td>
                    <td className="small muted">{p.speciesSlug ?? p.tags.join(', ')}{Object.keys(p.attributes).length ? ` · ${Object.entries(p.attributes).map(([k, v]) => `${k}=${v}`).join(' ')}` : ''}</td>
                    <td><button type="button" className="btn btn-sm btn-ghost" onClick={() => removeProduct(p.id)} title="Retirer du catalogue">✕</button></td>
                  </tr>
                ))}
                {products.products.length === 0 && <tr><td colSpan={7} className="muted center">Aucun produit. Importez votre catalogue.</td></tr>}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="row center">
                <button type="button" className="btn btn-sm btn-ghost" disabled={products.page <= 1} onClick={() => load(products.page - 1)}>‹</button>
                <span className="muted small">page {products.page} / {pages}</span>
                <button type="button" className="btn btn-sm btn-ghost" disabled={products.page >= pages} onClick={() => load(products.page + 1)}>›</button>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'leads' && (
        <section className="card">
          <p className="muted small">Chaque ligne est un produit de votre catalogue retenu dans le devis d'un client.</p>
          <table className="table">
            <thead><tr><th>Date</th><th>Projet client</th><th>Besoin</th><th>Votre produit</th><th>Qté</th><th>Montant</th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.quote.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>{l.quote.aquarium.name} · {l.quote.aquarium.volumeL} L</td>
                  <td>{l.label}</td>
                  <td>{l.product?.name ?? '—'}</td>
                  <td>{l.quantity}</td>
                  <td>{l.unitPriceCents != null ? euros(l.unitPriceCents * l.quantity) : '—'}</td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={6} className="muted center">Aucun lead pour le moment.</td></tr>}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
