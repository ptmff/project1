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
.stage { border: 1px solid #ddd; padding: 8px; border-radius: 6px; background: #fafafa; margin-bottom: 6px }
label { display: block; margin: 4px 0 }
button { margin-right: 4px; margin-top: 4px }
</style>
