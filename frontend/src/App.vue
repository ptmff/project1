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
html,body,#app { height:100%; margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial; background:#f7f8fa; color:#111 }
</style>
