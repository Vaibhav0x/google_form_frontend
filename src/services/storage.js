// simple localStorage-based persistence used for Milestone 1
import { v4 as uuidv4 } from 'uuid'

const LS_USERS = 'gfc_users_v1'
const LS_CURRENT = 'gfc_current_v1'
const LS_FORMS = 'gfc_forms_v1'
const LS_RESPONSES = 'gfc_responses_v1'

function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') }
    catch { return null }
}
function write(key, v) { localStorage.setItem(key, JSON.stringify(v)) }

// seed admin
if (!read(LS_USERS)) {
    write(LS_USERS, [{ id: uuidv4(), name: 'Admin', email: 'admin@gmail.com', password: 'admin' }])
}

export const storage = {
    findUser(email, password) {
        const users = read(LS_USERS) || []
        return users.find(u => u.email === email && u.password === password) || null
    },
    createUser({ name, email, password }) {
        const users = read(LS_USERS) || []
        const u = { id: uuidv4(), name, email, password }
        users.push(u)
        write(LS_USERS, users)
        return u
    },
    setCurrentUser(user) { write(LS_CURRENT, user) },
    getCurrentUser() { return read(LS_CURRENT) },
    clearCurrentUser() { localStorage.removeItem(LS_CURRENT) },

    // forms
    getForms() { return read(LS_FORMS) || [] },
    saveForm(form) {
        const forms = read(LS_FORMS) || []
        const existing = forms.find(f => f.id === form.id)
        if (existing) {
            const idx = forms.findIndex(f => f.id === form.id)
            forms[idx] = form
        } else {
            forms.push(form)
        }
        write(LS_FORMS, forms)
    },
    deleteForm(id) {
        const forms = (read(LS_FORMS) || []).filter(f => f.id !== id)
        write(LS_FORMS, forms)
        // also remove responses for that form
        const responses = (read(LS_RESPONSES) || []).filter(r => r.formId !== id)
        write(LS_RESPONSES, responses)
    },

    // responses (admin can view these)
    addResponse(formId, values, user) {
        const responses = read(LS_RESPONSES) || []
        responses.push({ id: uuidv4(), formId, values, user, createdAt: Date.now() })
        write(LS_RESPONSES, responses)
    },
    getResponsesForForm(formId) {
        return (read(LS_RESPONSES) || []).filter(r => r.formId === formId)
    }
}