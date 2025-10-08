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
  padding: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  color: #f5f5f5;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.35);
}

h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.3px;
}

.desc {
  color: #ddd;
  margin: 4px 0 0;
  line-height: 1.5;
  font-size: 14px;
}

.meta {
  font-size: 13px;
  color: #aaa;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta strong {
  color: #43e97b;
  font-weight: 600;
}

.stages-preview {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
  color: #ccc;
}

.stages-title {
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.stages-preview ul {
  margin: 0 0 0 18px;
  padding: 0;
  list-style: decimal;
}

.stages-preview li {
  margin: 2px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stages-preview small {
  color: #8fe3ff;
}

.no-stages {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.actions {
  margin-top: auto;
  display: flex;
  gap: 10px;
  align-items: center;
}

.actions a,
.actions button {
  color: #fff;
  background: linear-gradient(135deg, #0072ff, #00c6ff);
  border: none;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.actions button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions a:hover,
.actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 114, 255, 0.4);
}

.actions button:nth-child(2) {
  background: linear-gradient(135deg, #ff758c, #ff7eb3);
}

.actions button:nth-child(3) {
  background: linear-gradient(135deg, #f85032, #e73827);
}
</style>
