import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '../api/http'
import router from '../router'


export const useAuthStore = defineStore('auth', () => {
const token = ref(localStorage.getItem('token') || '')
const user = ref(null) // { id, username, role }


function saveToken(t) {
token.value = t
localStorage.setItem('token', t)
}


async function loadMe() {
if (!token.value) return null
try {
const res = await http.get('/protected/me')
user.value = res.data.user
return user.value
} catch (e) {
logout()
return null
}
}


async function login({ username, password }) {
const res = await http.post('/auth/login', { username, password })
saveToken(res.data.token)
await loadMe()
return res
}


async function register(payload) {
// register then auto-login (good UX)
await http.post('/auth/register', payload)
// auto-login
return login({ username: payload.username, password: payload.password })
}


function logout() {
token.value = ''
user.value = null
localStorage.removeItem('token')
router.push({ name: 'Login' })
}


return { token, user, saveToken, loadMe, login, register, logout }
})