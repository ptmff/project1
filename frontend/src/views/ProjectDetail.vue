<template>
  <div class="page">
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
.page {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #243b55, #141e30);
  color: #f5f5f5;
  font-family: 'Inter', system-ui, sans-serif;
}


.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #f5f5f5;
  font-family: 'Inter', system-ui, sans-serif;
  animation: fadeIn 0.6s ease;
}

/* Кнопка "Назад" */
.back-btn {
  align-self: flex-start;
  background: linear-gradient(135deg, rgba(0, 114, 255, 0.3), rgba(0, 198, 255, 0.3));
  backdrop-filter: blur(12px);
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.back-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 198, 255, 0.4);
}

/* Карточки (стеклянные блоки) */
.card-glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
  padding: 24px;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-glass:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 38px rgba(0, 0, 0, 0.35);
}

/* Заголовок проекта */
.project-header h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 600;
  color: #fff;
}

.desc {
  margin: 10px 0 14px;
  color: #ddd;
  font-size: 15px;
  line-height: 1.6;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  font-size: 14px;
  color: #bbb;
}

.meta strong {
  color: #43e97b;
  font-weight: 600;
}

/* Этапы */
h2 {
  font-size: 22px;
  font-weight: 600;
  margin-top: 10px;
  margin-bottom: 4px;
  color: #fff;
  border-left: 4px solid #00c6ff;
  padding-left: 10px;
}

.stages {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.no-stages {
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  font-size: 15px;
  padding-left: 8px;
}

/* Добавление этапа */
.add-stage {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.add-stage h3 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #fff;
}

.add-stage label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #ccc;
}

.add-stage input,
.add-stage textarea,
.add-stage select {
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  outline: none;
  font-size: 14px;
  transition: background 0.2s, box-shadow 0.2s;
}

.add-stage input:focus,
.add-stage textarea:focus,
.add-stage select:focus {
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 2px rgba(0, 198, 255, 0.3);
}

/* Кнопка добавления */
.btn-glass {
  align-self: flex-start;
  background: linear-gradient(135deg, #43e97b, #38f9d7);
  border: none;
  padding: 10px 18px;
  border-radius: 12px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.btn-glass:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 22px rgba(56, 249, 215, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
