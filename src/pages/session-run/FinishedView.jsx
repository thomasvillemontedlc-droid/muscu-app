import { useNavigate } from 'react-router-dom'
import { BigButton } from '../../components/BigButton.jsx'

export function FinishedView({ session }) {
  const navigate = useNavigate()

  return (
    <div className="page">
      <h1>Séance terminée 🎉</h1>
      <p className="last-performance">{session.templateName}</p>
      <BigButton onClick={() => navigate('/')}>Retour aux séances</BigButton>
    </div>
  )
}
