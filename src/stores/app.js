import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { defaultCategories } from '../data/tools'

function loadState() {
  try {
    const raw = localStorage.getItem('toolbox_v1')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export const useAppStore = defineStore('app', () => {
  const saved = loadState()

  const categories = ref(saved?.categories || defaultCategories)
  const favorites = ref(saved?.favorites || [])
  const theme = ref(saved?.theme || 'auto')
  const accent = ref(saved?.accent || '#3b82f6')
  const grid = ref(saved?.grid || '3x3')
  const radius = ref(saved?.radius ?? 12)
  const opened = ref(saved?.opened || false)

  const isDark = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const allTools = computed(() => {
    const list = []
    categories.value.forEach(c => {
      c.tools.forEach(t => list.push({ ...t, categoryId: c.id, categoryName: c.name }))
    })
    return list
  })

  const favTools = computed(() => {
    return allTools.value.filter(t => favorites.value.includes(t.id))
  })

  function toggleFav(toolId) {
    const idx = favorites.value.indexOf(toolId)
    if (idx >= 0) favorites.value.splice(idx, 1)
    else favorites.value.push(toolId)
    persist()
  }

  function isFav(toolId) {
    return favorites.value.includes(toolId)
  }

  function addCategory(cat) {
    categories.value.push(cat)
    persist()
  }

  function addTool(categoryId, tool) {
    const cat = categories.value.find(c => c.id === categoryId)
    if (cat) {
      cat.tools.push(tool)
      persist()
    }
  }

  function findTool(toolId) {
    for (const c of categories.value) {
      const t = c.tools.find(x => x.id === toolId)
      if (t) return { ...t, categoryId: c.id, categoryName: c.name }
    }
    return null
  }

  function findCategory(catId) {
    return categories.value.find(c => c.id === catId)
  }

  function persist() {
    localStorage.setItem('toolbox_v1', JSON.stringify({
      categories: categories.value,
      favorites: favorites.value,
      theme: theme.value,
      accent: accent.value,
      grid: grid.value,
      radius: radius.value,
      opened: opened.value,
    }))
  }

  watch([categories, favorites, theme, accent, grid, radius, opened], persist, { deep: true })

  return {
    categories, favorites, theme, accent, grid, radius, opened,
    isDark, allTools, favTools,
    toggleFav, isFav, addCategory, addTool,
    findTool, findCategory, persist,
  }
})