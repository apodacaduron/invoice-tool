<script setup lang="ts">
import { ref } from 'vue';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores';
import { useMutation } from '@tanstack/vue-query';
import { supabase } from '@/config/supabase';

const drawerVisible = ref(false);

const authStore = useAuthStore()
const signInMutation = useMutation({
  async mutationFn() {
    return supabase.auth.signInWithOAuth({ provider: 'google' });
  },
});
</script>

<template>
  <nav class="flex justify-between items-center border-b px-4 py-2 h-[60px]">
    <Button @click="drawerVisible = true" icon="pi pi-bars" text />

    <router-link class="font-semibold" to="/">🧾 Invoice Tool</router-link>

    <div class="flex gap-2">
      <Button
        text
        size="small"
        as="a"
        label="❤️ Support me"
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

  <Drawer v-model:visible="drawerVisible">
    <template #container="{ closeCallback }">
      <div class="flex flex-col justify-between h-full">
        <div class="flex flex-col">
          <div class="flex items-center justify-between px-6 pt-4 shrink-0">
            <span class="inline-flex items-center gap-2">
              <span class="font-semibold text-2xl">Menu</span>
            </span>
            <span>
              <Button
                type="button"
                @click="closeCallback"
                icon="pi pi-times"
                rounded
                outlined
              ></Button>
            </span>
          </div>
          <div class="overflow-y-auto">
            <ul class="list-none p-4 m-0">
              <li>
                <ul class="list-none p-0 m-0 overflow-hidden">
                  <li>
                    <router-link
                      to="/history"
                      class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                      @click="closeCallback"
                    >
                      <i class="pi pi-receipt mr-2"></i>
                      <span class="font-medium">Saved invoices</span>
                    </router-link>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        <div class="flex flex-col px-6 pb-6">
          <div v-if="authStore.isLoggedIn">
            <Button @click="authStore.signOut" fluid icon="pi pi-sign-out" label="Sign out" outlined />
          </div>
          <div v-else>
            <Button @click="signInMutation.mutate" fluid icon="pi pi-google" label="Sign in with Google" :loading="signInMutation.isPending.value" />
          </div>
        </div>
      </div>
    </template>
  </Drawer>
</template>
