<script setup lang="ts">
import { useInvoiceStore } from "@/stores/invoice";
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";

type Props = {
  showBackButton: boolean
}

defineProps<Props>()
defineEmits(['backToForm'])

const invoiceStore = useInvoiceStore();

function formatNumberToCurrency(value: any, locale: string = 'en-US', currency: string = 'USD'): string {
    // Convert the value to a number and default to 0 if it's invalid
    const numericValue = isNaN(Number(value)) ? 0 : Number(value);

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(numericValue);
}
</script>

<template>
  <div class="invoice">
    <div class="invoice__toolbar">
        <div class="flex items-center gap-2">
            <Button v-if="showBackButton" size="small" icon="pi pi-arrow-left" @click="$emit('backToForm')" />
            <h2 class="invoice__title">Preview</h2>
        </div>
      <div>
        <Button size="small" label="Download as PDF" />
      </div>
    </div>
    <div class="page">
      <div class="grid grid-cols-2 gap-4 p-8">
        <div class="h-fit col-span-2 sm:col-span-1 whitespace-pre-wrap"></div>
        <div class="h-fit col-span-2 sm:col-span-1">
          <div class="text-4xl text-right">INVOICE</div>
          <div class="flex justify-between items-center">
            <div class="text-gray-500 text-sm">ID</div>
            <div>
              {{
                invoiceStore.activeInvoice?.id
              }}
            </div>
          </div>
          <div class="flex justify-between items-center">
            <div class="text-gray-500 text-sm">Date</div>
            <div>
              {{
                invoiceStore.activeInvoice?.invoiceDate?.toLocaleDateString()
              }}
            </div>
          </div>
          <div class="flex justify-between items-center">
            <div class="text-gray-500 text-sm">Invoice due</div>
            <div>
              {{ invoiceStore.activeInvoice?.dueDate?.toLocaleDateString() }}
            </div>
          </div>
        </div>
        <div class="h-fit col-span-2 sm:col-span-1 whitespace-pre-wrap">
          <div class="text-gray-500 text-sm">From</div>
          <div class="text-sm">
            {{ invoiceStore.activeInvoice?.sellerInfo }}
          </div>
        </div>
        <div class="h-fit col-span-2 sm:col-span-1 whitespace-pre-wrap">
          <div class="text-gray-500 text-sm">Bill to</div>
          <div class="text-sm">
            {{ invoiceStore.activeInvoice?.buyerInfo }}
          </div>
        </div>
        <div class="h-fit col-span-2 text-sm">
          <DataTable :value="invoiceStore.activeInvoice?.items">
            <Column field="description" header="Description" class="!w-full"></Column>
            <Column field="quantity" header="Quantity"></Column>
            <Column field="rate" header="Rate"></Column>
            <Column key="amount" field="amount" header="Amount">
              <template #body="slotProps">
                {{ formatNumberToCurrency(slotProps.data.quantity * slotProps.data.rate) }}
              </template>
            </Column>
          </DataTable>
        </div>
        <div class="h-fit col-span-2 sm:col-span-1"></div>
        <div class="h-fit col-span-2 sm:col-span-1">
          <div class="flex justify-between items-center text-right p-4">
            <div class="text-gray-500 text-sm">Total</div>
            <div>{{ formatNumberToCurrency(invoiceStore.activeInvoiceTotal) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.invoice {
  @apply w-full p-4 flex flex-col items-center;
  &__toolbar {
    @apply flex justify-between items-center mb-4;
    @apply max-w-[8.5in] w-full;
  }
  &__title {
    @apply text-2xl font-semibold;
  }
  .page {
    @apply shadow-lg border w-full max-w-[8.5in] min-h-[11in] bg-white;
  }
}
</style>
