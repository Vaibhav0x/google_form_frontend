import React, { useState, useEffect } from 'react'
import Login from './pages/Login'
import AdminPanel from './pages/AdminPanel'
import { getUser } from './utils/auth'

export default function App() {
  const [user, setUser] = useState(getUser())

  useEffect(() => {
    setUser(getUser())
  }, [])

  if (!user) return <Login onLogin={() => setUser(getUser())} />

  return <AdminPanel user={user} onLogout={() => { localStorage.clear(); setUser(null) }} />
}
