<template>
  <nav class="nav">
    <div class="left">
      <router-link to="/projects">Проекты</router-link>
      <router-link to="/defects">Дефекты</router-link>
    </div>

    <div class="right">
      <template v-if="auth.user">
        <span class="user">{{ auth.user.username }} <small>({{ auth.user.role }})</small></span>
        <button @click="logout" class="logout-btn">Выйти</button>
      </template>
      <template v-else>
        <router-link class="link" to="/login">Войти</router-link>
        <router-link class="link" to="/register">Регистрация</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()

function logout() {
  auth.logout()
}
</script>

<style scoped>
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px;
  backdrop-filter: blur(15px);
  background: rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 25px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
}

.left, .right {
  display: flex;
  align-items: center;
  gap: 20px;
}

a {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  position: relative;
  transition: color 0.2s;
}

a::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 0%;
  height: 2px;
  background: linear-gradient(90deg, #00c6ff, #0072ff);
  transition: width 0.3s ease;
  border-radius: 2px;
}

a:hover::after {
  width: 100%;
}

a:hover {
  color: #00c6ff;
}

.user {
  font-weight: 500;
  color: #e0e0e0;
}

.user small {
  color: #aaa;
}

.logout-btn {
  background: linear-gradient(135deg, #ff4b2b, #ff416c);
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 65, 108, 0.4);
}

.link {
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 114, 255, 0.4);
}

@media (max-width: 640px) {
  .nav {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 20px;
    gap: 10px;
  }

  .left, .right {
    flex-wrap: wrap;
    gap: 12px;
  }

  .logout-btn, .link {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
