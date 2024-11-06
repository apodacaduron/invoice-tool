<script setup lang="ts">
import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/stores';
import { useMutation } from '@tanstack/vue-query';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import { watch } from 'vue';

const visible = defineModel<boolean>('visible');

const authStore = useAuthStore();
const toast = useToast();

const signInMutation = useMutation({
  async mutationFn() {
    return supabase.auth.signInWithOAuth({ provider: 'google' });
  },
});

watch(
  () => authStore.isLoggedIn,
  (isLoggedIn) => {
    if (!isLoggedIn) return;

    visible.value = false;
    toast.add({
      summary: 'Success',
      detail: 'You are now signed in',
      severity: 'success',
      life: 3000,
    });
  }
);
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Sign in to continue"
    :style="{ width: '25rem' }"
  >
    <Button
      @click="signInMutation.mutate"
      fluid
      icon="pi pi-google"
      label="Sign in with Google"
      :loading="signInMutation.isPending.value"
    />
  </Dialog>
</template>
