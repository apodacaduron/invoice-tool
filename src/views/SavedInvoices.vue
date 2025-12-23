<script setup lang="ts">
import { ActiveInvoice, useActiveInvoice } from "@/composables/useActiveInvoice";
import { useAuthStatus } from "@/composables/useAuthStatus";
import { supabase } from "@/config/supabase";
import { formatNumberToCurrency } from "@/utils/formatNumber";
import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/vue-query";
import Button from "primevue/button";
import Popover from "primevue/popover";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { nextTick, ref, toRef, onMounted, onUnmounted } from "vue";

const actionsPopoverRef = ref<{
  show: (e: MouseEvent) => void;
  hide: () => void;
}>();
const selectedInvoice = ref<ActiveInvoice | null>(null);

const { fromDB } = useActiveInvoice();
const { data: session } = useAuthStatus();
const queryClient = useQueryClient();
const confirm = useConfirm();
const toast = useToast();

// --- Delete invoice mutation ---
const deleteInvoiceQuery = useMutation({
  async mutationFn(invoiceId?: string) {
    if (!invoiceId)
      throw new Error("Could not delete since invoice id was not provided");
    await supabase.from("invoices").delete().eq("id", invoiceId);
    await queryClient.invalidateQueries({ queryKey: ["invoices"] });
  },
});

// --- Infinite query setup ---
const PAGE_SIZE = 12;

const invoicesQuery = useInfiniteQuery({
  queryKey: ["invoices"],
  queryFn: async ({ pageParam = 0 }) => {
    const { data, error } = await supabase
      .from("invoices")
      .select()
      .order("date", { ascending: false })
      .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

    if (error) throw error;
    return data?.map(fromDB);
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage, allPages) => {
    if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
    return allPages.length; // next page index
  },
  enabled: toRef(() => Boolean(session.value)),
});

// --- Infinite scroll observer ---
const loadMoreRef = ref<HTMLElement | null>(null);

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (
        entry.isIntersecting &&
        invoicesQuery.hasNextPage.value &&
        !invoicesQuery.isFetchingNextPage.value
      ) {
        invoicesQuery.fetchNextPage();
      }
    },
    { threshold: 1 }
  );

  if (loadMoreRef.value) observer.observe(loadMoreRef.value);

  onUnmounted(() => {
    if (loadMoreRef.value) observer.unobserve(loadMoreRef.value);
  });
});

// --- Popover + Actions ---
function openActionsPopover(event: MouseEvent, invoice: ActiveInvoice) {
  selectedInvoice.value = invoice;
  nextTick(() => {
    actionsPopoverRef.value?.show(event);
  });
}

function confirmDelete(invoice?: ActiveInvoice | null) {
  if (!invoice) return;
  confirm.require({
    message: `Do you want to delete this record? ${invoice?.id}`,
    header: "Danger Zone",
    icon: "pi pi-info-circle",
    rejectLabel: "Cancel",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
    },
    accept: async () => {
      await deleteInvoiceQuery.mutateAsync(invoice.id);
      toast.add({
        severity: "info",
        summary: "Confirmed",
        detail: "Record deleted",
        life: 3000,
      });
    },
  });
}

// --- Download PDF ---
async function saveAsPdf(uuid: string) {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error("Usuario no autenticado");
    const token = session.access_token;

    const response = await fetch(
      "https://msoloxkubjdinqyeutzb.supabase.co/functions/v1/generate-pdf",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uuid }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Edge Function error: ${errText}`);
    }

    const disposition = response.headers.get("content-disposition");
    const match = disposition?.match(/filename="(.+)"/);
    const filename = match ? match[1] : "invoice.pdf";

    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });

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
</script>

<template>
  <div class="max-w-[1295px] mx-auto px-4 lg:px-6 py-4">
    <!-- Header Section -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-semibold mt-4">History</h2>
      <router-link to="/">
        <Button label="New invoice" icon="pi pi-plus" />
      </router-link>
    </div>

    <!-- Initial loading state -->
    <div v-if="invoicesQuery.isLoading.value" class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="n in 6"
        :key="n"
        class="animate-pulse bg-white dark:bg-neutral-800 shadow-md p-4 rounded-lg border dark:border-neutral-700"
      >
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/2"></div>
        <div class="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-1/3 mt-4"></div>
      </div>
    </div>

    <!-- Cards Section -->
    <div class="grid gap-4 mt-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="invoice in invoicesQuery.data.value?.pages.flat()"
        :key="invoice.id"
        class="bg-white dark:bg-neutral-800 shadow-md p-4 rounded-lg border dark:border-neutral-700 hover:shadow-lg transition"
      >
        <!-- Card Header -->
        <div class="flex justify-between items-center mb-2">
          <div>
            <h3 class="font-semibold text-lg flex items-center gap-2">
              <i class="pi pi-file text-blue-500"></i> Invoice
            </h3>
            <span class="text-xs text-gray-500 dark:text-neutral-500">{{
              invoice.id
            }}</span>
          </div>
          <Button
            icon="pi pi-ellipsis-v"
            text
            @click="openActionsPopover($event, invoice)"
          />
        </div>

        <!-- Invoice Content -->
        <div class="text-sm space-y-2">
          <!-- Dates -->
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-gray-600"></i>
            <div>
              <span class="font-medium">Date:</span>
              {{ invoice.date?.toLocaleDateString() }}
              <span class="mx-1 text-gray-400">→</span>
              <span class="font-medium">Due:</span>
              {{ invoice.due_date?.toLocaleDateString() }}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              <span class="font-medium">Seller:</span>
              <span class="text-gray-800 dark:text-neutral-400">{{
                invoice.seller_info
              }}</span>
            </div>

            <div class="flex gap-2">
              <span class="font-medium">Buyer:</span>
              <span class="text-gray-800 dark:text-neutral-400">{{
                invoice.buyer_info
              }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <i class="pi pi-box text-gray-600"></i>
            <span class="font-medium">Items:</span>
            {{ invoice.items?.length }}
          </div>

          <div class="flex items-center gap-2">
            <i class="pi pi-dollar text-gray-600"></i>
            <div>
              <span class="font-medium">Total:</span>
              {{
                formatNumberToCurrency(
                  invoice.items.reduce(
                    (prev, item) =>
                      prev + Number(item.rate) * Number(item.quantity),
                    0
                  )
                )
              }}
              {{ invoice.currency }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Infinite scroll sentinel -->
    <div ref="loadMoreRef" class="flex justify-center py-6 text-gray-500">
      <span v-if="invoicesQuery.isFetchingNextPage.value">Loading more...</span>
      <span v-else-if="!invoicesQuery.hasNextPage.value"
        >No more invoices</span
      >
    </div>

    <!-- Actions Popover -->
    <Popover ref="actionsPopoverRef">
      <div class="flex flex-col gap-4 w-[120px]">
        <ul class="list-none p-0 m-0 flex flex-col">
          <router-link :to="`/invoice/${selectedInvoice?.id}`">
            <li
              class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer rounded-border"
            >
              <i class="pi pi-eye mr-2" />
              <span class="font-medium">Open</span>
            </li>
          </router-link>
          <li
            class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer rounded-border"
            @click="saveAsPdf(selectedInvoice?.id || '')"
          >
            <i class="pi pi-download mr-2" />
            <span class="font-medium">Download</span>
          </li>
          <li
            class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer rounded-border text-red-500"
            @click="confirmDelete(selectedInvoice)"
          >
            <i class="pi pi-trash mr-2" />
            <span class="font-medium">Delete</span>
          </li>
        </ul>
      </div>
    </Popover>
  </div>
</template>
