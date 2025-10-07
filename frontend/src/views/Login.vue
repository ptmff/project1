<template>
<div class="auth-page">
<NavBar />
<form @submit.prevent="onSubmit" class="card">
<h2>Вход</h2>
<label>Username<input v-model="username" required /></label>
<label>Password<input type="password" v-model="password" required /></label>
<button type="submit">Войти</button>
<p class="note">Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link></p>
<p v-if="error" class="error">{{ error }}</p>
</form>
</div>
</template>


<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import NavBar from '../components/NavBar.vue'


const auth = useAuthStore()
const username = ref('')
const password = ref('')
const error = ref('')


async function onSubmit() {
error.value = ''
try {
await auth.login({ username: username.value, password: password.value })
// redirect handled in store or router guard
// go to projects
window.location.href = '/projects'
} catch (e) {
error.value = e.response?.data?.message || 'Ошибка входа'
}
}
</script>


<style scoped>
.auth-page { display:flex; gap:20px; padding:20px }
.card{ max-width:420px; padding:20px; border:1px solid #eee; border-radius:8px }
.error{ color:crimson }
</style>