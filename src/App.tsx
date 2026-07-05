import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { HistoryPage } from '@/pages/HistoryPage'
import { HistoryDetailPage } from '@/pages/HistoryDetailPage'
import { SeriesPage } from '@/pages/SeriesPage'
import { SeriesDetailPage } from '@/pages/SeriesDetailPage'
import { SharePage } from '@/pages/SharePage'
import { TrialPage } from '@/pages/TrialPage'
import { TemplateGalleryPage } from '@/pages/TemplateGalleryPage'
import { TemplateDetailPage } from '@/pages/TemplateDetailPage'
import { BlogIndexPage } from '@/pages/BlogIndexPage'
import { BlogPostPage } from '@/pages/BlogPostPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/share/:id" element={<SharePage />} />
          <Route path="/trial" element={<TrialPage />} />
          <Route path="/templates" element={<TemplateGalleryPage />} />
          <Route path="/templates/:id" element={<TemplateDetailPage />} />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:id" element={<HistoryDetailPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/series/:id" element={<SeriesDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
