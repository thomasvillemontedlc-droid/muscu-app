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
