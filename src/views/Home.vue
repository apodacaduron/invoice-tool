<script setup lang="ts">
import InvoicePreview from "@/components/InvoicePreview.vue";
import { useActiveInvoice } from "@/composables/useActiveInvoice";
import { onBeforeMount } from "vue";

const { resetInvoice } = useActiveInvoice();

onBeforeMount(() => resetInvoice());
</script>

<template>
  
  <div ref="invoiceContainerRef" class="max-w-[1295px] mx-auto">
    <div class="flex">
      <InvoicePreview />
    </div>
  </div>
</template>

<style scoped></style>
