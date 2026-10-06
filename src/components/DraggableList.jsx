import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { vibrateSuccess } from '../lib/haptics.js'

const LONG_PRESS_MS = 400
const MOVE_CANCEL_THRESHOLD = 10
// Zone (px) près du haut/bas de l'écran où le doigt fait défiler la page
// pendant un déplacement, et vitesse max (px par image).
const AUTO_SCROLL_EDGE = 80
const AUTO_SCROLL_MAX_SPEED = 14

// Liste réordonnable par appui long sur le TITRE d'un élément, puis glisser
// (tactile et souris). Pas de poignée dédiée : renderItem(item, index,
// { titleProps, isCollapsed, isDragging }) pose `titleProps` sur le titre.
//
// Défilement : rien n'est bloqué tant que l'appui long n'est pas déclenché
// (pas de preventDefault sur touchstart, touch-action laissé par défaut) -
// un balayage qui commence sur un titre fait défiler la page normalement,
// le navigateur annule alors le pointeur (pointercancel) et l'appui long
// avec. Ce n'est qu'une fois l'appui long déclenché qu'un écouteur
// touchmove non passif bloque le défilement natif ; la page défile alors
// d'elle-même si le doigt approche du haut ou du bas de l'écran.
//
// Pendant le déplacement, toute la liste passe en mode replié
// (isCollapsed : chaque écran n'affiche que le titre, sur une hauteur
// fixe) : l'élément tenu suit le doigt, les autres se décalent pour montrer
// l'emplacement d'arrivée. Au relâchement : onReorder(from, to), puis
// affichage normal.
export function DraggableList({ items, getKey, onReorder, renderItem, className }) {
  const itemRefs = useRef(new Map())
  const press = useRef(null) // { index, x, y, pointerType, timer }
  const fingerY = useRef(0)
  const suppressClick = useRef(false)
  // { index, pointerType, fingerY, scrollY, slots: [{ docTop, height }] | null }
  const [drag, setDrag] = useState(null)
  // Lus au relâchement, hors rendu : les emplacements mesurés (posés dès
  // la mesure) et le dernier onReorder. La position du doigt vient de
  // fingerY (mis à jour à chaque mouvement, avant tout rendu) : le dernier
  // mouvement avant le relâchement compte même s'il n'a pas encore été
  // rendu par React.
  const slotsRef = useRef(null)
  const onReorderRef = useRef(onReorder)
  useEffect(() => {
    onReorderRef.current = onReorder
  })

  function registerItemRef(key, el) {
    if (el) itemRefs.current.set(key, el)
    else itemRefs.current.delete(key)
  }

  function cancelPress() {
    if (press.current) clearTimeout(press.current.timer)
    press.current = null
  }

  function handleTitlePointerDown(index, e) {
    if (e.button != null && e.button !== 0) return
    cancelPress()
    fingerY.current = e.clientY
    const pending = { index, x: e.clientX, y: e.clientY, pointerType: e.pointerType }
    pending.timer = setTimeout(() => {
      press.current = null
      vibrateSuccess()
      // Le clic qui suit le relâchement (même sans déplacement) ne doit
      // pas être interprété comme un simple toucher sur le titre.
      suppressClick.current = true
      setDrag({ index, pointerType: pending.pointerType, fingerY: fingerY.current, scrollY: window.scrollY, slots: null })
    }, LONG_PRESS_MS)
    press.current = pending
  }

  function handleTitlePointerMove(e) {
    if (!press.current) return
    fingerY.current = e.clientY
    const dx = Math.abs(e.clientX - press.current.x)
    const dy = Math.abs(e.clientY - press.current.y)
    if (dx > MOVE_CANCEL_THRESHOLD || dy > MOVE_CANCEL_THRESHOLD) cancelPress()
  }

  // Liste repliée rendue : on mesure les emplacements (coordonnées du
  // document, insensibles au défilement), puis on fait défiler pour que
  // l'élément tenu reste sous le doigt malgré le changement de hauteur.
  useLayoutEffect(() => {
    if (!drag || drag.slots) return
    const slots = items.map((item) => {
      const rect = itemRefs.current.get(getKey(item))?.getBoundingClientRect()
      return rect ? { docTop: rect.top + window.scrollY, height: rect.height } : { docTop: 0, height: 0 }
    })
    slotsRef.current = slots
    const held = slots[drag.index]
    window.scrollBy(0, held.docTop - window.scrollY + held.height / 2 - drag.fingerY)
    setDrag((d) => d && { ...d, slots, scrollY: window.scrollY })
    // Mesure unique au déclenchement (drag.slots passe de null à rempli).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag])

  const dragging = drag != null
  const dragIndex = drag?.index
  const isTouchDrag = drag?.pointerType === 'touch'

  // Suivi du doigt, fin du geste et défilement automatique, seulement
  // pendant un déplacement.
  useEffect(() => {
    if (!dragging) return

    function move(clientY) {
      fingerY.current = clientY
      setDrag((d) => d && { ...d, fingerY: clientY, scrollY: window.scrollY })
    }

    function end() {
      const slots = slotsRef.current
      slotsRef.current = null
      setDrag(null)
      if (slots) {
        const to = getTargetIndex({ index: dragIndex, slots, fingerY: fingerY.current, scrollY: window.scrollY })
        if (to !== dragIndex) onReorderRef.current(dragIndex, to)
      }
      setTimeout(() => {
        suppressClick.current = false
      }, 400)
    }

    function handleTouchMove(e) {
      // Appui long déclenché : le défilement natif est bloqué à partir
      // d'ici seulement (voir le commentaire en tête de composant).
      e.preventDefault()
      if (e.touches[0]) move(e.touches[0].clientY)
    }
    const handlePointerMove = (e) => move(e.clientY)

    let frame = requestAnimationFrame(function autoScroll() {
      const y = fingerY.current
      let speed = 0
      if (y < AUTO_SCROLL_EDGE) speed = -AUTO_SCROLL_MAX_SPEED * (1 - y / AUTO_SCROLL_EDGE)
      else if (y > window.innerHeight - AUTO_SCROLL_EDGE) {
        speed = AUTO_SCROLL_MAX_SPEED * (1 - (window.innerHeight - y) / AUTO_SCROLL_EDGE)
      }
      if (speed !== 0) {
        window.scrollBy(0, speed)
        setDrag((d) => d && { ...d, scrollY: window.scrollY })
      }
      frame = requestAnimationFrame(autoScroll)
    })

    // Tactile : uniquement les événements touch (iOS peut annuler le
    // pointeur au début du geste) ; souris/stylet : les Pointer Events.
    if (isTouchDrag) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', end)
      document.addEventListener('touchcancel', end)
    } else {
      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', end)
      document.addEventListener('pointercancel', end)
    }
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', end)
      document.removeEventListener('touchcancel', end)
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', end)
      document.removeEventListener('pointercancel', end)
    }
  }, [dragging, dragIndex, isTouchDrag])

  useEffect(() => () => cancelPress(), [])

  const targetIndex = drag?.slots ? getTargetIndex(drag) : null
  const step = drag?.slots ? getSlotStep(drag.slots) : 0

  return (
    <ol className={`${className ?? ''}${dragging ? ' draggable-list--collapsed' : ''}`}>
      {items.map((item, index) => {
        const key = getKey(item)
        const isDragging = drag?.index === index
        let transform
        if (drag?.slots) {
          if (isDragging) {
            const slot = drag.slots[index]
            transform = drag.fingerY + drag.scrollY - (slot.docTop + slot.height / 2)
          } else if (index > drag.index && index <= targetIndex) transform = -step
          else if (index < drag.index && index >= targetIndex) transform = step
        }

        const titleProps = {
          onPointerDown: (e) => handleTitlePointerDown(index, e),
          onPointerMove: handleTitlePointerMove,
          onPointerUp: cancelPress,
          onPointerCancel: cancelPress,
          onContextMenu: (e) => e.preventDefault(),
          onClickCapture: (e) => {
            if (!suppressClick.current) return
            e.stopPropagation()
            e.preventDefault()
          },
          style: { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' },
        }

        return (
          <li
            key={key}
            ref={(el) => registerItemRef(key, el)}
            style={transform != null ? { transform: `translateY(${transform}px)` } : undefined}
            className={[
              'draggable-list__item',
              dragging && 'draggable-list__item--collapsed',
              isDragging && 'draggable-list__item--dragging',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {renderItem(item, index, { titleProps, isCollapsed: dragging, isDragging })}
          </li>
        )
      })}
    </ol>
  )
}

// Rang d'arrivée de l'élément tenu : nombre d'autres éléments dont le
// centre est au-dessus du doigt (coordonnées du document).
function getTargetIndex(drag) {
  const fingerDocY = drag.fingerY + drag.scrollY
  return drag.slots.filter((slot, i) => i !== drag.index && slot.docTop + slot.height / 2 < fingerDocY).length
}

// Distance entre deux emplacements consécutifs (hauteur fixe + marge, voir
// le mode replié), dont se décalent les éléments pour laisser la place.
function getSlotStep(slots) {
  if (slots.length < 2) return slots[0]?.height ?? 0
  return slots[1].docTop - slots[0].docTop
}
