import React, { useState } from 'react'
import { register } from '../api'

export default function Register({ onRegister }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function submit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const response = await register({ name, email, password })
            onRegister(response.user)
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mt-3">
            <form onSubmit={submit} className="bg-white p-4 rounded shadow">
                {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
                <label className="block mb-2">
                    <input
                        required
                        placeholder="Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full p-2 border rounded"
                        disabled={loading}
                    />
                </label>
                <label className="block mb-2">
                    <input
                        required
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                        disabled={loading}
                    />
                </label>
                <label className="block mb-4">
                    <input
                        required
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        disabled={loading}
                    />
                </label>
                <button
                    className="w-full bg-slate-700 text-white p-2 rounded disabled:bg-slate-400"
                    disabled={loading}
                >
                    {loading ? 'Creating account...' : 'Create account'}
                </button>
            </form>
        </div>
    )
}