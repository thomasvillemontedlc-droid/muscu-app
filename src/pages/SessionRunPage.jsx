import { Link, useParams } from 'react-router-dom'
import { useAppDataContext } from '../hooks/AppDataContext.jsx'
import { getSessionById } from '../domain/sessions.js'
import { PrepView } from './session-run/PrepView.jsx'
import { ExerciseView } from './session-run/ExerciseView.jsx'
import { PickExerciseView } from './session-run/PickExerciseView.jsx'
import { FinishedView } from './session-run/FinishedView.jsx'

// Aiguille vers l'écran correspondant à la phase de la séance (prep ->
// exercise -> [exercise | picking] -> finished). Le repos n'est plus une
// phase à part : il tourne en arrière-plan (session.restStartedAt) et
// s'affiche via <RestBanner> sur l'écran actif, sans étape de confirmation
// entre la fin du chrono et la série suivante. Une seule route pour tout
// le déroulé : voir domain/sessionRunner.js pour la machine à états et
// l'explication du choix (pas de démontage de route entre les étapes,
// important pour la persistance du chrono de repos).
export function SessionRunPage() {
  const { sessionId } = useParams()
  const { data, setData } = useAppDataContext()
  const session = getSessionById(data.sessions, sessionId)

  if (!session) {
    return (
      <div className="page">
        <p>Séance introuvable.</p>
        <Link to="/">Retour</Link>
      </div>
    )
  }

  switch (session.phase) {
    case 'exercise':
      return <ExerciseView session={session} data={data} setData={setData} />
    case 'picking':
      return <PickExerciseView session={session} data={data} setData={setData} />
    case 'finished':
      return <FinishedView session={session} data={data} />
    case 'prep':
    default:
      return <PrepView session={session} data={data} setData={setData} />
  }
}
