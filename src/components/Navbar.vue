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

    <div class="flex gap-2">
        <Button
          text
          size="small"
          as="a"
          label="❤️ Donate"
          href="https://buymeacoffee.com/DanielApodaca"
          target="_blank"
          rel="noopener"
        />
        <Button
          text
          size="small"
          as="a"
          icon="pi pi-github"
          href="https://github.com/apodacaduron/invoice-tool"
          target="_blank"
          rel="noopener"
        />
    </div>
  </nav>

  <Drawer v-model:visible="drawerVisible" header="Menu">
    Coming soon.
  </Drawer>
</template>
