<!-- src/App.vue -->
<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

// при загрузке приложения попробуем восстановить сессию
onMounted(async () => {
  if (auth.token && !auth.user) {
    await auth.loadMe()
    // если не авторизован — оставим текущую страницу (login/other)
  }
})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  background: linear-gradient(135deg, #f0f4f8, #ffffff);
  color: #1a1a1a;
}

a {
  color: #0ea5e9;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  background: #0ea5e9;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

button:hover {
  background: #0284c7;
  transform: translateY(-1px);
}
</style>
