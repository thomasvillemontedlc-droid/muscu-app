import { createId } from '../storage/ids.js'

export function createTemplate(templates, name) {
  const now = new Date().toISOString()
  const template = {
    id: createId(),
    name: name.trim(),
    exerciseIds: [],
    createdAt: now,
    updatedAt: now,
  }
  return { template, templates: [...templates, template] }
}

export function updateTemplate(templates, templateId, changes) {
  return templates.map((t) =>
    t.id === templateId ? { ...t, ...changes, updatedAt: new Date().toISOString() } : t,
  )
}

export function deleteTemplate(templates, templateId) {
  return templates.filter((t) => t.id !== templateId)
}

export function getTemplateById(templates, templateId) {
  return templates.find((t) => t.id === templateId)
}

export function addExerciseToTemplate(templates, templateId, exerciseId) {
  const template = getTemplateById(templates, templateId)
  if (!template) return templates
  return updateTemplate(templates, templateId, {
    exerciseIds: [...template.exerciseIds, exerciseId],
  })
}

export function removeExerciseFromTemplate(templates, templateId, exerciseId) {
  const template = getTemplateById(templates, templateId)
  if (!template) return templates
  return updateTemplate(templates, templateId, {
    exerciseIds: template.exerciseIds.filter((id) => id !== exerciseId),
  })
}

export function moveExerciseInTemplate(templates, templateId, fromIndex, toIndex) {
  const template = getTemplateById(templates, templateId)
  if (!template) return templates

  const exerciseIds = [...template.exerciseIds]
  const [moved] = exerciseIds.splice(fromIndex, 1)
  exerciseIds.splice(toIndex, 0, moved)

  return updateTemplate(templates, templateId, { exerciseIds })
}

// Ordre pour l'écran d'accueil : en premier l'habitude claire du jour de la
// semaine (le template le plus souvent fait CE jour-là dans l'historique,
// seulement si aucun autre n'est à égalité), puis les autres par date de
// dernière séance décroissante, les templates jamais faits en dernier
// (dans leur ordre d'origine, entre eux).
export function sortTemplatesForToday(templates, sessions, referenceDate = new Date()) {
  const todayWeekday = referenceDate.getDay()

  const weekdayCounts = new Map()
  for (const session of sessions) {
    const weekday = new Date(session.date).getDay()
    const key = `${session.templateName}|${weekday}`
    weekdayCounts.set(key, (weekdayCounts.get(key) ?? 0) + 1)
  }

  let habitName = null
  let habitCount = 0
  let tie = false
  for (const template of templates) {
    const count = weekdayCounts.get(`${template.name}|${todayWeekday}`) ?? 0
    if (count === 0) continue
    if (count > habitCount) {
      habitName = template.name
      habitCount = count
      tie = false
    } else if (count === habitCount) {
      tie = true
    }
  }
  if (tie) habitName = null

  const lastDoneByName = new Map()
  for (const session of sessions) {
    const previous = lastDoneByName.get(session.templateName)
    if (!previous || session.date > previous) lastDoneByName.set(session.templateName, session.date)
  }

  const rest = templates.filter((t) => t.name !== habitName)
  rest.sort((a, b) => {
    const dateA = lastDoneByName.get(a.name)
    const dateB = lastDoneByName.get(b.name)
    if (dateA && dateB) return dateB.localeCompare(dateA)
    if (dateA) return -1
    if (dateB) return 1
    return 0
  })

  const habitTemplate = templates.find((t) => t.name === habitName)
  return habitTemplate ? [habitTemplate, ...rest] : rest
}

// --- Actions groupées (sélection multiple sur "Mes séances enregistrées") ---
// Chaque fonction ne touche QUE les templates dont l'id est dans
// `templateIds` ; les autres sont rendus tels quels.

// Supprime plusieurs séances types d'un coup, et nettoie ce qui pointait
// dessus : leurs ids dans tous les programmes (data.programs) et le choix
// manuel "Prochaine séance" (data.nextTemplate). L'historique
// (data.sessions) n'est jamais touché : chaque séance passée garde son
// templateName.
export function deleteTemplates(data, templateIds) {
  const ids = new Set(templateIds)
  let templates = data.templates
  for (const id of ids) templates = deleteTemplate(templates, id)
  return {
    ...data,
    templates,
    programs: data.programs.map((program) =>
      program ? { ...program, templateIds: program.templateIds.filter((id) => !ids.has(id)) } : program,
    ),
    nextTemplate: ids.has(data.nextTemplate?.templateId) ? null : data.nextTemplate,
  }
}

