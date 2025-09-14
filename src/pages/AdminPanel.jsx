import React, { useEffect, useState } from 'react'
import { getMyForms, createForm, updateForm, deleteForm, getForm } from '../api'
import FormBuilderPanel from '../components/FormBuilder'
import FormsList from '../components/FormList'
import ResponsesModal from '../components/ResponseViewer'
import { clearAuth } from '../utils/auth'

export default function AdminPanel({ user, onLogout }) {
    const [forms, setForms] = useState([])
    const [active, setActive] = useState(null)
    const [showResponsesFor, setShowResponsesFor] = useState(null)

    async function load() {
        try {
            const data = await getMyForms()
            setForms(data.forms || [])
        } catch (e) { console.error(e) }
    }

    useEffect(() => { load() }, [])

    async function handleSave(form) {
        try {
            if (form.id) {
                await updateForm(form.id, form)
            } else {
                await createForm(form)
            }
            await load()
        } catch (e) { console.error(e) }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this form?')) return
        await deleteForm(id)
        if (active?.id === id) setActive(null)
        await load()
    }

    async function handleOpen(id) {
        const { form } = await getForm(id)
        setActive(form)
    }

    return (
        <div className="min-h-screen">
            <header className="bg-white shadow p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Google Forms Clone — Admin</h2>
                    <div className="text-sm text-slate-500">Logged in as {user?.name}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { clearAuth(); onLogout(); }} className="px-3 py-1 border rounded">Logout</button>
                </div>
            </header>

            <main className="p-6 grid grid-cols-12 gap-6">
                <aside className="col-span-3">
                    <FormsList forms={forms} onOpen={handleOpen} onDelete={handleDelete} onViewResponses={(f) => setShowResponsesFor(f)} />
                </aside>

                <section className="col-span-9">
                    <FormBuilderPanel form={active} onSave={handleSave} onNewSaved={(f) => setActive(f)} />
                </section>
            </main>

            {showResponsesFor && <ResponsesModal form={showResponsesFor} onClose={() => setShowResponsesFor(null)} />}
        </div>
    )
}
