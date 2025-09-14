export function setAuth(token, user) {
    localStorage.setItem('gfc_token', token)
    localStorage.setItem('gfc_user', JSON.stringify(user))
}

export function clearAuth() {
    localStorage.removeItem('gfc_token')
    localStorage.removeItem('gfc_user')
}

export function getUser() {
    try { return JSON.parse(localStorage.getItem('gfc_user')) } catch { return null }
}
