import { HashRouter, Route, Routes } from 'react-router-dom'
import { useAppData } from './hooks/useAppData.js'
import { AppDataContext } from './hooks/AppDataContext.jsx'
import { useTheme } from './hooks/useTheme.js'
import { ThemeContext } from './hooks/ThemeContext.jsx'
import { BottomNav } from './components/BottomNav.jsx'
import { TemplatesListPage } from './pages/TemplatesListPage.jsx'
import { TemplateEditPage } from './pages/TemplateEditPage.jsx'
import { SessionRunPage } from './pages/SessionRunPage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { ProgressPage } from './pages/ProgressPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { PrintPage } from './pages/PrintPage.jsx'

function App() {
  const [data, setData] = useAppData()
  const [theme, setTheme] = useTheme()

  return (
    <AppDataContext.Provider value={{ data, setData }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <HashRouter>
          <div className="app">
            <main className="app__content">
              <Routes>
                <Route path="/" element={<TemplatesListPage />} />
                <Route path="/templates/:templateId" element={<TemplateEditPage />} />
                <Route path="/sessions/:sessionId" element={<SessionRunPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/progress" element={<ProgressPage />} />
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
