<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Navbar from "@/components/Navbar.vue";
import Toast from "primevue/toast";
import ConfirmDialog from 'primevue/confirmdialog';
import SignInDialog from "./components/SignInDialog.vue";
import { useAuthStatus } from './composables/useAuthStatus';

const isSignInDialogVisible = ref(false);
const { data: session, isLoading } = useAuthStatus();

function handleClick(event: MouseEvent) {
  // If user is not logged in
  if (!session.value && !isLoading.value) {
    // Optionally, ignore clicks on the dialog itself to prevent infinite loops
    const target = event.target as HTMLElement;
    if (target.closest('.sign-in-dialog')) return;

    isSignInDialogVisible.value = true;
    event.preventDefault();
    event.stopPropagation();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClick, true); // capture phase
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClick, true);
});
</script>

<template>
  <ConfirmDialog />
  <Toast position="bottom-right" />
  <SignInDialog
    class="sign-in-dialog"
    v-model:visible="isSignInDialogVisible"
  />
  <div class="flex flex-col">
    <Navbar />
    <div class="flex-1">
      <router-view />
    </div>
  </div>
</template>
