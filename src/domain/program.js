import { getFirstVariantModel } from './rotation.js'
import { RECOVERY_HOURS } from './recovery.js'
import { getInProgressSession, getSessionStatus } from './sessions.js'

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

// Séance "récente" : faite il y a moins que le délai de récupération
// musculaire (domain/recovery.js) - on évite de la reproposer tout de suite.
const RECENT_HOURS = RECOVERY_HOURS
const HOUR_MS = 3600 * 1000
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

// templateIds du programme ACTIF (alternance comprise, voir
// getActiveProgramIndex), [] s'il n'y en a pas.
export function getActiveProgramTemplateIds(alternation, programs, now = new Date()) {
  return programs[getActiveProgramIndex(alternation, programs, now)]?.templateIds ?? []
}

// Prochaine séance du programme, selon QUELLES séances ont été faites (pas
// seulement combien) - fonction pure. `templateIds` : programme actif, dans
// l'ordre. Pour chaque séance : doneThisWeek (entamée depuis lundi 00:00)
// et lastDoneAt (dernière fois entamée, toutes semaines confondues). La
// séance en cours (démarrée, pas terminée) ne compte pas comme faite.
// 1. Candidats : séances pas encore faites cette semaine, dans l'ordre du
//    programme ; semaine bouclée -> toutes, de la plus anciennement faite à
//    la plus récente (jamais faite en premier).
// 2. Le premier candidat jamais fait ou fait il y a plus de RECENT_HOURS.
// 3. Sinon (tous récents) : le candidat fait il y a le plus longtemps.
// Renvoie { templateId, reason } (reason : explication courte affichée sous
// la séance mise en avant), ou null si le programme est vide.
export function getNextProgramSuggestion(templateIds, sessions, templates, now = new Date()) {
  if (templateIds.length === 0) return null

  const inProgress = getInProgressSession(sessions)
  const started = sessions.filter((s) => s !== inProgress && getSessionStatus(s) !== 'not-done')
  const weekStart = getWeekStart(now)
  const nameOf = (id) => templates.find((t) => t.id === id)?.name ?? 'Séance supprimée'

  const stats = templateIds.map((templateId) => {
    const dates = started.filter((s) => s.templateId === templateId).map((s) => new Date(s.date))
    const lastDoneAt = dates.length > 0 ? new Date(Math.max(...dates)) : null
    return { templateId, lastDoneAt, doneThisWeek: dates.some((d) => d >= weekStart) }
  })
  const isRecent = (stat) => stat.lastDoneAt != null && now - stat.lastDoneAt < RECENT_HOURS * HOUR_MS

  const notDoneThisWeek = stats.filter((stat) => !stat.doneThisWeek)
  const weekComplete = notDoneThisWeek.length === 0
  const candidates = weekComplete
    ? [...stats].sort((a, b) => (a.lastDoneAt ?? -Infinity) - (b.lastDoneAt ?? -Infinity))
    : notDoneThisWeek

  const firstRested = candidates.find((stat) => !isRecent(stat))
  const chosen = firstRested ?? candidates.reduce((oldest, stat) => (stat.lastDoneAt < oldest.lastDoneAt ? stat : oldest))

  // Raison : contexte de la semaine, puis ce qui a orienté le choix.
  const parts = []
  if (weekComplete) {
    parts.push('Toutes les séances de la semaine sont faites')
  } else {
    const doneThisWeek = stats.filter((stat) => stat.doneThisWeek)
    if (doneThisWeek.length > 0) {
      const latest = doneThisWeek.reduce((a, b) => (b.lastDoneAt > a.lastDoneAt ? b : a))
      parts.push(`${nameOf(latest.templateId)} faite ${formatDay(latest.lastDoneAt, now)}`)
      const remaining = notDoneThisWeek.map((stat) => nameOf(stat.templateId))
      parts.push(`${joinNames(remaining)} ${remaining.length > 1 ? 'restantes' : 'restante'} cette semaine`)
    } else {
      parts.push('Rien de fait cette semaine')
    }
  }
  if (!firstRested) {
    parts.push(`toutes faites il y a moins de ${RECENT_HOURS} h, ${nameOf(chosen.templateId)} la plus ancienne`)
  } else {
    const skipped = candidates.slice(0, candidates.indexOf(chosen))
    for (const stat of skipped) parts.push(`${nameOf(stat.templateId)} faite ${formatDay(stat.lastDoneAt, now)}, trop récent`)
    if (weekComplete && skipped.length === 0) parts.push(`${nameOf(chosen.templateId)} la plus ancienne`)
  }

  return { templateId: chosen.templateId, reason: parts.join(' · ') }
}

// "aujourd'hui", "hier", le jour de la semaine (moins de 7 jours), sinon
// "il y a N jours" - en jours calendaires locaux.
function formatDay(date, now) {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / (24 * HOUR_MS))
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return WEEKDAYS[date.getDay()]
  return `il y a ${days} jours`
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// "A", "A et B", "A, B et C".
function joinNames(names) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`
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
