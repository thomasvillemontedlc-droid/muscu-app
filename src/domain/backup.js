// Rappel de sauvegarde : les données ne vivent que dans le localStorage du
// téléphone (voir storage/storage.js), une purge du navigateur efface tout.
// Seul un export COMPLET (toutes les séances) compte comme sauvegarde :
// settings.lastBackupAt, posé par recordBackup.
export const BACKUP_REMINDER_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

export function recordBackup(data, now = new Date()) {
  return { ...data, settings: { ...data.settings, lastBackupAt: now.toISOString() } }
}

// {daysSince (null si jamais), unsavedCount} quand un rappel s'impose :
// au moins une séance terminée pas encore sauvegardée, et dernière
// sauvegarde absente ou plus vieille que BACKUP_REMINDER_DAYS. Sinon null.
export function getBackupReminder(data, now = new Date()) {
  const lastBackupAt = data.settings?.lastBackupAt ?? null
  const lastBackupMs = lastBackupAt ? new Date(lastBackupAt).getTime() : null
  // Fin de séance (finishedAt), pas son début : une séance en cours pendant
  // l'export n'y était pas encore complète. Anciennes séances sans
  // finishedAt : leur date.
  const unsavedCount = data.sessions.filter(
    (s) => s.phase === 'finished' && (lastBackupMs == null || (s.finishedAt ?? new Date(s.date).getTime()) > lastBackupMs),
  ).length
  if (unsavedCount === 0) return null

  const daysSince = lastBackupAt ? Math.floor((now.getTime() - new Date(lastBackupAt).getTime()) / DAY_MS) : null
  if (daysSince != null && daysSince < BACKUP_REMINDER_DAYS) return null
  return { daysSince, unsavedCount }
}
