import { useAuthStore } from './auth';
import { useInvoiceStore } from './invoice';

export * from './auth';
export * from './invoice';

export function resetAllPiniaStores() {
  const authStore = useAuthStore();
  const invoiceStore = useInvoiceStore();

  authStore.$reset();
  invoiceStore.$reset();
}
