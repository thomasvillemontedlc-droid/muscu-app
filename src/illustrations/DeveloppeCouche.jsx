// Développé couché : le corps ne bouge pas, seuls les bras montent et
// descendent. Position basse (barre près de la poitrine) en traits pleins,
// position haute (bras tendus) en silhouette fantôme, flèche indiquant le
// sens de la poussée. Muscle ciblé : pectoraux.
export function DeveloppeCoucheIllustration({ className }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      {/* banc */}
      <rect x="18" y="56" width="52" height="5" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="26" y1="61" x2="26" y2="72" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="62" y1="61" x2="62" y2="72" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* jambe pliée, pied au sol */}
      <path
        d="M68 56 L82 56 L82 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="82" y1="44" x2="82" y2="72" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* tête */}
      <circle cx="26" cy="50" r="7" fill="none" stroke="currentColor" strokeWidth="3" />

      {/* torse allongé */}
      <rect x="31" y="46" width="38" height="9" rx="4.5" fill="none" stroke="currentColor" strokeWidth="3" />

      {/* pectoraux (muscle ciblé) */}
      <ellipse cx="48" cy="48.5" rx="11" ry="4.5" fill="var(--color-primary)" />

      {/* fantôme : position haute, bras tendus */}
      <g opacity="0.3">
        <line x1="42" y1="46" x2="42" y2="16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="56" y1="46" x2="56" y2="16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="26" y1="16" x2="72" y2="16" stroke="currentColor" strokeWidth="3" />
        <rect x="22" y="10" width="6" height="12" rx="1" fill="currentColor" />
        <rect x="70" y="10" width="6" height="12" rx="1" fill="currentColor" />
      </g>

      {/* position basse (principale) : bras fléchis, barre près de la poitrine */}
      <path
        d="M42 46 L30 42 L36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M56 46 L68 42 L62 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="30" y1="36" x2="68" y2="36" stroke="currentColor" strokeWidth="3" />
      <rect x="26" y="30" width="6" height="12" rx="1" fill="currentColor" />
      <rect x="73" y="30" width="6" height="12" rx="1" fill="currentColor" />

      {/* flèche : sens du mouvement (poussée vers le haut) */}
      <line x1="94" y1="34" x2="94" y2="18" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M89 22 L94 14 L99 22 Z" fill="var(--color-primary)" />
    </svg>
  )
}
