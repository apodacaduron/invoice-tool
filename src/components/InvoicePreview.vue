<script setup lang="ts">
import { useInvoiceStore } from '@/stores/invoice';
import Button from 'primevue/button';

const invoiceStore = useInvoiceStore()
</script>

<template>
    <div class="invoice">
        <div class="invoice__toolbar">
            <h2 class="invoice__title">
                Preview
            </h2>
            <div>
                <Button size="small" label="Download as PDF" />
            </div>
        </div>
        <div class="page">
            <div class="grid grid-cols-2 gap-4 p-8">
                <div class="h-fit col-span-2">Logo</div>
                <div class="h-fit col-span-1">
                    <div>From</div>
                    {{ invoiceStore.activeInvoice?.sellerInfo }}
                </div>
                <div class="h-fit col-span-1 text-4xl text-right">INVOICE</div>
                <div class="h-fit col-span-1">TO</div>
                <div class="h-fit col-span-1">DATES</div>
                <div class="h-fit col-span-2">DETAILS</div>
                <div class="h-fit col-span-1"></div>
                <div class="h-fit col-span-1">TOTAL</div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.invoice {
    @apply w-full p-4 flex flex-col justify-center;
    &__toolbar {
        @apply flex justify-between items-center mb-4;
    }
    &__title {
        @apply text-2xl font-semibold;
    }
    .page {
        @apply shadow-lg border w-full max-w-[8.5in] min-h-[11in] bg-white;
    }
}
</style>