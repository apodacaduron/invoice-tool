import { nanoid } from 'nanoid';
import { computed, reactive } from 'vue';

import type { Tables } from "database.types";

export type Invoice = Tables<"invoices">;

export interface ActiveInvoice {
  id?: string;
  short_id: string;
  date: Date;
  due_date: Date;
  seller_info: string;
  buyer_info: string;
  currency: string;
  notes?: string | null;
  items: {
    id: string;
    description: string;
    quantity: number | null;
    rate: number | null;
  }[];
  created_at?: Date | null;
  user_id?: string | null;
}

let _singleton: ReturnType<typeof createActiveInvoice> | null = null;

function createActiveInvoice() {
  const activeInvoice = reactive<ActiveInvoice>(getDefaultInvoice());

  const total = computed(() =>
    activeInvoice.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
      0
    )
  );

  function getDefaultInvoice(): ActiveInvoice {
    return {
      short_id: nanoid(),
      date: new Date(),
      due_date: new Date(),
      seller_info: "",
      buyer_info: "",
      currency: "USD",
      notes: null,
      items: [{ id: nanoid(), description: "", quantity: null, rate: null }],
    };
  }

  function resetInvoice() {
    Object.assign(activeInvoice, getDefaultInvoice());
  }

  function setInvoice(invoice: ActiveInvoice) {
    Object.assign(activeInvoice, invoice);
  }

  function addItem() {
    activeInvoice.items.push({
      id: nanoid(),
      description: "",
      quantity: null,
      rate: null,
    });
  }

  function removeItem(itemId: string) {
    activeInvoice.items = activeInvoice.items.filter((i) => i.id !== itemId);
  }

  function toDB(invoice: ActiveInvoice): Invoice {
    return {
      ...invoice,
      date: invoice.date.toISOString(),
      due_date: invoice.due_date.toISOString(),
      created_at: invoice.created_at?.toISOString() ?? new Date().toISOString(),
      ...(invoice?.id ? {id: invoice.id} : {}),
    } as Invoice;
  }

  function fromDB(invoice: Invoice): ActiveInvoice {
    return {
      ...invoice,
      date: new Date(invoice.date),
      due_date: new Date(invoice.due_date ?? invoice.date),
      created_at: invoice.created_at ? new Date(invoice.created_at) : null,
      items: invoice.items as ActiveInvoice["items"],
    };
  }

  return {
    activeInvoice,
    total,
    resetInvoice,
    setInvoice,
    addItem,
    removeItem,
    toDB,
    fromDB,
  };
}

export function useActiveInvoice() {
  if (!_singleton) {
    _singleton = createActiveInvoice();
  }
  return _singleton;
}