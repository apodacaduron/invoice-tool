<script setup lang="ts">
import InvoiceForm from "@/components/InvoiceForm.vue";
import InvoicePreview from "@/components/InvoicePreview.vue";
import { useResizeObserver } from "@/composables/useResizeObserver";
import { ref, toRef } from "vue";

const invoiceContainerRef = ref<HTMLDivElement | null>(null);
const isPreviewVisible = ref(false);

const { elementSize: invoiceContainerDimensions } =
  useResizeObserver(invoiceContainerRef);

const isMobile = toRef(() => invoiceContainerDimensions.value.width < 1024)
</script>

<template>
  <div class="max-w-[1295px] mx-auto">
    <div ref="invoiceContainerRef" class="flex">
      <InvoiceForm
        v-show="!isMobile || !isPreviewVisible"
        :class="{ ['mx-auto']: isMobile }"
        @preview="isPreviewVisible = true"
        :showPreviewButton="isMobile"
      />
      <InvoicePreview
        v-show="!isMobile || isPreviewVisible"
        @backToForm="isPreviewVisible = false"
        :showBackButton="isMobile"
      />
    </div>
  </div>
</template>

<style scoped></style>
