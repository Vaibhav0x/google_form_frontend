import React from 'react';

export default function FormSettings({ form, onChange }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h3 className="text-lg font-medium mb-4">Form Settings</h3>

            <div className="space-y-4">
                {/* Basic Settings */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-2">Form Title</label>
                        <input
                            type="text"
                            value={form.title || ''}
                            onChange={(e) => onChange({ ...form, title: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="Enter form title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            value={form.description || ''}
                            onChange={(e) => onChange({ ...form, description: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="Enter form description"
                            rows="3"
                        />
                    </div>
                </div>

                {/* Submission Settings */}
                <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Submission Settings</h4>
                    <div className="space-y-3">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!form.allow_multiple_responses}
                                onChange={(e) => onChange({
                                    ...form,
                                    allow_multiple_responses: !e.target.checked
                                })}
                                className="rounded text-blue-600"
                            />
                            <div>
                                <div className="text-sm font-medium">Prevent Multiple Submissions</div>
                                <div className="text-xs text-gray-500">Users can only submit this form once</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.require_email}
                                onChange={(e) => onChange({
                                    ...form,
                                    require_email: e.target.checked
                                })}
                                className="rounded text-blue-600"
                            />
                            <div>
                                <div className="text-sm font-medium">Require Email</div>
                                <div className="text-xs text-gray-500">Users must provide their email to submit</div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}