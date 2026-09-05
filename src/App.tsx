import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { AuthProvider } from '@/lib/auth'

import Analytics from '@/pages/Analytics'
import Calendar from '@/pages/Calendar'
import Dashboard from '@/pages/Dashboard'
import Landing from '@/pages/Landing'
import Leaderboard from '@/pages/Leaderboard'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import Problems from '@/pages/Problems'
import Resources from '@/pages/Resources'
import Settings from '@/pages/Settings'
import Sheets from '@/pages/Sheets'
import Signup from '@/pages/Signup'
import Teams from '@/pages/Teams'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="problems" element={<Problems />} />
            <Route path="sheets" element={<Sheets />} />
            <Route path="resources" element={<Resources />} />
            <Route path="teams" element={<Teams />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
