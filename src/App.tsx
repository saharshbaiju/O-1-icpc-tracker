import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { AuthProvider } from '@/lib/auth'

import Dashboard from '@/pages/Dashboard'
import Database from '@/pages/Database'
import Landing from '@/pages/Landing'
import Leaderboard from '@/pages/Leaderboard'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'
import Problems from '@/pages/Problems'
import Profile from '@/pages/Profile'
import Sheets from '@/pages/Sheets'
import Signup from '@/pages/Signup'
import Submissions from '@/pages/Submissions'
import Team from '@/pages/Team'

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
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="problems" element={<Problems />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="sheets" element={<Sheets />} />
            <Route path="team" element={<Team />} />
            <Route path="profile" element={<Profile />} />
            <Route path="database" element={<Database />} />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
