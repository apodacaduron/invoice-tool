// db.ts
import Dexie, { type EntityTable } from "dexie";

export type Invoice = {
  id: string;
  logo?: FileReader["result"];
  date: Date | null;
  dueDate: Date | null;
  sellerInfo: string | null;
  buyerInfo: string | null;
  currency: string | null;
  items: {
    id: string;
    description: string | null;
    quantity: string | null;
    rate: string | null;
  }[];
};

export type InvoiceSerialized = {
  id: string;
  logo?: string;
  date: string | null;
  dueDate: string | null;
  sellerInfo: string | null;
  buyerInfo: string | null;
  currency: string | null;
  items: {
    id: string;
    description: string | null;
    quantity: string | null;
    rate: string | null;
  }[];
};

export function serializeInvoice(invoice: Invoice) {
  return {
    ...invoice,
    items: JSON.parse(JSON.stringify(invoice.items)),
    logo: invoice.logo?.toString(),
    date: invoice.date?.toISOString() ?? null,
    dueDate: invoice.dueDate?.toISOString() ?? null,
  }
}

export function deserializeInvoice(invoice: InvoiceSerialized) {
  return {
    ...invoice,
    logo: invoice.logo?.toString(),
    date: invoice.date ? new Date(invoice.date) : new Date(),
    dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(),
  }
}

export const db = new Dexie("invocie-tool-db") as Dexie & {
  invoices: EntityTable<
    InvoiceSerialized,
    "id" // primary key "id" (for the typings only)
  >;
};

// Schema declaration:
db.version(1).stores({
  invoices:
    "id, logo, date, dueDate, sellerInfo, buyerInfo, items, currency", // primary key "id" (for the runtime!)
});