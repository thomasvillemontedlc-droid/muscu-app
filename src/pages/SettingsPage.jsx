import { useRef } from 'react'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { parseImportedData } from '../storage/storage.js'
import { BigButton } from '../components/BigButton.jsx'

export function SettingsPage() {
  const { data, setData } = useAppDataContext()
  const fileInputRef = useRef(null)

  function downloadExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `muscu-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSendTo(url) {
    downloadExport()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const imported = parseImportedData(text)
      if (window.confirm('Importer ce fichier remplacera toutes les données actuelles. Continuer ?')) {
        setData(imported)
      }
    } catch (err) {
      window.alert(`Import impossible : ${err.message}`)
    } finally {
      e.target.value = ''
    }
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
        <BigButton onClick={downloadExport}>Exporter (JSON)</BigButton>
        <BigButton variant="secondary" onClick={handleImportClick}>
          Importer
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
    </div>
  )
}
