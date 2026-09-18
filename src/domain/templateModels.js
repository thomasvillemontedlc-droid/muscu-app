import { createId } from '../storage/ids.js'
import { getOrCreateExercise } from './exercises.js'

// Modèles fournis par l'utilisateur (modeles-seances.md). "sets"/"reps" ne
// sont utilisés qu'au tout premier remplissage (voir createTemplateFromModel
// et domain/sessions.js#startSessionFromTemplate) : dès qu'une vraie séance
// a été faite, la dernière performance prend le relais comme pour n'importe
// quelle séance type. reps: 0 pour "de max" (Tractions, sans cible
// chiffrée) ; les durées en secondes ("au temps") utilisent le milieu de la
// fourchette indiquée (30-45s -> 40s).
// Modèles Pecs/Dos/Épaules/Jambes de la Structure B, réutilisés tels quels
// par la Structure E (5 séances/semaine, voir structure-frequence.md) qui
// reprend ces quatre-là et remplace Bras+Abdos séparés par un seul modèle
// fusionné — extraits ici pour ne définir leurs exercices qu'une fois.
const pecsModel = {
  name: 'Modèle Pecs',
  exercises: [
    { name: 'Développé couché barre', sets: 4, reps: 8 },
    { name: 'Développé incliné haltères', sets: 3, reps: 10 },
    { name: 'Écarté couché haltères', sets: 3, reps: 12 },
    { name: 'Pec deck (butterfly)', sets: 3, reps: 15 },
    { name: 'Dips sur banc', sets: 3, reps: 12 },
  ],
}

const dosModel = {
  name: 'Modèle Dos',
  exercises: [
    { name: 'Tractions pronation', sets: 4, reps: 0 },
    { name: 'Rowing barre buste penché', sets: 4, reps: 8 },
    { name: 'Tirage vertical poulie haute (pronation)', sets: 3, reps: 10 },
    { name: 'Rowing haltère unilatéral', sets: 3, reps: 10 },
    { name: 'Face pull', sets: 3, reps: 15 },
  ],
}

const epaulesModel = {
  name: 'Modèle Épaules',
  exercises: [
    { name: 'Développé militaire barre debout', sets: 4, reps: 8 },
    { name: 'Élévations latérales haltères', sets: 4, reps: 15 },
    { name: 'Élévations frontales barre', sets: 3, reps: 12 },
    { name: 'Oiseau à la poulie vis-à-vis', sets: 3, reps: 15 },
    { name: 'Shrugs haltères', sets: 3, reps: 12 },
  ],
}

const jambesSplitModel = {
  name: 'Modèle Jambes',
  exercises: [
    { name: 'Squat barre', sets: 4, reps: 8 },
    { name: 'Soulevé de terre roumain', sets: 3, reps: 10 },
    { name: 'Presse à cuisses', sets: 3, reps: 12 },
    { name: 'Leg curl allongé', sets: 3, reps: 12 },
    { name: 'Extension mollets debout à la machine', sets: 4, reps: 15 },
  ],
}

