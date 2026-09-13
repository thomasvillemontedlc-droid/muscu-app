import { createId } from '../storage/ids.js'
import { getOrCreateExercise } from './exercises.js'

// Modèles fournis par l'utilisateur (modeles-seances.md). "sets"/"reps" ne
// sont utilisés qu'au tout premier remplissage (voir createTemplateFromModel
// et domain/sessions.js#startSessionFromTemplate) : dès qu'une vraie séance
// a été faite, la dernière performance prend le relais comme pour n'importe
// quelle séance type. reps: 0 pour "de max" (Tractions, sans cible
// chiffrée) ; les durées en secondes ("au temps") utilisent le milieu de la
// fourchette indiquée (30-45s -> 40s).
export const TEMPLATE_STRUCTURES = [
  {
    key: 'ppl',
    label: 'Structure A — PPL (Push / Pull / Jambes)',
    models: [
      {
        name: 'Modèle Push A',
        exercises: [
          { name: 'Développé couché barre', sets: 4, reps: 8 },
          { name: 'Développé militaire haltères assis', sets: 3, reps: 10 },
          { name: 'Écarté couché haltères', sets: 3, reps: 12 },
          { name: 'Élévations latérales haltères', sets: 3, reps: 15 },
          { name: 'Extension triceps à la poulie haute (corde)', sets: 3, reps: 12 },
        ],
      },
      {
        name: 'Modèle Push B',
        exercises: [
          { name: 'Développé incliné haltères', sets: 4, reps: 10 },
          { name: 'Développé à la machine convergente', sets: 3, reps: 10 },
          { name: 'Écarté à la poulie vis-à-vis', sets: 3, reps: 12 },
          { name: 'Élévations frontales haltères', sets: 3, reps: 12 },
          { name: 'Dips machine', sets: 3, reps: 10 },
        ],
      },
      {
        name: 'Modèle Pull A',
        exercises: [
          { name: 'Tractions pronation', sets: 4, reps: 0 },
          { name: 'Rowing barre buste penché', sets: 3, reps: 10 },
          { name: 'Tirage horizontal poulie basse', sets: 3, reps: 12 },
          { name: 'Curl barre EZ', sets: 3, reps: 10 },
          { name: 'Face pull', sets: 3, reps: 15 },
        ],
      },
      {
        name: 'Modèle Pull B',
        exercises: [
          { name: 'Tirage vertical poulie haute (prise neutre)', sets: 4, reps: 10 },
          { name: 'Rowing haltère unilatéral', sets: 3, reps: 10 },
          { name: 'Rowing T-bar', sets: 3, reps: 10 },
          { name: 'Curl marteau', sets: 3, reps: 12 },
          { name: 'Oiseau haltères', sets: 3, reps: 15 },
        ],
      },
      {
        name: 'Modèle Jambes A',
        exercises: [
          { name: 'Squat barre', sets: 4, reps: 8 },
          { name: 'Leg curl allongé', sets: 3, reps: 12 },
          { name: 'Presse à cuisses', sets: 3, reps: 12 },
          { name: 'Extension mollets debout à la machine', sets: 4, reps: 15 },
          { name: 'Gainage planche', sets: 3, reps: 40 },
        ],
      },
      {
        name: 'Modèle Jambes B',
        exercises: [
          { name: 'Fentes bulgares', sets: 3, reps: 10 },
          { name: 'Soulevé de terre roumain', sets: 4, reps: 8 },
          { name: 'Hip thrust barre', sets: 3, reps: 10 },
          { name: 'Leg extension', sets: 3, reps: 12 },
          { name: 'Extension mollets assis', sets: 4, reps: 15 },
        ],
      },
    ],
  },
  {
    key: 'split',
    label: 'Structure B — Split par groupe musculaire',
    models: [
      {
        name: 'Modèle Pecs',
        exercises: [
          { name: 'Développé couché barre', sets: 4, reps: 8 },
          { name: 'Développé incliné haltères', sets: 3, reps: 10 },
          { name: 'Écarté couché haltères', sets: 3, reps: 12 },
          { name: 'Pec deck (butterfly)', sets: 3, reps: 15 },
          { name: 'Dips sur banc', sets: 3, reps: 12 },
        ],
      },
      {
        name: 'Modèle Dos',
        exercises: [
          { name: 'Tractions pronation', sets: 4, reps: 0 },
          { name: 'Rowing barre buste penché', sets: 4, reps: 8 },
          { name: 'Tirage vertical poulie haute (pronation)', sets: 3, reps: 10 },
          { name: 'Rowing haltère unilatéral', sets: 3, reps: 10 },
          { name: 'Face pull', sets: 3, reps: 15 },
        ],
      },
      {
        name: 'Modèle Épaules',
        exercises: [
          { name: 'Développé militaire barre debout', sets: 4, reps: 8 },
          { name: 'Élévations latérales haltères', sets: 4, reps: 15 },
          { name: 'Élévations frontales barre', sets: 3, reps: 12 },
          { name: 'Oiseau à la poulie vis-à-vis', sets: 3, reps: 15 },
          { name: 'Shrugs haltères', sets: 3, reps: 12 },
        ],
      },
      {
        name: 'Modèle Jambes',
        exercises: [
          { name: 'Squat barre', sets: 4, reps: 8 },
          { name: 'Soulevé de terre roumain', sets: 3, reps: 10 },
          { name: 'Presse à cuisses', sets: 3, reps: 12 },
          { name: 'Leg curl allongé', sets: 3, reps: 12 },
          { name: 'Extension mollets debout à la machine', sets: 4, reps: 15 },
        ],
      },
      {
        name: 'Modèle Bras',
        exercises: [
          { name: 'Curl barre EZ', sets: 4, reps: 10 },
          { name: 'Extension triceps à la poulie haute (barre)', sets: 4, reps: 10 },
          { name: 'Curl marteau', sets: 3, reps: 12 },
          { name: 'Barre au front (skull crusher)', sets: 3, reps: 10 },
          { name: 'Curl à la poulie basse', sets: 3, reps: 12 },
          { name: 'Kickback haltère', sets: 3, reps: 12 },
        ],
      },
      {
        name: 'Modèle Abdos',
        exercises: [
          { name: 'Relevé de jambes suspendu', sets: 3, reps: 12 },
          { name: 'Gainage planche', sets: 3, reps: 40 },
          { name: 'Russian twist', sets: 3, reps: 20 },
          { name: 'Roulette abdominale (ab wheel)', sets: 3, reps: 10 },
          { name: 'Extension lombaire au banc', sets: 3, reps: 12 },
        ],
      },
    ],
  },
  {
    key: 'real',
    label: 'Mes séances réelles',
    models: [
      {
        // "Oiseau haltères (optionnel, à cocher/décocher selon le temps)"
        // dans mes-seances-reelles.md : la parenthèse est une note d'usage
        // ("à faire si le temps le permet"), pas le nom de l'exercice —
        // ajouté normalement, à retirer à la main les jours où on le saute
        // (comme n'importe quel exercice d'une séance type).
        name: 'Pull (réel)',
        exercises: [
          { name: 'Tractions', sets: 3, reps: 12 },
          { name: 'Tirage horizontal poulie basse', sets: 3, reps: 12 },
          { name: 'Tirage vertical poulie haute', sets: 3, reps: 12 },
          { name: 'Curl marteau (haltère ou machine)', sets: 3, reps: 12 },
          { name: 'Curl biceps à la poulie basse', sets: 3, reps: 12 },
        ],
      },
      {
        name: 'Push (réel)',
        exercises: [
          { name: 'Développé couché barre', sets: 3, reps: 8 },
          { name: 'Développé incliné barre', sets: 3, reps: 8 },
          { name: 'Écarté à la poulie vis-à-vis', sets: 3, reps: 15 },
          { name: 'Dips machine', sets: 3, reps: 12 },
          { name: 'Extension nuque haltère', sets: 3, reps: 12 },
          { name: 'Extension triceps à la poulie haute', sets: 3, reps: 12 },
          { name: 'Oiseau haltères', sets: 3, reps: 15 },
        ],
      },
      {
        name: 'Jambes (réel)',
        exercises: [
          { name: 'Presse à cuisses', sets: 3, reps: 12 },
          { name: 'Fentes marchées', sets: 3, reps: 15 },
          { name: 'Leg curl assis', sets: 3, reps: 11 },
          { name: 'Extension mollets assis', sets: 3, reps: 15 },
          { name: 'Machine adducteurs (serrer)', sets: 3, reps: 15 },
          { name: 'Machine abducteurs (écarter)', sets: 3, reps: 15 },
          { name: 'Gainage planche', sets: 3, reps: 40 },
        ],
      },
    ],
  },
]

