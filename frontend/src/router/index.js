import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Projects from '../views/Projects.vue'
import ProjectDetail from '../views/ProjectDetail.vue'
import NotFound from '../views/NotFound.vue'
import { useAuthStore } from '../stores/auth'
import Defects from '../views/Defects.vue'
import DefectDetail from '../views/DefectDetail.vue'


const routes = [
{ path: '/', redirect: '/projects' },
{ path: '/login', name: 'Login', component: Login, meta: { guest: true } },
{ path: '/register', name: 'Register', component: Register, meta: { guest: true } },
{
path: '/projects',
name: 'Projects',
component: Projects,
meta: { requiresAuth: true }
},
{
path: '/projects/:id',
name: 'ProjectDetail',
component: ProjectDetail,
meta: { requiresAuth: true }
},
{
  path: '/defects',
  name: 'Defects',
  component: Defects,
  meta: { requiresAuth: true }
},
{
  path: '/defects/:id',
  name: 'DefectDetail',
  component: DefectDetail,
  meta: { requiresAuth: true }
},
{ path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]


const router = createRouter({ history: createWebHistory(), routes })


router.beforeEach(async (to, from, next) => {
const auth = useAuthStore()
// if route is guest only, redirect when logged in
if (!auth.user && auth.token) {
// try to load user
await auth.loadMe()
}


const requiresAuth = to.meta.requiresAuth
const guest = to.meta.guest


if (requiresAuth && !auth.user) {
return next({ name: 'Login' })
}
if (guest && auth.user) {
return next({ name: 'Projects' })
}
return next()
})


export default router