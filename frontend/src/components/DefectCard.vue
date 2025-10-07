<template>
  <div class="card-glass defect-card">
    <div class="left">
      <h4>{{ defect.title }}</h4>
      <p class="meta-row">
        <span class="badge">Приоритет: {{ defect.priority }}</span>
        <span class="badge">Статус: {{ defect.status }}</span>
        <span v-if="defect.project">Проект: {{ defect.project.name }}</span>
        <span v-if="defect.stage">Этап: {{ defect.stage.name }}</span>
      </p>
      <p class="desc">{{ defect.description }}</p>
    </div>
    <div class="right">
      <button @click="$emit('edit', defect)">Открыть</button>
      <template v-if="canDelete">
        <button class="danger" @click="$emit('delete', defect)">Удалить</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({ defect: Object })
const auth = useAuthStore()
const canDelete = computed(()=> auth.user?.role === 'manager')
</script>

<style scoped>
.defect-card { display:flex; justify-content:space-between; gap:10px; padding:12px; border-radius:12px; }
.left { flex:1 }
.right { display:flex; flex-direction:column; gap:8px }
.badge { margin-right:8px; font-size:13px; color:#fff }
.desc { color:#eee; margin-top:8px }
button { padding:8px 12px; border-radius:10px; border:none; cursor:pointer; background: rgba(255,255,255,0.06) }
button.danger { background: rgba(255,80,80,0.9); color:#fff }
</style>
