import React from 'react'

export default function FormsList({ forms = [], onOpen, onDelete, onViewResponses }) {
    return (
        <div className="space-y-3">
            <div className="bg-white p-3 rounded shadow">
                <button onClick={() => onOpen(null)} className="w-full text-left font-medium">+ New Form</button>
            </div>

            {forms.map(f => (
                <div key={f.id} className="bg-white p-3 rounded shadow flex items-center justify-between">
                    <div>
                        <div className="font-medium">{f.title || 'Untitled'}</div>
                        <div className="text-xs text-slate-500">{new Date(f.updated_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onViewResponses(f)} className="px-2 py-1 border rounded text-sm">Responses</button>
                        <button onClick={() => onOpen(f.id)} className="px-2 py-1 border rounded text-sm">Edit</button>
                        <button onClick={() => onDelete(f.id)} className="px-2 py-1 border rounded text-red-600 text-sm">Delete</button>
                    </div>
                </div>
            ))}
        </div>
    )
}
