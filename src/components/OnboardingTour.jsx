import { useState } from 'react'
import { BigButton } from './BigButton.jsx'

// Un point par fonctionnalité clé, volontairement très court (voir demande :
// lisible en moins de deux minutes) — pas une doc exhaustive, juste de quoi
// savoir que la fonctionnalité existe et où la trouver.
const STEPS = [
  {
    title: 'Crée ta première séance',
    text: '"Séance personnalisée" pour partir de zéro, ou choisis un modèle prêt à l’emploi depuis l’accueil.',
  },
  {
    title: 'Suis le déroulé d’un exercice',
    text: 'Poids et répétitions se règlent avec les boutons +/-. "Saisir par côté" pour un haltère par bras.',
  },
  {
    title: 'Le chrono de repos',
    text: 'Démarre automatiquement après chaque série. Ajustable à la volée (+15s/-15s) ; une alarme sonne à la fin.',
  },
  {
    title: 'Échauffement et étirements',
    text: 'Avant la séance, lance ou personnalise l’échauffement suggéré. À la fin, des étirements adaptés te sont proposés.',
  },
  {
    title: 'Historique des séances',
    text: 'Chaque séance passée garde un statut — faite, partielle ou non faite — pour suivre ta régularité.',
  },
  {
    title: 'Onglet Progression',
    text: 'Tendances par exercice et carte musculaire cumulée des zones travaillées.',
  },
  {
    title: 'Programme hebdomadaire',
    text: 'Planifie tes séances de la semaine ; l’app propose ensuite une rotation d’exercices tous les X semaines.',
  },
  {
    title: 'Exporter tes données',
    text: 'Depuis Réglages : export JSON ou PDF, ou envoi direct de tes séances vers Claude ou ChatGPT.',
  },
]

// Overlay affiché au premier lancement (voir storage/onboarding.js) et
// rejouable à volonté depuis Réglages (SettingsPage#onReplayTutorial) : ce
// composant ne connaît que sa propre navigation entre étapes, c'est le
// parent qui décide quand le monter/démonter et marque le tutoriel comme vu.
export function OnboardingTour({ onClose }) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  function handleNext() {
    if (isLast) onClose()
    else setStepIndex((i) => i + 1)
  }

  return (
    <div className="modal-overlay onboarding-overlay">
      <div className="modal onboarding-card" role="dialog" aria-modal="true" aria-label="Tutoriel de découverte">
        <button type="button" className="onboarding-skip" onClick={onClose}>
          Passer
        </button>

        <p className="onboarding-step-count">
          Étape {stepIndex + 1} / {STEPS.length}
        </p>
        <h2 className="onboarding-title">{step.title}</h2>
        <p className="onboarding-text">{step.text}</p>

        <div className="onboarding-dots">
          {STEPS.map((s, i) => (
            <span key={s.title} className={`onboarding-dot${i === stepIndex ? ' onboarding-dot--active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-nav">
          {stepIndex > 0 && (
            <BigButton variant="secondary" onClick={() => setStepIndex((i) => i - 1)}>
              Précédent
            </BigButton>
          )}
          <BigButton onClick={handleNext}>{isLast ? 'Terminer' : 'Suivant'}</BigButton>
        </div>
      </div>
    </div>
  )
}
