let sharedContext = null

function getContext() {
  if (!sharedContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    sharedContext = new AudioContextClass()
  }
  return sharedContext
}

// À appeler depuis un geste utilisateur (ex: clic sur "Valider la série")
// pour débloquer l'audio sur mobile avant que l'alarme n'ait besoin de
// sonner plus tard, sans interaction directe à ce moment-là.
export function unlockAudio() {
  const ctx = getContext()
  if (ctx.state === 'suspended') ctx.resume()
}

// Trois bips générés (oscillateur), pas de fichier audio à embarquer :
// fonctionne hors-ligne par construction.
export function playAlarmBeep() {
  const ctx = getContext()
  if (ctx.state === 'suspended') ctx.resume()

  const now = ctx.currentTime
  const beepDuration = 0.15
  const gap = 0.1

  for (let i = 0; i < 3; i++) {
    const start = now + i * (beepDuration + gap)
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gainNode.gain.setValueAtTime(0.001, start)
    gainNode.gain.exponentialRampToValueAtTime(0.3, start + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + beepDuration)
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + beepDuration)
  }
}
