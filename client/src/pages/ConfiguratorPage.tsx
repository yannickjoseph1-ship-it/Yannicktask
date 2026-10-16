import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompatibilityPanel } from '../components/CompatibilityPanel';
import { ConfigForm } from '../components/ConfigForm';
import { MatchResults } from '../components/MatchResults';
import { api } from '../lib/api';
import type { Analysis, AquariumConfig, Option, SavedAquarium, Species } from '../lib/types';
import { AquariumScene } from '../three/AquariumScene';

const DEFAULT_CONFIG: AquariumConfig = {
  volumeL: 120,
  waterType: 'FRESH',
  pricePreference: 'STANDARD',
  items: [
    { kind: 'FISH', refSlug: 'neon-tetra', quantity: 10 },
    { kind: 'FISH', refSlug: 'corydoras-panda', quantity: 6 },
    { kind: 'PLANT', refSlug: 'anubias-nana', quantity: 3 },
    { kind: 'PLANT', refSlug: 'vallisneria', quantity: 4 },
    { kind: 'DECOR', refSlug: 'driftwood', quantity: 1 },
    { kind: 'DECOR', refSlug: 'rock', quantity: 3 },
  ],
};

interface AquariumRow { id: string; name: string; volumeL: number; waterType: AquariumConfig['waterType']; lengthCm: number | null; widthCm: number | null; heightCm: number | null; pricePreference: AquariumConfig['pricePreference']; items: { kind: AquariumConfig['items'][number]['kind']; refSlug: string; quantity: number }[]; updatedAt: string }

export function ConfiguratorPage() {
  const [config, setConfig] = useState<AquariumConfig>(DEFAULT_CONFIG);
  const [species, setSpecies] = useState<Species[]>([]);
  const [options, setOptions] = useState<{ decor: Option[]; equipment: Option[] }>({ decor: [], equipment: [] });
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<SavedAquarium[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('Mon aquarium');
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const [mobileTab, setMobileTab] = useState<'config' | 'scene' | 'results'>('config');

  const loadSaved = useCallback(async () => {
    const { aquariums } = await api<{ aquariums: AquariumRow[] }>('/aquariums');
    setSaved(aquariums.map((a) => ({ id: a.id, name: a.name, updatedAt: a.updatedAt, volumeL: a.volumeL, waterType: a.waterType, lengthCm: a.lengthCm, widthCm: a.widthCm, heightCm: a.heightCm, pricePreference: a.pricePreference, items: a.items.map((i) => ({ kind: i.kind, refSlug: i.refSlug, quantity: i.quantity })) })));
  }, []);

  useEffect(() => {
    Promise.all([
      api<{ species: Species[] }>('/species'),
      api<{ decor: Option[]; equipment: Option[] }>('/species/options'),
      loadSaved(),
    ]).then(([s, o]) => {
      setSpecies(s.species);
      setOptions(o);
    }).catch((e) => setError((e as Error).message));
  }, [loadSaved]);

  // Analyse (compatibilité + matching) avec debounce à chaque changement
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setPending(true);
    timer.current = window.setTimeout(async () => {
      try {
        setAnalysis(await api<Analysis>('/aquariums/preview', { method: 'POST', json: config }));
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setPending(false);
      }
    }, 350);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [config]);

  const speciesBySlug = useMemo(() => Object.fromEntries(species.map((s) => [s.slug, s])), [species]);
  const equipment = useMemo(() => {
    const keys = new Set(analysis?.match.lines.map((l) => l.requirement.key) ?? []);
    return { heater: keys.has('heater'), filter: keys.has('filter'), light: keys.has('light'), co2: keys.has('co2') };
  }, [analysis]);
  const dimensions = analysis?.dimensions ?? { lengthCm: 80, widthCm: 40, heightCm: 45 };

  async function save() {
    try {
      const payload = { ...config, name };
      if (currentId) {
        await api(`/aquariums/${currentId}`, { method: 'PUT', json: payload });
      } else {
        const { aquarium } = await api<{ aquarium: { id: string } }>('/aquariums', { method: 'POST', json: payload });
        setCurrentId(aquarium.id);
      }
      await loadSaved();
      setNotice('Configuration enregistrée.');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function requestQuote() {
    try {
      let id = currentId;
      if (!id) {
        const { aquarium } = await api<{ aquarium: { id: string } }>('/aquariums', { method: 'POST', json: { ...config, name } });
        id = aquarium.id;
        setCurrentId(id);
      } else {
        await api(`/aquariums/${id}`, { method: 'PUT', json: { ...config, name } });
      }
      const result = await api<Analysis>(`/aquariums/${id}/quote`, { method: 'POST' });
      setAnalysis(result);
      await loadSaved();
      setNotice(`Devis enregistré et transmis aux magasins partenaires (réf. ${result.quoteId?.slice(-6)}).`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function load(a: SavedAquarium) {
    setCurrentId(a.id);
    setName(a.name);
    setConfig({ volumeL: a.volumeL, waterType: a.waterType, lengthCm: a.lengthCm, widthCm: a.widthCm, heightCm: a.heightCm, pricePreference: a.pricePreference, items: a.items });
  }

  function reset() {
    setCurrentId(null);
    setName('Mon aquarium');
    setConfig(DEFAULT_CONFIG);
  }

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  return (
    <div className={`configurator tab-${mobileTab}`}>
      <div className="mobile-tabs segmented" role="tablist">
        <button type="button" className={mobileTab === 'config' ? 'active' : ''} onClick={() => setMobileTab('config')}>Configurer</button>
        <button type="button" className={mobileTab === 'scene' ? 'active' : ''} onClick={() => setMobileTab('scene')}>Aperçu</button>
        <button type="button" className={mobileTab === 'results' ? 'active' : ''} onClick={() => setMobileTab('results')}>{analysis ? `Devis · ${(analysis.match.totalCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : 'Devis'}</button>
      </div>
      <aside className="panel left">
        <div className="row space">
          <h2>Configurer</h2>
          <select value={currentId ?? ''} onChange={(e) => { const a = saved.find((s) => s.id === e.target.value); if (a) load(a); else reset(); }}>
            <option value="">Nouveau projet</option>
            {saved.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.volumeL} L)</option>)}
          </select>
        </div>
        <ConfigForm config={config} onChange={setConfig} species={species} options={options} />
      </aside>

      <section className="panel center">
        <div className="scene">
          <AquariumScene dimensions={dimensions} waterType={config.waterType} items={config.items} speciesBySlug={speciesBySlug} equipment={equipment} />
          <div className="scene-overlay">
            <span>{dimensions.lengthCm} × {dimensions.widthCm} × {dimensions.heightCm} cm · {config.volumeL} L</span>
            {pending && <span className="muted">analyse…</span>}
          </div>
        </div>
        <div className="actions card">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du projet" />
          <button type="button" className="btn btn-ghost" onClick={save}>Enregistrer</button>
          <button type="button" className="btn" onClick={requestQuote} disabled={!analysis}>Obtenir le devis</button>
        </div>
        {notice && <p className="notice">{notice}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <aside className="panel right">
        {analysis ? (
          <>
            <CompatibilityPanel report={analysis.compatibility} />
            <MatchResults match={analysis.match} />
          </>
        ) : (
          <p className="muted center">Analyse en cours…</p>
        )}
      </aside>
    </div>
  );
}
