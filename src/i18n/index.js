import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

const savedLocale = localStorage.getItem('toolbox_locale')
const systemLocale = navigator.language.startsWith('zh') ? 'zh' : 'en'
const locale = savedLocale || systemLocale

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'zh',
  messages: { zh, en },
})

export default i18n
