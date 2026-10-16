import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

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
          <div className="hero-figure">
            <img src="/brand/hero-aquarium.svg" alt="Illustration d'un aquarium planté avec ses poissons" width={800} height={600} />
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
