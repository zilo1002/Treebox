import { watch, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

export function useTheme() {
  const store = useAppStore()

  function apply() {
    const root = document.documentElement
    root.style.setProperty('--accent', store.accent)
    root.style.setProperty('--radius', store.radius + 'px')

    const dark = store.isDark
    root.style.setProperty('--bg', dark ? '#0f0f11' : '#ffffff')
    root.style.setProperty('--bg-muted', dark ? '#1a1a1e' : '#f5f5f7')
    root.style.setProperty('--bg-raised', dark ? '#1e1e22' : '#fafafa')
    root.style.setProperty('--bg-strong', dark ? '#25252a' : '#e8e8ec')
    root.style.setProperty('--text-primary', dark ? '#f0f0f5' : '#111114')
    root.style.setProperty('--text-secondary', dark ? '#a0a0a8' : '#55555a')
    root.style.setProperty('--text-tertiary', dark ? '#707078' : '#99999f')
    root.style.setProperty('--border', dark ? '#2a2a30' : '#e5e5ea')
    root.style.setProperty('--shadow', dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)')
    root.style.setProperty('--meta', dark ? '#505058' : '#bbbbbf')

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.content = store.accent
  }

  onMounted(apply)
  watch(() => [store.theme, store.accent, store.radius, store.isDark], apply, { immediate: true })

  return { apply }
}