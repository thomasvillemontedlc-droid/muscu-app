// Développé couché : allongé sur un banc, barre tenue à bout de bras
// au-dessus de la poitrine. Muscle ciblé : pectoraux.
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

      {/* bras tendus tenant la barre */}
      <line x1="42" y1="46" x2="42" y2="22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="56" y1="46" x2="56" y2="22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* barre + disques */}
      <line x1="26" y1="22" x2="72" y2="22" stroke="currentColor" strokeWidth="3" />
      <rect x="22" y="16" width="6" height="12" rx="1" fill="currentColor" />
      <rect x="70" y="16" width="6" height="12" rx="1" fill="currentColor" />
    </svg>
  )
}
