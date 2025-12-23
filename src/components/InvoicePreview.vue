<script setup lang="ts">
import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { formatNumberToCurrency } from "@/utils/formatNumber";
import router from "@/config/router";
import { supabase } from "@/config/supabase";
import { useAuthStatus } from "@/composables/useAuthStatus";
import { Invoice, useActiveInvoice } from "@/composables/useActiveInvoice";
import {
  DatePicker,
  Dialog,
  InputText,
  ProgressSpinner,
  Select,
  Textarea,
} from "primevue";
import { currencies } from "@/utils/currencies";
import { ref, toRef } from "vue";

const isRecentSellersDialogOpen = ref(false);
const isRecentBuyersDialogOpen = ref(false);

const { data: session } = useAuthStatus();
const { activeInvoice, addItem, setInvoice, toDB, fromDB, total } =
  useActiveInvoice();
const queryClient = useQueryClient();
const pdfMutation = useMutation({ mutationFn: saveAsPdf });
const saveToDatabaseMutation = useMutation({
  mutationFn: saveInvoiceToDatabase,
});

const recentSellersQuery = useQuery({
  queryKey: ["recent-sellers"],
  queryFn: async () =>
    await supabase
      .from("sellers")
      .select()
      .order("created_at", { ascending: false })
      .limit(10),
  enabled: toRef(
    () => isRecentSellersDialogOpen.value && Boolean(session.value)
  ),
});
const recentBuyersQuery = useQuery({
  queryKey: ["recent-buyers"],
  queryFn: async () =>
    await supabase
      .from("buyers")
      .select()
      .order("created_at", { ascending: false })
      .limit(10),
  enabled: toRef(
    () => isRecentBuyersDialogOpen.value && Boolean(session.value)
  ),
});

function selectRecentValue(
  value: string | null,
  field: keyof Pick<Invoice, "buyer_info" | "seller_info">
) {
  if (!activeInvoice) return;
  if (value === null) return;

  activeInvoice[field] = value;
  closeRecentValuesDialog();
}

function closeRecentValuesDialog() {
  isRecentBuyersDialogOpen.value = false;
  isRecentSellersDialogOpen.value = false;
}

