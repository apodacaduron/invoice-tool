<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
</script>

<template>
  <div class="w-full max-w-md px-6 max-h-[calc(100vh-60px)] overflow-y-auto py-4">
    <h1 class="text-2xl font-semibold mb-4">
        Invoice details
    </h1>
    <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2 col-span-2">
          <label class="text-sm" for="invoiceNumber">Invoice Number</label>
          <InputText id="invoiceNumber" placeholder="Enter invoice number" />
        </div>
    
        <div class="flex flex-col gap-2 col-span-1">
          <label class="text-sm" for="invoiceDate">Invoice Date</label>
          <InputText size="small" id="invoiceDate" type="date" placeholder="Select invoice date" />
        </div>
    
        <div class="flex flex-col gap-2 col-span-1">
          <label class="text-sm" for="dueDate">Due Date</label>
          <InputText size="small" id="dueDate" type="date" placeholder="Select due date" />
        </div>
    
        <!-- Seller Information -->
        <div class="flex flex-col gap-2 col-span-2">
          <label class="text-sm" for="sellerInfo">Your Information</label>
          <Textarea
            size="small" id="sellerInfo"
            class="border rounded p-2"
            placeholder="Enter your company details (Name, Address, Contact)"
          ></Textarea>
        </div>
    
        <!-- Buyer Information -->
        <div class="flex flex-col gap-2 col-span-2">
          <label class="text-sm" for="buyerInfo">Client Information</label>
          <Textarea
            size="small" id="buyerInfo"
            class="border rounded p-2"
            placeholder="Enter client details (Name, Address, Contact)"
          ></Textarea>
        </div>
    
        <!-- Item or Service Details -->
        <div class="flex flex-col gap-2 col-span-2">
          <label class="text-sm" for="itemDescription">Item Description</label>
          <Textarea
            size="small" id="itemDescription"
            placeholder="Enter item or service description"
          />
        </div>
    
        <div class="flex flex-col gap-2 col-span-1">
          <label class="text-sm" for="quantity">Quantity</label>
          <InputText size="small" id="quantity" type="number" placeholder="Enter quantity" />
        </div>
    
        <div class="flex flex-col gap-2 col-span-1">
          <label class="text-sm" for="unitPrice">Unit Price</label>
          <InputText size="small" id="unitPrice" type="number" placeholder="Enter price per unit" />
        </div>
    
        <!-- Tax and Total -->
        <div class="flex flex-col gap-2 col-span-2">
          <label class="text-sm" for="taxRate">Tax Rate</label>
          <InputText size="small" id="taxRate" type="number" placeholder="Enter tax rate (%)" />
        </div>
    
        <!-- Payment Method -->
        <div class="flex flex-col gap-2 col-span-2">
          <label class="text-sm" for="paymentMethod">Payment Method</label>
          <InputText size="small" id="paymentMethod" placeholder="Enter payment method" />
        </div>
    </div>
    <!-- Invoice details -->
  </div>
</template>
