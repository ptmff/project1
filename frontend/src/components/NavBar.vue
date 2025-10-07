<template>
<nav class="nav">
<div class="left">
<router-link to="/projects">Проекты</router-link>
</div>
<div class="right">
<template v-if="auth.user">
<span>{{ auth.user.username }} ({{ auth.user.role }})</span>
<button @click="logout">Выйти</button>
</template>
<template v-else>
<router-link to="/login">Войти</router-link>
<router-link to="/register">Регистрация</router-link>
</template>
</div>
</nav>
</template>


<script setup>
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
function logout(){ auth.logout() }
</script>


<style scoped>
.nav{ display:flex; justify-content:space-between; padding:12px 20px; border-bottom:1px solid #eee }
.left a{ margin-right:12px }
</style>