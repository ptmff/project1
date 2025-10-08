<template>
  <div class="page">
    <NavBar />

    <section class="container">
      <div class="toolbar card-glass">
        <h1>Дефекты</h1>

        <div class="filters">
          <select v-model="filters.projectId">
            <option value="">Все проекты</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>

          <select v-model="filters.stageId">
            <option value="">Все этапы</option>
            <option v-for="s in allStages" :key="s.id" :value="s.id">{{ s.name }} ({{ s.projectName }})</option>
          </select>

          <select v-model="filters.status">
            <option value="">Все статусы</option>
            <option v-for="st in STATUS_LIST" :key="st" :value="st">{{ st }}</option>
          </select>

          <select v-model="filters.priority">
            <option value="">Все приоритеты</option>
            <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
          </select>

          <input v-model="filters.search" placeholder="Поиск по заголовку или описанию" @keyup.enter="loadDefects" />

          <button @click="loadDefects">Применить</button>

          <template v-if="canCreate">
            <button @click="showCreate = !showCreate">{{ showCreate ? 'Отмена' : 'Создать дефект' }}</button>
          </template>
        </div>
      </div>

      <div v-if="showCreate" class="card-glass create-defect">
        <h3>Новый дефект</h3>
        <label>Проект
          <select v-model="newDefect.projectId">
            <option value="">Выберите проект</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>

        <label>Этап (опционально)
          <select v-model="newDefect.stageId">
            <option value="">—</option>
            <option v-for="s in stagesForSelectedProject" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </label>

        <label>Заголовок<input v-model="newDefect.title" /></label>
        <label>Описание<textarea v-model="newDefect.description"></textarea></label>
        <label>Приоритет
          <select v-model="newDefect.priority">
            <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <label>Срок <input type="date" v-model="newDefect.dueDate" /></label>

        <div class="actions">
          <button @click="createDefect">Создать</button>
        </div>
      </div>

      <div class="list">
        <DefectCard
          v-for="d in defects"
          :key="d.id"
          :defect="d"
          @delete="deleteDefect"
          @edit="goToDetail"
        />
      </div>

      <div class="pagination card-glass">
        <button @click="prevPage" :disabled="page===1">Prev</button>
        <span>Страница {{ page }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="page>=totalPages">Next</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import NavBar from '../components/NavBar.vue'
import DefectCard from '../components/DefectCard.vue'
import http from '../api/http'
import { useAuthStore } from '../stores/auth'
import { PRIORITIES, STATUS_LIST } from '../utils/defectRules'
import { useRouter } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()
const canCreate = computed(()=> ['manager','engineer'].includes(auth.user?.role))

const projects = ref([])
const allStages = ref([]) // flat list of stages across projects for filter
const defects = ref([])
const page = ref(1)
const limit = ref(20)
const totalPages = ref(1)
const filters = ref({ projectId: '', stageId: '', status: '', priority: '', search: '', sortBy: 'createdAt', sortOrder: 'DESC' })
const showCreate = ref(false)
const newDefect = ref({ projectId: '', stageId: '', title: '', description: '', priority: 'medium', dueDate: '' })

async function loadProjects() {
  try {
    const res = await http.get('/projects', { params: { page: 1, limit: 200 } })
    projects.value = res.data.projects || []
    // build flat stages list
    allStages.value = []
    projects.value.forEach(p => {
      (p.stages || []).forEach(s => { allStages.value.push({ ...s, projectId: p.id, projectName: p.name }) })
    })
  } catch (e) {
    console.warn(e)
  }
}

const stagesForSelectedProject = computed(() => {
  return allStages.value.filter(s => !filters.value.projectId || s.projectId === filters.value.projectId)
})

async function loadDefects() {
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      ...filters.value
    }
    const res = await http.get('/defects', { params })
    defects.value = res.data.defects || []
    totalPages.value = res.data.pagination?.totalPages || 1
  } catch (e) {
    console.error(e)
    defects.value = []
  }
}

async function createDefect() {
  if (!newDefect.value.projectId || !newDefect.value.title || newDefect.value.title.length < 3) {
    return alert('Заполните проект и заголовок (минимум 3 символа)')
  }
  try {
    const payload = {
      projectId: newDefect.value.projectId,
      stageId: newDefect.value.stageId || undefined,
      title: newDefect.value.title,
      description: newDefect.value.description,
      priority: newDefect.value.priority,
      dueDate: newDefect.value.dueDate || undefined
    }
    await http.post('/defects', payload)
    newDefect.value = { projectId: '', stageId: '', title: '', description: '', priority: 'medium', dueDate: '' }
    showCreate.value = false
    await loadDefects()
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка создания дефекта')
  }
}

function goToDetail(defect) {
  router.push({ name: 'DefectDetail', params: { id: defect.id } })
}

async function deleteDefect(defect) {
  if (!confirm('Удалить дефект? Это удалит все комментарии и вложения.')) return
  try {
    await http.delete(`/defects/${defect.id}`)
    await loadDefects()
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка удаления')
  }
}

function prevPage(){ if (page.value>1) { page.value--; loadDefects() } }
function nextPage(){ if (page.value<totalPages.value) { page.value++; loadDefects() } }

onMounted(async () => {
  await auth.loadMe()
  await loadProjects()
  await loadDefects()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #243b55, #141e30);
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
}

.container {
  padding: 30px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

input, select {
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  background: rgba(255,255,255,0.1);
  color: #fff;
  outline: none;
  font-size: 14px;
  transition: 0.2s;
}

input::placeholder {
  color: rgba(255,255,255,0.6);
}

input:focus, select:focus {
  background: rgba(255,255,255,0.2);
  box-shadow: 0 0 0 2px rgba(0,198,255,0.3);
}

button {
  padding: 8px 14px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  background: linear-gradient(135deg, #00c6ff, #0072ff);
  color: #fff;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,114,255,0.4);
}

button:nth-child(2) {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.card-glass {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.create-defect {
  margin-top: 12px;
  padding: 16px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.pagination {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(10px);
}
</style>
