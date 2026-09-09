// Utilisé quand aucun schéma dédié n'existe pour l'exercice — silhouette
// neutre, sans muscle mis en évidence.
export function GenericIllustration({ className }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      <circle cx="60" cy="20" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="48" y="32" width="24" height="28" rx="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="48" y1="38" x2="34" y2="52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="72" y1="38" x2="86" y2="52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="54" y1="60" x2="50" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="66" y1="60" x2="70" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
