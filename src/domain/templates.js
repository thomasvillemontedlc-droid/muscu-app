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
