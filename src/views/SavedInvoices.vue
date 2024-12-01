<script setup lang="ts">
import { supabase } from "@/config/supabase";
import { deserializeInvoice, Invoice, useAuthStore } from "@/stores";
import { formatNumberToCurrency } from "@/utils/formatNumber";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Popover from "primevue/popover";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { nextTick, ref, toRef } from "vue";

const actionsPopoverRef = ref<{
  show: (e: MouseEvent) => void;
  hide: () => void;
}>();
const selectedInvoice = ref<Invoice | null>(null);

const authStore = useAuthStore()
const queryClient = useQueryClient();
const confirm = useConfirm();
const toast = useToast();
const deleteInvoiceQuery = useMutation({
  async mutationFn(invoiceId?: string) {
    if (!invoiceId) throw new Error('Could not delete since invoice id was not provided')
    await supabase.from('invoices').delete().eq('id', invoiceId)
    await queryClient.invalidateQueries({ queryKey: ["invoices"] });
  },
});
const invoicesQuery = useQuery({
  queryKey: ["invoices"],
  async queryFn() {
    const serializedInvoices = await supabase
      .from('invoices')
      .select().order('date', {ascending: false})
    const deserializedInvoices =
      serializedInvoices.data?.map(deserializeInvoice);
    return deserializedInvoices;
  },
  enabled: toRef(() => authStore.isLoggedIn)
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
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-semibold mt-4">History</h2>
      <router-link to="/">
        <Button label="New invoice" icon="pi pi-plus" />
      </router-link>
    </div>

    <DataTable :value="invoicesQuery.data.value" tableStyle="min-width: 60rem">
      <Column field="id" header="ID"></Column>
      <Column field="date" header="Date">
        <template #body="slotProps">
          {{ slotProps.data.date.toLocaleDateString() }}
        </template>
      </Column>
      <Column field="due_date" header="Due date">
        <template #body="slotProps">
          {{ slotProps.data.date.toLocaleDateString() }}
        </template>
      </Column>
      <Column field="seller_info" header="Seller info"></Column>
      <Column field="buyer_info" header="Buyer info"></Column>
      <Column field="items" header="Items">
        <template #body="slotProps">
          {{ slotProps.data.items.length }}
        </template>
      </Column>
      <Column field="total" header="Total">
        <template #body="slotProps">
          {{
            formatNumberToCurrency(
              (slotProps.data.items as Invoice["items"]).reduce(
                (prev, item) =>
                  prev + Number(item.rate) * Number(item.quantity),
                0
              )
            )
          }} {{ slotProps.data?.currency }}
        </template>
      </Column>
      <Column header="-">
        <template #body="slotProps">
          <Button
            icon="pi pi-ellipsis-v"
            text
            @click="openActionsPopover($event, slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>

    <Popover ref="actionsPopoverRef">
      <div class="flex flex-col gap-4 w-[120px]">
        <div>
          <ul class="list-none p-0 m-0 flex flex-col">
            <router-link :to="`/invoice/${selectedInvoice?.id}`">
              <li
                class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer rounded-border"
              >
                <div>
                  <i class="pi pi-eye mr-2" />
                  <span class="font-medium">Open</span>
                </div>
              </li>
            </router-link>
            <li
              class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer rounded-border !text-red-500"
              @click="confirmDelete(selectedInvoice)"
            >
              <div>
                <i class="pi pi-trash mr-2" />
                <span class="font-medium">Delete</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Popover>
  </div>
</template>
