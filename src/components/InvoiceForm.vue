<script setup lang="ts">
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import FileUpload from "primevue/fileupload";
import { ref, toRef, watch } from "vue";
import { buildInvoiceItem, useInvoiceStore } from "@/stores/invoice";
import { FileUploadSelectEvent } from "primevue/fileupload";
import { db, deserializeInvoice, Invoice } from "@/config/database";
import Dialog from "primevue/dialog";
import { useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";

type Props = {
  showPreviewButton: boolean;
};

defineProps<Props>();
defineEmits(["preview"]);

const invoiceStore = useInvoiceStore();
const invoiceForm = ref<Invoice | undefined>(invoiceStore.activeInvoice);
const isRecentValuesOpen = ref(false);
const recentValuesField = ref<keyof Invoice | null>(null);

const route = useRoute()
const recentValuesQuery = useQuery({
  queryKey: toRef(() => ["recent-values-invoices", recentValuesField.value]),
  async queryFn() {
    const fieldKey = recentValuesField.value;
    if (!fieldKey) throw new Error("Recent value field not provided");
    const serializedInvoices = await db.invoices.toArray();
    const deserializedInvoices = serializedInvoices.map(deserializeInvoice);
    const uniqueFieldValues = [
      ...new Set(
        deserializedInvoices.map((invoice) => invoice[fieldKey]).filter(Boolean)
      ),
    ];
    return uniqueFieldValues;
  },
  enabled: toRef(() => Boolean(recentValuesField.value)),
});

function addItem() {
  const nextInvoiceItem = buildInvoiceItem();
  invoiceForm.value?.items.push(nextInvoiceItem);
}

function onFileSelect(event: FileUploadSelectEvent) {
  const file = event.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    if (!invoiceForm.value) return;
    invoiceForm.value.logo = e.target?.result;
  };

  reader.readAsDataURL(file);
}

function openRecentValuesDialog(field: keyof Invoice) {
  isRecentValuesOpen.value = true;
  recentValuesField.value = field;
}

function setRecentValue(recentValue: any) {
  if (!recentValuesField.value) return;
  if (!invoiceForm.value) return;
  invoiceForm.value[recentValuesField.value] = recentValue;
  isRecentValuesOpen.value = false;
  recentValuesField.value = null;
}

watch(
  invoiceForm,
  (nextInvoiceForm) => {
    if (!nextInvoiceForm) return;
    invoiceStore.setActiveInvoice(nextInvoiceForm);
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
      <div class="flex flex-col gap-2 col-span-2">
        <FileUpload
          mode="basic"
          @select="onFileSelect"
          customUpload
          auto
          severity="secondary"
          class="w-full p-button-outlined"
          :chooseLabel="
            invoiceForm.logo ? `Choose another logo` : `Choose logo`
          "
        />
      </div>
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
        <label class="text-sm" for="dueDate">Due date</label>
        <DatePicker
          id="dueDate"
          type="date"
          v-model="invoiceForm.dueDate"
          placeholder="Select due date"
        />
      </div>

      <!-- Seller Information -->
      <div class="flex flex-col gap-2 col-span-2">
        <div class="flex justify-between items-end">
          <label class="text-sm" for="sellerInfo">Your information</label>
          <Button
            @click="openRecentValuesDialog('sellerInfo')"
            small
            text
            label="Recent values"
            icon="pi pi-history"
            class="!py-0"
          />
        </div>
        <Textarea
          id="sellerInfo"
          :autoResize="true"
          v-model="invoiceForm.sellerInfo"
          class="border rounded p-2"
          placeholder="Enter your company details (Name, Address, Contact)"
        ></Textarea>
      </div>

      <!-- Buyer Information -->
      <div class="flex flex-col gap-2 col-span-2">
        <div class="flex justify-between items-end">
          <label class="text-sm" for="buyerInfo">Client information</label>
          <Button
            @click="openRecentValuesDialog('buyerInfo')"
            small
            text
            label="Recent values"
            icon="pi pi-history"
            class="!py-0"
          />
        </div>
        <Textarea
          id="buyerInfo"
          :autoResize="true"
          v-model="invoiceForm.buyerInfo"
          class="border rounded p-2"
          placeholder="Enter client details (Name, Address, Contact)"
        ></Textarea>
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
          <label class="text-sm" for="quantity">Quantity</label>
          <InputText
            v-model="item.quantity"
            id="quantity"
            type="number"
            placeholder="Enter quantity"
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
          @click="addItem"
          label="Add item"
          severity="secondary"
          icon="pi pi-plus"
        />
      </div>
    </div>

    <Dialog
      v-model:visible="isRecentValuesOpen"
      modal
      :header="`Recent values - ${recentValuesField}`"
      :style="{ width: '25rem' }"
    >
      <div class="flex flex-col gap-2">
        <Button
          v-for="(recentValue, index) in recentValuesQuery.data.value"
          :key="index"
          text
          class="w-full"
          @click="setRecentValue(recentValue)"
        >
          {{ recentValue ?? "-" }}
        </Button>
      </div>
    </Dialog>
  </div>
</template>
