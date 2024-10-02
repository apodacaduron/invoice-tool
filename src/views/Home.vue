<script setup lang="ts">
import InvoiceForm from '@/components/InvoiceForm.vue';
import InvoicePreview from '@/components/InvoicePreview.vue';
import { useResizeObserver } from '@/composables/useResizeObserver';
import Button from 'primevue/button';
import { ref } from 'vue';

const invoiceContainerRef = ref<HTMLDivElement | null>(null)
const isPreviewVisible = ref(false)

const { elementSize: invoiceContainerDimensions } = useResizeObserver(invoiceContainerRef)
</script>

<template>
  <div class="max-w-[1295px] mx-auto">
    <div ref="invoiceContainerRef" class="flex">
      <InvoiceForm v-if="!isPreviewVisible" :class="{ ['mx-auto']: invoiceContainerDimensions.width < 1024 }">
        <template #action>
          <Button label="Preview" @click="isPreviewVisible = !isPreviewVisible" />
        </template>
      </InvoiceForm>
      <InvoicePreview v-if="invoiceContainerDimensions.width >= 1024 || isPreviewVisible" />
    </div>
  </div>
</template>

<style scoped></style>
