// axios instance + token handling
import axios from 'axios'
import { useAuthStore } from '../stores/auth'


const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'


const http = axios.create({
baseURL: API_BASE,
timeout: 10000,
})


// attach token
http.interceptors.request.use((config) => {
const auth = useAuthStore()
if (auth.token) {
config.headers = config.headers || {}
config.headers.Authorization = `Bearer ${auth.token}`
}
return config
})


http.interceptors.response.use(
(res) => res,
(err) => {
// basic global handling
if (err.response && err.response.status === 401) {
const auth = useAuthStore()
auth.logout()
// router push will be done by caller if needed
}
return Promise.reject(err)
}
)


export default http