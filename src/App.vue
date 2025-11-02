<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
import Toast from "primevue/toast";
import ConfirmDialog from 'primevue/confirmdialog';
</script>

<template>
  <ConfirmDialog />
  <Toast position="bottom-right" />
  <div class="flex flex-col">
    <Navbar />
    <div class="flex-1">
      <router-view />
    </div>
  </div>
</template>
