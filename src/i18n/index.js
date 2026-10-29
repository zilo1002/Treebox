import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

let savedLocale = null
try { savedLocale = localStorage.getItem('toolbox_locale') } catch { /* 存储被禁/损坏时不让启动白屏，用系统语言 */ }
const systemLocale = navigator.language.startsWith('zh') ? 'zh' : 'en'
const locale = savedLocale || systemLocale

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'zh',
  messages: { zh, en },
})

export default i18n
