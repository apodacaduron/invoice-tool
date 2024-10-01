import { defineStore } from "pinia"
import { ref } from "vue"

type Invoice = {
    invoiceNumber: number,
    invoiceDate: Date | null,
    dueDate: Date | null,
    sellerInfo: string | null,
    buyerInfo: string | null,
    items: {
        id: string, description: string | null, quantity: string | null, rate: string | null
    }[],
}

export const useInvoiceStore = defineStore('invoice', () => {
    const activeInvoice = ref<Invoice>()

    function setActiveInvoice(invoice: Invoice) {
        activeInvoice.value = invoice
    }

    return { setActiveInvoice, activeInvoice }
  })