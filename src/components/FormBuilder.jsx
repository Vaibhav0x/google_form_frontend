import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import FormPreview from './FormPreview'
import FieldEditor from './FieldEditor'

function emptyForm() {
    return { title: '', description: '', theme: 'default', fields: [] }
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
            options: []
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

    async function save() {
        // convert uid fields to simple objects acceptable by API
        const payload = {
            id: local.id,
            title: local.title,
            description: local.description,
            theme: local.theme,
            fields: local.fields.map((f, i) => ({
                label: f.label,
                type: mapTypeToBackend(f.type),
                required: !!f.required,
                placeholder: f.placeholder,
                options: (f.options || []).map(o => o.label || o),
                imageUrl: f.imageUrl,
                annotations: f.annotations,
                extra: f.extra || null,
                max_images: f.max_images,
                image_options: f.image_options
            }))
        }
        await onSave(payload)
        alert('Form saved.')
    }

    function mapTypeToBackend(type) {
        // map frontend types to backend types
        const map = {
            short_answer: 'text',
            paragraph: 'textarea',
            multiple_choice: 'radio',
            checkboxes: 'checkbox',
            dropdown: 'select',
            date: 'date',
            time: 'time',
            file_upload: 'file',
            image: 'image',
            image_upload: 'image_upload'
        }
        return map[type] || type
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
