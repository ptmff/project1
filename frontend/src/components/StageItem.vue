<template>
  <div class="stage">
    <div v-if="!editing">
      <h4>{{ stage.name }}</h4>
      <p v-if="stage.description">{{ stage.description }}</p>
      <p>Order: {{ stage.order }} | Status: {{ stage.status }}</p>

      <div v-if="canEdit">
        <button @click="editing = true">Редактировать</button>
        <button @click="remove">Удалить</button>
      </div>
    </div>

    <div v-else>
      <label>Name<input v-model="editStage.name" /></label>
      <label>Description<input v-model="editStage.description" /></label>
      <label>Order<input type="number" v-model.number="editStage.order" /></label>
      <label>Status
        <select v-model="editStage.status">
          <option value="pending">pending</option>
          <option value="in_progress">in_progress</option>
          <option value="completed">completed</option>
        </select>
      </label>
      <button @click="updateStage">Сохранить</button>
      <button @click="cancelEdit">Отмена</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import http from '../api/http'

const props = defineProps({
  stage: Object,
  canEdit: Boolean
})
const emit = defineEmits(['updated', 'deleted'])

const editing = ref(false)
const editStage = ref({ ...props.stage })

watch(() => props.stage, (newVal) => editStage.value = { ...newVal })

async function updateStage() {
  try {
    await http.put(`/stages/${props.stage.id}`, editStage.value)
    editing.value = false
    emit('updated')
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка обновления этапа')
  }
}

function cancelEdit() {
  editing.value = false
  editStage.value = { ...props.stage }
}

async function remove() {
  if (!confirm('Удалить этап?')) return
  try {
    await http.delete(`/stages/${props.stage.id}`)
    emit('deleted')
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка удаления этапа')
  }
}
</script>

<style scoped>
.stage {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  padding: 16px;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.stage:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
}

h4 {
  margin: 0;
  font-size: 17px;
  color: #fff;
  font-weight: 600;
}

p {
  margin: 0;
  font-size: 14px;
  color: #ccc;
  line-height: 1.4;
}

p strong {
  color: #43e97b;
}

label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #ddd;
  margin-bottom: 8px;
}

input,
select {
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  outline: none;
  font-size: 14px;
  transition: background 0.2s, box-shadow 0.2s;
}

input:focus,
select:focus {
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 2px rgba(0, 198, 255, 0.3);
}

button {
  padding: 6px 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #0072ff, #00c6ff);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-right: 6px;
  margin-top: 6px;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 198, 255, 0.4);
}

button:nth-child(2) {
  background: linear-gradient(135deg, #ff758c, #ff7eb3);
}
</style>
