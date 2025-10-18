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

async function callPdfThing() {
  const invoiceData = {
    invoice: {
      seller: { name: "Daniel Apodaca", email: "me@example.com" },
      buyer: { name: "Client Name", email: "client@example.com" },
      items: [
        { description: "Frontend Development", qty: 10, price: 50 },
        { description: "Backend API", qty: 5, price: 80 },
      ],
      uuid: "INV-20251018-001",
      date: "2025-10-18",
    }
  };

  const response = await fetch("https://msoloxkubjdinqyeutzb.supabase.co/functions/v1/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoiceData),
  });

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url);
}
</script>

<template>
  <button @click="callPdfThing">callPdfThing</button>
  <ConfirmDialog />
  <Toast position="bottom-right" />
  <div class="flex flex-col">
    <Navbar />
    <div class="flex-1">
      <router-view />
    </div>
  </div>
</template>
