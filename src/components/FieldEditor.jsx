import React, { useState, useRef } from 'react'

export default function FieldEditor({ field, onChange }) {
    const [imagePreview, setImagePreview] = useState(field.imageUrl || null)
    const [adminImagePreviews, setAdminImagePreviews] = useState(field.adminImages || [])
    const [selectedAnnotation, setSelectedAnnotation] = useState(null)
    const imageRef = useRef(null)
    const adminImageInputRef = useRef(null)

    function set(key, value) { onChange({ [key]: value }) }

    function addOption() {
        const opts = Array.isArray(field.options) ? field.options : []
        const newOption = { id: Date.now(), label: 'Option' }
        set('options', [...opts, newOption])
    }

    function handleImageUpload(e) {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImagePreview(e.target.result)
                set('imageUrl', e.target.result)
                set('annotations', [])
            }
            reader.readAsDataURL(file)
        }
    }

    function addAnnotation(type) {
        const annotations = Array.isArray(field.annotations) ? [...field.annotations] : []
        const newAnnotation = {
            id: Date.now(),
            type,
            x: 50,
            y: 50,
            width: type === 'hotspot' ? 20 : 100,
            height: type === 'hotspot' ? 20 : 40,
            options: type === 'multiple_choice' ? [{ id: Date.now(), label: 'Option 1' }] : []
        }
        set('annotations', [...annotations, newAnnotation])
    }

    function updateOption(i, val) {
        const opts = Array.isArray(field.options) ? [...field.options] : []
        const updatedOpt = typeof opts[i] === 'string' ? { id: Date.now(), label: val } : { ...opts[i], label: val }
        const newOpts = [...opts]
        newOpts[i] = updatedOpt
        set('options', newOpts)
    }

    function removeOption(i) {
        const opts = Array.isArray(field.options) ? [...field.options] : []
        set('options', opts.filter((_, idx) => idx !== i))
    } return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <label className="text-sm">Required</label>
                <input type="checkbox" checked={!!field.required} onChange={e => set('required', e.target.checked)} />
            </div>

            {['short_answer', 'paragraph', 'date', 'time'].includes(field.type) && (
                <input value={field.placeholder || ''} onChange={e => set('placeholder', e.target.value)} placeholder="Placeholder (optional)" className="w-full p-2 border rounded mb-2" />
            )}

            {field.type === 'file_upload' && (
                <input value={field.placeholder || ''} onChange={e => set('placeholder', e.target.value)} placeholder="Placeholder (optional)" className="w-full p-2 border rounded mb-2" />
            )}

            {field.type === 'image_upload' && (
                <div className="space-y-4">
                    {/* Admin Images Section */}
                    <div className="border-b pb-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm font-medium">Enable Admin Images</label>
                            <input
                                type="checkbox"
                                checked={field.enableAdminImages}
                                onChange={e => set('enableAdminImages', e.target.checked)}
                            />
                        </div>

                        {field.enableAdminImages && (
                            <div className="space-y-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    ref={adminImageInputRef}
                                    onChange={e => {
                                        const files = Array.from(e.target.files);
                                        const readers = files.map(file => {
                                            return new Promise((resolve) => {
                                                const reader = new FileReader();
                                                reader.onload = (e) => resolve(e.target.result);
                                                reader.readAsDataURL(file);
                                            });
                                        });

                                        Promise.all(readers).then(results => {
                                            const newImages = results.map(dataUrl => ({
                                                id: Date.now() + Math.random(),
                                                url: dataUrl
                                            }));
                                            const updatedImages = [...(field.adminImages || []), ...newImages];
                                            set('adminImages', updatedImages);
                                            setAdminImagePreviews(updatedImages);
                                        });
                                    }}
                                    className="mb-2"
                                />

                                <div className="grid grid-cols-3 gap-4">
                                    {(field.adminImages || []).map((img, index) => (
                                        <div key={img.id} className="relative">
                                            <img
                                                src={img.url}
                                                alt={`Admin uploaded ${index + 1}`}
                                                className="w-full h-32 object-cover rounded"
                                            />
                                            <button
                                                onClick={() => {
                                                    const updatedImages = field.adminImages.filter(i => i.id !== img.id);
                                                    set('adminImages', updatedImages);
                                                    setAdminImagePreviews(updatedImages);
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content input field */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Content</label>
                        <input
                            type="text"
                            value={field.content || ''}
                            onChange={e => set('content', e.target.value)}
                            placeholder="Enter content for this image upload field"
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="text-sm">Maximum images allowed:</label>
                        <input
                            type="number"
                            min="1"
                            value={field.max_images || 1}
                            onChange={e => set('max_images', Math.max(1, parseInt(e.target.value)))}
                            className="w-20 p-2 border rounded"
                        />
                    </div>

                    {/* Options for all uploaded images */}
                    <div className="border-t pt-4">
                        <div className="text-lg font-medium mb-4">Options for All Uploaded Images</div>

                        {/* Checkbox options section */}
                        <div className="mb-6">
                            <div className="text-sm font-medium mb-2">Checkbox Options (Select all that apply)</div>
                            <div className="space-y-2">
                                {(field.checkbox_options || []).map((opt, i) => (
                                    <div key={opt.id || i} className="flex gap-2">
                                        <input
                                            value={typeof opt === 'string' ? opt : (opt.label || '')}
                                            onChange={e => {
                                                const opts = [...(field.checkbox_options || [])];
                                                opts[i] = { id: opts[i].id || Date.now(), label: e.target.value };
                                                set('checkbox_options', opts);
                                            }}
                                            className="flex-1 p-2 border rounded"
                                            placeholder="Checkbox option text"
                                        />
                                        <button
                                            onClick={() => {
                                                const opts = [...(field.checkbox_options || [])];
                                                opts.splice(i, 1);
                                                set('checkbox_options', opts);
                                            }}
                                            className="px-2 py-1 border rounded text-red-600"
                                        >x</button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const opts = [...(field.checkbox_options || [])];
                                        opts.push({ id: Date.now(), label: '' });
                                        set('checkbox_options', opts);
                                    }}
                                    className="px-3 py-1 border rounded"
                                >+ Add checkbox option</button>
                            </div>
                        </div>

                        {/* Multiple choice (radio) section */}
                        <div className="mb-4">
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Multiple Choice Question (Select one)</label>
                                    <input
                                        value={field.choice_question || ''}
                                        onChange={e => set('choice_question', e.target.value)}
                                        placeholder="Enter your question for all images"
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                {(field.choice_options || []).map((opt, i) => (
                                    <div key={opt.id || i} className="flex gap-2">
                                        <input
                                            value={typeof opt === 'string' ? opt : (opt.label || '')}
                                            onChange={e => {
                                                const opts = [...(field.choice_options || [])];
                                                opts[i] = { id: opts[i].id || Date.now(), label: e.target.value };
                                                set('choice_options', opts);
                                            }}
                                            className="flex-1 p-2 border rounded"
                                            placeholder="Choice option text"
                                        />
                                        <button
                                            onClick={() => {
                                                const opts = [...(field.choice_options || [])];
                                                opts.splice(i, 1);
                                                set('choice_options', opts);
                                            }}
                                            className="px-2 py-1 border rounded text-red-600"
                                        >x</button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const opts = [...(field.choice_options || [])];
                                        opts.push({ id: Date.now(), label: '' });
                                        set('choice_options', opts);
                                    }}
                                    className="px-3 py-1 border rounded"
                                >+ Add choice option</button>
                            </div>
                        </div>

                        <div className="text-sm text-slate-500 italic mt-2">
                            Note: These options will apply to all images uploaded in this field
                        </div>
                    </div>
                </div>
            )}

            {field.type === 'image' && (
                <div className="space-y-4">
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="mb-2"
                        />
                        {imagePreview && (
                            <div className="relative border rounded p-2">
                                <img
                                    ref={imageRef}
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-w-full h-auto"
                                />
                                {field.annotations?.map((anno, i) => (
                                    <div
                                        key={anno.id}
                                        className="absolute border-2 border-blue-500 bg-blue-100/50"
                                        style={{
                                            left: `${anno.x}%`,
                                            top: `${anno.y}%`,
                                            width: `${anno.width}px`,
                                            height: `${anno.height}px`,
                                            cursor: 'move'
                                        }}
                                        onClick={() => setSelectedAnnotation(anno)}
                                    >
                                        {anno.type === 'text' && <div className="text-xs">Text Input</div>}
                                        {anno.type === 'multiple_choice' && <div className="text-xs">Multiple Choice</div>}
                                        {anno.type === 'hotspot' && <div className="text-xs">⭐</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {imagePreview && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Add Annotations:</div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => addAnnotation('text')}
                                    className="px-3 py-1 border rounded"
                                >
                                    + Add Text Input
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addAnnotation('multiple_choice')}
                                    className="px-3 py-1 border rounded"
                                >
                                    + Add Multiple Choice
                                </button>
                                <button
                                    type="button"
                                    onClick={() => addAnnotation('hotspot')}
                                    className="px-3 py-1 border rounded"
                                >
                                    + Add Hotspot
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {['multiple_choice', 'checkboxes', 'dropdown'].includes(field.type) && (
                <div>
                    <div className="text-sm font-medium mb-2">Options</div>
                    {(field.options || []).map((opt, i) => (
                        <div key={opt.id || i} className="flex gap-2 mb-2">
                            <input
                                value={typeof opt === 'string' ? opt : (opt.label || '')}
                                onChange={e => updateOption(i, e.target.value)}
                                className="flex-1 p-2 border rounded"
                                placeholder="Option text"
                            />
                            <button
                                onClick={() => removeOption(i)}
                                className="px-2 py-1 border rounded text-red-600"
                                type="button"
                            >x</button>
                        </div>
                    ))}
                    <button onClick={addOption} className="px-3 py-1 border rounded">+ Add option</button>
                </div>
            )}
        </div>
    )
}
