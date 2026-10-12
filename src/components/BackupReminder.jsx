import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getBackupReminder, recordBackup } from '../domain/backup.js'
import { downloadJson, getExportFilename } from '../lib/downloadJson.js'

// Bandeau "Dernière sauvegarde il y a X jours" (voir domain/backup.js) :
// exporte toutes les données en un toucher, même fichier que Réglages >
// Sauvegarde avec "Toutes les séances".
export function BackupReminder() {
  const { data, setData } = useAppDataContext()
  const reminder = getBackupReminder(data)
  if (!reminder) return null

  function handleBackup() {
    downloadJson(data, getExportFilename())
    setData((current) => recordBackup(current))
  }

  const { daysSince, unsavedCount } = reminder
  const when =
    daysSince == null ? 'Aucune sauvegarde pour l’instant' : `Dernière sauvegarde il y a ${daysSince} jours`

  return (
    <div className="backup-reminder" role="status">
      <p className="backup-reminder__text">
        {when} · {unsavedCount} séance{unsavedCount > 1 ? 's' : ''} non sauvegardée{unsavedCount > 1 ? 's' : ''}
      </p>
      <button type="button" className="backup-reminder__button" onClick={handleBackup}>
        Sauvegarder
      </button>
    </div>
  )
}
