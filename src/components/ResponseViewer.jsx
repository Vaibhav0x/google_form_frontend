import React, { useEffect, useState } from 'react'
import { exportCSV, getFormResponses } from '../api'

export default function ResponsesModal({ form, onClose }) {
    const [responses, setResponses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        load()
    }, [form.id]) // You could also use [form] if the whole form object might change

    async function load() {
        try {
            setLoading(true)
            setError(null)
            const data = await getFormResponses(form.id)
            console.log(data);
            setResponses(data.responses || [])
        } catch (e) {
            console.error(e)
            setError('Failed to load responses')
        } finally {
            setLoading(false)
        }
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

                {loading ? (
                    <div className="text-slate-500">Loading responses...</div>
                ) : error ? (
                    <div className="text-red-500">{error}</div>
                ) : responses.length === 0 ? (
                    <div className="text-slate-500">No responses yet</div>
                ) : (
                    responses.map((response, idx) => (
                        <div key={response.id || idx} className="mb-3 p-3 border rounded">
                            <div className="text-xs text-slate-500">
                                {new Date(response.submitted_at).toLocaleString()} — Anonymous
                            </div>
                            <div className="mt-2 space-y-1">
                                {response.Answers?.map((answer) => {
                                    const question = answer.Question
                                    if (!question) return null

                                    if (question.question_type === 'image_upload') {
                                        return (
                                            <div key={answer.id} className="mb-4">
                                                <div className="text-sm font-medium">{question.question_text}</div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                                    {JSON.parse(answer.image_urls || '[]').map((imageUrl, imageIndex) => (
                                                        <div key={imageUrl} className="space-y-2">
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Image ${imageIndex + 1}`}
                                                                className="max-w-full h-auto rounded"
                                                            />
                                                            {/* Checkbox selections */}
                                                            {answer.image_responses?.checkboxes[imageIndex]?.length > 0 && (
                                                                <div className="text-sm">
                                                                    <div className="font-medium">Selected attributes:</div>
                                                                    <ul className="list-disc list-inside">
                                                                        {answer.image_responses.checkboxes[imageIndex].map(opt => (
                                                                            <li key={opt}>{opt}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {/* Multiple choice selection */}
                                                            {answer.image_responses?.multiple_choice[imageIndex] && (
                                                                <div className="text-sm">
                                                                    <div className="font-medium">Category:</div>
                                                                    <div>{answer.image_responses.multiple_choice[imageIndex]}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div key={answer.id}>
                                            <div className="text-sm font-medium">{answer.Question?.question_text}</div>
                                            <div className="text-sm">{answer.value}</div>
                                        </div>
                                    )
                                })}
                                {response.files?.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium">Files</div>
                                        {response.files.map(f => (
                                            <a
                                                key={f.id}
                                                href={`${(import.meta.env.VITE_API_BASE || 'http://localhost:4000').replace('/api', '')}/uploads/${f.filename}`}
                                                className="block text-blue-600"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {f.originalname}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
