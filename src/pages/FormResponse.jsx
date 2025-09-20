import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function FormResponse() {
    const { formId } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [responses, setResponses] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        loadForm();
    }, [formId]);

    async function loadForm() {
        try {
            setLoading(true);
            const formData = await api.getFormByShare(formId);

            // normalize fields
            formData.fields = formData.fields.map(f => ({
                ...f,
                options: typeof f.options === "string" ? JSON.parse(f.options) : f.options,
                checkbox_options: typeof f.checkbox_options === "string" ? JSON.parse(f.checkbox_options) : f.checkbox_options,
                choice_options: typeof f.choice_options === "string" ? JSON.parse(f.choice_options) : f.choice_options,
            }));

            console.log("Normalized form fields:", formData.fields);
            setForm(formData);
        } catch (err) {
            setError(err.response?.data?.message || 'Form not found');
        } finally {
            setLoading(false);
        }
    }

    function handleResponse(fieldId, value) {
        setResponses(prev => ({
            ...prev,
            [fieldId]: value
        }));
    }

    // async function handleSubmit(e) {
    //     e.preventDefault();
    //     try {
    //         setSubmitting(true);
    //         await api.submitForm(
    //             formId,
    //             Object.entries(responses).map(([fieldId, value]) => ({
    //                 fieldId,
    //                 value
    //             }))
    //         );
    //         setSubmitted(true);
    //     } catch (err) {
    //         setError(err.response?.data?.message || 'Failed to submit form');
    //     } finally {
    //         setSubmitting(false);
    //     }
    // }
    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setSubmitting(true);

            // Create FormData instance first
            const formData = new FormData();

            // Convert responses to the format expected by the backend
            const formattedAnswers = Object.entries(responses).map(([fieldId, value]) => {
                const field = form.fields.find(f => f.uid === fieldId);
                if (!field) return null;

                let formattedAnswer = {
                    questionId: field.id, // Use the actual question ID
                    type: field.type
                };

                // Handle different response types
                if (field.type === 'file_upload' || field.type === 'image_upload') {
                    if (Array.isArray(value) && value.length > 0) {
                        formattedAnswer.files = value;
                        // Immediately append files to FormData
                        value.forEach((file, idx) => {
                            formData.append(`files_${field.id}`, file);
                        });
                    }
                } else if (field.type === 'checkboxes') {
                    formattedAnswer.text = Array.isArray(value) ? value : [value];
                } else if (field.type === 'multiple_choice') {
                    formattedAnswer.text = value;
                } else {
                    formattedAnswer.text = value;
                }

                // Handle image responses
                if (field.type === 'image_upload') {
                    if (responses[`${fieldId}_checkboxes`]) {
                        formattedAnswer.checkboxes = responses[`${fieldId}_checkboxes`];
                    }
                    if (responses[`${fieldId}_choice`]) {
                        formattedAnswer.multipleChoice = responses[`${fieldId}_choice`];
                    }
                }

                return formattedAnswer;
            }).filter(Boolean);

            // Add the answers to FormData
            formData.append('answers', JSON.stringify(formattedAnswers.map(ans => {
                // Remove the files property since we've already handled the files
                const { files, ...rest } = ans;
                return rest;
            })));

            await api.submitForm(formId, formData);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit form');
            console.error('Submission error:', err);
        } finally {
            setSubmitting(false);
        }
    }


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-gray-500">Loading form...</div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-red-500">{error}</div>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-4">Response Submitted!</h2>
                <p className="text-gray-600 mb-4">Thank you for your response.</p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setResponses({});
                        window.scrollTo(0, 0);
                    }}
                    className="text-blue-500 hover:underline"
                >
                    Submit another response
                </button>
            </div>
        </div>
    );

    if (!form) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h1 className="text-3xl font-bold text-purple-700">{form.title}</h1>
                    {form.description && (
                        <p className="mt-2 text-gray-600">{form.description}</p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {form.fields.map((field, idx) => (
                        <div key={field.uid} className="space-y-2">
                            <label className="block">
                                <div className="font-medium text-gray-700">
                                    {idx + 1}. {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </div>

                                <div className="mt-2">
                                    {field.type === 'short_answer' && (
                                        <input
                                            type="text"
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                                            onChange={e => handleResponse(field.uid, e.target.value)}
                                        />
                                    )}
                                    {field.type === 'paragraph' && (
                                        <textarea
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                                            rows={4}
                                            onChange={e => handleResponse(field.uid, e.target.value)}
                                        />
                                    )}
                                    {field.type === 'multiple_choice' && (
                                        <div className="space-y-2">
                                            {field.options.map((option, i) => (
                                                <label key={i} className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        name={`field_${field.uid}`}
                                                        required={field.required}
                                                        onChange={() => handleResponse(field.uid, option)}
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {field.type === 'checkboxes' && (
                                        <div className="space-y-2">
                                            {field.options.map((option, i) => (
                                                <label key={i} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            const currentValue = responses[field.uid] || [];
                                                            if (e.target.checked) {
                                                                handleResponse(field.uid, [...currentValue, option]);
                                                            } else {
                                                                handleResponse(field.uid, currentValue.filter(v => v !== option));
                                                            }
                                                        }}
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* file upload feature for the single file */}
                                    {field.type === 'file_upload' && (
                                        <div className="space-y-4">
                                            {field.content && (
                                                <div className="text-gray-600">{field.content}</div>
                                            )}
                                            <div>
                                                <input
                                                    type="file"
                                                    multiple={false}   // you can allow multiple if needed
                                                    required={field.required}
                                                    className="w-full"
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files);
                                                        handleResponse(field.uid, files);
                                                    }}
                                                />
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {field.max_images === 1
                                                        ? 'Upload one file'
                                                        : `Upload up to ${field.max_images} files`}
                                                </div>
                                            </div>

                                            {/* ✅ Preview selected files */}
                                            {responses[field.uid] && responses[field.uid].length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {responses[field.uid].map((file, i) => (
                                                        <div key={i} className="flex items-center justify-between border p-2 rounded">
                                                            <span className="truncate">{file.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = responses[field.uid].filter((_, idx) => idx !== i);
                                                                    handleResponse(field.uid, updated);
                                                                }}
                                                                className="text-red-600 text-sm"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {field.type === 'image_upload' && (
                                        <div className="space-y-4">
                                            {field.content && (
                                                <div className="text-gray-600">{field.content}</div>
                                            )}
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple={field.max_images > 1}
                                                    required={field.required}
                                                    className="w-full"
                                                    onChange={(e) => {
                                                        const newFiles = Array.from(e.target.files);
                                                        const existingFiles = responses[field.uid] || [];

                                                        // Merge existing + new files
                                                        const mergedFiles = [...existingFiles, ...newFiles];

                                                        // Limit to max_images
                                                        const limitedFiles = field.max_images
                                                            ? mergedFiles.slice(0, field.max_images)
                                                            : mergedFiles;

                                                        handleResponse(field.uid, limitedFiles);

                                                        // Clear input so user can reselect the same file again if needed
                                                        // e.target.value = null;
                                                    }}

                                                />
                                                <div className="text-sm text-gray-500 mt-1">
                                                    Maximum {field.max_images || 1} {field.max_images === 1 ? 'image' : 'images'} allowed
                                                </div>
                                            </div>

                                            {/* ✅ Preview selected images */}
                                            {responses[field.uid] && responses[field.uid].length > 0 && (
                                                <div className="mt-3 flex gap-4 flex-wrap">
                                                    {responses[field.uid].map((file, i) => (
                                                        <div key={i} className="relative">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={`Preview ${i + 1}`}
                                                                className="h-24 w-24 object-cover rounded border"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = responses[field.uid].filter((_, idx) => idx !== i);
                                                                    handleResponse(field.uid, updated);
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* ✅ Global options for all uploaded images */}
                                            {(field.checkbox_options?.length > 0 || field.choice_options?.length > 0) && (
                                                <div className="mt-4 p-4 bg-gray-50 rounded border">
                                                    <div className="text-sm text-gray-500 mb-3">For all uploaded images:</div>

                                                    {field.checkbox_options?.length > 0 && (
                                                        <div className="space-y-2">
                                                            <div className="font-medium">Select all that apply:</div>
                                                            {field.checkbox_options.map((opt, i) => (
                                                                <label key={i} className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        onChange={(e) => {
                                                                            const currentValue = responses[`${field.uid}_checkboxes`] || [];
                                                                            if (e.target.checked) {
                                                                                handleResponse(`${field.uid}_checkboxes`, [...currentValue, opt.label || opt]);
                                                                            } else {
                                                                                handleResponse(`${field.uid}_checkboxes`, currentValue.filter(v => v !== (opt.label || opt)));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span>{opt.label || opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {field.choice_options?.length > 0 && (
                                                        <div className="mt-4 space-y-2">
                                                            <div className="font-medium">{field.choice_question || 'Select one:'}</div>
                                                            {field.choice_options.map((opt, i) => (
                                                                <label key={i} className="flex items-center gap-2">
                                                                    <input
                                                                        type="radio"
                                                                        name={`${field.uid}_choice`}
                                                                        onChange={() => handleResponse(`${field.uid}_choice`, opt.label || opt)}
                                                                    />
                                                                    <span>{opt.label || opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {field.type === 'date' && (
                                        <input
                                            type="date"
                                            required={field.required}
                                            className="p-2 border rounded"
                                            onChange={e => handleResponse(field.uid, e.target.value)}
                                        />
                                    )}
                                    {field.type === 'time' && (
                                        <input
                                            type="time"
                                            required={field.required}
                                            className="p-2 border rounded"
                                            onChange={e => handleResponse(field.uid, e.target.value)}
                                        />
                                    )}
                                </div>
                            </label>
                        </div>
                    ))}

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
