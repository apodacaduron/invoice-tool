<script setup lang="ts">
import DesktopInvoiceView from '@/components/DesktopInvoiceView.vue'
import MobileInvoiceView from '@/components/MobileInvoiceView.vue'
</script>

<template>
  <div class="max-w-[1295px] mx-auto">
    <div class="hidden lg:block">
      <DesktopInvoiceView />
    </div>
    <div class="block lg:hidden">
      <MobileInvoiceView />
    </div>
  </div>
</template>

<style scoped>
</style>
