import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import FormPreview from './FormPreview'
import FieldEditor from './FieldEditor'
import FormSettings from './FormSettings'

function emptyForm() {
    return {
        title: 'Untitled Form',
        description: '',
        theme: 'default',
        fields: [],
        questions: [], // ensure compatibility with backend
        allow_multiple_responses: true,
        require_email: false
    }
}

export default function FormBuilderPanel({ form, onSave }) {
    const [local, setLocal] = useState(form || emptyForm())

    useEffect(() => {
        if (form) {
            setLocal(form)
        } else if (!local.fields?.length) {
            setLocal(emptyForm())
        }
    }, [form])

    function addQuestion(type = 'short_answer') {
        const q = {
            id: null, // will be created by backend if saving new
            uid: uuidv4(),
            label: '',
            type,
            required: false,
            placeholder: '',
            options: [],
            adminImages: [], // Array to store admin uploaded images
            enableAdminImages: false // Flag to enable/disable admin images
        }
        setLocal(prevLocal => ({
            ...prevLocal,
            fields: [...(prevLocal.fields || []), q]
        }))
    }

    function updateField(uid, patch) {
        setLocal(prevLocal => ({
            ...prevLocal,
            fields: prevLocal.fields.map(f =>
                f.uid === uid ? { ...f, ...patch } : f
            )
        }))
    }

    function removeField(uid) {
        setLocal(prevLocal => ({
            ...prevLocal,
            fields: prevLocal.fields.filter(f => f.uid !== uid)
        }))
    }

    function moveField(uid, dir) {
        setLocal(prevLocal => {
            const idx = prevLocal.fields.findIndex(f => f.uid === uid)
            if (idx === -1) return prevLocal
            const arr = [...prevLocal.fields]
            const [item] = arr.splice(idx, 1)
            arr.splice(idx + dir, 0, item)
            return { ...prevLocal, fields: arr }
        })
    }

    // ✅ Added helper to normalize array fields
    function normalizeArray(val) {
        if (!val) return []
        if (Array.isArray(val)) return val
        try {
            return JSON.parse(val) // handle string like "[]"
        } catch {
            return []
        }
    }

    async function save() {
        try {
            // convert uid fields to simple objects acceptable by API
            const payload = {
                id: local.id,
                title: local.title || 'Untitled Form',
                description: local.description || '',
                theme: local.theme || 'default',
                allow_multiple_responses: local.allow_multiple_responses ?? true,
                require_email: local.require_email ?? false,
                fields: local.fields.map((f, i) => ({
                    id: f.id, // Keep original ID if it exists
                    label: f.label || 'Untitled Question',
                    type: f.type || 'short_answer',
                    required: !!f.required,
                    placeholder: f.placeholder || '',
                    options: normalizeArray(f.options).map(o =>
                        typeof o === 'string' ? o : o.label || ''
                    ),
                    content: f.content || '',
                    max_images: f.max_images || 1,
                    checkbox_options: normalizeArray(f.checkbox_options),
                    choice_question: f.choice_question || '',
                    choice_options: normalizeArray(f.choice_options),
                    image_only: f.image_only || false,
                    enable_checkboxes: f.enable_checkboxes || false,
                    enable_multiple_choice: f.enable_multiple_choice || false,
                    multiple_choice_label: f.multiple_choice_label || '',
                    multiple_choice_options: normalizeArray(f.multiple_choice_options),
                    image_options: normalizeArray(f.image_options)
                }))
            };

            await onSave(payload);
            alert('Form saved successfully.');
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Error saving form: ' + (error.message || 'Please try again'));
        }
    }

    function mapTypeToBackend(type) {
        // map frontend types to backend types
        const map = {
            text: 'short_answer',
            textarea: 'paragraph',
            radio: 'multiple_choice',
            checkbox: 'checkboxes',
            select: 'dropdown',
            date: 'date',
            time: 'time',
            file: 'file_upload',
            image: 'image',
            image_upload: 'image_upload'
        }
        return type // Keep the frontend types as is, no need to map
    }

    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
                <div className="bg-white p-4 rounded shadow space-y-4">
                    <div className="flex items-center gap-3">
                        <input value={local.title} onChange={e => setLocal({ ...local, title: e.target.value })} placeholder="Form title" className="text-xl font-semibold w-full p-2 border rounded" />
                        <button onClick={save} className="bg-purple-600 text-white px-4 py-2 rounded">Save</button>
                    </div>

                    <textarea value={local.description} onChange={e => setLocal({ ...local, description: e.target.value })} placeholder="Form description" className="w-full p-2 border rounded" />

                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => addQuestion('short_answer')} className="px-3 py-1 border rounded text-sm">Short answer</button>
                        <button onClick={() => addQuestion('paragraph')} className="px-3 py-1 border rounded text-sm">Paragraph</button>
                        <button onClick={() => addQuestion('multiple_choice')} className="px-3 py-1 border rounded text-sm">Multiple choice</button>
                        <button onClick={() => addQuestion('checkboxes')} className="px-3 py-1 border rounded text-sm">Checkboxes</button>
                        <button onClick={() => addQuestion('dropdown')} className="px-3 py-1 border rounded text-sm">Dropdown</button>
                        <button onClick={() => addQuestion('date')} className="px-3 py-1 border rounded text-sm">Date</button>
                        <button onClick={() => addQuestion('time')} className="px-3 py-1 border rounded text-sm">Time</button>
                        <button onClick={() => addQuestion('file_upload')} className="px-3 py-1 border rounded text-sm">File upload</button>
                        <button onClick={() => addQuestion('image')} className="px-3 py-1 border rounded text-sm">Image</button>
                        <button onClick={() => addQuestion('image_upload')} className="px-3 py-1 border rounded text-sm">Image upload</button>
                    </div>

                    <div className="space-y-3">
                        {local.fields.map((f, idx) => (
                            <div key={f.uid} className="p-3 border rounded">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <div className="text-sm text-slate-500 mb-1">Question {idx + 1} • {f.type.replace('_', ' ')}</div>
                                        <input value={f.label} onChange={e => updateField(f.uid, { label: e.target.value })} placeholder="Question text" className="w-full p-2 border rounded mb-2" />
                                        <FieldEditor field={f} onChange={(patch) => updateField(f.uid, patch)} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => moveField(f.uid, -1)} className="px-2 py-1 border rounded">↑</button>
                                        <button onClick={() => moveField(f.uid, 1)} className="px-2 py-1 border rounded">↓</button>
                                        <button onClick={() => removeField(f.uid)} className="px-2 py-1 border rounded text-red-600">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="col-span-6">
                <FormPreview title={local.title} description={local.description} fields={local.fields} />
            </div>
        </div>
    )
}
