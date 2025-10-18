<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
import Toast from "primevue/toast";
import ConfirmDialog from 'primevue/confirmdialog';
import { onMounted } from "vue";
import { supabase } from "./config/supabase";
import { useAuthStore } from "./stores";

const authStore = useAuthStore()

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    authStore.setSession(data.session);
  });

  supabase.auth.onAuthStateChange((_, _session) => {
    authStore.setSession(_session);
  });
});
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
