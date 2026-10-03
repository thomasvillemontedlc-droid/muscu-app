export const SCHEMA_VERSION = 4

export function createEmptyData() {
  return {
    version: SCHEMA_VERSION,
    exercises: [],
    templates: [],
    sessions: [],
    // Jusqu'à deux programmes hebdomadaires (domain/program.js) qui
    // alternent si le second existe (voir `alternation` ci-dessous).
    // programs[0] ("Programme 1") est toujours présent ; programs[1]
    // ("Programme 2") vaut null tant qu'il n'a pas été composé - un seul
    // programme actif dans ce cas, pas d'alternance.
    programs: [{ templateIds: [] }, null],
    // Fréquence d'alternance entre les deux programmes une fois que les
    // deux existent : periodWeeks = nombre de semaines passées sur chacun
    // avant de basculer. startDate ancre le calcul des semaines écoulées,
    // posée au moment où le programme 2 est composé pour la première fois
    // (avant ça, un seul programme existe, rien à alterner).
    alternation: { periodWeeks: 4, startDate: null },
    // Séance choisie à la main comme "prochaine séance" (domain/program.js
    // #getNextTemplateOverrideId) : {templateId, setAt} ou null. Optionnel,
    // absent des données plus anciennes (traité comme null).
    nextTemplate: null,
    settings: {},
  }
}
