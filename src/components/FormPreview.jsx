import React from 'react'

export default function FormPreview({ title, description, fields = [] }) {
    return (
        <div className="bg-white p-6 rounded shadow h-full overflow-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-purple-700">{title || 'Untitled Form'}</h2>
                {description && <div className="text-sm text-slate-600">{description}</div>}
            </div>

            <div className="space-y-6">
                {fields.map((f, idx) => (
                    <div key={f.uid} className="p-4 border rounded">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">{idx + 1}. {f.label || 'Untitled question'}</div>
                                {f.required && <div className="text-xs text-red-500">Required</div>}
                            </div>
                        </div>

                        <div className="mt-3">
                            {f.type === 'short_answer' && <input disabled placeholder={f.placeholder || 'Short answer'} className="w-full p-2 border-b" />}
                            {f.type === 'paragraph' && <textarea disabled placeholder={f.placeholder || 'Long answer'} className="w-full p-2 border rounded" />}
                            {f.type === 'multiple_choice' && (f.options || []).map((o, i) => (
                                <label key={i} className="block">
                                    <input type="radio" disabled name={`q_${f.uid}`} />
                                    <span className="ml-2">{typeof o === 'string' ? o : o.label || 'Untitled option'}</span>
                                </label>
                            ))}
                            {f.type === 'checkboxes' && (f.options || []).map((o, i) => (
                                <label key={i} className="block">
                                    <input type="checkbox" disabled />
                                    <span className="ml-2">{typeof o === 'string' ? o : o.label || 'Untitled option'}</span>
                                </label>
                            ))}
                            {f.type === 'dropdown' && (
                                <select disabled className="p-2 border rounded">
                                    <option>Choose...</option>
                                    {(f.options || []).map((o, i) => (
                                        <option key={i}>{typeof o === 'string' ? o : o.label || 'Untitled option'}</option>
                                    ))}
                                </select>
                            )}
                            {f.type === 'date' && <input disabled type="date" className="p-2 border rounded" />}
                            {f.type === 'time' && <input disabled type="time" className="p-2 border rounded" />}
                            {f.type === 'file_upload' && (
                                <input disabled type="file" className="p-2" />
                            )}
                            {f.type === 'image_upload' && (
                                <div className="space-y-4">
                                    {/* Content display */}
                                    {f.content && (
                                        <div className="mb-4">
                                            {f.content}
                                        </div>
                                    )}

                                    {/* Image upload input */}
                                    <div>
                                        <input
                                            type="file"
                                            multiple={f.max_images > 1}
                                            accept="image/*"
                                            disabled
                                            className="p-2"
                                        />
                                        <div className="text-sm text-slate-500">
                                            Maximum {f.max_images || 1} {f.max_images === 1 ? 'image' : 'images'} allowed
                                        </div>
                                    </div>

                                    {/* Image preview placeholder */}
                                    <div className="border rounded p-4 bg-gray-50">
                                        <div className="text-sm text-slate-500 italic">Images will be displayed here</div>
                                    </div>

                                    {/* Options for all uploaded images */}
                                    {(f.checkbox_options?.length > 0 || f.choice_options?.length > 0) && (
                                        <div className="mt-4 border rounded p-4 bg-gray-50">
                                            <div className="text-sm text-slate-500 italic mb-3">For all uploaded images:</div>

                                            {/* Checkbox options */}
                                            {f.checkbox_options?.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="font-medium">Select all that apply:</div>
                                                    {f.checkbox_options.map((opt, i) => (
                                                        <label key={opt.id || i} className="flex items-center gap-2">
                                                            <input type="checkbox" disabled />
                                                            <span>{opt.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Multiple choice question */}
                                            {f.choice_options?.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <div className="font-medium">{f.choice_question || 'Select one:'}</div>
                                                    {f.choice_options.map((opt, i) => (
                                                        <label key={opt.id || i} className="flex items-center gap-2">
                                                            <input type="radio" disabled name="preview_choice" />
                                                            <span>{opt.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {f.type === 'image' && (
                                <div className="relative">
                                    {f.imageUrl ? (
                                        <>
                                            <img src={f.imageUrl} alt={f.label} className="max-w-full h-auto" />
                                            {f.annotations?.map((anno, i) => (
                                                <div
                                                    key={anno.id}
                                                    className="absolute border-2 border-blue-500 bg-blue-100/50"
                                                    style={{
                                                        left: `${anno.x}%`,
                                                        top: `${anno.y}%`,
                                                        width: `${anno.width}px`,
                                                        height: `${anno.height}px`
                                                    }}
                                                >
                                                    {anno.type === 'text' && (
                                                        <input
                                                            type="text"
                                                            placeholder="Your answer"
                                                            className="w-full h-full p-1 bg-transparent"
                                                            disabled
                                                        />
                                                    )}
                                                    {anno.type === 'multiple_choice' && (
                                                        <div className="p-1">
                                                            <select disabled className="w-full bg-transparent">
                                                                <option>Choose...</option>
                                                                {anno.options?.map(opt => (
                                                                    <option key={opt.id}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                    {anno.type === 'hotspot' && (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <input type="checkbox" disabled />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="text-sm text-slate-500 italic">Image (admin preview)</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <button className="bg-purple-600 text-white px-4 py-2 rounded">Send</button>
            </div>
        </div>
    )
}
