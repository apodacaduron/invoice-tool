<script setup lang="ts">
import InvoiceForm from "@/components/InvoiceForm.vue";
import InvoicePreview from "@/components/InvoicePreview.vue";
import { useResizeObserver } from "@/composables/useResizeObserver";
import { supabase } from "@/config/supabase";
import { useAuthStore } from "@/stores";
import { deserializeInvoice, useInvoiceStore } from "@/stores/invoice";
import { useQuery } from "@tanstack/vue-query";
import BlockUI from "primevue/blockui";
import ProgressSpinner from "primevue/progressspinner";
import { ref, toRef, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

const invoiceContainerRef = ref<HTMLDivElement | null>(null);
const isPreviewVisible = ref(false);

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const invoiceStore = useInvoiceStore()
const { elementSize: invoiceContainerDimensions } =
  useResizeObserver(invoiceContainerRef);
const invoiceQuery = useQuery({
  queryKey: ['invoice', route.params.invoiceId?.toString()],
  async queryFn() {
    const serializedInvoice = await supabase.from('invoices').select().eq('id', route.params.invoiceId.toString()).single()
    if (!serializedInvoice.data) throw new Error('Invoice not found')
    const deserializedInvoice = deserializeInvoice(serializedInvoice.data)
    return deserializedInvoice
  },
  enabled: toRef(() => Boolean(route.params.invoiceId?.toString()) && authStore.isLoggedIn)
})

const isMobile = toRef(() => invoiceContainerDimensions.value.width < 1024)

watchEffect(() => {
  const isInvoiceLoading = invoiceQuery.isLoading.value
  if (isInvoiceLoading) return
  const hasInvoice = invoiceQuery.data.value
  if (hasInvoice) {
    return invoiceStore.setActiveInvoice({...invoiceQuery.data.value})
  }

  router.push('/404')
})
</script>

<template>
  
  <div ref="invoiceContainerRef" class="max-w-[1295px] mx-auto">
    <BlockUI :blocked="invoiceQuery.isLoading.value" fullScreen unstyled>
    <div v-if="invoiceQuery.isLoading.value" class="h-screen absolute w-full top-0 left-0 flex justify-center items-center">
      <ProgressSpinner />
    </div>
  </BlockUI>

    <div v-if="!invoiceQuery.isLoading.value" class="flex">
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