async function saveAsPdf() {
  try {
    await saveInvoiceToDatabase();

    if (!activeInvoice?.id) throw new Error("Invoice ID missing");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("Usuario no autenticado");
    const token = session.access_token;

    // Call your Supabase Edge Function
    const response = await fetch(
      "https://msoloxkubjdinqyeutzb.supabase.co/functions/v1/generate-pdf",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uuid: activeInvoice.id }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Edge Function error: ${errText}`);
    }

    // --- 💡 Get filename from response header ---
    const disposition = response.headers.get("content-disposition");
    const match = disposition?.match(/filename="(.+)"/);
    const filename = match ? match[1] : "invoice.pdf";

    // --- Convert returned data to Blob ---
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });

    // --- Trigger download ---
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error saving PDF:", err);
  }
}

function handleDownloadInvoice() {
  if (!activeInvoice) return;
  if (!session.value) {
    return;
  }

  pdfMutation.mutate();
}

async function saveInvoiceToDatabase() {
  if (!activeInvoice || !session.value) return;

  const { data: savedInvoice } = await supabase
    .from("invoices")
    .upsert(toDB(activeInvoice))
    .select()
    .single();

  if (savedInvoice) {
    setInvoice(fromDB(savedInvoice));
    await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    await router.push(`/invoice/${savedInvoice.id}`);
  }
}
</script>

<template>
  <div class="invoice">
    <div class="invoice__toolbar">
      <div class="flex items-center gap-2">
        <h1 class="invoice__title">Invoice</h1>
      </div>
      <div class="flex gap-3">
        <Button
          v-if="session"
          @click="saveToDatabaseMutation.mutate()"
          size="small"
          label="Save"
          icon="pi pi-save"
          :disabled="
            saveToDatabaseMutation.isPending.value ||
            pdfMutation.isPending.value
          "
          :loading="saveToDatabaseMutation.isPending.value"
          severity="secondary"
          v-tooltip.bottom="'Save invoice to your account'"
        />
        <Button
          @click="handleDownloadInvoice"
          size="small"
          label="Download PDF"
          icon="pi pi-download"
          :disabled="
            pdfMutation.isPending.value ||
            saveToDatabaseMutation.isPending.value
          "
          :loading="pdfMutation.isPending.value"
          v-tooltip.bottom="session ? 'Generate and download PDF' : 'Sign in required to download'"
        />
      </div>
    </div>
    <div class="page">
      <div class="grid grid-cols-2 gap-6">
        <div
          :class="[
            'h-fit sm:col-span-1',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="text-5xl font-bold mb-8 tracking-tight text-gray-900 dark:text-white">INVOICE</div>
        </div>
        <div
          :class="[
            'h-fit sm:col-span-1 space-y-3',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="flex justify-between items-center gap-4">
            <div class="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wide">
              Invoice ID
            </div>
            <div class="text-xs text-gray-700 dark:text-gray-300">
              {{ activeInvoice?.id || "Not yet saved" }}
            </div>
          </div>
          <div class="flex justify-between items-center gap-4">
            <div class="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wide">
              Issue Date
            </div>
            <div class="text-xs">
              <DatePicker
                id="date"
                type="date"
                v-model="activeInvoice.date"
                placeholder="Select date"
                size="small"
              />
            </div>
          </div>
          <div class="flex justify-between items-center gap-4">
            <div class="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wide">
              Due Date
            </div>
            <div class="text-xs">
              <DatePicker
                id="due_date"
                type="date"
                v-model="activeInvoice.due_date"
                placeholder="Select due date"
                size="small"
              />
            </div>
          </div>
        </div>
        <div
          :class="[
            'h-fit sm:col-span-1 whitespace-pre-wrap',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="flex justify-between items-end mb-2">
            <label
              class="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide"
              for="seller_info"
              >From</label
            >
            <Button
              v-if="session"
              @click="isRecentSellersDialogOpen = true"
              small
              text
              icon="pi pi-history"
              class="!py-0 !text-xs !text-gray-500 hover:!text-gray-700 dark:hover:!text-gray-300"
              v-tooltip.bottom="'Use saved business details'"
            />
          </div>
          <Textarea
            id="seller_info"
            :autoResize="true"
            v-model="activeInvoice.seller_info"
            class="rounded p-3 w-full text-sm leading-relaxed"
            placeholder="Your business information&#10;Company name&#10;Street address&#10;City, State ZIP&#10;Email or phone"
            size="small"
          ></Textarea>
        </div>
        <div
          :class="[
            'h-fit sm:col-span-1 whitespace-pre-wrap',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="flex justify-between items-end mb-2">
            <label
              class="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide"
              for="buyer_info"
              >Bill To</label
            >
            <Button
              v-if="session"
              @click="isRecentBuyersDialogOpen = true"
              small
              text
              icon="pi pi-history"
              class="!py-0 !text-xs !text-gray-500 hover:!text-gray-700 dark:hover:!text-gray-300"
              v-tooltip.bottom="'Use saved client details'"
            />
          </div>
          <Textarea
            id="buyer_info"
            :autoResize="true"
            v-model="activeInvoice.buyer_info"
            class="rounded p-3 w-full text-sm leading-relaxed"
            placeholder="Client information&#10;Client or company name&#10;Street address&#10;City, State ZIP&#10;Email or phone"
            size="small"
          ></Textarea>
        </div>
        <div class="h-fit col-span-2 text-sm whitespace-pre-wrap">
          <DataTable :value="activeInvoice?.items" stripedRows>
            <Column field="description" header="DESCRIPTION" class="!w-full">
              <template #body="slotProps">
                <Textarea
                  id="itemDescription"
                  v-model="activeInvoice.items[slotProps.index].description"
                  placeholder="Service or product description"
                  size="small"
                  class="!text-sm w-full"
                />
              </template>
            </Column>
            <Column field="quantity" header="HOURS">
              <template #body="slotProps">
                <InputText
                  :modelValue="
                    String(activeInvoice.items[slotProps.index].quantity)
                  "
                  @update:modelValue="
                    activeInvoice.items[slotProps.index].quantity =
                      Number($event)
                  "
                  id="quantity"
                  type="number"
                  placeholder="0"
                  size="small"
                  class="w-20 text-right"
                />
              </template>
            </Column>
            <Column field="rate" header="RATE">
              <template #body="slotProps">
                <InputText
                  id="rate"
                  type="number"
                  :modelValue="
                    String(activeInvoice.items[slotProps.index].rate)
                  "
                  @update:modelValue="
                    activeInvoice.items[slotProps.index].rate = Number($event)
                  "
                  placeholder="0.00"
                  size="small"
                  class="w-24 text-right"
                />
              </template>
            </Column>
            <Column key="amount" field="amount" header="AMOUNT">
              <template #body="slotProps">
                <span class="font-medium">{{
                  formatNumberToCurrency(
                    slotProps.data.quantity * slotProps.data.rate
                  ) || "-"
                }}</span>
              </template>
            </Column>
            <Column v-if="activeInvoice && activeInvoice.items.length > 1" key="delete" field="delete" header="" class="!w-12">
              <template #body="slotProps">
                <Button
                  @click="activeInvoice.items.splice(slotProps.index, 1)"
                  size="small"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  class="!p-1"
                />
              </template>
            </Column>
          </DataTable>

          <Button
            @click="addItem()"
            label="Add Line Item"
            severity="secondary"
            icon="pi pi-plus"
            text
            class="mt-3 w-full !text-sm"
          />
        </div>
        <div
          :class="[
            'h-fit sm:col-span-1',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        ></div>
        <div
          :class="[
            'h-fit sm:col-span-1 text-xl font-semibold mt-8 p-5 border-t-2 border-gray-300 dark:border-neutral-600',
            { 'col-span-2': !pdfMutation.isPending.value },
          ]"
        >
          <div class="flex justify-between items-center text-right">
            <div class="text-gray-600 dark:text-gray-400 text-sm font-semibold uppercase tracking-wide">Total</div>
            <div class="flex gap-3 items-center">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatNumberToCurrency(total) || "0.00" }}</span>
              <Select
                id="currency"
                :options="currencies"
                filter
                v-model="activeInvoice.currency"
                placeholder="Currency"
                size="small"
                class="w-24"
              />
            </div>
          </div>
        </div>
        <div class="col-span-2 mt-6">
          <label
            class="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide block mb-3"
            for="notes"
            >Additional Notes</label
          >
          <Textarea
            id="notes"
            :autoResize="true"
            v-model="activeInvoice.notes"
            class="rounded p-3 w-full text-sm leading-relaxed"
            placeholder="Payment terms, delivery instructions, or other relevant information"
            size="small"
          ></Textarea>
        </div>
      </div>
    </div>
    <Dialog
      v-model:visible="isRecentSellersDialogOpen"
      modal
      header="Saved Business Details"
      :style="{ width: '28rem' }"
    >
      <div
        v-if="recentSellersQuery.isLoading.value"
        class="flex justify-center items-center"
      >
        <ProgressSpinner />
      </div>
      <div
        v-else-if="!recentSellersQuery.data.value?.data?.length"
        class="flex flex-col items-center text-center space-y-4 py-6"
      >
        <i class="pi pi-inbox text-gray-400 dark:text-gray-500" style="font-size: 2rem"></i>
        <p class="text-gray-500 dark:text-gray-400">No saved business details yet</p>
      </div>
      <div v-else class="flex flex-col gap-2">
        <Button
          v-for="(recentValue, index) in recentSellersQuery.data.value.data"
          :key="index"
          text
          class="w-full"
          @click="selectRecentValue(recentValue.info, 'seller_info')"
        >
          {{ recentValue.info ?? "-" }}
        </Button>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="isRecentBuyersDialogOpen"
      modal
      header="Saved Client Details"
      :style="{ width: '28rem' }"
    >
      <div
        v-if="recentBuyersQuery.isLoading.value"
        class="flex justify-center items-center"
      >
        <ProgressSpinner />
      </div>
      <div
        v-else-if="!recentBuyersQuery.data.value?.data?.length"
        class="flex flex-col items-center text-center space-y-4 py-6"
      >
        <i class="pi pi-inbox text-gray-400 dark:text-gray-500" style="font-size: 2rem"></i>
        <p class="text-gray-500 dark:text-gray-400">No saved client details yet</p>
      </div>
      <div v-else class="flex flex-col gap-2">
        <Button
          v-for="(recentValue, index) in recentBuyersQuery.data.value?.data"
          :key="index"
          text
          class="w-full"
          @click="selectRecentValue(recentValue.info, 'buyer_info')"
        >
          {{ recentValue.info ?? "-" }}
        </Button>
      </div>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.invoice {
  @apply w-full p-4 flex flex-col items-center;

  &__toolbar {
    @apply flex justify-between items-center mb-6;
    @apply max-w-[8.5in] w-full;
  }

  &__title {
    @apply text-xl font-semibold text-gray-900 dark:text-white;
  }

  .page {
    @apply shadow-xl border border-gray-200 dark:border-neutral-700 w-full max-w-[8.5in] min-h-[11in] bg-white dark:bg-neutral-800;
    @apply p-8 lg:p-12;
  }
}
</style>
