<template>
  <div class="page">
    <NavBar />

    <section class="container">
      <h1>Проекты</h1>

      <div class="controls">
        <input
          v-model="search"
          placeholder="Поиск по названию или описанию"
          @keyup.enter="loadProjects"
        />
        <select v-model="statusFilter">
          <option value="">Все статусы</option>
          <option value="planning">planning</option>
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button class="btn" @click="loadProjects">Искать</button>

        <template v-if="isManager">
          <button class="btn create" @click="showCreate = !showCreate">
            {{ showCreate ? 'Отмена' : 'Создать проект' }}
          </button>
        </template>
      </div>

      <transition name="fade">
        <div v-if="showCreate" class="card create-form">
          <h3>Новый проект</h3>
          <label>Название
            <input v-model="newProject.name" required />
          </label>
          <label>Описание
            <textarea v-model="newProject.description"></textarea>
          </label>
          <div class="dates">
            <label>Начало
              <input type="date" v-model="newProject.startDate" />
            </label>
            <label>Конец
              <input type="date" v-model="newProject.endDate" />
            </label>
          </div>
          <div class="actions">
            <button class="btn create" @click="createProject">Создать</button>
          </div>
        </div>
      </transition>

      <div v-if="projects && projects.length" class="grid">
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
        <button class="btn small" @click="prevPage" :disabled="page === 1">Prev</button>
        <span>Страница {{ page }} / {{ totalPages }}</span>
        <button class="btn small" @click="nextPage" :disabled="page >= totalPages">Next</button>
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

const isManager = computed(() => auth.user?.role === 'manager')

async function loadProjects() {
  const params = { page: page.value, limit: limit.value }
  if (search.value) params.search = search.value
  if (statusFilter.value) params.status = statusFilter.value
  try {
    const res = await http.get('/projects', { params })
    projects.value = res.data.projects || []
    totalPages.value = res.data.pagination?.totalPages || 1
  } catch (e) {
    projects.value = []
    totalPages.value = 1
    alert(e.response?.data?.message || 'Ошибка загрузки проектов')
  }
}

async function createProject() {
  if (!newProject.value.name || newProject.value.name.length < 3)
    return alert('Введите корректное название')

  try {
    const payload = {
      name: newProject.value.name,
      description: newProject.value.description,
      startDate: newProject.value.startDate || undefined,
      endDate: newProject.value.endDate || undefined,
    }
    await http.post('/projects', payload)
    showCreate.value = false
    newProject.value = { name: '', description: '', startDate: '', endDate: '' }
    page.value = 1
    await loadProjects()
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка создания проекта')
  }
}

async function editProject(project) {
  const name = prompt('Новое название проекта', project.name)
  if (!name) return
  try {
    await http.put(`/projects/${project.id}`, { name })
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

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadProjects()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    loadProjects()
  }
}

onMounted(async () => {
  await auth.loadMe()
  await loadProjects()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #243b55, #141e30);
  background-attachment: fixed;
  color: #f3f4f6;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Контейнер */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 50px 24px 60px;
  animation: fadeIn 0.6s ease;
}

/* Заголовок */
h1 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 28px;
  text-align: center;
  letter-spacing: -0.5px;
  color: #f9fafb;
}

/* Панель управления */
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 30px;
}

/* Поля ввода и селекты */
input,
select,
textarea {
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
  outline: none;
  transition: background 0.2s, box-shadow 0.2s;
  font-size: 15px;
}

input::placeholder,
textarea::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

input:focus,
select:focus,
textarea:focus {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4);
}

select option {
  background: #1f2937;
  color: #f9fafb;
}

/* Кнопки */
.btn {
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  border: none;
  padding: 11px 18px;
  border-radius: 12px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.25);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.btn.create {
  background: linear-gradient(135deg, #10b981, #34d399);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.25);
}

.btn.create:hover {
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn.small {
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 8px;
}

/* Карточка проекта / форма */
.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.5s ease;
}

.create-form label {
  display: block;
  text-align: left;
  color: #e5e7eb;
  margin-bottom: 12px;
  font-size: 15px;
}

.create-form input,
.create-form textarea {
  width: 100%;
  margin-top: 6px;
}

.dates {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

/* Сетка проектов */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

/* Когда нет проектов */
.no-items {
  text-align: center;
  margin-top: 40px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 17px;
  font-weight: 400;
}

/* Пагинация */
.pagination {
  margin-top: 36px;
  display: flex;
  gap: 14px;
  justify-content: center;
  align-items: center;
  font-size: 15px;
  color: #e5e7eb;
}

/* Анимации */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
