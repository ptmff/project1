<template>
  <div>
    <NavBar />

    <section class="container">
      <button @click="goBack">Назад к проектам</button>

      <h1>{{ project?.name || 'Проект' }}</h1>
      <p>{{ project?.description }}</p>

      <div class="meta">
        <p>Статус: {{ project?.status }}</p>
        <p>Создатель: {{ project?.creator?.username }}</p>
      </div>

      <h2>Этапы</h2>
      <div v-if="stages.length === 0">Нет этапов</div>

      <div class="stages">
        <StageItem
          v-for="s in stages"
          :key="s.id"
          :stage="s"
          :can-edit="isManager"
          @updated="loadProject"
          @deleted="loadProject"
        />
      </div>

      <div v-if="isManager" class="card">
        <h3>Добавить этап</h3>
        <label>Name
          <input v-model="newStage.name" required />
        </label>
        <label>Order
          <input type="number" v-model.number="newStage.order" />
        </label>
        <label>Status
          <select v-model="newStage.status">
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </select>
        </label>
        <label>Description
          <input v-model="newStage.description" />
        </label>
        <button @click="createStage">Добавить</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

// Инициализация
onMounted(async () => {
  await auth.loadMe()
  await loadProject()
})
</script>

<style scoped>
.container { padding: 20px }
.meta { margin-bottom: 12px }
.stages { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px }
.card { padding: 12px; border: 1px solid #eee; border-radius: 8px; background: #fff; margin-top: 12px }
button { margin-top: 8px }
</style>
