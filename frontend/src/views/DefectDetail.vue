<template>
  <div class="page">
    <NavBar />
    <section class="container">
      <button class="back" @click="goBack">← Назад</button>

      <div v-if="defect" class="card-glass">
        <h1>{{ defect.title }}</h1>
        <p class="muted">Проект: {{ defect.project?.name }} • Этап: {{ defect.stage?.name }}</p>

        <div class="row">
          <div class="col">
            <label>Статус
              <select v-model="edit.status">
                <option v-for="s in STATUS_LIST" :key="s" :value="s">{{ s }}</option>
              </select>
            </label>

            <label>Приоритет
              <select v-model="edit.priority">
                <option v-for="p in PRIORITIES" :key="p" :value="p">{{ p }}</option>
              </select>
            </label>

            <label>Исполнитель
              <input v-model="edit.assigneeId" placeholder="user id (опционально)" />
            </label>

            <label>Срок
              <input type="date" v-model="edit.dueDate" />
            </label>

            <label>Этап
              <select v-model="edit.stageId">
                <option value="">—</option>
                <option v-for="s in allStages" :key="s.id" :value="s.id">{{ s.name }} ({{ s.projectName }})</option>
              </select>
            </label>

            <div class="actions">
              <button @click="updateDefect" :disabled="!canEdit">Сохранить</button>
              <button v-if="isManager" class="danger" @click="deleteDefect">Удалить</button>
            </div>
          </div>

          <div class="col">
            <h3>Описание</h3>
            <p>{{ defect.description }}</p>

            <h3>Вложения ({{ attachments.length }})</h3>
            <div class="attachments-list" v-if="attachments.length">
              <div v-for="a in attachments" :key="a.id" class="attachment">
                <div class="left">
                  <div class="filename">{{ a.originalName || a.filename }}</div>
                  <div class="meta">
                    <small>{{ pretty(a.createdAt) }}</small>
                    <small>• {{ humanFileSize(a.size) }}</small>
                    <small v-if="a.mimeType">• {{ a.mimeType }}</small>
                  </div>
                </div>
                <div class="right">
                  <button @click="downloadAttachment(a)">Скачать</button>
                  <button v-if="canUploadOrDelete" class="danger" @click="deleteAttachment(a)">Удалить</button>
                </div>
              </div>
            </div>
            <div v-else class="no-attachments">Вложений нет</div>

            <div v-if="canUploadOrDelete" class="upload-box card-glass">
              <h4>Загрузить файл</h4>
              <input ref="fileInput" type="file" @change="onFileSelected" :accept="acceptString" />
              <div class="upload-actions">
                <button @click="uploadSelected" :disabled="!selectedFile">Загрузить</button>
                <button @click="clearSelected" v-if="selectedFile">Отмена</button>
              </div>
              <div v-if="selectedFile" class="selected-info">
                Выбрано: {{ selectedFile.name }} ({{ humanFileSize(selectedFile.size) }})
              </div>
              <div class="hint">Поддерживаемые: jpg, png, gif, webp, pdf, doc, docx, xls, xlsx, txt, csv. Максимум 10 MB.</div>
            </div>

            <h3>Комментарии</h3>
            <div v-for="c in comments" :key="c.id" class="comment">
              <div class="author">{{ c.author.username }} • <small>{{ formatDate(c.createdAt) }}</small></div>
              <div class="content">{{ c.content }}</div>
            </div>

            <div class="add-comment">
              <textarea v-model="newComment" placeholder="Добавить комментарий..."></textarea>
              <button @click="addComment">Добавить</button>
            </div>

            <h3>История</h3>
            <ul>
              <li v-for="h in history" :key="h.id">
                {{ pretty(h.createdAt) }} — {{ h.user?.username || h.user?.username }}: {{ h.field }} → {{ h.newValue }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-else>Загрузка...</div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import NavBar from '../components/NavBar.vue'
import http from '../api/http'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { canTransition, PRIORITIES, STATUS_LIST } from '../utils/defectRules'
import dayjs from 'dayjs'

// allowed mime types & extensions (client-side check)
const ALLOWED_MIMES = [
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain','text/csv'
]
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const defect = ref(null)
const comments = ref([])
const history = ref([])
const allStages = ref([])
const edit = ref({})
const newComment = ref('')
const attachments = ref([])

// file upload state
const selectedFile = ref(null)
const fileInput = ref(null)

const isManager = computed(()=> auth.user?.role === 'manager')
const canEdit = computed(()=> ['manager','engineer'].includes(auth.user?.role))
// allow upload/delete for manager and engineer
const canUploadOrDelete = computed(()=> ['manager','engineer'].includes(auth.user?.role))

const PRIORITIES_LIST = PRIORITIES
const STATUS_LIST_LOCAL = STATUS_LIST

function pretty(d){ return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '' }
function formatDate(d){ return pretty(d) }
function humanFileSize(bytes){
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes)/Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// --- load defect and attachments ---
async function loadDefect() {
  try {
    const res = await http.get(`/defects/${route.params.id}`)
    defect.value = res.data
    edit.value = {
      title: res.data.title,
      description: res.data.description,
      priority: res.data.priority,
      status: res.data.status,
      assigneeId: res.data.assigneeId,
      dueDate: res.data.dueDate ? res.data.dueDate.split('T')[0] : '',
      stageId: res.data.stageId
    }
    comments.value = res.data.comments || []
    history.value = res.data.history || []
    attachments.value = res.data.attachments || []
  } catch (e) {
    alert('Дефект не найден')
    router.push({ name: 'Defects' })
  }
}

// load flat stages for selects
async function loadStagesFlat() {
  try {
    const res = await http.get('/projects', { params: { page:1, limit:200 } })
    const projects = res.data.projects || []
    allStages.value = []
    projects.forEach(p => (p.stages || []).forEach(s => allStages.value.push({ ...s, projectId: p.id, projectName: p.name })))
  } catch (e) { console.warn(e) }
}

// --- update/delete defect (unchanged) ---
async function updateDefect() {
  if (!canEdit.value) return alert('Нет прав')
  if (!canTransition(defect.value.status, edit.value.status)) {
    return alert(`Нельзя изменить статус ${defect.value.status} → ${edit.value.status}`)
  }
  try {
    const payload = {
      title: edit.value.title,
      description: edit.value.description,
      priority: edit.value.priority,
      status: edit.value.status,
      assigneeId: edit.value.assigneeId || undefined,
      dueDate: edit.value.dueDate || undefined,
      stageId: edit.value.stageId || undefined
    }
    const res = await http.put(`/defects/${defect.value.id}`, payload)
    defect.value = res.data.defect || defect.value
    await loadDefect()
    alert('Дефект обновлён')
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка обновления дефекта')
  }
}

async function deleteDefect() {
  if (!isManager.value) return alert('Нет прав')
  if (!confirm('Удалить дефект и все связанные данные?')) return
  try {
    await http.delete(`/defects/${defect.value.id}`)
    alert('Дефект удалён')
    router.push({ name: 'Defects' })
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка удаления')
  }
}

// --- comments ---
async function addComment() {
  if (!newComment.value || newComment.value.trim().length === 0) return alert('Пустой комментарий')
  try {
    const res = await http.post(`/defects/${defect.value.id}/comments`, { content: newComment.value })
    comments.value.unshift(res.data.comment)
    newComment.value = ''
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка добавления комментария')
  }
}

// --- attachments: selection, validation, upload, download, delete ---
const acceptString = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv'

function onFileSelected(e){
  const f = e.target.files && e.target.files[0]
  if (!f) {
    selectedFile.value = null
    return
  }
  // validate size
  if (f.size > MAX_BYTES) {
    alert('Файл слишком большой — максимум 10 MB')
    fileInput.value.value = ''
    selectedFile.value = null
    return
  }
  // validate mime (fallback to extension if mime missing)
  if (!ALLOWED_MIMES.includes(f.type)) {
    const lower = f.name.toLowerCase()
    const okExt = ['.jpg','.jpeg','.png','.gif','.webp','.pdf','.doc','.docx','.xls','.xlsx','.txt','.csv'].some(ext => lower.endsWith(ext))
    if (!okExt) {
      alert('Недопустимый формат файла')
      fileInput.value.value = ''
      selectedFile.value = null
      return
    }
  }
  selectedFile.value = f
}

function clearSelected(){
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function uploadSelected(){
  if (!selectedFile.value) return alert('Файл не выбран')
  try {
    const fd = new FormData()
    fd.append('file', selectedFile.value)
    // POST /api/uploads/defect/{defectId}
    const res = await http.post(`/uploads/defect/${defect.value.id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    // append to attachments list
    if (res.data && res.data.attachment) {
      attachments.value.unshift(res.data.attachment)
    }
    clearSelected()
    alert('Файл загружен')
  } catch (e) {
    // show backend error or generic
    alert(e.response?.data?.message || 'Ошибка загрузки файла')
  }
}

async function downloadAttachment(a){
  try {
    const res = await http.get(`/uploads/${a.id}`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: a.mimeType || res.headers['content-type'] || 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    // use originalName if available, otherwise filename
    link.download = a.originalName || a.filename || 'file'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка скачивания файла')
  }
}

async function deleteAttachment(a){
  if (!confirm(`Удалить файл "${a.originalName || a.filename}"?`)) return
  try {
    await http.delete(`/uploads/${a.id}`)
    // remove from local list
    attachments.value = attachments.value.filter(x => x.id !== a.id)
    alert('Вложение удалено')
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка удаления вложения')
  }
}

// navigation
function goBack() { router.push({ name: 'Defects' }) }

onMounted(async ()=>{
  await auth.loadMe()
  await loadStagesFlat()
  await loadDefect()
})
</script>

<style scoped>
.page {
  background: radial-gradient(circle at 20% 20%, #243b55, #141e30);
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  min-height: 100vh;
  padding-bottom: 40px;
}

.container {
  max-width: 1100px;
  margin: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* кнопка назад */
.back {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  color: #fff;
  font-weight: 500;
  transition: 0.2s;
  width: fit-content;
}
.back:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.35);
}

/* стеклянные карточки */
.card-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  color: #eee;
}

/* строки и колонки */
.row {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.col {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* заголовки */
h1, h3 {
  color: #fff;
  margin-bottom: 12px;
}
h4 {
  color: #fff;
  margin: 0 0 6px 0;
}

/* метки и текст */
.muted {
  color: #aaa;
}
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
}
.badge {
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(0,120,255,0.6);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

/* формы */
label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 4px;
}
input, select, textarea {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 10px;
  color: #eee;
  outline: none;
  width: 100%;
  transition: 0.2s;
}
input:focus, select:focus, textarea:focus {
  border-color: rgba(0,150,255,0.7);
  box-shadow: 0 0 6px rgba(0,150,255,0.3);
}

/* кнопки */
button {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: 0.2s;
}
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.4);
}
button.danger {
  background: rgba(255, 80, 80, 0.9);
}

/* комментарии */
.comment {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 12px;
}
.comment .author {
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
}
.comment .content {
  color: #eee;
}

/* добавление комментария */
.add-comment textarea {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 10px;
  color: #eee;
  resize: none;
  width: 100%;
  min-height: 80px;
}
.add-comment button {
  margin-top: 8px;
  align-self: flex-end;
}

/* вложения */
.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.attachment {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
}
.attachment .filename {
  font-weight: 600;
}
.attachment .meta {
  color: #ccc;
  font-size: 12px;
  margin-top: 2px;
}
.attachment .right button {
  margin-left: 8px;
}

/* загрузка файлов */
.upload-box {
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.upload-box h4 {
  margin: 0;
}
.upload-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.selected-info {
  font-size: 13px;
  color: #ccc;
}
.hint {
  font-size: 12px;
  color: #888;
}

/* история */
ul {
  list-style: none;
  padding-left: 0;
}
ul li {
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  font-size: 13px;
  color: #ccc;
}

.col {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* все поля и блоки в колонке */
.col label,
.upload-box {
  width: 100%;
  box-sizing: border-box; /* чтобы padding не ломал ширину */
}

/* input, select, textarea */
input, select, textarea {
  width: 100%;
  box-sizing: border-box; /* важно для одинаковой ширины */
}

/* кнопки */
.actions button,
.upload-actions button,
.add-comment button {
  min-width: 120px; /* одинаковая минимальная ширина */
  max-width: 100%;
  width: fit-content;
}

/* блок загрузки */
.upload-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

</style>
