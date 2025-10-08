<template>
  <div class="card-glass defect-card">
    <div class="left">
      <h4>{{ defect.title }}</h4>
      <p class="meta-row">
        <span class="badge priority">{{ defect.priority }}</span>
        <span class="badge status">{{ defect.status }}</span>
        <span v-if="defect.project" class="badge project">Проект: {{ defect.project.name }}</span>
        <span v-if="defect.stage" class="badge stage">Этап: {{ defect.stage.name }}</span>
      </p>
      <p class="desc">{{ defect.description }}</p>
    </div>
    <div class="right">
      <button class="btn-glass" @click="$emit('edit', defect)">Открыть</button>
      <template v-if="canDelete">
        <button class="btn-glass danger" @click="$emit('delete', defect)">Удалить</button>
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
.defect-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.defect-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.25);
}

.left { flex: 1 }

.right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

h4 {
  margin: 0 0 8px;
  color: #fff;
  font-size: 18px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
}

.badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  color: #fff;
}

.badge.priority { background: #43e97b; }   /* зеленый для приоритета */
.badge.status { background: #00c6ff; }     /* голубой для статуса */
.badge.project { background: #ffa500; }    /* оранжевый для проекта */
.badge.stage { background: #ff6b81; }      /* красный для этапа */

.desc {
  color: #eee;
  margin-top: 8px;
  font-size: 14px;
}

.btn-glass {
  padding: 8px 14px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  background: rgba(255,255,255,0.1);
  color: #fff;
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-glass:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.2);
}

.btn-glass.danger {
  background: rgba(255,80,80,0.9);
  color: #fff;
}
</style>
