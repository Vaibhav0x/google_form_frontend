import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminPanel from './pages/AdminPanel'
import FormResponse from './pages/FormResponse'
import { getUser } from './utils/auth'

export default function App() {
  const [user, setUser] = useState(getUser())

  useEffect(() => {
    setUser(getUser())
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public form routes */}
        <Route path="/forms/:formId" element={<FormResponse />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            user ? (
              <AdminPanel
                user={user}
                onLogout={() => { localStorage.clear(); setUser(null) }}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Auth routes */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/admin" />
            ) : (
              <Login onLogin={() => setUser(getUser())} />
            )
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            <Navigate to={user ? "/admin" : "/login"} />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
