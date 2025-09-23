// src/api.js
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

// Create axios instance
const instance = axios.create({ baseURL: API_BASE, timeout: 20000 })

// Attach token if available
instance.interceptors.request.use(cfg => {
    const token = localStorage.getItem('gfc_token')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
})

/* ------------------ AUTH ------------------ */
export async function register(payload) {
    const response = await instance.post('/auth/register', payload)
    return response.data
}

export async function login(payload) {
    const response = await instance.post('/auth/login', payload)
    return response.data
}

/* ------------------ FORMS ------------------ */
export async function getMyForms() {
    const response = await instance.get('/forms')
    return response.data
}

export async function createForm(payload) {
    const response = await instance.post('/forms', payload)
    return response.data
}

export async function updateForm(formId, payload) {
    const response = await instance.put(`/forms/${formId}`, payload)
    return response.data
}

export async function deleteForm(formId) {
    const response = await instance.delete(`/forms/${formId}`)
    return response.data
}


export async function getForm(id) {
    const res = await instance.get(`/forms/${id}`);
    return res.data.form || res.data;  // ✅ support both shapes
}

export async function getFormByShare(formId) {
    const response = await instance.get(`/forms/${formId}/public`)
    return response.data
}

export async function submitForm(formId, formData) {
    console.log('Form data in api.js:', formData);

    // Debug FormData contents
    console.log('FormData contents in api.js:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    const response = await instance.post(
        `/forms/${formId}/responses`,
        formData,
        {
            headers: {
                // Don't set Content-Type manually for FormData
                // Let axios set it automatically with boundary
            }
        }
    );
    return response.data;
}


export async function getFormResponses(formId) {
    const response = await instance.get(`/forms/${formId}/responses`)
    return response.data
}

export async function getResponses(formId) {
    const response = await instance.get(`/forms/${formId}/responses`)
    return response.data
}

export async function fetchResponses(formId) {
    const response = await instance.get(`/forms/${formId}/responses`)
    return response.data
}

export function exportCSV(formId) {
    return `${instance.defaults.baseURL}/forms/${formId}/csv`
}

/* ------------------ OPTIONAL: GROUPED EXPORT ------------------ */
const api = {
    register,
    login,
    getMyForms,
    createForm,
    updateForm,
    deleteForm,
    getForm,
    getFormByShare,
    submitForm,
    getResponses,
    fetchResponses,
    exportCSV
}

export default api
