<script setup lang="ts">
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import { ref, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import { useInvoiceStore } from "@/stores/invoice";

const invoiceForm = ref({
  invoiceNumber: 1,
  invoiceDate: null,
  dueDate: null,
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
  return { id: uuidv4(), description: "", quantity: null, rate: null };
}

watch(
  invoiceForm,
  (nextInvoiceForm) => invoiceStore.setActiveInvoice(nextInvoiceForm),
  { deep: true }
);
</script>

<template>
  <div class="w-full min-w-56 max-w-md px-2 lg:px-6 py-4">
    <h2 class="text-2xl font-semibold mb-4">Invoice details</h2>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2 col-span-2">
        <label class="text-sm" for="invoiceNumber">Invoice Number</label>
        <InputText
          id="invoiceNumber"
          v-model="invoiceForm.invoiceNumber"
          placeholder="Enter invoice number"
        />
      </div>

      <div class="flex flex-col gap-2 col-span-1">
        <label class="text-sm" for="invoiceDate">Invoice Date</label>
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
