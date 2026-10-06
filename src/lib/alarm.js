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
  const ctx = await getRunningContext()
  if (!ctx) return

  const now = ctx.currentTime
  const beepDuration = 0.15
  const gap = 0.1

  for (let i = 0; i < 3; i++) {
    scheduleBeep(ctx, now + i * (beepDuration + gap), beepDuration, 0.3, 880)
  }
}

// Décompte des 3 dernières secondes du repos ("bip, biip, biiip") : un bip
// par seconde, de plus en plus long et fort à l'approche de zéro, puis
// l'alarme de fin (playAlarmBeep). `secondsLeft` = 3, 2 ou 1.
const COUNTDOWN_BEEPS = {
  3: { duration: 0.08, gain: 0.12 },
  2: { duration: 0.15, gain: 0.2 },
  1: { duration: 0.25, gain: 0.3 },
}

export async function playCountdownBeep(secondsLeft) {
  const beep = COUNTDOWN_BEEPS[secondsLeft]
  if (!beep) return
  const ctx = await getRunningContext()
  if (!ctx) return
  scheduleBeep(ctx, ctx.currentTime, beep.duration, beep.gain, 660)
}

// Bip unique, ex. fin du temps d'un mouvement d'échauffement/étirement
// (voir components/RoutineRunner.jsx).
export async function playSingleBeep() {
  const ctx = await getRunningContext()
  if (!ctx) return
  scheduleBeep(ctx, ctx.currentTime, 0.2, 0.3, 880)
}

async function getRunningContext() {
  const ctx = getContext()
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx.state === 'running' ? ctx : null
}

function scheduleBeep(ctx, start, duration, gain, frequency) {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gainNode.gain.setValueAtTime(0.001, start)
  gainNode.gain.exponentialRampToValueAtTime(gain, start + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration)
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + duration)
}
