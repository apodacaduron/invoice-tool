import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', component: () => import('@/views/Home.vue') },
  { path: '/invoice/:invoiceId', component: () => import('@/views/EditInvoice.vue') },
  { path: '/history', component: () => import('@/views/SavedInvoices.vue') },
  { path: '/buyers', component: () => import('@/views/Buyers.vue') },
  { path: '/sellers', component: () => import('@/views/Sellers.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFound.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})