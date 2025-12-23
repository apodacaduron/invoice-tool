<script setup lang="ts">
import { ref } from "vue";
import Drawer from "primevue/drawer";
import Button from "primevue/button";
import { useMutation } from "@tanstack/vue-query";
import { supabase } from "@/config/supabase";
import { useDark, useToggle } from "@vueuse/core";
import { useAuthStatus } from "@/composables/useAuthStatus";

const drawerVisible = ref(false);

const { data: session } = useAuthStatus();
const isDarkMode = useDark();
const toggleDarkMode = useToggle(isDarkMode);
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

async function signOut() {
  await supabase.auth.signOut({ scope: 'local' });
  window.location.href = '/';
}
</script>

<template>
  <nav class="flex justify-between items-center border-b dark:border-neutral-700 px-6 py-3 h-[64px] bg-white dark:bg-neutral-900">
    <Button @click="drawerVisible = true" icon="pi pi-bars" text aria-label="Open menu" />
    
    <router-link class="font-semibold text-lg tracking-tight text-gray-900 dark:text-white" to="/">Invoice Tool</router-link>

    <div class="flex items-center gap-1">
      <Button 
        :icon="`pi ${isDarkMode ? 'pi-sun' : 'pi-moon'}`" 
        @click="toggleDarkMode()" 
        text 
        aria-label="Toggle theme"
        class="text-gray-600 dark:text-gray-400"
      />
    </div>
  </nav>

  <Drawer v-model:visible="drawerVisible">
    <template #container="{ closeCallback }">
      <div class="flex flex-col justify-between h-full">
        <div class="flex flex-col">
          <div class="flex items-center justify-between px-6 pt-5 pb-4 shrink-0 border-b dark:border-neutral-700">
            <span class="inline-flex items-center gap-2">
              <span class="font-semibold text-xl text-gray-900 dark:text-white">Navigation</span>
            </span>
            <span>
              <Button
                type="button"
                @click="closeCallback"
                icon="pi pi-times"
                rounded
                text
                aria-label="Close menu"
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
                      <i class="pi pi-receipt mr-3 text-gray-600 dark:text-gray-400"></i>
                      <span class="font-medium">Saved Invoices</span>
                    </router-link>
                  </li>
                  <li>
                    <router-link
                      to="/buyers"
                      class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                      @click="closeCallback"
                    >
                      <i class="pi pi-user mr-3 text-gray-600 dark:text-gray-400"></i>
                      <span class="font-medium">Clients</span>
                    </router-link>
                  </li>
                  <li>
                    <router-link
                      to="/sellers"
                      class="flex items-center cursor-pointer p-4 rounded text-surface-700 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-surface-800 duration-150 transition-colors p-ripple"
                      @click="closeCallback"
                    >
                      <i class="pi pi-briefcase mr-3 text-gray-600 dark:text-gray-400"></i>
                      <span class="font-medium">Business Details</span>
                    </router-link>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        <div class="flex flex-col px-6 pb-6 gap-3 border-t dark:border-neutral-700 pt-4">
          <div v-if="session" class="mb-2">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Your data is saved and synced across devices.</p>
            <Button
              @click="signOut()"
              fluid
              icon="pi pi-sign-out"
              label="Sign Out"
              outlined
              severity="secondary"
            />
          </div>
          <div v-else class="mb-2">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">Sign in to save invoices and access them from any device.</p>
            <Button
              @click="signInMutation.mutate()"
              fluid
              icon="pi pi-google"
              label="Sign In with Google"
              :loading="signInMutation.isPending.value"
            />
          </div>
          
          <div class="flex flex-col gap-2 pt-2 border-t dark:border-neutral-700">
            <Button
              text
              as="a"
              icon="pi pi-github"
              label="View on GitHub"
              href="https://github.com/apodacaduron/invoice-tool"
              target="_blank"
              rel="noopener"
              class="!text-sm !justify-start"
            />
            <Button
              text
              as="a"
              icon="pi pi-comment"
              label="Report an Issue"
              href="https://forms.gle/Yd16fknTRPuSArRu9"
              target="_blank"
              rel="noopener"
              class="!text-sm !justify-start"
            />
            <Button
              text
              as="a"
              icon="pi pi-heart"
              label="Support This Project"
              href="https://ko-fi.com/apodacaduron"
              target="_blank"
              rel="noopener"
              class="!text-sm !justify-start"
            />
          </div>
        </div>
      </div>
    </template>
  </Drawer>
</template>
