export const SCHEMA_VERSION = 3

export function createEmptyData() {
  return {
    version: SCHEMA_VERSION,
    exercises: [],
    templates: [],
    sessions: [],
    // Programme hebdomadaire tournant (domain/program.js) : un seul à la
    // fois, templateIds dans l'ordre voulu. blockStartDate marque le début
    // du bloc d'exercices en cours, pour savoir quand proposer la rotation
    // (domain/rotation.js) ; null tant qu'aucun template n'y a été ajouté.
    weeklyProgram: { templateIds: [], blockStartDate: null },
    settings: {
      // Nombre de semaines avant de proposer une rotation des exercices du
      // programme (voir Réglages > Programme). Paramétrable : 2, 3, 4 ou 6.
      rotationWeeks: 4,
    },
  }
}
