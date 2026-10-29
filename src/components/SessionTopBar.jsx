import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { useNow } from '../hooks/useNow.js'
import { deleteSession } from '../domain/sessions.js'
import { finishSessionEarly } from '../domain/sessionRunner.js'
import { getRemainingSessionEstimate, getSetProgress } from '../domain/sessionSummary.js'
import { formatClock } from '../lib/formatClock.js'
import { formatDuration } from '../lib/formatDuration.js'
import { BigButton } from './BigButton.jsx'
import { ConfirmDialog } from './ConfirmDialog.jsx'

// Barre du haut pendant une séance (la navigation du bas est masquée, voir
// hooks/useLiveSession.js) : temps écoulé, séries faites, estimation du
// temps restant, et "Terminer" qui ouvre les trois sorties possibles.
export function SessionTopBar({ session }) {
  const { data, setData } = useAppDataContext()
  const navigate = useNavigate()
  const now = useNow(1000)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const { done, total } = getSetProgress(session)
  const remainingMs = getRemainingSessionEstimate(session, data.sessions)
  const elapsed = session.startedAt ? formatClock(now - session.startedAt) : null

  function handleFinish() {
    setData((current) => ({ ...current, sessions: finishSessionEarly(current.sessions, session.id) }))
    setMenuOpen(false)
  }

  function handleAbandon() {
    setData((current) => ({ ...current, sessions: deleteSession(current.sessions, session.id) }))
    navigate('/')
  }

  return (
    <>
      <div className="session-top-bar">
        <div className="session-top-bar__info">
          {elapsed && <span className="session-top-bar__clock">{elapsed}</span>}
          <span>
            {done}/{total} séries
          </span>
          {remainingMs > 0 && <span className="session-top-bar__muted">~{formatDuration(remainingMs)} restant</span>}
        </div>
        <button type="button" className="session-top-bar__finish" onClick={() => setMenuOpen(true)}>
          Terminer
        </button>
      </div>

      {menuOpen && (
        <div className="modal-overlay" onClick={() => setMenuOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Terminer la séance" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Terminer la séance ?</h2>
            <p className="modal__message">
              {done}/{total} séries faites.
            </p>
            <div className="session-top-bar__menu">
              <BigButton onClick={handleFinish}>Terminer et enregistrer</BigButton>
              <BigButton variant="secondary" onClick={() => navigate('/')}>
                Quitter pour l'instant
              </BigButton>
              <BigButton
                variant="danger"
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmAbandon(true)
                }}
              >
                Abandonner la séance
              </BigButton>
              <button type="button" className="subtle-button" onClick={() => setMenuOpen(false)}>
                Continuer la séance
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmAbandon}
        title="Abandonner la séance ?"
        message="La séance et toutes ses séries seront supprimées. Impossible de revenir en arrière."
        confirmLabel="Abandonner"
        danger
        onConfirm={handleAbandon}
        onCancel={() => setConfirmAbandon(false)}
      />
    </>
  )
}
