<script setup lang="ts">
import InvoicePreview from "@/components/InvoicePreview.vue";
import { useActiveInvoice } from "@/composables/useActiveInvoice";
import { useAuthStatus } from "@/composables/useAuthStatus";
import { supabase } from "@/config/supabase";
import { useQuery } from "@tanstack/vue-query";
import BlockUI from "primevue/blockui";
import ProgressSpinner from "primevue/progressspinner";
import { toRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const { data: session } = useAuthStatus();
const route = useRoute()
const router = useRouter()
const { fromDB, setInvoice } = useActiveInvoice();
const invoiceQuery = useQuery({
  queryKey: ['invoice', route.params.invoiceId?.toString()],
  async queryFn() {
    const invoice = await supabase.from('invoices').select().eq('id', route.params.invoiceId.toString()).single()
    if (!invoice.data) throw new Error('Invoice not found')
    return fromDB(invoice.data)
  },
  enabled: toRef(() => Boolean(route.params.invoiceId?.toString() && session.value))
})


watch([invoiceQuery.isSuccess, () => invoiceQuery.data.value], ([isSuccess, invoiceData]) => {
  if (!isSuccess) return;
  if (!invoiceData) return router.push('/404');

  return setInvoice({ ...invoiceData, items: JSON.parse(JSON.stringify(invoiceData.items)) })
}, { immediate: true })
</script>

<template>
  
  <div ref="invoiceContainerRef" class="max-w-[1295px] mx-auto">
    <BlockUI :blocked="invoiceQuery.isLoading.value" fullScreen unstyled>
    <div v-if="invoiceQuery.isLoading.value" class="h-screen absolute w-full top-0 left-0 flex justify-center items-center">
      <ProgressSpinner />
    </div>
  </BlockUI>

    <div v-if="!invoiceQuery.isLoading.value" class="flex">
      <InvoicePreview />
    </div>
  </div>
</template>

<style scoped></style>
