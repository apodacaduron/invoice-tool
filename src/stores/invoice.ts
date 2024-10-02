import { defineStore } from "pinia";
import { computed, ref } from "vue";

type Invoice = {
  id: string;
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
