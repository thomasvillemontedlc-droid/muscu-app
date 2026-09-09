import { useEffect } from 'react'
import { BigButton } from './BigButton.jsx'

// Remplace window.confirm() par une modale intégrée au style de l'app.
// Contrôlée par le parent (open + callbacks) plutôt qu'un appel bloquant :
// le parent garde en state ce qui est en attente de confirmation.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
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
          <BigButton variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </BigButton>
          <BigButton variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </BigButton>
        </div>
      </div>
    </div>
  )
}
