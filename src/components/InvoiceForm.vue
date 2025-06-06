<script setup lang="ts">
import { ref, toRef, watch } from "vue";
import { useRoute } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores";
import { supabase } from "@/config/supabase";
import {
  useInvoiceStore,
  buildInvoiceItem,
  Invoice,
} from "@/stores/invoice";
import { currencies } from "@/utils/currencies";

import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import ProgressSpinner from "primevue/progressspinner";

type Props = {
  showPreviewButton: boolean;
};

defineProps<Props>();
defineEmits(["preview"]);

const authStore = useAuthStore();
const invoiceStore = useInvoiceStore();

const invoiceForm = ref<Invoice | null>(invoiceStore.activeInvoice);
const isRecentSellersDialogOpen = ref(false);
const isRecentBuyersDialogOpen = ref(false);

const route = useRoute();

const recentSellersQuery = useQuery({
  queryKey: ["recent-sellers"],
  queryFn: async () => await supabase
      .from("sellers")
      .select()
      .order("created_at", { ascending: false })
      .limit(10),
  enabled: toRef(
    () => isRecentSellersDialogOpen.value && authStore.isLoggedIn
  ),
});
const recentBuyersQuery = useQuery({
  queryKey: ["recent-buyers"],
  queryFn: async () => await supabase
      .from("buyers")
      .select()
      .order("created_at", { ascending: false })
      .limit(10),
  enabled: toRef(
    () => isRecentBuyersDialogOpen.value && authStore.isLoggedIn
  ),
});

function addInvoiceItem() {
  invoiceForm.value?.items.push(buildInvoiceItem());
}

function selectRecentValue(value: string | null, field: keyof Pick<Invoice, 'buyer_info' | 'seller_info'>) {
  if (!invoiceForm.value) return
  if (value === null) return

  invoiceForm.value[field] = value;
  closeRecentValuesDialog();
}

function closeRecentValuesDialog() {
  isRecentBuyersDialogOpen.value = false;
  isRecentSellersDialogOpen.value = false;
}

