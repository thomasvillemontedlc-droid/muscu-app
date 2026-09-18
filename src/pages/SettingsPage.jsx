import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { useThemeContext } from '../hooks/ThemeContext.jsx'
import { filterSessionsByScope } from '../domain/sessions.js'
import { seedDefaultExercises } from '../domain/exercises.js'
import { parseImportedData } from '../storage/storage.js'
import { resetTour } from '../storage/tour.js'
import { BigButton } from '../components/BigButton.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { AlertDialog } from '../components/AlertDialog.jsx'
import { TourStep } from '../components/TourStep.jsx'

const SCOPE_LABELS = {
  last: 'La séance la plus récente',
  '7days': 'Les 7 derniers jours',
  month: 'Le mois en cours',
  all: 'Toutes les séances',
  custom: 'Sélection précise ci-dessous',
}

const THEME_LABELS = {
  system: 'Suivre le système',
  dark: 'Sombre',
  light: 'Clair',
}

export function SettingsPage() {
  const { data, setData } = useAppDataContext()
  const { theme, setTheme } = useThemeContext()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [scope, setScope] = useState('all')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState(null)
  const [catalogResetMessage, setCatalogResetMessage] = useState(null)

  const sortedSessions = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date))

  function getScopedSessions() {
    if (scope === 'custom') return data.sessions.filter((s) => selectedIds.has(s.id))
    return filterSessionsByScope(data.sessions, scope)
  }

  function toggleSession(sessionId) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  // Attacher l'élément au DOM avant de cliquer, et ne révoquer l'URL
  // qu'après un court délai : sur mobile, cliquer un <a> détaché du DOM ou
  // révoquer l'URL trop tôt peut silencieusement empêcher le téléchargement.
  function downloadJson(exportData, filename) {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function handleExport() {
    const scopedData = { ...data, sessions: getScopedSessions() }
    downloadJson(scopedData, `muscu-export-${new Date().toISOString().slice(0, 10)}.json`)
  }

  function handleSendTo(url) {
    const scopedData = { ...data, sessions: getScopedSessions() }
    downloadJson(scopedData, `muscu-export-${new Date().toISOString().slice(0, 10)}.json`)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handlePrint() {
    navigate('/print', { state: { sessionIds: getScopedSessions().map((s) => s.id) } })
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      setPendingImport(parseImportedData(text))
    } catch (err) {
      setImportError(err.message)
    }
  }

  function confirmImport() {
    setData(pendingImport)
    setPendingImport(null)
  }

  // Recomplète le catalogue depuis la base fournie (exercices-musculation.md,
  // voir domain/muscleGroups.js) à la demande : utile si le semis automatique
  // n'a pas encore tourné sur cet appareil (ex. ancien bundle en cache).
  // Purement additif comme seedDefaultExercises : aucun exercice existant ni
  // aucune séance n'est touché.
  function handleResetCatalog() {
    const exercises = seedDefaultExercises(data.exercises)
    const added = exercises.length - data.exercises.length
    setData({ ...data, exercises })
    setCatalogResetMessage(
      added > 0
        ? `${added} exercice${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} au catalogue.`
        : 'Le catalogue était déjà complet, rien à ajouter.',
    )
  }

  // Oublie les étapes ignorées manuellement (voir storage/tour.js) et
  // repart de l'accueil : le parcours guidé reprend au premier point encore
  // pertinent (voir domain/tour.js), pas forcément la toute première étape
  // si certaines sont déjà accomplies dans les faits.
  function handleReplayTutorial() {
    resetTour()
    navigate('/')
  }

  return (
    <div className="page">
      <h1>Réglages</h1>

      <section className="settings-section">
        <h2>Apparence</h2>
        <label className="prep-field">
          <span>Thème</span>
          <select className="prep-field__select" value={theme} onChange={(e) => setTheme(e.target.value)}>
            {Object.entries(THEME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="settings-section">
        <h2>Programme</h2>
        <label className="prep-field">
          <span>Durée d'un bloc avant rotation des exercices</span>
          <select
            className="prep-field__select"
            value={data.settings.rotationWeeks}
            onChange={(e) => setData({ ...data, settings: { ...data.settings, rotationWeeks: Number(e.target.value) } })}
          >
            {[2, 3, 4, 6].map((weeks) => (
              <option key={weeks} value={weeks}>
                {weeks} semaines
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="settings-section">
        <h2>Sauvegarde</h2>
        <p>
          Toutes tes données restent uniquement sur ce téléphone (localStorage). Exporte
          régulièrement pour ne rien perdre, surtout avant de vider le cache du navigateur.
        </p>

        <label className="prep-field">
          <span>Contenu à exporter / envoyer</span>
          <select className="prep-field__select" value={scope} onChange={(e) => setScope(e.target.value)}>
            {Object.entries(SCOPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {scope === 'custom' && (
          <ul className="session-checklist">
            {sortedSessions.length === 0 && <li className="session-checklist__empty">Aucune séance enregistrée.</li>}
            {sortedSessions.map((session) => (
              <li key={session.id}>
                <label className="session-checklist__row">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(session.id)}
                    onChange={() => toggleSession(session.id)}
                  />
                  <span>
                    {session.templateName} — {new Date(session.date).toLocaleDateString('fr-FR')}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <BigButton id="tip-settings-export" onClick={handleExport}>
          Exporter (JSON)
        </BigButton>
        <BigButton variant="secondary" onClick={handleImportClick}>
          Importer
        </BigButton>
        <BigButton variant="secondary" onClick={handlePrint}>
          Imprimer / Exporter en PDF
        </BigButton>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </section>

      <section className="settings-section">
        <h2>Catalogue d'exercices</h2>
        <p>
          Complète le catalogue avec tous les exercices de la base intégrée à l'app, sans toucher à tes
          exercices personnels ni à ton historique de séances. À utiliser si des exercices semblent manquants
          (filtre par muscle incomplet, par exemple) après une mise à jour de l'app.
        </p>
        <BigButton variant="secondary" onClick={handleResetCatalog}>
          Réinitialiser le catalogue d'exercices
        </BigButton>
      </section>

      <section className="settings-section">
        <h2>Envoyer à une IA</h2>
        <p>Utilise le même contenu sélectionné ci-dessus.</p>

        <BigButton variant="secondary" onClick={() => handleSendTo('https://claude.ai')}>
          Envoyer à Claude
        </BigButton>
        <BigButton variant="secondary" onClick={() => handleSendTo('https://chatgpt.com')}>
          Envoyer à ChatGPT
        </BigButton>
        <p className="settings-section__hint">
          Le fichier est téléchargé puis un nouvel onglet s'ouvre : glisse-le manuellement dans la
          conversation une fois là-bas, ce n'est pas automatique.
        </p>
      </section>

      <section className="settings-section">
        <h2>Aide</h2>
        <BigButton variant="secondary" onClick={handleReplayTutorial}>
          Revoir le tutoriel
        </BigButton>
      </section>

      <TourStep
        id="settings-export"
        selector="#tip-settings-export"
        text="Exporte tes séances en JSON, ou en PDF juste en dessous."
      />

      <ConfirmDialog
        open={pendingImport != null}
        title="Importer ce fichier ?"
        message="Cela remplacera toutes les données actuelles."
        confirmLabel="Importer"
        danger
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
      <AlertDialog title="Import impossible" message={importError} open={importError != null} onClose={() => setImportError(null)} />
      <AlertDialog
        title="Catalogue d'exercices"
        message={catalogResetMessage}
        open={catalogResetMessage != null}
        onClose={() => setCatalogResetMessage(null)}
      />
    </div>
  )
}
