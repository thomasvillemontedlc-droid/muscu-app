import { HashRouter, Route, Routes } from 'react-router-dom'
import { useAppData } from './hooks/useAppData.js'
import { AppDataContext } from './hooks/AppDataContext.jsx'
import { BottomNav } from './components/BottomNav.jsx'
import { TemplatesListPage } from './pages/TemplatesListPage.jsx'
import { TemplateEditPage } from './pages/TemplateEditPage.jsx'
import { SessionRunPage } from './pages/SessionRunPage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'

function App() {
  const [data, setData] = useAppData()

  return (
    <AppDataContext.Provider value={{ data, setData }}>
      <HashRouter>
        <div className="app">
          <main className="app__content">
            <Routes>
              <Route path="/" element={<TemplatesListPage />} />
              <Route path="/templates/:templateId" element={<TemplateEditPage />} />
              <Route path="/sessions/:sessionId" element={<SessionRunPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </HashRouter>
    </AppDataContext.Provider>
  )
}

export default App
