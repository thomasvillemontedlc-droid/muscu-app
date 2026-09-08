export const SCHEMA_VERSION = 1

export function createEmptyData() {
  return {
    version: SCHEMA_VERSION,
    exercises: [],
    templates: [],
    sessions: [],
  }
}
