import { useRef, useState } from 'react'

const LONG_PRESS_MS = 300
const MOVE_CANCEL_THRESHOLD = 10

// Liste réordonnable par appui long + glisser (tactile et souris, via les
// Pointer Events). `renderItem` reçoit les props à poser sur la "poignée"
// (l'élément qui déclenche le drag au toucher).
export function DraggableList({ items, getKey, onReorder, renderItem, className }) {
  const itemRefs = useRef(new Map())
  const pressTimer = useRef(null)
  const pressStart = useRef({ x: 0, y: 0 })
  const [dragState, setDragState] = useState(null) // { index, startY, offsetY, overIndex, startRect }

  function registerItemRef(key, el) {
    if (el) itemRefs.current.set(key, el)
    else itemRefs.current.delete(key)
  }

  function clearPressTimer() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  function handleHandlePointerDown(index, e) {
    pressStart.current = { x: e.clientX, y: e.clientY }
    clearPressTimer()
    pressTimer.current = setTimeout(() => {
      // Capturé maintenant : une fois le drag commencé, cet élément reçoit un
      // transform CSS et son getBoundingClientRect() ne reflète plus sa
      // position "au repos", donc on ne peut plus s'y fier pendant le geste.
      const startRect = itemRefs.current.get(getKey(items[index]))?.getBoundingClientRect()
      setDragState({ index, startY: e.clientY, offsetY: 0, overIndex: index, startRect })
    }, LONG_PRESS_MS)
  }

  function handleHandlePointerMove(e) {
    if (!pressTimer.current) return
    const dx = Math.abs(e.clientX - pressStart.current.x)
    const dy = Math.abs(e.clientY - pressStart.current.y)
    if (dx > MOVE_CANCEL_THRESHOLD || dy > MOVE_CANCEL_THRESHOLD) clearPressTimer()
  }

  function computeOverIndex(fromIndex, offsetY, startRect) {
    if (!startRect) return fromIndex
    const draggedCenter = startRect.top + startRect.height / 2 + offsetY

    let overIndex = fromIndex
    items.forEach((item, index) => {
      if (index === fromIndex) return
      const el = itemRefs.current.get(getKey(item))
      if (!el) return
      const rect = el.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      if (draggedCenter > center) overIndex = index
    })
    return overIndex
  }

  function handleContainerPointerMove(e) {
    if (!dragState) return
    const offsetY = e.clientY - dragState.startY
    setDragState((s) => ({
      ...s,
      offsetY,
      overIndex: computeOverIndex(s.index, offsetY, s.startRect),
    }))
  }

  function handleContainerPointerUp() {
    clearPressTimer()
    if (dragState && dragState.overIndex !== dragState.index) {
      onReorder(dragState.index, dragState.overIndex)
    }
    setDragState(null)
  }

  return (
    <ol
      className={className}
      onPointerMove={dragState ? handleContainerPointerMove : undefined}
      onPointerUp={dragState ? handleContainerPointerUp : undefined}
      onPointerCancel={dragState ? handleContainerPointerUp : undefined}
    >
      {items.map((item, index) => {
        const key = getKey(item)
        const isDragging = dragState?.index === index
        const style = isDragging
          ? { transform: `translateY(${dragState.offsetY}px)`, position: 'relative', zIndex: 2 }
          : undefined

        const dragHandleProps = {
          onPointerDown: (e) => handleHandlePointerDown(index, e),
          onPointerMove: handleHandlePointerMove,
          onPointerUp: clearPressTimer,
          style: { touchAction: 'none' },
        }

        return (
          <li
            key={key}
            ref={(el) => registerItemRef(key, el)}
            style={style}
            className={isDragging ? 'draggable-list__item draggable-list__item--dragging' : 'draggable-list__item'}
          >
            {renderItem(item, index, dragHandleProps)}
          </li>
        )
      })}
    </ol>
  )
}
