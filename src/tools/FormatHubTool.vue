<template>
  <div ref="root" class="formathub-root"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import '../formathub/formathub.css'

const props = defineProps({ tool: Object })
const root = ref(null)
let destroy = null

async function mount() {
  if (destroy) {
    destroy()
    destroy = null
  }
  if (!root.value) return
  const { initFormatHub } = await import('../formathub/main.js')
  if (root.value) destroy = initFormatHub(root.value, props.tool?.view || 'home')
}

onMounted(mount)
watch(() => props.tool?.view, () => { if (root.value) mount() })
onBeforeUnmount(() => {
  if (destroy) {
    destroy()
    destroy = null
  }
})
</script>
