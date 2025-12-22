<script setup lang="ts">
import { watch, computed } from 'vue';
import { useAuthStatus } from '@/composables/useAuthStatus';
import { supabase } from '@/config/supabase';
import { useMutation } from '@tanstack/vue-query';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

const visible = defineModel<boolean>('visible');

const toast = useToast();
const { data: session } = useAuthStatus();

const isAuthenticated = computed(() => !!session.value);

const signInMutation = useMutation({
  async mutationFn() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    return data;
  },
  onError() {
    toast.add({
      severity: 'error',
      summary: 'Sign-in failed',
      detail: 'Please try again.',
      life: 3000,
    });
  },
});

watch(isAuthenticated, (loggedIn) => {
  if (!loggedIn) return;

  visible.value = false;
  toast.add({
    severity: 'success',
    summary: 'Signed in',
    detail: 'Your invoices are now saved to your account.',
    life: 3000,
  });
});
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :closable="false"
    :showHeader="false"
    class="auth-dialog"
  >
    <div class="auth-card">
      <div class="auth-header">
        <h2>Sign in to save your invoices</h2>
        <p>
          We use your account to securely store your invoices and
          keep them available across sessions.
        </p>
      </div>

      <Button
        class="google-button"
        icon="pi pi-google"
        label="Continue with Google"
        :loading="signInMutation.isPending.value"
        @click="signInMutation.mutate()"
      />

      <div class="auth-footer">
        <p>
          No spam. No sharing. Your invoice data stays private.
        </p>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.auth-dialog {
  width: 24rem;
}

.auth-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem 1.75rem;
}

.auth-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.auth-header p {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--text-color-secondary);
}

.google-button {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.95rem;
}

.auth-footer {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}
</style>
