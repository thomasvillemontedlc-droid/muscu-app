import { getSessionStatus } from './sessions.js'

// Lundi (00:00 local) de la semaine contenant cette date. Même calcul que
// domain/progress.js#getWeekStart (non exporté là-bas) : deux domaines
// indépendants, pas de dépendance croisée pour un utilitaire aussi simple.
function getWeekStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + mondayOffset)
  return d
}

// Nombre de séances du programme déjà au moins entamées depuis le lundi de
// la semaine en cours, tous templates du programme confondus (pas suivi
// séparément par template : si l'ordre n'est pas respecté à la lettre, la
// suggestion avance quand même plutôt que de rester bloquée dessus).
function getCompletedThisWeek(program, sessions) {
  const weekStart = getWeekStart(new Date())
  return sessions.filter(
    (s) =>
      program.templateIds.includes(s.templateId) &&
      new Date(s.date) >= weekStart &&
      getSessionStatus(s) !== 'not-done',
  ).length
}

// Prochain template à proposer : celui à la position (nb déjà fait cette
// semaine) dans l'ordre du programme, qui reboucle au-delà de sa longueur
// (programme "tournant" - voir la demande). null si le programme est vide.
export function getNextProgramTemplateId(program, sessions) {
  if (!program || program.templateIds.length === 0) return null
  const completed = getCompletedThisWeek(program, sessions)
  return program.templateIds[completed % program.templateIds.length]
}

// Ajoute un template au programme ; démarre le bloc de rotation à cet
// instant si c'est le tout premier (un programme vide n'a pas de bloc en
// cours). Les ajouts suivants ne touchent pas blockStartDate : étoffer le
// programme ne doit pas repousser une rotation déjà en cours de route.
export function addTemplateToProgram(program, templateId) {
  if (program.templateIds.includes(templateId)) return program
  const templateIds = [...program.templateIds, templateId]
  return {
    ...program,
    templateIds,
    blockStartDate: program.blockStartDate ?? new Date().toISOString(),
  }
}

export function removeTemplateFromProgram(program, templateId) {
  return { ...program, templateIds: program.templateIds.filter((id) => id !== templateId) }
}

export function moveTemplateInProgram(program, fromIndex, toIndex) {
  const templateIds = [...program.templateIds]
  const [moved] = templateIds.splice(fromIndex, 1)
  templateIds.splice(toIndex, 0, moved)
  return { ...program, templateIds }
}

// Semaines écoulées depuis le début du bloc en cours (0 si jamais démarré).
export function getWeeksSinceBlockStart(program, now = new Date()) {
  if (!program?.blockStartDate) return 0
  const ms = now - new Date(program.blockStartDate)
  return Math.floor(ms / (7 * 24 * 3600 * 1000))
}

// true si le bloc en cours a atteint la durée de rotation réglée (Réglages
// > Programme, domain/settings via data.settings.rotationWeeks). Ne
// déclenche rien tout seul : sert juste à afficher la proposition, qui
// reste soumise à validation (voir domain/rotation.js).
export function isRotationDue(program, rotationWeeks, now = new Date()) {
  if (!program || program.templateIds.length === 0) return false
  return getWeeksSinceBlockStart(program, now) >= rotationWeeks
}
