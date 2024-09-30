<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <Navbar />
    <div class="flex-1">
      <router-view />
    </div>
  </div>
</template>