<script setup lang="ts">
import DesktopInvoiceView from '@/components/DesktopInvoiceView.vue'
import MobileInvoiceView from '@/components/MobileInvoiceView.vue'
</script>

<template>
  <div class="h-full">
    <div class="hidden lg:block h-full h-full">
      <DesktopInvoiceView />
    </div>
    <div class="block lg:hidden">
      <MobileInvoiceView />
    </div>
  </div>
</template>

<style scoped>
</style>
