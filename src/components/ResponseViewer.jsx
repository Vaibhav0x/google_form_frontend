import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { exportCSV } from '../api'

export default function ResponsesModal({ form, onClose }) {
    const [responses, setResponses] = useState([])

    useEffect(() => { load(); }, [])

    async function load() {
        try {
            const url = `${import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'}`.replace('/api', '')
            const res = await axios.get(`${url}/api/forms/${form.id}`)
            setResponses(res.data.responses || [])
        } catch (e) { console.error(e) }
    }

    function downloadCSV() {
        const downloadUrl = exportCSV(form.id)
        window.open(downloadUrl, '_blank')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white w-11/12 max-w-4xl p-4 rounded shadow max-h-[80vh] overflow-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Responses — {form.title}</h3>
                    <div className="flex gap-2">
                        <button onClick={downloadCSV} className="px-3 py-1 border rounded">Export CSV</button>
                        <button onClick={onClose} className="px-3 py-1 border rounded">Close</button>
                    </div>
                </div>

                {responses.length === 0 && <div className="text-slate-500">No responses yet</div>}

                {responses.map((r, idx) => (
                    <div key={idx} className="mb-3 p-3 border rounded">
                        <div className="text-xs text-slate-500">{r.response.created_at} — {r.response.submitter_name || 'Anonymous'}</div>
                        <div className="mt-2 space-y-1">
                            {r.values.map(v => {
                                if (v.question_type === 'image_upload') {
                                    return (
                                        <div key={v.id} className="mb-4">
                                            <div className="text-sm font-medium">{v.field_label}</div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                                {v.image_urls.map((imageUrl, imageIndex) => (
                                                    <div key={imageUrl} className="space-y-2">
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Image ${imageIndex + 1}`}
                                                            className="max-w-full h-auto rounded"
                                                        />

                                                        {/* Checkbox selections */}
                                                        {v.image_responses?.checkboxes[imageIndex]?.length > 0 && (
                                                            <div className="text-sm">
                                                                <div className="font-medium">Selected attributes:</div>
                                                                <ul className="list-disc list-inside">
                                                                    {v.image_responses.checkboxes[imageIndex].map(opt => (
                                                                        <li key={opt}>{opt}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Multiple choice selection */}
                                                        {v.image_responses?.multiple_choice[imageIndex] && (
                                                            <div className="text-sm">
                                                                <div className="font-medium">Category:</div>
                                                                <div>{v.image_responses.multiple_choice[imageIndex]}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={v.id}>
                                        <div className="text-sm font-medium">{v.field_label}</div>
                                        <div className="text-sm">{v.value}</div>
                                    </div>
                                );
                            })}
                            {r.files?.length > 0 && (
                                <div>
                                    <div className="text-sm font-medium">Files</div>
                                    {r.files.map(f => <a key={f.id} href={`${(import.meta.env.VITE_API_BASE || 'http://localhost:4000').replace('/api', '')}/uploads/${f.filename}`} className="block text-blue-600" target="_blank" rel="noreferrer">{f.originalname}</a>)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
