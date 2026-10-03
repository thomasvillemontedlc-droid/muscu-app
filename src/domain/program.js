import { getFirstVariantModel } from './rotation.js'
import { getSessionStatus } from './sessions.js'

const WEEK_MS = 7 * 24 * 3600 * 1000

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

// Index (0 ou 1) du programme actif selon l'alternance : 0 si l'alternance
// est désactivée (voir alternation.enabled), si le programme 2 n'existe pas
// (rien à alterner), ou si elle n'a jamais démarré (startDate null). Une
// fois tout ça en place, bascule tous les `periodWeeks` à partir de
// startDate.
export function getActiveProgramIndex(alternation, programs, now = new Date()) {
  if (!alternation.enabled || !programs[1] || !alternation.startDate) return 0
  const weeksElapsed = Math.floor((now - new Date(alternation.startDate)) / WEEK_MS)
  return Math.floor(weeksElapsed / alternation.periodWeeks) % 2
}

// Semaines restantes avant la prochaine bascule (toujours periodWeeks tant
// que l'alternance n'a pas démarré : le compte repart de zéro dès que
// startDate est posée, au moment où le programme 2 reçoit sa première
// séance - voir components/ProgramComposer.jsx).
export function getWeeksUntilSwitch(alternation, now = new Date()) {
  if (!alternation.startDate) return alternation.periodWeeks
  const weeksElapsed = Math.floor((now - new Date(alternation.startDate)) / WEEK_MS)
  const intoCurrentPeriod = weeksElapsed % alternation.periodWeeks
  return alternation.periodWeeks - intoCurrentPeriod
}

// Aperçu de l'alternance sur 12 semaines à partir d'une période donnée (1
// ou 2 selon le programme), indépendant de toute date réelle - pour montrer
// le RYTHME avant même que le programme 2 n'existe (voir ProgramPage.jsx).
export function getAlternationPreview(periodWeeks, weekCount = 12) {
  return Array.from({ length: weekCount }, (_, i) => (Math.floor(i / periodWeeks) % 2) + 1)
}

// Prochain template à proposer : celui à la position (nb déjà fait cette
// semaine) dans l'ordre du programme ACTIF (voir getActiveProgramIndex),
// qui reboucle au-delà de sa longueur. null si ce programme est vide.
export function getNextProgramTemplateId(alternation, programs, sessions, now = new Date()) {
  const program = programs[getActiveProgramIndex(alternation, programs, now)]
  if (!program || program.templateIds.length === 0) return null
  const completed = getCompletedThisWeek(program, sessions)
  return program.templateIds[completed % program.templateIds.length]
}

export function addTemplateToProgram(program, templateId) {
  if (program.templateIds.includes(templateId)) return program
  return { ...program, templateIds: [...program.templateIds, templateId] }
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

// Propose, pour chaque séance du programme 1, de quoi composer le
// programme 2 (voir components/ProgramComposer.jsx) : la première variante
// trouvée par le ciblage musculaire de domain/rotation.js (même principe
// que l'ancienne rotation - Push A <-> Push B...), sinon la séance
// elle-même telle quelle (pas de variante disponible, pas de doublon
// inventé). `source` suit le format attendu par ProgramComposer : {kind:
// 'model', model} crée une nouvelle séance depuis un modèle prédéfini,
// {kind: 'existing', templateId} réutilise une séance déjà existante.
export function getAlternateProgramProposal(program1, templates, exercises) {
  return program1.templateIds
    .map((templateId) => templates.find((t) => t.id === templateId))
    .filter(Boolean)
    .map((template) => {
      const currentNames = template.exerciseIds
        .map((id) => exercises.find((e) => e.id === id)?.name)
        .filter(Boolean)
      const variant = getFirstVariantModel(currentNames)

      if (variant) {
        return { key: template.id, label: variant.name, source: { kind: 'model', model: variant } }
      }
      return { key: template.id, label: template.name, source: { kind: 'existing', templateId: template.id } }
    })
}

// "Prochaine séance" choisie à la main (ex. depuis les suggestions de
// Progression) : prime sur le programme hebdomadaire et sur l'habitude du
// jour, jusqu'à ce qu'une séance de ce template soit lancée après le choix.
// Pas de nettoyage à faire au lancement : le choix s'éteint tout seul dès
// qu'une séance plus récente existe pour ce template.
export function setNextTemplate(templateId, now = new Date()) {
  return { templateId, setAt: now.toISOString() }
}

export function getNextTemplateOverrideId(nextTemplate, sessions, templates) {
  if (!nextTemplate?.templateId) return null
  if (!templates.some((t) => t.id === nextTemplate.templateId)) return null
  const alreadyStarted = sessions.some(
    (s) => s.templateId === nextTemplate.templateId && s.date >= nextTemplate.setAt,
  )
  return alreadyStarted ? null : nextTemplate.templateId
}
