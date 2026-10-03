import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAppData } from './hooks/useAppData.js'
import { AppDataContext } from './hooks/AppDataContext.jsx'
import { useTheme } from './hooks/useTheme.js'
import { ThemeContext } from './hooks/ThemeContext.jsx'
import { hasCompletedWeeklyProgramOnboarding } from './storage/onboarding.js'
import { BottomNav } from './components/BottomNav.jsx'
import { ThemeToggleButton } from './components/ThemeToggleButton.jsx'
import { TemplatesListPage } from './pages/TemplatesListPage.jsx'
import { TemplateEditPage } from './pages/TemplateEditPage.jsx'
import { SessionRunPage } from './pages/SessionRunPage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { ProgressPage } from './pages/ProgressPage.jsx'
import { ProgramPage } from './pages/ProgramPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { PrintPage } from './pages/PrintPage.jsx'

function App() {
  const [data, setData] = useAppData()
  const [theme, setTheme] = useTheme()
  // Tout premier lancement (aucun programme hebdomadaire jamais créé) :
  // force l'écran "Combien de séances par semaine ?" avant l'accueil
  // habituel. Le drapeau localStorage (jamais réinitialisé, voir
  // storage/onboarding.js) prime sur templateIds.length dès qu'il est posé
  // - sinon vider le programme plus tard redéclencherait ce forçage.
  const needsProgramOnboarding =
    data.programs[0].templateIds.length === 0 && !hasCompletedWeeklyProgramOnboarding()

  return (
    <AppDataContext.Provider value={{ data, setData }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <HashRouter>
          <div className="app">
            <ThemeToggleButton />
            <main className="app__content">
              <Routes>
                <Route
                  path="/"
                  element={needsProgramOnboarding ? <Navigate to="/program" replace /> : <TemplatesListPage />}
                />
                <Route path="/templates/:templateId" element={<TemplateEditPage />} />
                <Route path="/sessions/:sessionId" element={<SessionRunPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/program" element={<ProgramPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/print" element={<PrintPage />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </HashRouter>
      </ThemeContext.Provider>
    </AppDataContext.Provider>
  )
}

export default App
