import { useEffect } from 'react'
import { BigButton } from './BigButton.jsx'

// Remplace window.alert() par une modale intégrée au style de l'app.
export function AlertDialog({ open, title, message, closeLabel = 'OK', onClose }) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-label={title ?? message}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="modal__title">{title}</h2>}
        <p className="modal__message">{message}</p>
        <div className="modal__actions">
          <BigButton onClick={onClose}>{closeLabel}</BigButton>
        </div>
      </div>
    </div>
  )
}
