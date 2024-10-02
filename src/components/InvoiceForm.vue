<script setup lang="ts">
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import { ref, watch } from "vue";
import { nanoid } from 'nanoid';
import { useInvoiceStore } from "@/stores/invoice";

type Props = {
  showPreviewButton: boolean
}

defineProps<Props>()
defineEmits(['preview'])

const invoiceForm = ref({
  id: nanoid(),
  invoiceDate: new Date(),
  dueDate: new Date(),
  sellerInfo: null,
  buyerInfo: null,
  items: [buildInvoiceItem()],
});

const invoiceStore = useInvoiceStore();

function addItem() {
  const nextInvoiceItem = buildInvoiceItem();
  invoiceForm.value.items.push(nextInvoiceItem);
}

function buildInvoiceItem() {
  return { id: nanoid(), description: "", quantity: null, rate: null };
}

watch(
  invoiceForm,
  (nextInvoiceForm) => invoiceStore.setActiveInvoice(nextInvoiceForm),
  { deep: true, immediate: true }
);
</script>

<template>
  <div class="w-full min-w-56 max-w-md px-4 lg:px-6 py-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-semibold mb-4">Details</h2>
      <Button v-if="showPreviewButton" label="Preview" @click="$emit('preview')" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2 col-span-1">
        <label class="text-sm" for="invoiceDate">Date</label>
        <DatePicker
          id="invoiceDate"
          type="date"
          v-model="invoiceForm.invoiceDate"
          placeholder="Select invoice date"
        />
      </div>

      <div class="flex flex-col gap-2 col-span-1">
        <label class="text-sm" for="dueDate">Due Date</label>
        <DatePicker
          id="dueDate"
          type="date"
          v-model="invoiceForm.dueDate"
          placeholder="Select due date"
        />
      </div>

      <!-- Seller Information -->
      <div class="flex flex-col gap-2 col-span-2">
        <label class="text-sm" for="sellerInfo">Your Information</label>
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
        <label class="text-sm" for="buyerInfo">Client Information</label>
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
            v-if="invoiceForm.items.length > 1"
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
            invoiceForm.items.length > 1 && index < invoiceForm.items.length - 1
          "
        />
      </template>

      <div class="flex flex-col gap-2 col-span-2 mt-2">
        <Button @click="addItem" label="Add item" />
      </div>

      <!-- Tax and Total -->
      <!-- <div class="flex flex-col gap-2 col-span-2">
        <label class="text-sm" for="taxRate">Tax Rate</label>
        <InputText
          
          id="taxRate"
          type="number"
          placeholder="Enter tax rate (%)"
        />
      </div> -->

      <!-- Payment Method -->
      <!-- <div class="flex flex-col gap-2 col-span-2">
        <label class="text-sm" for="paymentMethod">Payment Method</label>
        <InputText
          
          id="paymentMethod"
          placeholder="Enter payment method"
        />
      </div> -->
    </div>
  </div>
</template>
