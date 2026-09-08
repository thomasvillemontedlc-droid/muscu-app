let sentinel = null

// Garde l'écran allumé pendant le repos, pour que l'alarme ait de bonnes
// chances de se déclencher (un téléphone qui s'éteint tout seul suspend le
// JS en arrière-plan). Silencieux si l'API n'est pas supportée.
export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return
  try {
    sentinel = await navigator.wakeLock.request('screen')
  } catch {
    sentinel = null
  }
}

export function releaseWakeLock() {
  sentinel?.release()
  sentinel = null
}
