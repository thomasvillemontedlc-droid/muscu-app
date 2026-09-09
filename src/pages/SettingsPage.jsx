import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { filterSessionsByScope } from '../domain/sessions.js'
import { parseImportedData } from '../storage/storage.js'
import { BigButton } from '../components/BigButton.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { AlertDialog } from '../components/AlertDialog.jsx'

const SCOPE_LABELS = {
  last: 'La séance la plus récente',
  '7days': 'Les 7 derniers jours',
  month: 'Le mois en cours',
  all: 'Toutes les séances',
  custom: 'Sélection précise ci-dessous',
}

export function SettingsPage() {
  const { data, setData } = useAppDataContext()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [scope, setScope] = useState('all')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState(null)

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

  return (
    <div className="page">
      <h1>Réglages</h1>

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

        <BigButton onClick={handleExport}>Exporter (JSON)</BigButton>
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
    </div>
  )
}
