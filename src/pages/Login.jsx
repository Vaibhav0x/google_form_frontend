import React, { useState } from 'react'
import { login, register } from '../api'
import { setAuth } from '../utils/auth'

export default function Login({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [err, setErr] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            if (isRegister) {
                const res = await register({ name, email, password })
                setAuth(res.token, res.user)
            } else {
                const res = await login({ email, password })
                setAuth(res.token, res.user)
            }
            onLogin()
        } catch (e) {
            console.error(e)
            const errorMessage = e?.response?.data?.message || e?.response?.data?.error || 'Login failed'
            setErr(errorMessage)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow p-6">
                <h1 className="text-2xl font-semibold mb-4">Google Forms Clone — Admin</h1>
                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full p-2 border rounded mb-3" />
                    )}
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full p-2 border rounded mb-3"
                    />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border rounded mb-3" />
                    <div className="flex gap-2">
                        <button className="bg-purple-600 text-white px-4 py-2 rounded">{isRegister ? 'Register' : 'Login'}</button>
                        <button type="button" onClick={() => setIsRegister(!isRegister)} className="px-4 py-2 border rounded">{isRegister ? 'Have an account?' : 'Create account'}</button>
                    </div>
                    {err && <div className="text-red-500 mt-3">{err}</div>}
                </form>
            </div>
        </div>
    )
}
