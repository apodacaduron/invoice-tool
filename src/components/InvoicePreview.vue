<script setup lang="ts">
import { useInvoiceStore } from "@/stores/invoice";
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { ref } from "vue";
import html2pdf from "html2pdf.js";
import { writeBinaryFile } from "@tauri-apps/api/fs";
import { dialog } from "@tauri-apps/api";

type Props = {
  showBackButton: boolean;
};

defineProps<Props>();
defineEmits(["backToForm"]);

const pageRef = ref<HTMLElement | null>(null);

const invoiceStore = useInvoiceStore();

function formatNumberToCurrency(
  value: any,
  locale: string = "en-US",
  currency: string = "USD"
): string {
  // Convert the value to a number and default to 0 if it's invalid
  const numericValue = isNaN(Number(value)) ? 0 : Number(value);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(numericValue);
}

function isTauri() {
  return Boolean(window.__TAURI__);
}

async function saveAsPdf() {
  if (!pageRef.value) return;
  const options = {
    margin: [0.3, 0.5, 1, 0.5],
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  const pdfInstance = html2pdf().set(options).from(pageRef.value);

  if (isTauri()) {
    const pdf = await pdfInstance.toPdf().get("pdf");
    const blob = pdf.output("blob");

    const arrayBuffer = await blob.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);

    const savePath = await dialog.save({
      title: "Save PDF",
      defaultPath: `invoice.pdf`, // Default filename
      filters: [{ name: "PDF Documents", extensions: ["pdf"] }],
    });

    if (savePath) {
      await writeBinaryFile(savePath, byteArray);
    } else {
      console.log("Save dialog was canceled.");
    }
  } else {
    await pdfInstance.save();
  }
}
</script>

<template>
  <div class="invoice">
    <div class="invoice__toolbar">
      <div class="flex items-center gap-2">
        <Button
          v-if="showBackButton"
          size="small"
          text
          icon="pi pi-arrow-left"
          @click="$emit('backToForm')"
        />
        <h2 class="invoice__title">Preview</h2>
      </div>
      <div>
        <Button
          @click="saveAsPdf"
          size="small"
          label="Download"
          icon="pi pi-download"
        />
      </div>
    </div>
    <div class="page">
      <div ref="pageRef" class="grid grid-cols-2 gap-4">
        <div class="h-fit col-span-2 sm:col-span-1">
          <img
            v-if="invoiceStore.activeInvoice?.logo"
            :src="invoiceStore.activeInvoice?.logo.toString()"
            alt="Invoice logo"
            class="w-auto h-auto max-w-[300px] max-h-[100px]"
          />
        </div>
        <div class="h-fit col-span-2 sm:col-span-1">
          <div class="text-4xl text-right">INVOICE</div>
          <div class="flex justify-between items-center">
            <div class="text-gray-500 text-sm">ID</div>
            <div>
              {{ invoiceStore.activeInvoice?.id }}
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
        <div class="h-fit col-span-2 text-sm whitespace-pre-wrap">
          <DataTable :value="invoiceStore.activeInvoice?.items">
            <Column
              field="description"
              header="Description"
              class="!w-full"
            ></Column>
            <Column field="quantity" header="Quantity"></Column>
            <Column field="rate" header="Rate"></Column>
            <Column key="amount" field="amount" header="Amount">
              <template #body="slotProps">
                {{
                  formatNumberToCurrency(
                    slotProps.data.quantity * slotProps.data.rate
                  )
                }}
              </template>
            </Column>
          </DataTable>
        </div>
        <div class="h-fit col-span-2 sm:col-span-1"></div>
        <div class="h-fit col-span-2 sm:col-span-1">
          <div class="flex justify-between items-center text-right p-4">
            <div class="text-gray-500 text-sm">Total</div>
            <div>
              {{ formatNumberToCurrency(invoiceStore.activeInvoiceTotal) }}
            </div>
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
    @apply p-4 lg:p-10;
  }
}
</style>
