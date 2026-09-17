import { useEffect, useState } from 'react'
import { hasSeenTip, markTipSeen } from '../storage/onboarding.js'

const BUBBLE_WIDTH = 240
const EDGE_MARGIN = 8
const GAP = 10

// Surligne un élément réel de l'écran (via son sélecteur CSS, pas une copie
// ou une capture) avec une bulle de texte à côté, la première fois qu'on
// tombe dessus. `selector` est cherché dans le DOM tant que la bulle n'a pas
// été vue — un sondage léger plutôt qu'un seul essai au montage, pour
// couvrir le cas où l'élément visé apparaît un peu après (ex. écran vide au
// premier passage). Ne bloque jamais l'interaction avec le reste de l'écran
// (pas d'overlay plein écran) : juste un contour + un petit texte.
export function OnboardingTip({ id, selector, text }) {
  const [seen, setSeen] = useState(() => hasSeenTip(id))
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (seen) return

    function update() {
      const el = document.querySelector(selector)
      setRect(el ? el.getBoundingClientRect() : null)
    }

    update()
    const poll = setInterval(update, 500)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      clearInterval(poll)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [seen, selector])

  function handleDismiss() {
    markTipSeen(id)
    setSeen(true)
  }

  if (seen || !rect) return null

  const placeAbove = window.innerHeight - rect.bottom < 160
  const bubbleLeft = Math.min(
    Math.max(rect.left + rect.width / 2 - BUBBLE_WIDTH / 2, EDGE_MARGIN),
    window.innerWidth - BUBBLE_WIDTH - EDGE_MARGIN,
  )

  return (
    <>
      <div
        className="tip-highlight"
        style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
      />
      <div
        className="tip-bubble"
        style={
          placeAbove
            ? { width: BUBBLE_WIDTH, left: bubbleLeft, top: rect.top - GAP, transform: 'translateY(-100%)' }
            : { width: BUBBLE_WIDTH, left: bubbleLeft, top: rect.bottom + GAP }
        }
      >
        <p className="tip-bubble__text">{text}</p>
        <button type="button" className="tip-bubble__close" onClick={handleDismiss}>
          Compris
        </button>
      </div>
    </>
  )
}
