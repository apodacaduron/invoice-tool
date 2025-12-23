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
    summary: 'Authentication successful',
    detail: 'Your data will now be saved and synced automatically.',
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
        <h2>Sign in required</h2>
        <p>
          Authentication is required to save your work. Your invoices and client data
          will be securely stored and accessible from any device.
        </p>
      </div>

      <div class="auth-benefits">
        <div class="benefit-item">
          <i class="pi pi-cloud-upload text-gray-600 dark:text-gray-400"></i>
          <span>Automatic cloud backup</span>
        </div>
        <div class="benefit-item">
          <i class="pi pi-sync text-gray-600 dark:text-gray-400"></i>
          <span>Access from any device</span>
        </div>
        <div class="benefit-item">
          <i class="pi pi-lock text-gray-600 dark:text-gray-400"></i>
          <span>Your data remains private</span>
        </div>
      </div>

      <Button
        class="google-button"
        icon="pi pi-google"
        label="Sign In with Google"
        :loading="signInMutation.isPending.value"
        @click="signInMutation.mutate()"
      />

      <div class="auth-footer">
        <p>
          We only use your account for authentication. Your invoice data is not shared with third parties.
        </p>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.auth-dialog {
  width: 28rem;
  max-width: 90vw;
}

.auth-card {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: 2rem 1.75rem;
}

.auth-header h2 {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-color);
}

.auth-header p {
  margin: 0.75rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--text-color-secondary);
}

.auth-benefits {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.25rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-color);
}

.benefit-item i {
  font-size: 1rem;
  flex-shrink: 0;
}

.google-button {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9375rem;
}

.auth-footer {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text-color-secondary);
  text-align: center;
}
</style>
