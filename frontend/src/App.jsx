import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useStacksStore } from './stores/stacksStore'
import { useEffect } from 'react'

import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CertificatesPage from './pages/CertificatesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user, checkAuth } = useAuthStore()
  const { initializeStacks } = useStacksStore()

  useEffect(() => {
    checkAuth()
    initializeStacks()
  }, [checkAuth, initializeStacks])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/certificates" element={
            <ProtectedRoute>
              <CertificatesPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App