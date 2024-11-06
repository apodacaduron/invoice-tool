import { supabase } from '@/config/supabase';
import { Session } from '@supabase/supabase-js';
import { defineStore } from 'pinia';
import { ref, toRef } from 'vue';
import { resetAllPiniaStores } from './index';
import { useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isLoadingSession = ref(true);
  const isSignInDialogVisible = ref(false);
  const session = ref<Session | null>(null);

  const isLoggedIn = toRef(() => Boolean(session.value));
  const avatar = toRef(() => session.value?.user.user_metadata.avatar_url);

  function setSession(nextSession: Session | null) {
    session.value = nextSession;
    isLoadingSession.value = false;
  }

  async function signOut() {
    await supabase.auth.signOut({ scope: 'local' });
    queryClient.removeQueries();
    resetAllPiniaStores();
    router.push('/');
  }

  function $reset() {
    isLoadingSession.value = false;
    session.value = null;
  }

  return {
    isSignInDialogVisible,
    session,
    isLoggedIn,
    avatar,
    isLoadingSession,
    setSession,
    signOut,
    $reset,
  };
});
