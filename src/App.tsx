import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { AuthProvider } from '@/lib/auth'

import Achievements from '@/pages/Achievements'
import Admin from '@/pages/Admin'
import Analytics from '@/pages/Analytics'
import Calendar from '@/pages/Calendar'
import Contests from '@/pages/Contests'
import Dashboard from '@/pages/Dashboard'
import Discussions from '@/pages/Discussions'
import Landing from '@/pages/Landing'
import Leaderboard from '@/pages/Leaderboard'
import Login from '@/pages/Login'
import Messages from '@/pages/Messages'
import NotFound from '@/pages/NotFound'
import Notifications from '@/pages/Notifications'
import Problems from '@/pages/Problems'
import Profile from '@/pages/Profile'
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
            <Route path="contests" element={<Contests />} />
            <Route path="resources" element={<Resources />} />
            <Route path="teams" element={<Teams />} />
            <Route path="discussions" element={<Discussions />} />
            <Route path="messages" element={<Messages />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:handle" element={<Profile />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="admin" element={<Admin />} />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
