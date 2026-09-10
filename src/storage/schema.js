export const SCHEMA_VERSION = 2

export function createEmptyData() {
  return {
    version: SCHEMA_VERSION,
    exercises: [],
    templates: [],
    sessions: [],
  }
}