// Crée un template à partir d'un modèle prédéfini : chaque exercice est
// retrouvé ou créé dans le catalogue (même mécanique qu'un ajout manuel,
// voir domain/exercises.js#getOrCreateExercise), puis son nombre de
// séries/répétitions par défaut est mémorisé sur le template
// (defaultSets), consulté une seule fois par exercice par
// startSessionFromTemplate — tant qu'aucune vraie séance n'a encore été
// faite avec lui. La séance type qui en résulte est ensuite normale :
// modifiable, renommable, sans aucune trace de son origine.
export function createTemplateFromModel(templates, exercises, model) {
  let currentExercises = exercises
  const exerciseIds = []
  const defaultSets = {}

  for (const spec of model.exercises) {
    const { exercise, exercises: updated } = getOrCreateExercise(currentExercises, spec.name)
    currentExercises = updated
    exerciseIds.push(exercise.id)
    defaultSets[exercise.id] = Array.from({ length: spec.sets }, () => ({ weight: 0, reps: spec.reps }))
  }

  const now = new Date().toISOString()
  const template = {
    id: createId(),
    name: model.name,
    exerciseIds,
    defaultSets,
    createdAt: now,
    updatedAt: now,
  }

  return { template, templates: [...templates, template], exercises: currentExercises }
}
