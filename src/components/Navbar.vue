<script setup lang="ts">
import { ref } from 'vue'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'

const drawerVisible = ref(false)
</script>

<template>
    <nav class="flex justify-between border-b px-4 py-2 h-[60px]">
        <Button @click="drawerVisible = true" icon="pi pi-bars" text />
        <Button size="small" as="a" label="🍺 Donate" href="https://buymeacoffee.com/DanielApodaca" target="_blank" rel="noopener" />
    </nav>

    <Drawer v-model:visible="drawerVisible" header="Drawer">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    </Drawer>
</template>