let sharedContext = null
let pendingResume = null
let listenersInstalled = false
// Alarme de fin de repos qui n'a pas pu sonner faute d'audio débloqué (ex.
// repos terminé app en arrière-plan sur iOS, voir hooks/useRestTimer.js) :
// rejouée au prochain déblocage par un toucher, tant qu'on reste dans ce
// délai.
let pendingAlarmUntil = 0
const PENDING_ALARM_MS = 60 * 1000
const RESUME_TIMEOUT_MS = 1500
const stateSubscribers = new Set()

function notifyState() {
  for (const fn of stateSubscribers) fn()
}

function createContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  const ctx = new AudioContextClass()
  ctx.onstatechange = notifyState
  sharedContext = ctx
  notifyState()
  return ctx
}

// Recrée le contexte s'il n'existe pas encore, ou s'il a fini par passer en
// 'closed' (certains navigateurs mobiles ferment l'AudioContext après une
// longue mise en arrière-plan plutôt que de juste le suspendre) - un
// contexte fermé ne peut plus jamais être repris via resume().
function getContext() {
  if (!sharedContext || sharedContext.state === 'closed') return createContext()
  return sharedContext
}

// Contexte irrécupérable (resume() rejeté, ou toujours pas 'running'
// après) : on le ferme et on repart d'un neuf - seulement s'il est encore
// le contexte courant (une autre tentative a pu le remplacer entre-temps).
function recreateContext(failed) {
  if (sharedContext !== failed) return sharedContext
  sharedContext = null
  if (failed && failed.state !== 'closed') failed.close().catch(() => {})
  return createContext()
}

// Technique standard de déblocage iOS : jouer un buffer silencieux d'un
// échantillon pendant la relance du contexte.
function playSilentBuffer(ctx) {
  try {
    const source = ctx.createBufferSource()
    source.buffer = ctx.createBuffer(1, 1, 22050)
    source.connect(ctx.destination)
    source.start(0)
  } catch {
    // Contexte dans un état où rien ne peut être programmé : la relance
    // ci-dessus/ci-dessous décidera.
  }
}

// resume() peut rester bloqué indéfiniment sur iOS tant que l'interruption
// dure (appel, autre app audio...) : borné dans le temps.
async function tryResume(ctx) {
  playSilentBuffer(ctx)
  try {
    await Promise.race([
      ctx.resume(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), RESUME_TIMEOUT_MS)),
    ])
  } catch {
    return false
  }
  playSilentBuffer(ctx)
  return ctx.state === 'running'
}

// Tout état autre que 'running' est à relancer : 'suspended' (onglet en
// arrière-plan sur la plupart des navigateurs) mais aussi 'interrupted',
// l'état dans lequel iOS Safari/PWA laisse le contexte après être sorti de
// l'app - c'est ce cas, non géré avant, qui rendait l'alarme muette pour le
// reste de la séance après un seul aller-retour. Si la relance échoue, on
// recrée un contexte. Les appels concurrents partagent la même tentative.
function ensureRunning() {
  const ctx = getContext()
  if (!ctx) return Promise.resolve(null)
  if (ctx.state === 'running') return Promise.resolve(ctx)
  if (pendingResume) return pendingResume

  pendingResume = (async () => {
    if (await tryResume(ctx)) return ctx
    const fresh = recreateContext(ctx)
    if (fresh && (await tryResume(fresh))) return fresh
    return null
  })().finally(() => {
    pendingResume = null
    notifyState()
  })
  return pendingResume
}

// true si le son peut partir maintenant (contexte 'running'). Voir
// subscribeAudioState pour être prévenu des changements.
export function isAudioReady() {
  return sharedContext?.state === 'running'
}

export function subscribeAudioState(callback) {
  stateSubscribers.add(callback)
  return () => stateSubscribers.delete(callback)
}

// À appeler depuis un geste utilisateur (toucher, "Valider la série"...).
// resume() et le buffer silencieux sont lancés de façon SYNCHRONE, dans le
// geste lui-même : iOS n'accepte de relancer l'audio que là. Si le
// contexte ne repasse pas en 'running', il est recréé ; le prochain toucher
// le débloquera (voir installAudioUnlockListeners).
export function unlockAudio() {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'running') {
    playPendingAlarm(ctx)
    return
  }
  playSilentBuffer(ctx)
  ctx
    .resume()
    .then(() => {
      if (ctx.state === 'running') {
        playSilentBuffer(ctx)
        playPendingAlarm(ctx)
      } else {
        recreateContext(ctx)
      }
    })
    .catch(() => recreateContext(ctx))
}

// Écoute en permanence les touchers/touches sur toute l'app : n'importe
// quelle interaction après un retour dans l'app réactive le son (et joue
// une alarme restée en attente). À appeler une seule fois au démarrage.
export function installAudioUnlockListeners() {
  if (listenersInstalled) return
  listenersInstalled = true
  const handler = () => {
    if (!isAudioReady()) unlockAudio()
  }
  for (const type of ['touchend', 'pointerdown', 'keydown']) {
    document.addEventListener(type, handler, { passive: true, capture: true })
  }
}

// Retente un réveil du contexte au retour de l'app au premier plan
// (visibilitychange/pageshow, voir hooks/useRestTimer.js), avec la même
// logique que ensureRunning. Peut échouer sans geste utilisateur sur iOS :
// le toucher suivant prend alors le relais (installAudioUnlockListeners).
export function resumeAudioIfNeeded() {
  if (sharedContext) ensureRunning()
}

// Trois bips générés (oscillateur), pas de fichier audio à embarquer :
// fonctionne hors-ligne par construction. On attend que le contexte soit
// réellement 'running' avant de programmer les bips : sinon ctx.currentTime
// ne redémarre pas et des oscillateurs programmés dessus restent muets sans
// erreur. Si l'audio est bloqué, l'alarme est mise en attente et jouée au
// prochain déblocage (voir unlockAudio).
export async function playAlarmBeep() {
  const ctx = await ensureRunning()
  if (!ctx) {
    pendingAlarmUntil = Date.now() + PENDING_ALARM_MS
    return
  }
  pendingAlarmUntil = 0
  scheduleAlarm(ctx)
}

function scheduleAlarm(ctx) {
  const now = ctx.currentTime
  const beepDuration = 0.15
  const gap = 0.1
  for (let i = 0; i < 3; i++) {
    scheduleBeep(ctx, now + i * (beepDuration + gap), beepDuration, 0.3, 880)
  }
}

function playPendingAlarm(ctx) {
  if (pendingAlarmUntil === 0) return
  const stillRelevant = Date.now() < pendingAlarmUntil
  pendingAlarmUntil = 0
  if (stillRelevant) scheduleAlarm(ctx)
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
  const ctx = await ensureRunning()
  if (!ctx) return
  scheduleBeep(ctx, ctx.currentTime, beep.duration, beep.gain, 660)
}

// Bip unique, ex. fin du temps d'un mouvement d'échauffement/étirement
// (voir components/RoutineRunner.jsx).
export async function playSingleBeep() {
  const ctx = await ensureRunning()
  if (!ctx) return
  scheduleBeep(ctx, ctx.currentTime, 0.2, 0.3, 880)
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
