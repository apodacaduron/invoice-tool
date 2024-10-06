import { Invoice } from "@/config/database";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { nanoid } from "nanoid";

export function isInvoice(maybeInvoice: unknown): maybeInvoice is Invoice {
  const invoice = maybeInvoice as Invoice

  return invoice !== null && typeof invoice === 'object' && 'id' in invoice && 'date' in invoice && 'sellerInfo' in invoice && 'buyerInfo' in invoice
}

export function getInvoiceInitialValues(): Invoice {
  return {
    id: nanoid(),
    logo: null,
    date: new Date(),
    dueDate: new Date(),
    sellerInfo: null,
    buyerInfo: null,
    items: [buildInvoiceItem()],
  };
}

export function buildInvoiceItem() {
  return { id: nanoid(), description: "", quantity: null, rate: null };
}

export const useInvoiceStore = defineStore("invoice", () => {
  const activeInvoice = ref<Invoice>();

  const activeInvoiceTotal = computed(() =>
    activeInvoice.value?.items.reduce(
      (prev, item) => prev + Number(item.quantity) * Number(item.rate),
      0
    )
  );

  function setActiveInvoice(invoice: Invoice) {
    activeInvoice.value = invoice;
  }

  function resetActiveInvoice() {
    const initialInvoiceValues = getInvoiceInitialValues()
    activeInvoice.value = {
      ...initialInvoiceValues,
      id: activeInvoice.value?.id ?? initialInvoiceValues.id
    }
  }

  function hardResetActiveInvoice() {
    activeInvoice.value = getInvoiceInitialValues();
  }

  return { setActiveInvoice, activeInvoice, activeInvoiceTotal, resetActiveInvoice, hardResetActiveInvoice };
});
