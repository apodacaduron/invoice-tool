import { useInvoiceStore } from './invoice';

export * from './invoice';

export function resetAllPiniaStores() {
  const invoiceStore = useInvoiceStore();

  invoiceStore.$reset();
}
