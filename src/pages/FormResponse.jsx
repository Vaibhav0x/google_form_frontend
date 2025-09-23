import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function FormResponse() {
    const { formId } = useParams();
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [responses, setResponses] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [view, setView] = useState("form"); // "form" | "success"


    useEffect(() => {
        loadForm();
    }, [formId]);

    async function loadForm() {
        try {
            setLoading(true);
            const formData = await api.getFormByShare(formId);

            // normalize fields with proper adminImages parsing
            formData.fields = formData.fields.map(f => ({
                ...f,
                options: typeof f.options === "string" ? JSON.parse(f.options) : f.options,
                checkbox_options: typeof f.checkbox_options === "string" ? JSON.parse(f.checkbox_options) : f.checkbox_options,
                choice_options: typeof f.choice_options === "string" ? JSON.parse(f.choice_options) : f.choice_options,
                adminImages: typeof f.adminImages === "string" ? JSON.parse(f.adminImages) : (f.adminImages || []),
            }));

            console.log('Form loaded with fields:', formData.fields);
            setForm(formData);
        } catch (err) {
            setError(err.response?.data?.message || 'Form not found');
        } finally {
            setLoading(false);
        }
    }

    function handleResponse(fieldId, value) {
        console.log(`Updating response for field ${fieldId}:`, value); // Debug log
        setResponses(prev => {
            const updated = {
                ...prev,
                [fieldId]: value
            };
            console.log('Updated responses state:', updated); // Debug log
            return updated;
        });
    }


    // Replace your entire handleSubmit function with this:
    async function handleSubmit(e) {
        e.preventDefault();

        // Debug: Log current responses state
        console.log('Current responses state on submit:', responses);

        // Validate required fields before submission
        const missingFields = form.fields
            .filter(field => field.required)
            .filter(field => {
                const value = responses[field.uid];
                return !value ||
                    (Array.isArray(value) && value.length === 0) ||
                    (typeof value === 'string' && value.trim() === '');
            })
            .map(field => field.label);

        if (missingFields.length > 0) {
            setError(`Please fill in required fields: ${missingFields.join(', ')}`);
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const formData = new FormData();

            // Filter out responses that don't have values
            const validResponses = Object.entries(responses).filter(([fieldId, value]) => {
                if (value === null || value === undefined) return false;
                if (typeof value === 'string' && value.trim() === '') return false;
                if (Array.isArray(value) && value.length === 0) return false;
                return true;
            });

            console.log('Valid responses:', validResponses);

            const formattedAnswers = [];

            for (const [fieldId, value] of validResponses) {
                // Skip checkbox and choice extensions - they're handled with their parent
                if (fieldId.includes('_checkboxes') || fieldId.includes('_choice')) {
                    continue;
                }

                const field = form.fields.find(f => f.uid == fieldId); // Use == for flexible matching
                if (!field) {
                    console.log(`Field not found for fieldId: ${fieldId}`);
                    console.log('Available fields:', form.fields.map(f => ({ uid: f.uid, id: f.id })));
                    continue;
                }

                console.log(`Processing field ${fieldId}, type: ${field.type}`);

                let formattedAnswer = {
                    questionId: field.uid, // Use field.id as questionId (this is the database ID)
                    fieldUid: field.uid,
                    type: field.type,
                };

                if (field.type === 'image_upload') {
                    if (Array.isArray(value) && value.length > 0) {
                        // Append files with consistent naming
                        value.forEach((file, idx) => {
                            const fileKey = `image_${field.uid}_${idx}`;
                            formData.append(fileKey, file);
                            console.log(`Appending image file: ${fileKey}`, file.name);
                        });

                        formattedAnswer.imageData = value.map((file, idx) => ({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            fileKey: `image_${field.uid}_${idx}`
                        }));

                        // Handle additional checkbox selections
                        if (responses[`${fieldId}_checkboxes`]) {
                            formattedAnswer.checkboxSelections = responses[`${fieldId}_checkboxes`];
                        }
                        // Handle additional multiple choice selection
                        if (responses[`${fieldId}_choice`]) {
                            formattedAnswer.multipleChoiceSelection = responses[`${fieldId}_choice`];
                        }
                    }
                } else if (field.type === 'checkboxes') {
                    formattedAnswer.text = Array.isArray(value) ? value : [value];
                } else if (field.type === 'multiple_choice') {
                    formattedAnswer.text = value;
                } else if (field.type === 'file_upload') {
                    if (Array.isArray(value) && value.length > 0) {
                        value.forEach((file, idx) => {
                            const fileKey = `file_${field.uid}_${idx}`;
                            formData.append(fileKey, file);
                            console.log(`Appending regular file: ${fileKey}`, file.name);
                        });
                        formattedAnswer.fileData = value.map((file, idx) => ({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            fileKey: `file_${field.uid}_${idx}`
                        }));
                    }
                } else {
                    formattedAnswer.text = value;
                }

                formattedAnswers.push(formattedAnswer);
            }

            // Append the JSON data
            const answersJson = JSON.stringify(formattedAnswers);
            formData.append('answers', answersJson);

            // Add form metadata
            formData.append('formId', formId);
            formData.append('submissionTimestamp', new Date().toISOString());

            console.log("Answers JSON:", answersJson);
            console.log("Form data is: ", formData);
            // Debug FormData contents
            // logFormData(formData);

            // Submit to API
            const response = await api.submitForm(formId, formData);
            console.log('Form submission successful:', response);

            setSubmitted(true);
            setResponses({});
            setView("success");   // ✅ switch to success screen
            window.scrollTo(0, 0);

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to submit form';
            setError(errorMessage);
            console.error('Submission error:', err);

            if (err.response) {
                console.error('Error response status:', err.response.status);
                console.error('Error response data:', err.response.data);
            }
        } finally {
            setSubmitting(false);
        }
    }


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Loading form...</div>
            </div>
        );
    }

    if (error && !form) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

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

                {view === "success" ? (
                    <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-green-600 mb-4">Response Submitted!</h2>
                        <p className="text-gray-700 mb-6">Thank you for your response.</p>
                        <button
                            onClick={() => {
                                setSubmitted(false);
                                setResponses({});
                                setView("form"); // switch back to form
                            }}
                            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                            Submit another response
                        </button>
                    </div>
                ) : (
                    <>
                        {error && form && (
                            <div className="p-4 bg-red-100 text-red-700 rounded m-6">
                                {error}
                                <button
                                    onClick={() => setError(null)}
                                    className="ml-3 text-blue-600 underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {/* Debug Panel - Remove this in production */}
                        {/* <div className="p-4 bg-gray-100 m-6 rounded">
                            <h3 className="font-bold">Debug Info:</h3>
                            <p>Current responses: {JSON.stringify(responses, null, 2)}</p>
                        </div> */}

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {form.fields.map((field, idx) => (
                                <div key={field.uid} className="space-y-2">
                                    <label className="block">
                                        <div className="font-medium text-gray-700">
                                            {idx + 1}. {field.label}
                                            {field.required && (
                                                <span className="text-red-500 ml-1">*</span>
                                            )}
                                        </div>

                                        <div className="mt-2">
                                            {/* short_answer - FIXED */}
                                            {field.type === 'short_answer' && (
                                                <input
                                                    type="text"
                                                    required={field.required}
                                                    placeholder={field.placeholder}
                                                    value={responses[field.uid] || ''}
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                                                    onChange={e => {
                                                        console.log(`Short answer change for ${field.uid}:`, e.target.value);
                                                        handleResponse(field.uid, e.target.value);
                                                    }}
                                                />
                                            )}

                                            {/* paragraph - FIXED */}
                                            {field.type === 'paragraph' && (
                                                <textarea
                                                    required={field.required}
                                                    placeholder={field.placeholder}
                                                    value={responses[field.uid] || ''}
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                                                    rows={4}
                                                    onChange={e => {
                                                        console.log(`Paragraph change for ${field.uid}:`, e.target.value);
                                                        handleResponse(field.uid, e.target.value);
                                                    }}
                                                />
                                            )}

                                            {/* multiple_choice - FIXED */}
                                            {field.type === 'multiple_choice' && (
                                                <div className="space-y-2">
                                                    {field.options.map((option, i) => (
                                                        <label key={i} className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                name={`field_${field.uid}`}
                                                                required={field.required}
                                                                checked={responses[field.uid] === option}
                                                                onChange={() => {
                                                                    console.log(`Multiple choice change for ${field.uid}:`, option);
                                                                    handleResponse(field.uid, option);
                                                                }}
                                                            />
                                                            <span>{option}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {/* dropdown - NEW */}
                                            {field.type === 'dropdown' && (
                                                <select
                                                    required={field.required}
                                                    value={responses[field.uid] || ''}
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                                                    onChange={e => handleResponse(field.uid, e.target.value)}
                                                >
                                                    <option value="">Select an option</option>
                                                    {field.options.map((option, i) => (
                                                        <option key={i} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {/* checkboxes - FIXED */}
                                            {field.type === 'checkboxes' && (
                                                <div className="space-y-2">
                                                    {field.options.map((option, i) => (
                                                        <label key={i} className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={(responses[field.uid] || []).includes(option)}
                                                                onChange={e => {
                                                                    const current = responses[field.uid] || [];
                                                                    let updated;
                                                                    if (e.target.checked) {
                                                                        updated = [...current, option];
                                                                    } else {
                                                                        updated = current.filter(v => v !== option);
                                                                    }
                                                                    console.log(`Checkbox change for ${field.uid}:`, updated);
                                                                    handleResponse(field.uid, updated);
                                                                }}
                                                            />
                                                            <span>{option}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {/* file_upload - FIXED */}
                                            {field.type === 'file_upload' && (
                                                <div className="space-y-4">
                                                    {field.content && (
                                                        <div className="text-gray-600">{field.content}</div>
                                                    )}
                                                    <div>
                                                        <input
                                                            type="file"
                                                            multiple={field.max_images > 1}
                                                            required={field.required && (!responses[field.uid] || responses[field.uid].length === 0)}
                                                            className="w-full"
                                                            onChange={e => {
                                                                const newFiles = Array.from(e.target.files);
                                                                const existing = responses[field.uid] || [];
                                                                const combined = [...existing, ...newFiles];
                                                                const limited = field.max_images ?
                                                                    combined.slice(0, field.max_images) : combined;
                                                                console.log(`File upload change for ${field.uid}:`, limited);
                                                                handleResponse(field.uid, limited);
                                                            }}
                                                        />
                                                    </div>

                                                    {responses[field.uid]?.length > 0 && (
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

                                            {/* image_upload - FIXED */}
                                            {/* {field.type === 'image_upload' && (
                                                <div className="space-y-4">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple={field.max_images > 1}
                                                        required={field.required && (!responses[field.uid] || responses[field.uid].length === 0)}
                                                        className="w-full"
                                                        onChange={e => {
                                                            const newFiles = Array.from(e.target.files);
                                                            const existing = responses[field.uid] || [];
                                                            const merged = [...existing, ...newFiles];
                                                            const limited = field.max_images ? merged.slice(0, field.max_images) : merged;
                                                            console.log(`Image upload change for ${field.uid}:`, limited);
                                                            handleResponse(field.uid, limited);
                                                        }}
                                                    />

                                                    {responses[field.uid]?.length > 0 && (
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

                                                    {(field.checkbox_options?.length > 0 || field.choice_options?.length > 0) && (
                                                        <div className="mt-4 p-4 bg-gray-50 rounded border">
                                                            {field.checkbox_options?.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <div className="font-medium">Select all that apply:</div>
                                                                    {field.checkbox_options.map((opt, i) => (
                                                                        <label key={i} className="flex items-center gap-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={(responses[`${field.uid}_checkboxes`] || []).includes(opt.label || opt)}
                                                                                onChange={e => {
                                                                                    const current = responses[`${field.uid}_checkboxes`] || [];
                                                                                    const optionValue = opt.label || opt;
                                                                                    let updated;
                                                                                    if (e.target.checked) {
                                                                                        updated = [...current, optionValue];
                                                                                    } else {
                                                                                        updated = current.filter(v => v !== optionValue);
                                                                                    }
                                                                                    handleResponse(`${field.uid}_checkboxes`, updated);
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
                                                                                checked={responses[`${field.uid}_choice`] === (opt.label || opt)}
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
                                            )} */}
                                            {field.type === 'image_upload' && (
                                                <div className="space-y-4">
                                                    {/* Display Admin Images if they exist */}
                                                    {field.enableAdminImages && field.adminImages?.length > 0 && (
                                                        <div className="mb-4">
                                                            <div className="text-sm font-medium text-gray-700 mb-2">Reference Images:</div>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                {field.adminImages.map((adminImg, index) => (
                                                                    <div key={adminImg.id || index} className="border rounded overflow-hidden">
                                                                        <img
                                                                            src={adminImg.url}
                                                                            alt={`Reference image ${index + 1}`}
                                                                            className="w-full h-24 object-cover"
                                                                            onError={(e) => {
                                                                                e.target.src = '/placeholder-image.jpg';
                                                                                console.error('Failed to load admin image:', adminImg.url);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                These are reference images provided by the form creator.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* User Upload Section */}
                                                    <div>
                                                        <div className="text-sm font-medium mb-2">
                                                            Upload your images {field.max_images > 1 ? `(up to ${field.max_images})` : ''}
                                                        </div>

                                                        {field.content && (
                                                            <p className="text-gray-600 text-sm mb-3">{field.content}</p>
                                                        )}

                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple={field.max_images > 1}
                                                            required={field.required && (!responses[field.uid] || responses[field.uid].length === 0)}
                                                            className="w-full p-2 border rounded"
                                                            onChange={e => {
                                                                const newFiles = Array.from(e.target.files);
                                                                const existing = responses[field.uid] || [];
                                                                const merged = [...existing, ...newFiles];
                                                                const limited = field.max_images ? merged.slice(0, field.max_images) : merged;
                                                                console.log(`Image upload change for ${field.uid}:`, limited);
                                                                handleResponse(field.uid, limited);
                                                            }}
                                                        />

                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Accepted formats: JPG, PNG, GIF, etc.
                                                        </p>
                                                    </div>

                                                    {/* Image Previews */}
                                                    {responses[field.uid]?.length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="text-sm font-medium mb-2">Your uploaded images:</div>
                                                            <div className="flex gap-4 flex-wrap">
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
                                                                        <div className="text-xs text-gray-500 mt-1 text-center">
                                                                            {file.name}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Checkbox and Multiple Choice Options */}
                                                    {(field.checkbox_options?.length > 0 || field.choice_options?.length > 0) && (
                                                        <div className="mt-4 p-4 bg-gray-50 rounded border">
                                                            {field.checkbox_options?.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <div className="font-medium">Select all that apply:</div>
                                                                    {field.checkbox_options.map((opt, i) => (
                                                                        <label key={i} className="flex items-center gap-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={(responses[`${field.uid}_checkboxes`] || []).includes(opt.label || opt)}
                                                                                onChange={e => {
                                                                                    const current = responses[`${field.uid}_checkboxes`] || [];
                                                                                    const optionValue = opt.label || opt;
                                                                                    let updated;
                                                                                    if (e.target.checked) {
                                                                                        updated = [...current, optionValue];
                                                                                    } else {
                                                                                        updated = current.filter(v => v !== optionValue);
                                                                                    }
                                                                                    handleResponse(`${field.uid}_checkboxes`, updated);
                                                                                }}
                                                                            />
                                                                            <span className="text-sm">{opt.label || opt}</span>
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
                                                                                checked={responses[`${field.uid}_choice`] === (opt.label || opt)}
                                                                                onChange={() => handleResponse(`${field.uid}_choice`, opt.label || opt)}
                                                                            />
                                                                            <span className="text-sm">{opt.label || opt}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* date - FIXED */}
                                            {field.type === 'date' && (
                                                <input
                                                    type="date"
                                                    required={field.required}
                                                    value={responses[field.uid] || ''}
                                                    className="p-2 border rounded"
                                                    onChange={e => {
                                                        console.log(`Date change for ${field.uid}:`, e.target.value);
                                                        handleResponse(field.uid, e.target.value);
                                                    }}
                                                />
                                            )}

                                            {/* time - FIXED */}
                                            {field.type === 'time' && (
                                                <input
                                                    type="time"
                                                    required={field.required}
                                                    value={responses[field.uid] || ''}
                                                    className="p-2 border rounded"
                                                    onChange={e => {
                                                        console.log(`Time change for ${field.uid}:`, e.target.value);
                                                        handleResponse(field.uid, e.target.value);
                                                    }}
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
                    </>
                )}
            </div>
        </div>
    )
}


