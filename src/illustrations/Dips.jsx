// Dips : position basse (corps fléchi entre les barres) en traits pleins,
// position haute (bras tendus) en silhouette fantôme, flèche indiquant le
// sens de la poussée. Muscle ciblé : triceps (arrière du bras).
export function DipsIllustration({ className }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      {/* barres parallèles */}
      <line x1="30" y1="26" x2="30" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="26" x2="70" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="26" x2="42" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="26" x2="82" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* fantôme : position haute, bras tendus, corps remonté */}
      <g opacity="0.3">
        <circle cx="50" cy="20" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
        <line x1="50" y1="27" x2="53" y2="34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="47" y1="24" x2="30" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="53" y1="24" x2="70" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* tête, position basse (principale) */}
      <circle cx="50" cy="34" r="7" fill="none" stroke="currentColor" strokeWidth="3" />

      {/* torse penché en avant, corps abaissé entre les barres */}
      <line x1="50" y1="41" x2="56" y2="60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* jambes fléchies vers l'arrière */}
      <path
        d="M56 60 L50 68 L58 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* bras : épaule sur la barre, coude fléchi vers le bas */}
      <line x1="46" y1="44" x2="30" y2="40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="30" y1="40" x2="38" y2="56" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      <line x1="54" y1="44" x2="70" y2="40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <line x1="70" y1="40" x2="62" y2="56" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />

      {/* triceps (muscle ciblé), sur le bras avant */}
      <ellipse cx="33" cy="48" rx="8.5" ry="4" fill="var(--color-primary)" transform="rotate(65 33 48)" />

      {/* flèche : sens du mouvement (poussée vers le haut) */}
      <line x1="98" y1="56" x2="98" y2="36" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M93 40 L98 32 L103 40 Z" fill="var(--color-primary)" />
    </svg>
  )
}