watch(
  invoiceForm,
  (updatedInvoice) => {
    if (updatedInvoice) invoiceStore.setActiveInvoice(updatedInvoice);
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div v-if="invoiceForm" class="w-full min-w-56 max-w-md px-4 lg:px-6 py-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <h2 class="text-2xl font-semibold">Details</h2>
      </div>

      <div>
        <router-link v-if="route.path !== '/'" to="/">
          <Button text label="New invoice" icon="pi pi-plus" />
        </router-link>
        <Button
          v-if="showPreviewButton"
          text
          label="Preview"
          @click="$emit('preview')"
          icon="pi pi-eye"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2 col-span-1">
        <label class="text-sm" for="date">Date</label>
        <DatePicker
          id="date"
          type="date"
          v-model="invoiceForm.date"
          placeholder="Select invoice date"
        />
      </div>

      <div class="flex flex-col gap-2 col-span-1">
        <label class="text-sm" for="due_date">Due date</label>
        <DatePicker
          id="due_date"
          type="date"
          v-model="invoiceForm.due_date"
          placeholder="Select due date"
        />
      </div>

      <!-- Seller Information -->
      <div class="flex flex-col gap-2 col-span-2">
        <div class="flex justify-between items-end">
          <label class="text-sm" for="seller_info">Your information</label>
          <Button
            @click="isRecentSellersDialogOpen = true"
            small
            text
            label="Recent values"
            icon="pi pi-history"
            class="!py-0"
            v-if="authStore.isLoggedIn"
          />
        </div>
        <Textarea
          id="seller_info"
          :autoResize="true"
          v-model="invoiceForm.seller_info"
          class="border rounded p-2"
          placeholder="Enter your company details (Name, Address, Contact)"
        ></Textarea>
      </div>

      <!-- Buyer Information -->
      <div class="flex flex-col gap-2 col-span-2">
        <div class="flex justify-between items-end">
          <label class="text-sm" for="buyer_info">Client information</label>
          <Button
            @click="isRecentBuyersDialogOpen = true"
            small
            text
            label="Recent values"
            icon="pi pi-history"
            class="!py-0"
            v-if="authStore.isLoggedIn"
          />
        </div>
        <Textarea
          id="buyer_info"
          :autoResize="true"
          v-model="invoiceForm.buyer_info"
          class="border rounded p-2"
          placeholder="Enter client details (Name, Address, Contact)"
        ></Textarea>
      </div>

      <!-- Notes -->
      <div class="flex flex-col gap-2 col-span-2">
        <!-- <div class="flex justify-between items-end">
          <label class="text-sm" for="notes">Notes</label>
          <Button
            @click="openRecentValues('notes')"
            small
            text
            label="Recent values"
            icon="pi pi-history"
            class="!py-0"
            v-if="authStore.isLoggedIn"
          />
        </div> -->
        <Textarea
          id="notes"
          :autoResize="true"
          v-model="invoiceForm.notes"
          class="border rounded p-2"
          placeholder="Enter invoice notes"
        ></Textarea>
      </div>

      <!-- Currency -->
      <div class="flex flex-col gap-2 col-span-2">
        <label class="text-sm" for="currency">Currency</label>
        <Select
          id="currency"
          :options="currencies"
          filter
          v-model="invoiceForm.currency"
          placeholder="Select a currency"
        />
      </div>

      <!-- Item or Service Details -->
      <h4 class="text-xl font-semibold">Items</h4>
      <template v-for="(item, index) in invoiceForm.items" :key="item.id">
        <div class="flex flex-col gap-2 col-span-2 relative">
          <label class="text-sm" for="itemDescription">Description</label>
          <Textarea
            id="itemDescription"
            v-model="item.description"
            placeholder="Enter item or service description"
          />

          <div
            v-if="invoiceForm && invoiceForm.items.length > 1"
            @click="invoiceForm.items.splice(index, 1)"
            class="absolute top-0 right-0"
          >
            <Button size="small" icon="pi pi-trash" severity="danger" />
          </div>
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label class="text-sm" for="quantity">Hours</label>
          <InputText
            v-model="item.quantity"
            id="quantity"
            type="number"
            placeholder="Enter hours"
          />
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label class="text-sm" for="rate">Rate</label>
          <InputText
            id="rate"
            type="number"
            v-model="item.rate"
            placeholder="Enter price per unit"
          />
        </div>

        <hr
          class="col-span-2"
          v-if="
            invoiceForm &&
            invoiceForm.items.length > 1 &&
            index < invoiceForm.items.length - 1
          "
        />
      </template>

      <div class="flex flex-col gap-2 col-span-2 mt-2">
        <Button
          @click="addInvoiceItem"
          label="Add item"
          severity="secondary"
          icon="pi pi-plus"
        />
      </div>
    </div>

    <Dialog
      v-model:visible="isRecentSellersDialogOpen"
      modal
      header="Recent values"
      :style="{ width: '25rem' }"
    >
      <div
        v-if="recentSellersQuery.isLoading.value"
        class="flex justify-center items-center"
      >
        <ProgressSpinner />
      </div>
      <div
        v-else-if="!recentSellersQuery.data.value?.data?.length"
        class="flex flex-col items-center text-center space-y-4"
      >
        <i class="pi pi-inbox" style="font-size: 2rem"></i>
        <p class="text-gray-500">No recent values found</p>
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
      header="Recent values"
      :style="{ width: '25rem' }"
    >
      <div
        v-if="recentBuyersQuery.isLoading.value"
        class="flex justify-center items-center"
      >
        <ProgressSpinner />
      </div>
      <div
        v-else-if="!recentBuyersQuery.data.value?.data?.length"
        class="flex flex-col items-center text-center space-y-4"
      >
        <i class="pi pi-inbox" style="font-size: 2rem"></i>
        <p class="text-gray-500">No recent values found</p>
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
