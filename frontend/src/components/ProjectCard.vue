<template>
  <div class="card">
    <h3>{{ project.name }}</h3>
    <p class="desc">{{ project.description }}</p>

    <div class="meta">
      <span>Статус: <strong>{{ project.status || '-' }}</strong></span>
      <span v-if="project.startDate">• Начало: {{ pretty(project.startDate) }}</span>
      <span v-if="project.endDate">• Окончание: {{ pretty(project.endDate) }}</span>
    </div>

    <!-- Этапы -->
    <div class="stages-preview" v-if="sortedStages.length">
      <div class="stages-title">Этапы ({{ sortedStages.length }})</div>
      <ul>
        <li v-for="s in sortedStages" :key="s.id">
          {{ s.order }}. {{ s.name }} <small>({{ s.status }})</small>
        </li>
      </ul>
    </div>
    <div v-else class="no-stages">Этапы отсутствуют</div>

    <div class="actions">
      <slot name="actions">
        <router-link :to="{ name: 'ProjectDetail', params: { id: project.id } }">Открыть</router-link>
        <template v-if="isManager">
          <button @click="$emit('edit-project', project)">✏️</button>
          <button @click="$emit('delete-project', project)">🗑️</button>
        </template>
      </slot>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({ project: Object })
const auth = useAuthStore()

// Реактивно проверяем роль
const isManager = computed(() => auth.user?.role === 'manager')

// Сортировка этапов по полю "order" (по возрастанию)
const sortedStages = computed(() => {
  return (props.project.stages || []).slice().sort((a, b) => a.order - b.order)
})

function pretty(d) {
  return d ? dayjs(d).format('YYYY-MM-DD') : '-'
}
</script>

<style scoped>
.card {
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #000;
}

.desc {
  color: #000;
  margin: 0;
}

.meta {
  font-size: 13px;
  color: #000;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stages-preview {
  font-size: 13px;
  color: #000;
}

.stages-preview ul {
  margin: 6px 0 0 18px;
  padding: 0;
  list-style: decimal;
}

.stages-preview li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

.actions a,
.actions button {
  color: #000;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.actions button:hover,
.actions a:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.no-stages {
  color: #555;
  font-size: 13px;
}
</style>
