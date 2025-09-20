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

    async function handleOpen(formInput) {
        if (formInput === null) {
            // Create new form
            setActive({
                title: 'Untitled Form',
                description: '',
                theme: 'default',
                fields: [],
                questions: [],
                allow_multiple_responses: true,
                require_email: false
            });
        } else {
            try {
                // If we get just the ID, we need to load the full form
                const formId = typeof formInput === 'object' ? formInput.id : formInput;

                // Make sure we load fresh from backend
                const { form: freshForm } = await getForm(formId);

                if (!freshForm) {
                    throw new Error('Form not found');
                }

                // Map the questions to fields format
                const mappedForm = {
                    ...freshForm,
                    fields: freshForm.fields.map(field => ({
                        ...field,
                        uid: field.id.toString(), // Ensure each field has a unique ID for frontend
                        id: field.id, // Keep the original ID for backend reference
                        type: field.type || 'short_answer',
                        required: !!field.required,
                        placeholder: field.placeholder || '',
                        options: field.options || [],
                        content: field.content || '',
                        max_images: field.max_images || 1,
                        checkbox_options: field.checkbox_options || [],
                        choice_options: field.choice_options || [],
                        image_only: field.image_only || false,
                        enable_checkboxes: field.enable_checkboxes || false,
                        enable_multiple_choice: field.enable_multiple_choice || false,
                        multiple_choice_label: field.multiple_choice_label || '',
                        multiple_choice_options: field.multiple_choice_options || [],
                        image_options: field.image_options || []
                    }))
                };
                setActive(mappedForm);
            } catch (error) {
                console.error('Error loading form:', error);
                alert('Failed to load the form. Please check if the form exists and try again.');
            }
        }
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
