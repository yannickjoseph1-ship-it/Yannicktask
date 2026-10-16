import { useMemo, useState } from 'react';
import type { AquariumConfig, ConfigItem, ItemKind, Option, Species, WaterType } from '../lib/types';
import { WATER_LABELS } from '../lib/types';

interface Props {
  config: AquariumConfig;
  onChange: (c: AquariumConfig) => void;
  species: Species[];
  options: { decor: Option[]; equipment: Option[] };
}

const VOLUME_PRESETS = [30, 60, 100, 180, 240, 350, 450];

export function ConfigForm({ config, onChange, species, options }: Props) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'FISH' | 'INVERTEBRATE' | 'PLANT'>('FISH');
  const [customDims, setCustomDims] = useState(Boolean(config.lengthCm));

  const set = (patch: Partial<AquariumConfig>) => onChange({ ...config, ...patch });

  const qty = (kind: ItemKind, slug: string) => config.items.find((i) => i.kind === kind && i.refSlug === slug)?.quantity ?? 0;
  const setQty = (kind: ItemKind, slug: string, quantity: number) => {
    const others = config.items.filter((i) => !(i.kind === kind && i.refSlug === slug));
    const items: ConfigItem[] = quantity > 0 ? [...others, { kind, refSlug: slug, quantity }] : others;
    set({ items });
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return species.filter((s) => s.kind === tab && (!q || s.commonName.toLowerCase().includes(q) || (s.scientificName ?? '').toLowerCase().includes(q)));
  }, [species, tab, query]);

  const selected = config.items.filter((i) => i.kind !== 'DECOR' && i.kind !== 'EQUIPMENT');
  const bySlug = useMemo(() => Object.fromEntries(species.map((s) => [s.slug, s])), [species]);

  return (
    <div className="stack form">
      <section>
        <h3>1. Le bac</h3>
        <label>Type d'eau
          <div className="segmented">
            {(Object.keys(WATER_LABELS) as WaterType[]).map((w) => (
              <button key={w} type="button" className={config.waterType === w ? 'active' : ''} onClick={() => set({ waterType: w, items: config.items.filter((i) => { const s = bySlug[i.refSlug]; return !s || s.waterType === w; }) })}>{WATER_LABELS[w]}</button>
            ))}
          </div>
        </label>
        <label>Volume : <strong>{config.volumeL} L</strong>
          <input type="range" min={10} max={600} step={5} value={config.volumeL} onChange={(e) => set({ volumeL: Number(e.target.value) })} />
          <div className="chips">
            {VOLUME_PRESETS.map((v) => <button key={v} type="button" className={`chip ${config.volumeL === v ? 'active' : ''}`} onClick={() => set({ volumeL: v })}>{v} L</button>)}
          </div>
        </label>
        <label className="row"><input type="checkbox" checked={customDims} onChange={(e) => { setCustomDims(e.target.checked); if (!e.target.checked) set({ lengthCm: null, widthCm: null, heightCm: null }); }} /> Dimensions personnalisées</label>
        {customDims && (
          <div className="row">
            <label>L (cm)<input type="number" min={10} value={config.lengthCm ?? ''} onChange={(e) => set({ lengthCm: Number(e.target.value) || null })} /></label>
            <label>l (cm)<input type="number" min={10} value={config.widthCm ?? ''} onChange={(e) => set({ widthCm: Number(e.target.value) || null })} /></label>
            <label>H (cm)<input type="number" min={10} value={config.heightCm ?? ''} onChange={(e) => set({ heightCm: Number(e.target.value) || null })} /></label>
          </div>
        )}
        <label>Budget
          <div className="segmented">
            {(['ECO', 'STANDARD', 'PREMIUM'] as const).map((p) => (
              <button key={p} type="button" className={config.pricePreference === p ? 'active' : ''} onClick={() => set({ pricePreference: p })}>{p === 'ECO' ? 'Éco' : p === 'STANDARD' ? 'Standard' : 'Haut de gamme'}</button>
            ))}
          </div>
        </label>
      </section>

      <section>
        <h3>2. Les habitants</h3>
        {selected.length > 0 && (
          <ul className="selected-list">
            {selected.map((i) => (
              <li key={`${i.kind}-${i.refSlug}`}>
                <span className="dot" style={{ background: bySlug[i.refSlug]?.color }} />
                <span className="grow">{bySlug[i.refSlug]?.commonName ?? i.refSlug}</span>
                <input type="number" min={0} max={200} value={i.quantity} onChange={(e) => setQty(i.kind, i.refSlug, Number(e.target.value))} />
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setQty(i.kind, i.refSlug, 0)} aria-label="Retirer">✕</button>
              </li>
            ))}
          </ul>
        )}
        <div className="segmented">
          {(['FISH', 'INVERTEBRATE', 'PLANT'] as const).map((k) => (
            <button key={k} type="button" className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{k === 'FISH' ? 'Poissons' : k === 'INVERTEBRATE' ? 'Invertébrés' : 'Plantes'}</button>
          ))}
        </div>
        <input placeholder="Rechercher une espèce…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <ul className="species-list">
          {visible.map((s) => {
            const q = qty(s.kind, s.slug);
            const mismatch = s.waterType !== config.waterType;
            return (
              <li key={s.slug} className={mismatch ? 'dim' : ''}>
                <span className="dot" style={{ background: s.color }} />
                <div className="grow">
                  <div>{s.commonName}</div>
                  <div className="muted small">{s.scientificName} · {s.adultSizeCm} cm · min {s.minVolumeL} L{s.minGroupSize > 1 ? ` · groupe ≥ ${s.minGroupSize}` : ''}{mismatch ? ` · ${WATER_LABELS[s.waterType]}` : ''}</div>
                </div>
                <div className="qty">
                  <button type="button" onClick={() => setQty(s.kind, s.slug, Math.max(0, q - 1))} disabled={q === 0}>−</button>
                  <span>{q}</span>
                  <button type="button" onClick={() => setQty(s.kind, s.slug, q === 0 ? Math.max(1, s.kind === 'PLANT' ? 1 : s.minGroupSize) : q + 1)}>+</button>
                </div>
              </li>
            );
          })}
          {visible.length === 0 && <li className="muted">Aucune espèce.</li>}
        </ul>
      </section>

      <section>
        <h3>3. Décor</h3>
        <div className="chips">
          {options.decor.map((o) => {
            const q = qty('DECOR', o.slug);
            return (
              <button key={o.slug} type="button" className={`chip ${q ? 'active' : ''}`} onClick={() => setQty('DECOR', o.slug, q ? 0 : 1)}>
                {o.label}{q > 0 && <span className="badge" onClick={(e) => { e.stopPropagation(); setQty('DECOR', o.slug, q + 1); }} title="Ajouter un">{q}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3>4. Matériel complémentaire</h3>
        <p className="muted small">Bac, filtre, chauffage, éclairage et substrat sont dimensionnés automatiquement. Ajoutez ici les options.</p>
        <div className="chips">
          {options.equipment.map((o) => {
            const q = qty('EQUIPMENT', o.slug);
            return <button key={o.slug} type="button" className={`chip ${q ? 'active' : ''}`} onClick={() => setQty('EQUIPMENT', o.slug, q ? 0 : 1)}>{o.label}</button>;
          })}
        </div>
      </section>
    </div>
  );
}
