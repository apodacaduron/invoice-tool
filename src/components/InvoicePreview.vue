<script setup lang="ts">
import { useInvoiceStore } from "@/stores/invoice";
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { ref } from "vue";
import html2pdf from "html2pdf.js";
import { writeBinaryFile } from "@tauri-apps/api/fs";
import { dialog } from "@tauri-apps/api";
import { db, serializeInvoice } from "@/config/database";
import { useQueryClient } from "@tanstack/vue-query";
import { formatNumberToCurrency } from "@/utils/formatNumber";
import router from "@/config/router";

type Props = {
  showBackButton: boolean;
};

defineProps<Props>();
defineEmits(["backToForm"]);

const pageRef = ref<HTMLElement | null>(null);

const invoiceStore = useInvoiceStore();
const queryClient = useQueryClient()

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
  const date = new Date().toDateString().replace(' ', '-');
  const filename = `invoice-${date}.pdf`

  if (isTauri()) {
    const pdf = await pdfInstance.toPdf().get("pdf");
    const blob = pdf.output("blob");

    const arrayBuffer = await blob.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);

    const savePath = await dialog.save({
      title: "Save PDF",
      defaultPath: filename, // Default filename
      filters: [{ name: "PDF Documents", extensions: ["pdf"] }],
    });

    if (savePath) {
      await writeBinaryFile(savePath, byteArray);
      storeInvoice()
    } else {
      console.log("Save dialog was canceled.");
    }
  } else {
    await pdfInstance.save(filename);
    storeInvoice()
  }
}

async function downloadInvoice() {
  if (!invoiceStore.activeInvoice) return;
  await saveAsPdf();
}

async function storeInvoice() {
  if (!invoiceStore.activeInvoice) return;
  const invoiceId = await db.invoices.put(
    serializeInvoice({ ...invoiceStore.activeInvoice })
  );
  await queryClient.invalidateQueries({ queryKey: ['invoices'] })
  router.push(`/invoice/${invoiceId}`)
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
          @click="downloadInvoice"
          size="small"
          label="Save"
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
              {{ invoiceStore.activeInvoice?.date?.toLocaleDateString() }}
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
              {{ formatNumberToCurrency(invoiceStore.activeInvoiceTotal) }} {{ invoiceStore.activeInvoice?.currency ?? 'USD' }}
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