// Ajoute l'exercice à la fin de chaque séance sélectionnée qui ne le
// contient pas déjà.
export function addExerciseToTemplates(templates, templateIds, exerciseId) {
  return mapSelected(templates, templateIds, (t) =>
    t.exerciseIds.includes(exerciseId) ? t : { ...t, exerciseIds: [...t.exerciseIds, exerciseId] },
  )
}

// Retire l'exercice de toutes les séances sélectionnées (et ses
// séries/répétitions par défaut, devenues sans objet).
export function removeExerciseFromTemplates(templates, templateIds, exerciseId) {
  return mapSelected(templates, templateIds, (t) => {
    if (!t.exerciseIds.includes(exerciseId)) return t
    return withoutDefaults(
      { ...t, exerciseIds: t.exerciseIds.filter((id) => id !== exerciseId) },
      exerciseId,
    )
  })
}

// Remplace oldId par newId à la même position, en lui transmettant les
// séries/répétitions par défaut de l'ancien. Si la séance contient déjà
// newId, on retire simplement oldId (pas de doublon).
export function replaceExerciseInTemplates(templates, templateIds, oldId, newId) {
  if (oldId === newId) return templates
  return mapSelected(templates, templateIds, (t) => {
    if (!t.exerciseIds.includes(oldId)) return t
    if (t.exerciseIds.includes(newId)) {
      return withoutDefaults({ ...t, exerciseIds: t.exerciseIds.filter((id) => id !== oldId) }, oldId)
    }
    const next = { ...t, exerciseIds: t.exerciseIds.map((id) => (id === oldId ? newId : id)) }
    if (t.defaultSets?.[oldId]) next.defaultSets = { ...t.defaultSets, [newId]: t.defaultSets[oldId] }
    if (t.defaultSetsUpdatedAt?.[oldId]) {
      next.defaultSetsUpdatedAt = { ...t.defaultSetsUpdatedAt, [newId]: t.defaultSetsUpdatedAt[oldId] }
    }
    return withoutDefaults(next, oldId)
  })
}

// Fixe `setCount` séries de `reps` répétitions comme séries par défaut,
// pour un exercice précis (exerciseId) ou tous ceux de la séance
// (exerciseId null). defaultSetsUpdatedAt horodate ce choix : c'est ce qui
// permet à domain/sessions.js#startSessionFromTemplate de le préférer à la
// dernière performance tant qu'aucune séance plus récente ne l'a remplacé.
export function setDefaultSetsInTemplates(templates, templateIds, exerciseId, setCount, reps, now = new Date().toISOString()) {
  return mapSelected(templates, templateIds, (t) => {
    const targetIds = exerciseId == null ? t.exerciseIds : t.exerciseIds.filter((id) => id === exerciseId)
    if (targetIds.length === 0) return t
    const defaultSets = { ...t.defaultSets }
    const defaultSetsUpdatedAt = { ...t.defaultSetsUpdatedAt }
    for (const id of targetIds) {
      defaultSets[id] = Array.from({ length: setCount }, () => ({ weight: 0, reps }))
      defaultSetsUpdatedAt[id] = now
    }
    return { ...t, defaultSets, defaultSetsUpdatedAt }
  })
}

function mapSelected(templates, templateIds, transform) {
  const ids = new Set(templateIds)
  const now = new Date().toISOString()
  return templates.map((t) => {
    if (!ids.has(t.id)) return t
    const next = transform(t)
    return next === t ? t : { ...next, updatedAt: now }
  })
}

function withoutDefaults(template, exerciseId) {
  const next = { ...template }
  if (next.defaultSets?.[exerciseId]) {
    const { [exerciseId]: _sets, ...rest } = next.defaultSets
    next.defaultSets = rest
  }
  if (next.defaultSetsUpdatedAt?.[exerciseId]) {
    const { [exerciseId]: _date, ...rest } = next.defaultSetsUpdatedAt
    next.defaultSetsUpdatedAt = rest
  }
  return next
}
