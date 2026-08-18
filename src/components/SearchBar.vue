<template>
  <Transition name="fade">
    <div v-if="showSearch" class="search-bar">
      <input v-model="query" type="text" placeholder="搜索工具..." ref="inputRef" @input="onSearch">
      <button class="icon-btn" @click="close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18.3 5.7a1 1 0 00-1.4 0L12 10.6 7.1 5.7a1 1 0 00-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 001.4 1.4L12 13.4l4.9 4.9a1 1 0 001.4-1.4L13.4 12l4.9-4.9a1 1 0 000-1.4z" fill="currentColor"/></svg>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const showSearch = inject('showSearch')
const router = useRouter()
const store = useAppStore()
const query = ref('')
const inputRef = ref(null)

watch(showSearch, async (v) => {
  if (v) {
    await nextTick()
    inputRef.value?.focus()
  } else {
    query.value = ''
  }
})

function onSearch() {
  const q = query.value.trim().toLowerCase()
  if (!q) return
  const results = store.allTools.filter(t =>
    t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
  )
  if (results.length === 1) {
    router.push(`/tool/${results[0].id}`)
    showSearch.value = false
    query.value = ''
  }
}

function close() {
  showSearch.value = false
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
}
.search-bar input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}
.search-bar input:focus { border-color: var(--accent); }
.search-bar input::placeholder { color: var(--text-tertiary); }
</style>
