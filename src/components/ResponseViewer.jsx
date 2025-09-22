import React, { useEffect, useState } from 'react'
import { exportCSV, getFormResponses } from '../api'

export default function ResponsesModal({ form, onClose }) {
    const [responses, setResponses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedResponse, setSelectedResponse] = useState(null)

    useEffect(() => {
        loadResponses()
    }, [form.id])

    async function loadResponses() {
        try {
            setLoading(true)
            setError(null)
            const data = await getFormResponses(form.id)
            setResponses(data || [])
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
                    <>
                        {!selectedResponse ? (
                            // Step 1: List of responses
                            responses.map((resp) => {
                                const nameAnswer = resp.answers.find(a => a.question === 'Name')?.answerText || 'Anonymous';
                                return (
                                    <div
                                        key={resp.id}
                                        className="mb-2 p-3 border rounded cursor-pointer hover:bg-gray-100"
                                        onClick={() => setSelectedResponse(resp)}
                                    >
                                        {new Date(resp.submittedAt).toLocaleString()} — {nameAnswer} ({resp.respondent.email})
                                    </div>
                                )
                            })
                        ) : (
                            // Step 2: Detailed read-only filled form
                            <div>
                                <button
                                    onClick={() => setSelectedResponse(null)}
                                    className="mb-4 px-3 py-1 border rounded"
                                >
                                    Back to responses
                                </button>

                                {selectedResponse.answers
                                    .filter(a => a.answerText || a.imageUrls || a.files?.length)
                                    .map((answer) => {
                                        return (
                                            <div key={answer.question} className="mb-4">
                                                <div className="text-sm font-medium">{answer.question}</div>

                                                {/* Text / Paragraph / Dropdown / Multiple choice */}
                                                {answer.answerText && (
                                                    <input
                                                        type="text"
                                                        value={answer.answerText}
                                                        readOnly
                                                        className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100"
                                                    />
                                                )}

                                                {/* Checkbox selections */}
                                                {answer.checkboxSelections?.length > 0 && (
                                                    <ul className="list-disc list-inside mt-1 text-sm">
                                                        {answer.checkboxSelections.map((opt) => (
                                                            <li key={opt}>{opt}</li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {/* Multiple choice */}
                                                {answer.multipleChoiceSelection && (
                                                    <div className="mt-1 text-sm">{answer.multipleChoiceSelection}</div>
                                                )}

                                                {/* Images */}
                                                {answer.imageUrls && JSON.parse(answer.imageUrls).length > 0 && (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                                        {JSON.parse(answer.imageUrls).map((img, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={img}
                                                                alt={`img-${idx}`}
                                                                className="max-w-full h-auto rounded"
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Files */}
                                                {answer.files?.length > 0 && (
                                                    <div className="mt-2">
                                                        {answer.files.map(f => (
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
                                        )
                                    })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
