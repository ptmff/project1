<template>
  <div class="auth-page">
    <form @submit.prevent="onSubmit" class="card">
      <h2>Добро пожаловать 👋</h2>
      <p class="subtitle">Войдите, чтобы продолжить</p>

      <div class="form-group">
        <label>Имя пользователя</label>
        <input v-model="username" placeholder="Введите имя" required />
      </div>

      <div class="form-group">
        <label>Пароль</label>
        <input type="password" v-model="password" placeholder="Введите пароль" required />
      </div>

      <button type="submit" class="btn-primary">Войти</button>

      <p class="note">
        Нет аккаунта?
        <router-link to="/register">Зарегистрироваться</router-link>
      </p>

      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const username = ref('')
const password = ref('')
const error = ref('')

async function onSubmit() {
  error.value = ''
  try {
    await auth.login({ username: username.value, password: password.value })
    window.location.href = '/projects'
  } catch (e) {
    error.value = e.response?.data?.message || 'Ошибка входа'
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: radial-gradient(circle at 20% 20%, #243b55, #141e30);
  background-attachment: fixed;
  animation: gradientMove 10s ease infinite alternate;
  font-family: 'Inter', system-ui, sans-serif;
  color: #222;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  padding: 40px 50px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  text-align: center;
  width: 100%;
  max-width: 400px;
  color: #fff;
  animation: fadeIn 1s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

h2 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 5px;
}

.subtitle {
  color: #ccc;
  font-size: 15px;
  margin-bottom: 25px;
}

.form-group {
  text-align: left;
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #ddd;
}

input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 15px;
  outline: none;
  transition: background 0.2s, box-shadow 0.2s;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

input:focus {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: #fff;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 114, 255, 0.4);
}

.note {
  margin-top: 18px;
  font-size: 14px;
  color: #ccc;
}

.note a {
  color: #00c6ff;
  text-decoration: none;
  transition: color 0.2s;
}

.note a:hover {
  color: #fff;
}

.error {
  margin-top: 12px;
  color: #ff8080;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 8px;
  padding: 8px;
  font-size: 14px;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
</style>
