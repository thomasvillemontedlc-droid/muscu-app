import { HashRouter, Route, Routes } from 'react-router-dom'
import { useAppData } from './hooks/useAppData.js'
import { AppDataContext } from './hooks/AppDataContext.jsx'
import { useTheme } from './hooks/useTheme.js'
import { ThemeContext } from './hooks/ThemeContext.jsx'
import { BottomNav } from './components/BottomNav.jsx'
import { useLiveSession } from './hooks/useLiveSession.js'
import { ThemeToggleButton } from './components/ThemeToggleButton.jsx'
import { TemplatesListPage } from './pages/TemplatesListPage.jsx'
import { TemplateEditPage } from './pages/TemplateEditPage.jsx'
import { SessionRunPage } from './pages/SessionRunPage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { ProgressPage } from './pages/ProgressPage.jsx'
import { ProgramPage } from './pages/ProgramPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { PrintPage } from './pages/PrintPage.jsx'

// Mise en page commune. Pendant une séance en cours, ni barre de navigation
// ni bouton de thème (voir hooks/useLiveSession.js) : la séance a sa propre
// barre du haut (SessionTopBar), et la marge réservée au bouton de thème
// disparaît avec lui.
function AppLayout() {
  const live = useLiveSession() != null
  return (
    <div className={live ? 'app app--live' : 'app'}>
      {!live && <ThemeToggleButton />}
      <main className="app__content">
        <Routes>
          {/* Toujours accessible, même au premier lancement : l'accueil
              vide propose de créer un programme ou une séance (voir
              TemplatesListPage). Avant, il renvoyait de force vers
              /program, dont le lien retour ramenait... sur /program. */}
          <Route path="/" element={<TemplatesListPage />} />
          <Route path="/templates/:templateId" element={<TemplateEditPage />} />
          <Route path="/sessions/:sessionId" element={<SessionRunPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/program" element={<ProgramPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/print" element={<PrintPage />} />
        </Routes>
      </main>
      {!live && <BottomNav />}
    </div>
  )
}

function App() {
  const [data, setData] = useAppData()
  const [theme, setTheme] = useTheme()
  return (
    <AppDataContext.Provider value={{ data, setData }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </ThemeContext.Provider>
    </AppDataContext.Provider>
  )
}

export default App
