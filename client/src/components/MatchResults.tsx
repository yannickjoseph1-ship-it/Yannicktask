import { useState } from 'react';
import type { MatchLine, MatchResult, ScoredProduct } from '../lib/types';
import { CATEGORY_LABELS, euros } from '../lib/types';

function Tier({ tier }: { tier: string }) {
  return tier === 'PREMIUM' ? <span className="pill premium" title="Magasin premium">★ Premium</span> : null;
}

function ProductLine({ s }: { s: ScoredProduct }) {
  return (
    <div className="product">
      <div className="grow">
        <div>{s.product.name}</div>
        <div className="muted small">{s.product.shopName} <Tier tier={s.product.shopTier} /> · score {(s.score * 100).toFixed(0)} %</div>
      </div>
      <div className="price">
        {s.quantity > 1 && <span className="muted small">{s.quantity} × {euros(s.product.priceCents)} = </span>}
        <strong>{euros(s.lineTotalCents)}</strong>
      </div>
    </div>
  );
}

function Line({ line }: { line: MatchLine }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={line.status === 'UNMATCHED' ? 'unmatched' : ''}>
      <div className="row space">
        <div>
          <strong>{line.requirement.label}</strong> <span className="muted small">{CATEGORY_LABELS[line.requirement.category]}{line.requirement.optional ? ' · optionnel' : ''}</span>
          <div className="muted small">{line.requirement.reason}</div>
        </div>
        {line.alternatives.length > 0 && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(!open)}>{open ? 'Masquer' : `${line.alternatives.length} alternative${line.alternatives.length > 1 ? 's' : ''}`}</button>
        )}
      </div>
      {line.best ? <ProductLine s={line.best} /> : <p className="muted small">Aucun produit correspondant chez les magasins partenaires.</p>}
      {open && line.alternatives.map((a) => <ProductLine key={a.product.id} s={a} />)}
    </li>
  );
}

export function MatchResults({ match }: { match: MatchResult }) {
  const [view, setView] = useState<'mix' | 'shops'>('mix');
  return (
    <section className="card">
      <header className="row space">
        <h3>Budget estimé</h3>
        <strong className="total">{euros(match.totalCents)}</strong>
      </header>
      <p className="muted small">
        {Math.round(match.coverage * 100)} % des besoins couverts par les magasins partenaires
        {match.unmatched.length > 0 && ` · ${match.unmatched.length} non trouvé${match.unmatched.length > 1 ? 's' : ''}`}
      </p>
      <div className="chips">
        {Object.entries(match.byCategory).map(([cat, cents]) => <span key={cat} className="chip static">{CATEGORY_LABELS[cat] ?? cat} · {euros(cents)}</span>)}
      </div>
      <div className="segmented">
        <button type="button" className={view === 'mix' ? 'active' : ''} onClick={() => setView('mix')}>Meilleur mix</button>
        <button type="button" className={view === 'shops' ? 'active' : ''} onClick={() => setView('shops')}>Par magasin ({match.byShop.length})</button>
      </div>
      {view === 'mix' ? (
        <ul className="lines">
          {match.lines.map((l) => <Line key={l.requirement.key} line={l} />)}
        </ul>
      ) : (
        <ul className="shops">
          {match.byShop.map((b) => (
            <li key={b.shopId} className="card-inner">
              <div className="row space">
                <div><strong>{b.shopName}</strong> <Tier tier={b.shopTier} /></div>
                <strong>{euros(b.totalCents)}</strong>
              </div>
              <div className="muted small">{Math.round(b.coverage * 100)} % des besoins essentiels · {b.matchedCount} articles</div>
              <ul className="compact">
                {b.lines.map((l) => (
                  <li key={l.requirementKey} className={l.product ? '' : 'unmatched'}>
                    {l.product ? `${l.product.quantity > 1 ? `${l.product.quantity} × ` : ''}${l.product.product.name} — ${euros(l.product.lineTotalCents)}` : `${match.lines.find((x) => x.requirement.key === l.requirementKey)?.requirement.label} — indisponible`}
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {match.byShop.length === 0 && <li className="muted">Aucun magasin partenaire actif pour le moment.</li>}
        </ul>
      )}
    </section>
  );
}