export const TEMPLATE_STRUCTURES = [
  {
    key: 'ppl',
    label: 'Structure A — PPL (Push / Pull / Jambes)',
    models: [
      {
        name: 'Modèle Push A',
        subtitle: 'Barres & haltères',
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
        subtitle: 'Machines & poulies',
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
        subtitle: 'Tractions & barre',
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
        subtitle: 'Haltères unilatéral',
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
        subtitle: 'Squat & machines',
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
        subtitle: 'Hanches & ischios',
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
      pecsModel,
      dosModel,
      epaulesModel,
      jambesSplitModel,
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
    label: 'Structure 3 séances/semaine',
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
  {
    key: 'fullbody',
    label: 'Structure C — Full Body (2 séances par semaine)',
    models: [
      {
        name: 'Modèle Full Body A',
        exercises: [
          { name: 'Squat barre', sets: 3, reps: 10 },
          { name: 'Développé couché barre', sets: 3, reps: 10 },
          { name: 'Rowing barre buste penché', sets: 3, reps: 10 },
          { name: 'Développé militaire haltères assis', sets: 3, reps: 10 },
          { name: 'Curl marteau', sets: 2, reps: 12 },
          { name: 'Gainage planche', sets: 3, reps: 40 },
        ],
      },
      {
        name: 'Modèle Full Body B',
        exercises: [
          { name: 'Soulevé de terre roumain', sets: 3, reps: 10 },
          { name: 'Développé incliné haltères', sets: 3, reps: 10 },
          { name: 'Tirage vertical poulie haute (pronation)', sets: 3, reps: 10 },
          { name: 'Élévations latérales haltères', sets: 3, reps: 15 },
          { name: 'Extension triceps à la poulie haute (corde)', sets: 2, reps: 12 },
          { name: 'Relevé de jambes suspendu', sets: 3, reps: 12 },
        ],
      },
    ],
  },
  {
    key: 'upperlower',
    label: 'Structure D — Upper / Lower (4 séances par semaine)',
    models: [
      {
        name: 'Modèle Haut du corps A',
        exercises: [
          { name: 'Développé couché barre', sets: 4, reps: 8 },
          { name: 'Rowing barre buste penché', sets: 4, reps: 8 },
          { name: 'Développé militaire haltères assis', sets: 3, reps: 10 },
          { name: 'Tirage horizontal poulie basse', sets: 3, reps: 10 },
          { name: 'Curl barre EZ', sets: 2, reps: 12 },
          { name: 'Extension triceps à la poulie haute (corde)', sets: 2, reps: 12 },
        ],
      },
      {
        name: 'Modèle Bas du corps A',
        exercises: [
          { name: 'Squat barre', sets: 4, reps: 8 },
          { name: 'Soulevé de terre roumain', sets: 3, reps: 10 },
          { name: 'Presse à cuisses', sets: 3, reps: 12 },
          { name: 'Extension mollets debout à la machine', sets: 3, reps: 15 },
          { name: 'Gainage planche', sets: 3, reps: 40 },
        ],
      },
      {
        name: 'Modèle Haut du corps B',
        exercises: [
          { name: 'Développé incliné haltères', sets: 4, reps: 10 },
          { name: 'Tractions pronation', sets: 4, reps: 0 },
          { name: 'Élévations latérales haltères', sets: 3, reps: 15 },
          { name: 'Rowing haltère unilatéral', sets: 3, reps: 10 },
          { name: 'Curl marteau', sets: 2, reps: 12 },
          { name: 'Barre au front (skull crusher)', sets: 2, reps: 10 },
        ],
      },
      {
        name: 'Modèle Bas du corps B',
        exercises: [
          { name: 'Fentes bulgares', sets: 3, reps: 10 },
          { name: 'Hip thrust barre', sets: 4, reps: 10 },
          { name: 'Leg curl allongé', sets: 3, reps: 12 },
          { name: 'Leg extension', sets: 3, reps: 12 },
          { name: 'Extension mollets assis', sets: 3, reps: 15 },
        ],
      },
    ],
  },
  {
    key: 'five',
    label: 'Structure E — 5 séances par semaine (split détaillé)',
    models: [
      pecsModel,
      dosModel,
      epaulesModel,
      jambesSplitModel,
      {
        name: 'Modèle Bras + Abdos',
        exercises: [
          { name: 'Curl barre EZ', sets: 3, reps: 10 },
          { name: 'Extension triceps à la poulie haute (corde)', sets: 3, reps: 10 },
          { name: 'Curl marteau', sets: 3, reps: 12 },
          { name: 'Barre au front (skull crusher)', sets: 3, reps: 10 },
          { name: 'Gainage planche', sets: 3, reps: 40 },
          { name: 'Relevé de jambes suspendu', sets: 3, reps: 12 },
        ],
      },
    ],
  },
  {
    key: 'lowerfocus',
    label: 'Structure G — Focus bas du corps',
    models: [
      {
        name: 'Modèle Focus bas du corps A',
        exercises: [
          { name: 'Hip thrust barre', sets: 4, reps: 12 },
          { name: 'Fentes bulgares', sets: 4, reps: 10 },
          { name: 'Leg curl allongé', sets: 3, reps: 12 },
          { name: 'Abduction hanche à la machine', sets: 3, reps: 15 },
          { name: 'Squat sumo', sets: 3, reps: 10 },
          { name: 'Élévations latérales haltères', sets: 2, reps: 15 },
          { name: 'Gainage planche', sets: 2, reps: 40 },
        ],
      },
      {
        name: 'Modèle Focus bas du corps B',
        exercises: [
          { name: 'Soulevé de terre roumain', sets: 4, reps: 10 },
          { name: 'Presse à cuisses', sets: 4, reps: 12 },
          { name: 'Kickback fessier à la poulie', sets: 3, reps: 15 },
          { name: 'Adduction à la poulie basse', sets: 3, reps: 15 },
          { name: 'Extension mollets debout à la machine', sets: 3, reps: 15 },
          { name: 'Développé militaire haltères assis', sets: 2, reps: 10 },
        ],
      },
    ],
  },
]

// Fréquence hebdomadaire (nombre de séances/semaine) -> clé(s) de
// TEMPLATE_STRUCTURES adaptées, voir structure-frequence.md ("Comportement
// attendu dans l'app"). Plusieurs clés = l'utilisateur choisit laquelle
// suivre (ex. à 6/semaine : PPL x2 ou split complet, toutes deux déjà
// pensées pour cette fréquence).
export const FREQUENCY_STRUCTURE_KEYS = {
  2: ['fullbody'],
  3: ['ppl', 'split'],
  4: ['upperlower'],
  5: ['five'],
  6: ['ppl', 'split'],
}

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
