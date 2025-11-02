<script setup lang="ts">
import { useAuthStatus } from '@/composables/useAuthStatus';
import { supabase } from '@/config/supabase';
import { useMutation } from '@tanstack/vue-query';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import { watch } from 'vue';

const visible = defineModel<boolean>('visible');

const { data: session } = useAuthStatus();
const toast = useToast();

const signInMutation = useMutation({
  async mutationFn() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin, queryParams: { prompt: 'select_account' } },
    });
    if (error) throw error;
    return data;
  },
});

watch(
  session,
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
    <div class="flex flex-col gap-3">
      <Button
        @click="signInMutation.mutate()"
        fluid
        icon="pi pi-google"
        label="Sign in with Google"
        :loading="signInMutation.isPending.value"
      />
      <slot />
    </div>
  </Dialog>
</template>
