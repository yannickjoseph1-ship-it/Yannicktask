import type { CompatibilityReport } from '../lib/types';

const ICON = { error: '⛔', warning: '⚠️', info: 'ℹ️' } as const;

export function CompatibilityPanel({ report }: { report: CompatibilityReport }) {
  return (
    <section className="card">
      <header className="row space">
        <h3>Compatibilité</h3>
        <span className={`pill ${report.ok ? (report.warnings ? 'warn' : 'ok') : 'bad'}`}>
          {report.ok ? (report.warnings ? `${report.warnings} avertissement${report.warnings > 1 ? 's' : ''}` : 'Compatible') : `${report.errors} problème${report.errors > 1 ? 's' : ''}`}
        </span>
      </header>
      {report.envelope && (
        <p className="muted small">Paramètres communs : {report.envelope.tempMinC}–{report.envelope.tempMaxC} °C · pH {report.envelope.phMin}–{report.envelope.phMax}</p>
      )}
      {report.issues.length === 0 && <p className="muted">Ajoutez des habitants pour vérifier leur compatibilité.</p>}
      <ul className="issues">
        {report.issues.map((i, idx) => (
          <li key={idx} className={i.severity}>
            <span>{ICON[i.severity]}</span>
            <span>{i.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
