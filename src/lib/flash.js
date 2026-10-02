const FLASH_CLASS = 'screen-flash'
const FLASH_DURATION_MS = 600

// Flash visuel bref (voir .screen-flash dans styles/global.css), en
// complément du son et de la vibration à la fin du repos : plus de chances
// d'être perçu si le téléphone est en silencieux et posé sur une table hors
// de portée de la main. Simple classe CSS sur <body> (pas un composant React
// à monter depuis chaque écran) pour fonctionner quel que soit l'écran
// affiché pendant le repos - même logique que lib/alarm.js et
// lib/haptics.js, appelés comme de simples effets de bord depuis
// hooks/useRestTimer.js.
export function flashScreen() {
  document.body.classList.remove(FLASH_CLASS)
  // Force le navigateur à "voir" le retrait avant de rajouter la classe, pour
  // que l'animation CSS reparte bien du début si un flash précédent est
  // encore en cours (ex. plusieurs repos rapprochés).
  void document.body.offsetWidth
  document.body.classList.add(FLASH_CLASS)
  setTimeout(() => document.body.classList.remove(FLASH_CLASS), FLASH_DURATION_MS)
}
