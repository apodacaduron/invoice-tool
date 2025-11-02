import { supabase } from '@/config/supabase';
import { useQuery } from '@tanstack/vue-query';

export function useAuthStatus() {
  return useQuery({
    queryKey: ['auth-status'], // query key
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session // will be null if not logged in
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  })
}