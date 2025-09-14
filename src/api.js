import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'
const instance = axios.create({ baseURL: API_BASE, timeout: 20000 })

instance.interceptors.request.use(cfg => {
    const token = localStorage.getItem('gfc_token')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
})

export async function register(payload) { return instance.post('/auth/register', payload).then(r => r.data) }
export async function login(payload) { return instance.post('/auth/login', payload).then(r => r.data) }

export async function getMyForms() { return instance.get('/forms').then(r => r.data) }
export async function createForm(payload) { return instance.post('/forms', payload).then(r => r.data) }
export async function updateForm(formId, payload) { return instance.put(`/forms/${formId}`, payload).then(r => r.data) }
export async function deleteForm(formId) { return instance.delete(`/forms/${formId}`).then(r => r.data) }
export async function getForm(formId) { return instance.get(`/forms/${formId}`).then(r => r.data) }
export async function getFormByShare(uuid) { return instance.get(`/forms/share/uuid/${uuid}`).then(r => r.data) }

export async function submitForm(formId, answers, files) {
    // answers is array of { field_id, value }
    const formData = new FormData()
    formData.append('answers', JSON.stringify(answers))
    formData.append('submitter_name', localStorage.getItem('gfc_submitter_name') || '')
    formData.append('submitter_email', localStorage.getItem('gfc_submitter_email') || '')

    // files: array of { fieldId, file }
    if (Array.isArray(files)) {
        for (const f of files) {
            formData.append(`field_${f.fieldId}`, f.file)
        }
    }
    // use full server URL since submit endpoint is at /api/forms/:id/submit
    const url = `${instance.defaults.baseURL.replace('/api', '')}/api/forms/${formId}/submit`
    return axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}

export async function getResponses(formId) { return instance.get(`/forms/${formId.replace('/', '')}`).then(r => r.data) /* not used directly */ }
export async function fetchResponses(formId) { return axios.get(`${instance.defaults.baseURL.replace('/api', '')}/api/forms/${formId}`).then(r => r.data) }

export async function exportCSV(formId) {
    const url = `${instance.defaults.baseURL.replace('/api', '')}/api/forms/${formId}/csv`
    // return full url to call (GET) so browser can download with link
    return url
}
