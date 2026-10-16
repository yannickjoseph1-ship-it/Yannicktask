import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { ConfigItem, Species } from '../lib/types';
import { AquariumScene } from '../three/AquariumScene';

/** Espèces de démonstration pour la scène d'accueil (pas d'appel API). */
const DEMO_SPECIES: Record<string, Species> = {
  'neon-tetra': { id: '1', slug: 'neon-tetra', commonName: 'Néon bleu', kind: 'FISH', waterType: 'FRESH', minVolumeL: 60, tempMinC: 20, tempMaxC: 26, adultSizeCm: 3.5, minGroupSize: 8, needsCo2: false, rooted: true, tags: ['schooling'], color: '#2f7cff' },
  'cardinal-tetra': { id: '2', slug: 'cardinal-tetra', commonName: 'Néon cardinal', kind: 'FISH', waterType: 'FRESH', minVolumeL: 80, tempMinC: 24, tempMaxC: 29, adultSizeCm: 4, minGroupSize: 8, needsCo2: false, rooted: true, tags: ['schooling'], color: '#e33b3b' },
  'corydoras-panda': { id: '3', slug: 'corydoras-panda', commonName: 'Corydoras panda', kind: 'FISH', waterType: 'FRESH', minVolumeL: 80, tempMinC: 20, tempMaxC: 25, adultSizeCm: 5, minGroupSize: 6, needsCo2: false, rooted: true, tags: ['bottom-dweller'], color: '#edf2f4' },
  'vallisneria': { id: '4', slug: 'vallisneria', commonName: 'Vallisnérie', kind: 'PLANT', waterType: 'FRESH', minVolumeL: 60, tempMinC: 15, tempMaxC: 28, adultSizeCm: 50, minGroupSize: 1, needsCo2: false, rooted: true, tags: [], color: '#74c69d', lightNeed: 'MEDIUM' },
  'anubias-nana': { id: '5', slug: 'anubias-nana', commonName: 'Anubias nana', kind: 'PLANT', waterType: 'FRESH', minVolumeL: 10, tempMinC: 20, tempMaxC: 28, adultSizeCm: 12, minGroupSize: 1, needsCo2: false, rooted: false, tags: [], color: '#2d6a4f', lightNeed: 'LOW' },
};
const DEMO_ITEMS: ConfigItem[] = [
  { kind: 'FISH', refSlug: 'neon-tetra', quantity: 10 },
  { kind: 'FISH', refSlug: 'cardinal-tetra', quantity: 6 },
  { kind: 'FISH', refSlug: 'corydoras-panda', quantity: 5 },
  { kind: 'PLANT', refSlug: 'vallisneria', quantity: 5 },
  { kind: 'PLANT', refSlug: 'anubias-nana', quantity: 3 },
  { kind: 'DECOR', refSlug: 'driftwood', quantity: 1 },
  { kind: 'DECOR', refSlug: 'rock', quantity: 3 },
];

export function HomePage() {
  const { user } = useAuth();
  const clientCta = user?.role === 'CLIENT' ? '/app' : user?.role === 'SHOP' ? '/shop' : '/register';

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Aquariophilie · configurateur 3D · magasins partenaires</p>
            <h1>Concevez votre aquarium. Trouvez tout ce qu'il lui faut, près de chez vous.</h1>
            <p className="lead">
              Choisissez le volume, les poissons, les plantes et le décor. Aqu.app vérifie que tout est compatible,
              vous montre votre bac en 3D et vous propose le matériel correspondant chez les magasins partenaires, avec le budget total.
            </p>
            <div className="hero-actions">
              <Link to={clientCta} className="btn btn-lg">Créer mon aquarium</Link>
              <Link to={user ? clientCta : '/login'} className="btn btn-lg btn-outline">{user ? 'Reprendre mon projet' : 'Se connecter'}</Link>
            </div>
            <p className="hero-note">Gratuit pour les aquariophiles · Vous êtes un magasin ? <Link to="/register">Référencez votre catalogue</Link></p>
          </div>
          <div className="hero-scene" aria-label="Aperçu d'un aquarium configuré en 3D">
            <AquariumScene dimensions={{ lengthCm: 100, widthCm: 40, heightCm: 50 }} waterType="FRESH" items={DEMO_ITEMS} speciesBySlug={DEMO_SPECIES} equipment={{ heater: true, filter: true, light: true, co2: false }} zoom={0.72} />
            <div className="hero-scene-caption">Bac communautaire 180 L · 21 poissons · 8 plantes · budget estimé 612 €</div>
          </div>
        </div>
      </section>

      <section className="steps">
        <div className="section-inner">
          <h2>Comment ça marche</h2>
          <ol className="steps-grid">
            <li>
              <span className="step-no">1</span>
              <h3>Configurez</h3>
              <p>Volume, type d'eau, poissons, invertébrés, plantes, décor. Le référentiel couvre 45 espèces d'eau douce, saumâtre et de mer.</p>
            </li>
            <li>
              <span className="step-no">2</span>
              <h3>Vérifiez et visualisez</h3>
              <p>Compatibilité entre espèces, taille de banc, température, pH, plantes et matériel. Votre bac apparaît en 3D au fur et à mesure.</p>
            </li>
            <li>
              <span className="step-no">3</span>
              <h3>Recevez votre devis</h3>
              <p>Chaque besoin est associé à un produit réel du catalogue d'un magasin partenaire : bac, filtre, chauffage, éclairage, vivant. Budget total et alternatives inclus.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="proof">
        <div className="section-inner proof-grid">
          <div className="proof-item"><strong>45</strong><span>espèces et plantes référencées</span></div>
          <div className="proof-item"><strong>13</strong><span>catégories de matériel dimensionnées automatiquement</span></div>
          <div className="proof-item"><strong>3D</strong><span>visualisation immédiate de votre configuration</span></div>
          <div className="proof-item"><strong>0 €</strong><span>pour les aquariophiles, toujours</span></div>
        </div>
      </section>

      <section className="shops">
        <div className="section-inner shops-inner">
          <div>
            <p className="eyebrow">Pour les magasins</p>
            <h2>Vos produits, recommandés au bon moment.</h2>
            <p className="lead">
              Importez votre catalogue en CSV ou JSON avec vos tags et vos prix. Chaque devis client qui retient un de vos produits devient un lead.
              L'abonnement Premium vous place en priorité quand plusieurs magasins proposent un produit équivalent.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-lg">Référencer mon magasin</Link>
            </div>
          </div>
          <ul className="plan-list">
            <li><span className="plan-name">Standard</span><span className="plan-price">29 € / mois</span><span className="plan-desc">Catalogue illimité, apparition dans les recommandations, leads clients.</span></li>
            <li><span className="plan-name">Premium</span><span className="plan-price">79 € / mois</span><span className="plan-desc">Priorité à produit équivalent et mise en avant des offres groupées.</span></li>
          </ul>
        </div>
      </section>

      <footer className="home-footer">
        <div className="section-inner footer-inner">
          <img src="/brand/logo.webp" alt="" width={40} height={40} />
          <span>Aqu.app · la marketplace de l'aquariophilie</span>
          <nav><Link to="/login">Connexion</Link><Link to="/register">Créer un compte</Link></nav>
        </div>
      </footer>
    </div>
  );
}
