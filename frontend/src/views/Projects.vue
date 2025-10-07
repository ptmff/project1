<template>
  <div>
    <NavBar />

    <section class="container">
      <h1>Проекты</h1>

      <div class="controls">
        <input v-model="search" placeholder="Поиск по названию или описанию" @keyup.enter="loadProjects" />
        <select v-model="statusFilter">
          <option value="">Все статусы</option>
          <option value="planning">planning</option>
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button @click="loadProjects">Искать</button>

        <template v-if="isManager">
          <button @click="showCreate = !showCreate">{{ showCreate ? 'Отмена' : 'Создать проект' }}</button>
        </template>
      </div>

      <div v-if="showCreate" class="card create-form">
        <h3>Новый проект</h3>
        <label>Name
          <input v-model="newProject.name" required />
        </label>
        <label>Description
          <textarea v-model="newProject.description"></textarea>
        </label>
        <label>Start
          <input type="date" v-model="newProject.startDate" />
        </label>
        <label>End
          <input type="date" v-model="newProject.endDate" />
        </label>
        <div class="actions">
          <button @click="createProject">Создать</button>
        </div>
      </div>

      <div class="grid" v-if="projects && projects.length">
        <ProjectCard
            v-for="p in projects"
            :key="p.id"
            :project="p"
            @edit-project="editProject"
            @delete-project="deleteProject"
            @edit-stage="(stage) => handleEditStage(p, stage)"
            @delete-stage="(stage) => handleDeleteStage(p, stage)"
        />
      </div>

      <div v-else class="no-items">Проекты не найдены</div>

      <div class="pagination">
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
import ProjectCard from '../components/ProjectCard.vue'
import http from '../api/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const projects = ref([])
const page = ref(1)
const limit = ref(10)
const totalPages = ref(1)
const search = ref('')
const statusFilter = ref('')
const showCreate = ref(false)
const newProject = ref({ name: '', description: '', startDate: '', endDate: '' })

const isManager = computed(()=> auth.user?.role === 'manager')

async function loadProjects(){
  const params = { page: page.value, limit: limit.value }
  if (search.value) params.search = search.value
  if (statusFilter.value) params.status = statusFilter.value
  try {
    const res = await http.get('/projects', { params })
    projects.value = res.data.projects || []
    totalPages.value = res.data.pagination?.totalPages || 1
  } catch (e) {
    // basic error handling — show empty list on error
    projects.value = []
    totalPages.value = 1
    console.error('loadProjects error', e)
    alert(e.response?.data?.message || 'Ошибка загрузки проектов')
  }
}

async function createProject(){
  if (!newProject.value.name || newProject.value.name.length < 3) {
    return alert('Введите корректное название')
  }
  try{
    const payload = {
      name: newProject.value.name,
      description: newProject.value.description,
      startDate: newProject.value.startDate || undefined,
      endDate: newProject.value.endDate || undefined,
    }
    await http.post('/projects', payload)
    showCreate.value = false
    newProject.value = { name: '', description: '', startDate: '', endDate: '' }
    // reload first page to show new project
    page.value = 1
    await loadProjects()
  } catch (e){
    console.error('createProject error', e)
    alert(e.response?.data?.message || 'Ошибка создания проекта')
  }
}

async function editProject(project) {
  const name = prompt('Новое название проекта', project.name)
  if (!name) return
  try {
    const payload = { name }
    await http.put(`/projects/${project.id}`, payload)
    await loadProjects()
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка обновления проекта')
  }
}

async function deleteProject(project) {
  if (!confirm(`Удалить проект "${project.name}" и все его этапы?`)) return
  try {
    await http.delete(`/projects/${project.id}`)
    await loadProjects()
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка удаления проекта')
  }
}

// уже есть editProject(project) и deleteProject(project)

// пример: открыть модальное/prompt для редактирования этапа прямо из карточки
async function handleEditStage(project, stage) {
  const name = prompt('Новое название этапа', stage.name)
  if (!name) return
  try {
    await http.put(`/stages/${stage.id}`, { name })
    await loadProjects()
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка обновления этапа')
  }
}

async function handleDeleteStage(project, stage) {
  if (!confirm(`Удалить этап "${stage.name}"?`)) return
  try {
    await http.delete(`/stages/${stage.id}`)
    await loadProjects()
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка удаления этапа')
  }
}



function prevPage(){ if (page.value>1) { page.value--; loadProjects() } }
function nextPage(){ if (page.value<totalPages.value) { page.value++; loadProjects() } }

onMounted(async ()=>{
  await auth.loadMe()
  await loadProjects()
})
</script>

<style scoped>
.container{ padding:20px }
.controls{ display:flex; gap:8px; align-items:center; flex-wrap:wrap }
.grid{ display:grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap:12px; margin-top:12px }
.card{ padding:12px; border:1px solid #000000ff; border-radius:8px; background:#fff }
.create-form { margin-top: 12px; }
.actions{ margin-top:8px }
.no-items{ margin-top:12px; color:#666 }
.pagination{ margin-top:16px; display:flex; gap:8px; align-items:center }
</style>
