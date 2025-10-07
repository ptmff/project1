<template>
  <div>
    <NavBar />

    <section class="container">
      <button class="back-btn" @click="goBack">← Назад к проектам</button>

      <div class="project-header card-glass">
        <h1>{{ project?.name || 'Проект' }}</h1>
        <p class="desc">{{ project?.description }}</p>

        <div class="meta">
          <p>Статус: <strong>{{ project?.status }}</strong></p>
          <p>Создатель: {{ project?.creator?.username }}</p>
          <p v-if="project?.startDate">Начало: {{ pretty(project.startDate) }}</p>
          <p v-if="project?.endDate">Окончание: {{ pretty(project.endDate) }}</p>
        </div>
      </div>

      <h2>Этапы</h2>
      <div v-if="sortedStages.length === 0" class="no-stages">Нет этапов</div>

      <div class="stages">
        <StageItem
          v-for="s in sortedStages"
          :key="s.id"
          :stage="s"
          :can-edit="isManager"
          @updated="loadProject"
          @deleted="loadProject"
        />
      </div>

      <div v-if="isManager" class="card-glass add-stage">
        <h3>Добавить этап</h3>
        <label>Название
          <input v-model="newStage.name" required />
        </label>
        <label>Порядок
          <input type="number" v-model.number="newStage.order" />
        </label>
        <label>Статус
          <select v-model="newStage.status">
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </select>
        </label>
        <label>Описание
          <textarea v-model="newStage.description"></textarea>
        </label>
        <button class="btn-glass" @click="createStage">Добавить</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import NavBar from '../components/NavBar.vue'
import StageItem from '../components/StageItem.vue'
import http from '../api/http'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const project = ref(null)
const stages = ref([])
const newStage = ref({ name: '', description: '', order: 0, status: 'pending' })

const isManager = computed(() => auth.user?.role === 'manager')

// Сортировка этапов по полю order
const sortedStages = computed(() => {
  return [...stages.value].sort((a, b) => a.order - b.order)
})

function pretty(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

// Загрузка проекта и стадий
async function loadProject() {
  try {
    const res = await http.get(`/projects/${route.params.id}`)
    project.value = res.data
    stages.value = res.data.stages ? [...res.data.stages] : []
  } catch (e) {
    alert('Проект не найден')
    router.push({ name: 'Projects' })
  }
}

// Добавление нового этапа
async function createStage() {
  if (!newStage.value.name) return alert('Введите имя этапа')
  try {
    await http.post('/stages', {
      projectId: project.value.id,
      name: newStage.value.name,
      order: newStage.value.order,
      status: newStage.value.status,
      description: newStage.value.description
    })
    newStage.value = { name: '', description: '', order: 0, status: 'pending' }
    await loadProject()
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка создания этапа')
  }
}

// Кнопка «Назад»
function goBack() {
  router.push({ name: 'Projects' })
}

onMounted(async () => {
  await auth.loadMe()
  await loadProject()
})
</script>

<style scoped>
.container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-btn {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s;
}
.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.card-glass {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.project-header h1 {
  margin: 0;
}
.desc {
  margin: 6px 0 10px;
  color: #000;
}
.meta p {
  margin: 4px 0;
  color: #000;
  font-size: 14px;
}

.stages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.no-stages {
  color: #666;
  font-style: italic;
}

.add-stage label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  margin-bottom: 8px;
}
.add-stage input,
.add-stage textarea,
.add-stage select {
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.btn-glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  padding: 8px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-glass:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}
</style>
