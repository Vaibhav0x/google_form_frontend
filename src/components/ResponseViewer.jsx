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
            console.log('Loaded responses:', data) // Debug log
            setResponses(data || [])
        } catch (e) {
            console.error('Error loading responses:', e)
            setError('Failed to load responses')
        } finally {
            setLoading(false)
        }
    }

    function downloadCSV() {
        const downloadUrl = exportCSV(form.id)
        window.open(downloadUrl, '_blank')
    }

    // Safe JSON parse function
    const safeJsonParse = (str) => {
        if (!str) return null
        try {
            return JSON.parse(str)
        } catch (e) {
            console.error('JSON parse error:', e, 'for string:', str)
            return null
        }
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
                                const nameAnswer = resp.answers?.find(a => a.question?.includes('Name'))?.answerText ||
                                    resp.respondent?.name || 'Anonymous';
                                const email = resp.respondent?.email || 'No email';

                                return (
                                    <div
                                        key={resp.id}
                                        className="mb-2 p-3 border rounded cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                            console.log('Selected response:', resp) // Debug log
                                            setSelectedResponse(resp)
                                        }}
                                    >
                                        {new Date(resp.submittedAt).toLocaleString()} — {nameAnswer} ({email})
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
                                    ← Back to responses
                                </button>

                                <div className="mb-4 p-3 bg-gray-50 rounded">
                                    <div className="text-sm text-gray-600">
                                        Submitted: {new Date(selectedResponse.submittedAt).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Respondent: {selectedResponse.respondent?.name || 'Anonymous'}
                                        ({selectedResponse.respondent?.email || 'No email'})
                                    </div>
                                </div>

                                {selectedResponse.answers?.length > 0 ? (
                                    selectedResponse.answers
                                        .filter(a => a.answerText || a.imageUrls || a.files || a.checkboxSelections || a.multipleChoiceSelection)
                                        .map((answer, index) => {
                                            console.log('Rendering answer:', answer) // Debug log

                                            const imageUrls = Array.isArray(answer.imageUrls) ? answer.imageUrls :
                                                safeJsonParse(answer.imageUrls) || [];
                                            const files = Array.isArray(answer.files) ? answer.files :
                                                safeJsonParse(answer.files) || [];
                                            const checkboxSelections = Array.isArray(answer.checkboxSelections) ? answer.checkboxSelections :
                                                safeJsonParse(answer.checkboxSelections) || [];

                                            return (
                                                <div key={answer.question || index} className="mb-6 p-4 border rounded">
                                                    <div className="text-sm font-medium mb-3">
                                                        {answer.question || `Question ${index + 1}`}
                                                    </div>

                                                    {/* Text Answer */}
                                                    {answer.answerText && (
                                                        <div className="mb-2">
                                                            <div className="text-xs text-gray-500">Answer:</div>
                                                            <input
                                                                type="text"
                                                                value={answer.answerText}
                                                                readOnly
                                                                className="mt-1 block w-full border rounded px-2 py-1 bg-gray-100"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Checkbox Selections */}
                                                    {checkboxSelections.length > 0 && (
                                                        <div className="mb-2">
                                                            <div className="text-xs text-gray-500">Selected options:</div>
                                                            <ul className="list-disc list-inside mt-1 text-sm">
                                                                {checkboxSelections.map((opt, idx) => (
                                                                    <li key={idx}>{opt}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Multiple Choice Selection */}
                                                    {answer.multipleChoiceSelection && (
                                                        <div className="mb-2">
                                                            <div className="text-xs text-gray-500">Selected choice:</div>
                                                            <div className="mt-1 text-sm p-2 bg-gray-100 rounded">
                                                                {answer.multipleChoiceSelection}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Image URLs */}
                                                    {imageUrls.length > 0 && (
                                                        <div className="mb-2">
                                                            <div className="text-xs text-gray-500">Uploaded images:</div>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                                                {imageUrls.map((img, idx) => (
                                                                    <img
                                                                        key={idx}
                                                                        src={img}
                                                                        alt={`Uploaded image ${idx + 1}`}
                                                                        className="max-w-full h-32 object-cover rounded border"
                                                                        onError={(e) => {
                                                                            e.target.src = '/placeholder-image.jpg';
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Files */}
                                                    {files.length > 0 && (
                                                        <div className="mb-2">
                                                            <div className="text-xs text-gray-500">Uploaded files:</div>
                                                            <div className="mt-2 space-y-1">
                                                                {files.map((file, idx) => {
                                                                    const fileName = typeof file === 'string'
                                                                        ? file.split('/').pop()
                                                                        : file.filename || file.originalname || `file-${idx + 1}`;

                                                                    const fileUrl = typeof file === 'string'
                                                                        ? file
                                                                        : `/uploads/${file.filename}`;

                                                                    return (
                                                                        <a
                                                                            key={idx}
                                                                            href={fileUrl}
                                                                            className="block text-blue-600 hover:underline"
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                        >
                                                                            📎 {fileName}
                                                                        </a>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Image Responses (checkbox selections for images) */}
                                                    {answer.imageResponses && answer.imageResponses.length > 0 && (
                                                        <div className="mb-2">
                                                            <div className="text-xs text-gray-500">Image responses:</div>
                                                            <ul className="list-disc list-inside mt-1 text-sm">
                                                                {answer.imageResponses.map((resp, idx) => (
                                                                    <li key={idx}>{resp}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Fallback for empty answers */}
                                                    {!answer.answerText && !answer.imageUrls && !answer.files &&
                                                        !answer.checkboxSelections && !answer.multipleChoiceSelection && (
                                                            <div className="text-sm text-gray-500 italic">
                                                                No response provided
                                                            </div>
                                                        )}
                                                </div>
                                            )
                                        })
                                ) : (
                                    <div className="text-gray-500">No answers found for this response.</div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}