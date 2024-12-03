<script setup lang="ts">
import { supabase } from "@/config/supabase";
import { deserializeInvoice, Invoice, useAuthStore } from "@/stores";
import { formatNumberToCurrency } from "@/utils/formatNumber";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import Button from "primevue/button";
import Popover from "primevue/popover";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { nextTick, ref, toRef } from "vue";

const actionsPopoverRef = ref<{
  show: (e: MouseEvent) => void;
  hide: () => void;
}>();
const selectedInvoice = ref<Invoice | null>(null);

const authStore = useAuthStore();
const queryClient = useQueryClient();
const confirm = useConfirm();
const toast = useToast();
const deleteInvoiceQuery = useMutation({
  async mutationFn(invoiceId?: string) {
    if (!invoiceId)
      throw new Error("Could not delete since invoice id was not provided");
    await supabase.from("invoices").delete().eq("id", invoiceId);
    await queryClient.invalidateQueries({ queryKey: ["invoices"] });
  },
});
const invoicesQuery = useQuery({
  queryKey: ["invoices"],
  async queryFn() {
    const serializedInvoices = await supabase
      .from("invoices")
      .select()
      .order("date", { ascending: false });
    const deserializedInvoices =
      serializedInvoices.data?.map(deserializeInvoice);
    return deserializedInvoices;
  },
  enabled: toRef(() => authStore.isLoggedIn),
});

function openActionsPopover(event: MouseEvent, invoice: Invoice) {
  selectedInvoice.value = invoice;
  nextTick(() => {
    actionsPopoverRef.value?.show(event);
  });
}

function confirmDelete(invoice?: Invoice | null) {
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

    <!-- Cards Section -->
    <div class="grid gap-4 mt-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="invoice in invoicesQuery.data.value"
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
            <!-- Seller -->
            <div class="flex gap-2">
              <!-- <i class="pi pi-user text-gray-600"></i> -->
              <span class="font-medium">Seller:</span>
              <span class="text-gray-800 dark:text-neutral-400">{{
                invoice.seller_info
              }}</span>
            </div>

            <!-- Buyer -->
            <div class="flex gap-2">
              <!-- <i class="pi pi-user-edit text-gray-600"></i> -->
              <span class="font-medium">Buyer:</span>
              <span class="text-gray-800 dark:text-neutral-400">{{
                invoice.buyer_info
              }}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="flex items-center gap-2">
            <i class="pi pi-box text-gray-600"></i>
            <span class="font-medium">Items:</span>
            {{ invoice.items?.length }}
          </div>

          <!-- Total -->
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
