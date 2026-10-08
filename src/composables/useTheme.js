import { watch, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'

export function useTheme() {
  const store = useAppStore()
  let mqlHandler = null

  function apply() {
    const root = document.documentElement
    const dark = store.isDark

    // 基础
    root.style.setProperty('--accent', store.accent)
    root.style.setProperty('--radius', store.radius + 'px')
    root.style.setProperty('--font-size', store.fontSize + 'px')

    // 背景色（用户自定义优先，否则跟随明暗）
    const bg = store.bgColor || (dark ? '#17211B' : '#EEF3EC')
    const bgMuted = store.bgColor || (dark ? '#1E2A22' : '#E3EBE0')
    const bgRaised = dark ? '#232F27' : '#FAFBF7'
    const bgStrong = dark ? '#2C3A30' : '#D6E0D2'

    root.style.setProperty('--bg', bg)
    root.style.setProperty('--bg-muted', bgMuted)
    root.style.setProperty('--bg-raised', bgRaised)
    root.style.setProperty('--bg-strong', bgStrong)

    // 文字色
    const textPrimary = store.textColor || (dark ? '#E9F0E9' : '#25352A')
    root.style.setProperty('--text-primary', textPrimary)
    root.style.setProperty('--text-secondary', dark ? '#A8B8AA' : '#5A6D5E')
    root.style.setProperty('--text-tertiary', dark ? '#7D8F80' : '#93A496')
    root.style.setProperty('--border', dark ? '#2E3D33' : '#D8E2D6')
    root.style.setProperty('--shadow', dark ? 'rgba(0,0,0,0.4)' : 'rgba(53,107,87,0.10)')
    root.style.setProperty('--meta', dark ? '#5C6E60' : '#B9C8B4')

    // 导航栏颜色
    if (store.navColor) {
      root.style.setProperty('--nav-bg', store.navColor)
    } else {
      root.style.setProperty('--nav-bg', bgRaised)
    }

    // 毛玻璃
    if (store.enableGlass) {
      root.style.setProperty('--glass', dark ? 'rgba(35,47,39,0.65)' : 'rgba(250,251,247,0.68)')
      root.style.setProperty('--glass-blur', '14px')
      root.style.setProperty('--glass-border', dark ? 'rgba(255,255,255,0.06)' : 'rgba(53,107,87,0.08)')
    } else {
      // 关掉时给实色打底，不然顶栏 / 底栏会透出背后的背景图
      root.style.setProperty('--glass', dark ? '#232F27' : '#FAFBF7')
      root.style.setProperty('--glass-blur', '0px')
      root.style.setProperty('--glass-border', 'transparent')
    }

    // 减少动画
    if (store.reduceMotion) {
      document.body.classList.add('reduce-motion')
    } else {
      document.body.classList.remove('reduce-motion')
    }

    // 背景动画（图片/GIF/视频封面）
    const app = document.getElementById('app')
    if (app) {
      if (store.bgAnimation) {
        app.style.backgroundImage = `url(${store.bgAnimation})`
        app.style.backgroundSize = 'cover'
        app.style.backgroundPosition = 'center'
        app.style.backgroundRepeat = 'no-repeat'
        app.style.backgroundAttachment = 'fixed'
      } else {
        app.style.backgroundImage = 'none'
        app.style.backgroundAttachment = 'scroll'
      }
    }

    // 主题色 meta
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.content = store.accent
  }

  onMounted(() => {
    apply()
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mqlHandler = () => apply()
    mql.addEventListener('change', mqlHandler)
  })

  onUnmounted(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    if (mqlHandler) mql.removeEventListener('change', mqlHandler)
  })

  watch(
    () => [
      store.theme, store.accent, store.radius,
      store.bgColor, store.textColor, store.navColor,
      store.fontSize, store.enableGlass, store.reduceMotion, store.bgAnimation
    ],
    apply,
    { immediate: true, deep: true }
  )

  return { apply }
}