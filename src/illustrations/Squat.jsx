// Squat : debout, genoux fléchis, barre sur les épaules. Muscle ciblé :
// quadriceps (cuisse avant).
export function SquatIllustration({ className }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      {/* tête */}
      <circle cx="55" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="3" />

      {/* torse penché */}
      <line x1="55" y1="24" x2="62" y2="46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* barre sur les épaules */}
      <line x1="40" y1="26" x2="70" y2="26" stroke="currentColor" strokeWidth="3" />
      <rect x="36" y="20" width="6" height="12" rx="1" fill="currentColor" />
      <rect x="68" y="20" width="6" height="12" rx="1" fill="currentColor" />
      <line x1="55" y1="26" x2="55" y2="24" stroke="currentColor" strokeWidth="3" />

      {/* bras tenant la barre */}
      <line x1="55" y1="30" x2="42" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="59" y1="30" x2="68" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* hanche -> genou (cuisse) */}
      <line x1="62" y1="46" x2="44" y2="56" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* genou -> cheville (tibia) */}
      <line x1="44" y1="56" x2="50" y2="74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* pied */}
      <line x1="50" y1="74" x2="62" y2="74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* quadriceps (muscle ciblé) */}
      <ellipse cx="53" cy="50" rx="11" ry="4.5" fill="var(--color-primary)" transform="rotate(-25 53 50)" />

      {/* seconde jambe, en arrière-plan */}
      <line x1="62" y1="46" x2="76" y2="54" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      <line x1="76" y1="54" x2="72" y2="74" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}
