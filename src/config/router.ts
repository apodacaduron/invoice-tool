import { createMemoryHistory, createRouter } from 'vue-router'

import Home from '@/views/Home.vue'

const routes = [
  { path: '/', component: Home },
]

export default createRouter({
  history: createMemoryHistory(),
  routes,
})