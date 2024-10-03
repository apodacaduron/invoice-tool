<script setup lang="ts">
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import FileUpload from "primevue/fileupload";
import { onMounted, ref, watch } from "vue";
import { nanoid } from "nanoid";
import { Invoice, isInvoice, useInvoiceStore } from "@/stores/invoice";
import { FileUploadSelectEvent } from "primevue/fileupload";
import { useDebounce } from "@/composables/useDebounce";

type Props = {
  showPreviewButton: boolean;
};

defineProps<Props>();
defineEmits(["preview"]);

const invoiceForm = ref<Invoice>(getInvoiceInitialValues());

const invoiceStore = useInvoiceStore();

function addItem() {
  const nextInvoiceItem = buildInvoiceItem();
  invoiceForm.value.items.push(nextInvoiceItem);
}

function buildInvoiceItem() {
  return { id: nanoid(), description: "", quantity: null, rate: null };
}

function onFileSelect(event: FileUploadSelectEvent) {
  const file = event.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    invoiceForm.value.logo = e.target?.result;
  };

  reader.readAsDataURL(file);
}

const persistActiveInvoiceInLocalStorage = useDebounce(
  (activeInvoice: Invoice) => {
    const formattedActiveInvoice = {
      ...activeInvoice,
      invoiceDate: activeInvoice.invoiceDate?.toISOString(),
      dueDate: activeInvoice.dueDate?.toISOString()
    }
    localStorage.setItem("active-invoice", JSON.stringify(formattedActiveInvoice));
  },
  500
);

function getActiveInvoiceFromLocalStorage() {
  const maybeInvoiceString = localStorage.getItem("active-invoice");

  const maybeInvoice =
    maybeInvoiceString
      ? (JSON.parse(maybeInvoiceString) as Invoice)
      : null;

  if (!isInvoice(maybeInvoice)) {
    console.log("Stored data is not invoice shape", maybeInvoice);
    return null;
  }

  const formattedActiveInvoice = {
    ...maybeInvoice,
    invoiceDate: new Date(maybeInvoice.invoiceDate as unknown as string),
    dueDate: new Date(maybeInvoice.dueDate as unknown as string)
  }

  return formattedActiveInvoice;
}

function getInvoiceInitialValues() {
  return {
    id: nanoid(),
    logo: null,
    invoiceDate: new Date(),
    dueDate: new Date(),
    sellerInfo: null,
    buyerInfo: null,
    items: [buildInvoiceItem()],
  }
}

function resetForm() {
  watchers.invoiceWatcher.pause()

  const initialValues = getInvoiceInitialValues()
  invoiceForm.value = initialValues
  invoiceStore.setActiveInvoice(initialValues)
  localStorage.removeItem('active-invoice')

  watchers.invoiceWatcher.resume()
}

onMounted(() => {
  const activeInvoice = getActiveInvoiceFromLocalStorage()

  if (activeInvoice) {
    invoiceForm.value = activeInvoice
    invoiceStore.setActiveInvoice(activeInvoice)
  } else {
    invoiceStore.setActiveInvoice(invoiceForm.value)
  }

  watchers.invoiceWatcher.resume
});

const watchers = {
  invoiceWatcher: watch(
    invoiceForm,
    (nextInvoiceForm) => {
      invoiceStore.setActiveInvoice(nextInvoiceForm);
      persistActiveInvoiceInLocalStorage(nextInvoiceForm);
    },
    { deep: true }
  )
}
</script>

<template>
  <div class="w-full min-w-56 max-w-md px-4 lg:px-6 py-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <h2 class="text-2xl font-semibold">Details</h2>
        <Button text @click="resetForm" icon="pi pi-undo" label="Reset" />
      </div>

      <Button v-if="showPreviewButton" text label="Preview" @click="$emit('preview')" icon="pi pi-eye" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2 col-span-2">
        <FileUpload mode="basic" @select="onFileSelect" customUpload auto severity="secondary"
          class="w-full p-button-outlined" :chooseLabel="invoiceForm.logo ? `Choose another logo` : `Choose logo`
            " />
      </div>
      <div class="flex flex-col gap-2 col-span-1">
        <label class="text-sm" for="invoiceDate">Date</label>
        <DatePicker id="invoiceDate" type="date" v-model="invoiceForm.invoiceDate" placeholder="Select invoice date" />
      </div>

      <div class="flex flex-col gap-2 col-span-1">
        <label class="text-sm" for="dueDate">Due Date</label>
        <DatePicker id="dueDate" type="date" v-model="invoiceForm.dueDate" placeholder="Select due date" />
      </div>

      <!-- Seller Information -->
      <div class="flex flex-col gap-2 col-span-2">
        <label class="text-sm" for="sellerInfo">Your Information</label>
        <Textarea id="sellerInfo" :autoResize="true" v-model="invoiceForm.sellerInfo" class="border rounded p-2"
          placeholder="Enter your company details (Name, Address, Contact)"></Textarea>
      </div>

      <!-- Buyer Information -->
      <div class="flex flex-col gap-2 col-span-2">
        <label class="text-sm" for="buyerInfo">Client Information</label>
        <Textarea id="buyerInfo" :autoResize="true" v-model="invoiceForm.buyerInfo" class="border rounded p-2"
          placeholder="Enter client details (Name, Address, Contact)"></Textarea>
      </div>

      <!-- Item or Service Details -->
      <h4 class="text-xl font-semibold">Items</h4>
      <template v-for="(item, index) in invoiceForm.items" :key="item.id">
        <div class="flex flex-col gap-2 col-span-2 relative">
          <label class="text-sm" for="itemDescription">Description</label>
          <Textarea id="itemDescription" v-model="item.description" placeholder="Enter item or service description" />

          <div v-if="invoiceForm.items.length > 1" @click="invoiceForm.items.splice(index, 1)"
            class="absolute top-0 right-0">
            <Button size="small" icon="pi pi-trash" severity="danger" />
          </div>
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label class="text-sm" for="quantity">Quantity</label>
          <InputText v-model="item.quantity" id="quantity" type="number" placeholder="Enter quantity" />
        </div>

        <div class="flex flex-col gap-2 col-span-1">
          <label class="text-sm" for="rate">Rate</label>
          <InputText id="rate" type="number" v-model="item.rate" placeholder="Enter price per unit" />
        </div>

        <hr class="col-span-2" v-if="
          invoiceForm.items.length > 1 && index < invoiceForm.items.length - 1
        " />
      </template>

      <div class="flex flex-col gap-2 col-span-2 mt-2">
        <Button @click="addItem" label="Add item" severity="secondary" icon="pi pi-plus" />
      </div>
    </div>
  </div>
</template>
