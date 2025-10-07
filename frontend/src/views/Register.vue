<template>
<div class="auth-page">
<NavBar />
<form @submit.prevent="onSubmit" class="card">
<h2>Регистрация</h2>
<label>Username<input v-model="username" minlength="3" required /></label>
<label>Password<input type="password" v-model="password" minlength="6" required /></label>
<label>Role
<select v-model="role">
<option value="observer">Наблюдатель</option>
<option value="engineer">Инженер</option>
<option value="manager">Менеджер</option>
</select>
</label>
<button type="submit">Зарегистрироваться</button>
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
const role = ref('observer')
const error = ref('')


async function onSubmit() {
error.value = ''
try {
await auth.register({ username: username.value, password: password.value, role: role.value })
window.location.href = '/projects'
} catch (e) {
error.value = e.response?.data?.message || 'Ошибка регистрации'
}
}
</script>


<style scoped>
.card{ max-width:420px; padding:20px }
.error{ color:crimson }
</style>