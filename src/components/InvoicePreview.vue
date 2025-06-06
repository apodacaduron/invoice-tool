<script setup lang="ts">
import { serializeInvoice, useInvoiceStore } from "@/stores/invoice";
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { ref } from "vue";
import html2pdf from "html2pdf.js";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { formatNumberToCurrency } from "@/utils/formatNumber";
import router from "@/config/router";
import { useAuthStore } from "@/stores";
import { supabase } from "@/config/supabase";
import SignInDialog from "./SignInDialog.vue";
import { useDark, useToggle } from "@vueuse/core";

type Props = {
  showBackButton: boolean;
};

defineProps<Props>();
defineEmits(["backToForm"]);

const PDF_OPTIONS = {
  margin: [0.3, 0.5, 1, 0.5],
  image: { type: "jpeg", quality: 0.98 },
  html2canvas: { scale: 2 },
  jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
};

const invoicePageRef = ref<HTMLElement | null>(null);

const isDarkMode = useDark();
const toggleDarkMode = useToggle(isDarkMode);
const authStore = useAuthStore();
const invoiceStore = useInvoiceStore();
const queryClient = useQueryClient();
const pdfMutation = useMutation({ mutationFn: saveAsPdf });
const saveToDatabaseMutation = useMutation({
  mutationFn: saveInvoiceToDatabase,
});

async function saveAsPdf() {
  if (!invoicePageRef.value) return;

  const wasDarkMode = isDarkMode.value;
  if (wasDarkMode) toggleDarkMode();

  const pdfInstance = html2pdf().set(PDF_OPTIONS).from(invoicePageRef.value);
  const date = invoiceStore.activeInvoice?.date
    ?.toDateString()
    .replaceAll(" ", "-")
    .toLowerCase();
  const filename = `invoice-${date || "unknown"}.pdf`;

  await saveInvoiceToDatabase();
  await pdfInstance.save(filename);

  if (wasDarkMode) toggleDarkMode();

  authStore.isSignInDialogVisible = false;
}

function handleDownloadInvoice() {
  if (!invoiceStore.activeInvoice) return;
  if (!authStore.isLoggedIn) {
    authStore.isSignInDialogVisible = true;
    return;
  }

  pdfMutation.mutate();
}

async function saveInvoiceToDatabase() {
  if (!invoiceStore.activeInvoice || !authStore.isLoggedIn) return;

  const { data: savedInvoice } = await supabase
    .from("invoices")
    .upsert(serializeInvoice(invoiceStore.activeInvoice))
    .select()
    .single();

  if (savedInvoice) {
    invoiceStore.setActiveInvoiceId(savedInvoice.id);
    await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    await router.push(`/invoice/${savedInvoice.id}`);
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
      <div class="flex gap-2">
        <Button
          v-if="authStore.isLoggedIn"
          @click="saveToDatabaseMutation.mutate"
          size="small"
          label="Save"
          icon="pi pi-save"
          :disabled="
            saveToDatabaseMutation.isPending.value ||
            pdfMutation.isPending.value
          "
          :loading="saveToDatabaseMutation.isPending.value"
        />
        <Button
          @click="handleDownloadInvoice"
          size="small"
          label="Download"
          icon="pi pi-download"
          :disabled="
            pdfMutation.isPending.value ||
            saveToDatabaseMutation.isPending.value
          "
          :loading="pdfMutation.isPending.value"
        />
      </div>
    </div>
    <div class="page">
      <div ref="invoicePageRef" class="grid grid-cols-2 gap-4">
        <div
          :class="[
            'h-fit sm:col-span-1',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="text-4xl font-bold mb-3">INVOICE</div>
        </div>
        <div
          :class="[
            'h-fit sm:col-span-1',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="flex justify-between items-center">
            <div class="text-gray-500 dark:text-gray-200 font-bold text-sm">
              ID
            </div>
            <div class="text-xs">
              {{ invoiceStore.activeInvoice?.id || "-" }}
            </div>
          </div>
          <div class="flex justify-between items-center">
            <div class="text-gray-500 dark:text-gray-200 font-bold text-sm">
              Date
            </div>
            <div class="text-xs">
              {{ invoiceStore.activeInvoice?.date?.toDateString() || "-" }}
            </div>
          </div>
          <div class="flex justify-between items-center">
            <div class="text-gray-500 dark:text-gray-200 font-bold text-sm">
              Invoice due
            </div>
            <div class="text-xs">
              {{ invoiceStore.activeInvoice?.due_date?.toDateString() || "-" }}
            </div>
          </div>
        </div>
        <div
          :class="[
            'h-fit sm:col-span-1 whitespace-pre-wrap',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="text-gray-500 dark:text-gray-200 font-bold text-sm">
            From
          </div>
          <div class="text-sm">
            {{ invoiceStore.activeInvoice?.seller_info || "-" }}
          </div>
        </div>
        <div
          :class="[
            'h-fit sm:col-span-1 whitespace-pre-wrap',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="text-gray-500 dark:text-gray-200 font-bold text-sm">
            Bill to
          </div>
          <div class="text-sm">
            {{ invoiceStore.activeInvoice?.buyer_info || "-" }}
          </div>
        </div>
        <div class="h-fit col-span-2 text-sm whitespace-pre-wrap">
          <DataTable :value="invoiceStore.activeInvoice?.items">
            <Column field="description" header="Description" class="!w-full">
              <template #body="slotProps">
                {{ slotProps.data.description || "-" }}
              </template>
            </Column>
            <Column field="quantity" header="Hours">
              <template #body="slotProps">
                {{ slotProps.data.quantity || "-" }}
              </template>
            </Column>
            <Column field="rate" header="Rate">
              <template #body="slotProps">
                {{ formatNumberToCurrency(slotProps.data.rate) || "-" }}
              </template>
            </Column>
            <Column key="amount" field="amount" header="Amount">
              <template #body="slotProps">
                {{
                  formatNumberToCurrency(
                    slotProps.data.quantity * slotProps.data.rate
                  ) || "-"
                }}
              </template>
            </Column>
          </DataTable>
        </div>
        <div
          :class="[
            'h-fit sm:col-span-1',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        ></div>
        <div
          :class="[
            'h-fit sm:col-span-1 text-xl font-semibold mt-4 p-2 bg-gray-100 dark:bg-neutral-900',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="flex justify-between items-center text-right p-4">
            <div class="text-gray-500 text-sm">Total</div>
            <div>
              {{
                formatNumberToCurrency(invoiceStore.activeInvoiceTotal) || "-"
              }}
              {{ invoiceStore.activeInvoice?.currency || "USD" }}
            </div>
          </div>
        </div>
        <div v-if="invoiceStore.activeInvoice?.notes" class="h-fit col-span-2 text-sm whitespace-pre-wrap">
          Notes:
          <p>
            {{ invoiceStore.activeInvoice?.notes }}
          </p>
        </div>
      </div>
    </div>

    <SignInDialog v-model:visible="authStore.isSignInDialogVisible">
      <Button
        @click="pdfMutation.mutate"
        fluid
        icon="pi pi-download"
        label="Download without sign in"
        text
        :loading="pdfMutation.isPending.value"
      />
    </SignInDialog>
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
    @apply shadow-lg border dark:border-neutral-700 w-full max-w-[8.5in] min-h-[11in] bg-white dark:bg-neutral-800;
    @apply p-4 lg:p-10;
  }
}
</style>
