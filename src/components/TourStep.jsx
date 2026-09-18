import { useEffect, useState } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getCurrentTourStepId } from '../domain/tour.js'
import { dismissStep } from '../storage/tour.js'

const BUBBLE_WIDTH = 240
const EDGE_MARGIN = 8
const GAP = 10

// Une étape du parcours guidé (voir domain/tour.js) : surligne un élément
// réel de l'écran (via son sélecteur CSS, pas une copie ou une capture)
// avec une bulle de texte à côté, uniquement quand c'est son tour dans le
// parcours. Le sondage régulier (au lieu d'un seul essai au montage) sert
// deux choses à la fois : attendre qu'un élément qui apparaît après coup
// soit présent, et remarquer qu'une étape précédente vient d'être ignorée
// ailleurs sur l'écran (dismissStep touche le localStorage, pas un state
// React partagé). Ne bloque jamais l'interaction avec le reste de l'écran.
export function TourStep({ id, selector, text }) {
  const { data } = useAppDataContext()
  const [state, setState] = useState({ active: false, rect: null })

  useEffect(() => {
    function update() {
      if (getCurrentTourStepId(data) !== id) {
        setState((prev) => (prev.active || prev.rect ? { active: false, rect: null } : prev))
        return
      }
      const el = document.querySelector(selector)
      setState({ active: true, rect: el ? el.getBoundingClientRect() : null })
    }

    update()
    const poll = setInterval(update, 400)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      clearInterval(poll)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [id, selector, data])

  function handleDismiss() {
    dismissStep(id)
    setState({ active: false, rect: null })
  }

  if (!state.active || !state.rect) return null
  const rect = state.rect

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
