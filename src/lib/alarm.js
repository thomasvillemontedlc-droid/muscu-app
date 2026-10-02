let sharedContext = null

// Recrée le contexte s'il n'existe pas encore, ou s'il a fini par passer en
// 'closed' (certains navigateurs mobiles ferment l'AudioContext après une
// longue mise en arrière-plan plutôt que de juste le suspendre) - un
// contexte fermé ne peut plus jamais être repris via resume().
function getContext() {
  if (!sharedContext || sharedContext.state === 'closed') {
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

// Retente un réveil du contexte à chaque retour de l'app au premier plan
// (voir hooks/useRestTimer.js) : les navigateurs mobiles suspendent
// l'AudioContext quand l'app passe en arrière-plan et ne le reprennent pas
// tout seuls au retour - sans cette tentative proactive, le prochain
// playAlarmBeep() resterait silencieux pour de bon après un premier
// aller-retour en arrière-plan.
export function resumeAudioIfNeeded() {
  if (sharedContext && sharedContext.state === 'suspended') sharedContext.resume()
}

// Trois bips générés (oscillateur), pas de fichier audio à embarquer :
// fonctionne hors-ligne par construction. `await` la reprise du contexte
// avant de programmer les bips (plutôt que de lancer resume() sans l'attendre)
// : tant que le contexte n'est pas réellement 'running', ctx.currentTime ne
// redémarre pas et des oscillateurs programmés dessus restent muets sans
// erreur - c'est ce qui rendait l'alarme silencieuse après un retour en
// arrière-plan (voir le commentaire de resumeAudioIfNeeded ci-dessus).
export async function playAlarmBeep() {
  const ctx = getContext()
  if (ctx.state === 'suspended') await ctx.resume()
  if (ctx.state !== 'running') return

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
