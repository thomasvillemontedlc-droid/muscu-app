const COLORS = ['#22c55e', '#4ade80', '#facc15', '#38bdf8', '#f472b6']
const PARTICLE_COUNT = 14

// Quelques confettis CSS légers (pas de librairie) : displayed brièvement par
// le parent au moment de la validation d'une série (voir ExerciseView).
export function Confetti() {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    left: Math.round(Math.random() * 100),
    delay: Math.round(Math.random() * 120),
    duration: 700 + Math.round(Math.random() * 300),
    rotation: Math.round(Math.random() * 360),
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="confetti" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="confetti__piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            background: p.color,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}
