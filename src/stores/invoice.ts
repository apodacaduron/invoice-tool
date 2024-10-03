import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type Invoice = {
  id: string;
  logo?: FileReader['result'];
  invoiceDate: Date | null;
  dueDate: Date | null;
  sellerInfo: string | null;
  buyerInfo: string | null;
  items: {
    id: string;
    description: string | null;
    quantity: string | null;
    rate: string | null;
  }[];
};

export function isInvoice(maybeInvoice: unknown): maybeInvoice is Invoice {
  const invoice = maybeInvoice as Invoice

  return invoice !== null && typeof invoice === 'object' && 'id' in invoice && 'invoiceDate' in invoice && 'sellerInfo' in invoice && 'buyerInfo' in invoice
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

  return { setActiveInvoice, activeInvoice, activeInvoiceTotal };
});
