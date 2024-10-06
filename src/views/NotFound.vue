<script setup lang="ts">
import { useRouter } from "vue-router";
import Button from "primevue/button";

const router = useRouter();

// Function to redirect to the home page
function goHome() {
  router.push("/");
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4"
  >
    <div class="text-center">
      <!-- PrimeVue Icon -->
      <i class="pi pi-exclamation-triangle text-yellow-500 text-6xl mb-4"></i>

      <!-- Title -->
      <h1 class="text-4xl font-bold text-gray-800 mb-2">
        404 - Page Not Found
      </h1>

      <!-- Description -->
      <p class="text-lg text-gray-600 mb-6">
        Oops! The page you're looking for doesn't exist.
      </p>

      <!-- PrimeVue Button -->
      <Button
        label="Go back to Home"
        class="p-button-outlined p-button-lg"
        @click="goHome"
      />
    </div>
  </div>
</template>
