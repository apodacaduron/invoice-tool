<script setup lang="ts">
import { ref } from "vue";
import Drawer from "primevue/drawer";
import Button from "primevue/button";

const drawerVisible = ref(false);
</script>

<template>
  <nav class="flex justify-between items-center border-b px-4 py-2 h-[60px]">
    <Button @click="drawerVisible = true" icon="pi pi-bars" text />

    <div class="font-semibold">🧾 Invoice Tool</div>

    <Button
      text
      size="small"
      as="a"
      label="Donate"
      href="https://buymeacoffee.com/DanielApodaca"
      target="_blank"
      rel="noopener"
    />
  </nav>

  <Drawer v-model:visible="drawerVisible" header="Coming soon."> </Drawer>
</template>
