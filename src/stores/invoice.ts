import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { nanoid } from 'nanoid';
import { Tables } from 'database.types';

export type InvoiceSerialized = Tables<'invoices'>;
export type Invoice = Omit<InvoiceSerialized, 'date' | 'due_date' | 'created_at' | 'user_id' | 'items' | 'id'> & {
  date: Date | null;
  due_date: Date | null;
  id?: string;
  created_at?: Date | null;
  user_id?: string;
  items: {
    id: string;
    description: string | null;
    quantity: string | null;
    rate: string | null;
  }[];
};

export function isInvoice(maybeInvoice: unknown): maybeInvoice is Invoice {
  const invoice = maybeInvoice as Invoice;

  return (
    invoice !== null &&
    typeof invoice === 'object' &&
    'id' in invoice &&
    'date' in invoice &&
    'sellerInfo' in invoice &&
    'buyerInfo' in invoice
  );
}

export function getInvoiceInitialValues(): Omit<
  Invoice,
  'created_at' | 'user_id' | 'id'
> {
  return {
    short_id: nanoid(),
    date: new Date(),
    due_date: new Date(),
    seller_info: '',
    buyer_info: '',
    currency: 'USD',
    items: [buildInvoiceItem()],
  };
}

export function buildInvoiceItem() {
  return { id: nanoid(), description: '', quantity: null, rate: null };
}

export function serializeInvoice(invoice: Invoice) {
  return {
    ...invoice,
    date: invoice.date?.toISOString(),
    due_date: invoice.due_date?.toISOString(),
    created_at: invoice.created_at?.toISOString(),
  };
}

export function deserializeInvoice(invoice: InvoiceSerialized): Invoice {
  return {
    ...invoice,
    items: invoice.items as Invoice['items'],
    date: invoice.date ? new Date(invoice.date) : new Date(),
    due_date: invoice.due_date ? new Date(invoice.due_date) : new Date(),
    created_at: invoice.created_at ? new Date(invoice.created_at) : new Date(),
  };
}

export const useInvoiceStore = defineStore('invoice', () => {
  const activeInvoice = ref<Invoice | null>(null);

  const activeInvoiceTotal = computed(() =>
    activeInvoice.value?.items.reduce(
      (prev, item) => prev + Number(item.quantity) * Number(item.rate),
      0
    )
  );

  function setActiveInvoice(invoice: Invoice) {
    activeInvoice.value = invoice;
  }

  function setActiveInvoiceId(id: Invoice['id']) {
    if (!id || !activeInvoice.value) return;

    activeInvoice.value.id = id;
  }

  function resetActiveInvoice() {
    const initialInvoiceValues = getInvoiceInitialValues();

    if (!activeInvoice.value?.id) return;

    activeInvoice.value = {
      ...initialInvoiceValues,
      id: activeInvoice.value?.id,
    };
  }

  function hardResetActiveInvoice() {
    activeInvoice.value = getInvoiceInitialValues();
  }

  function $reset() {
    activeInvoice.value = null;
  }

  return {
    setActiveInvoice,
    activeInvoice,
    activeInvoiceTotal,
    resetActiveInvoice,
    hardResetActiveInvoice,
    setActiveInvoiceId,
    $reset,
  };
});
