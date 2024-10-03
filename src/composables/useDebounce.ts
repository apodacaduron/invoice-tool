import { ref, onUnmounted } from 'vue';

export function useDebounce(callback: (...args: any[]) => void, delay: number) {
  const timeout = ref<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFunction = (...args: any[]) => {
    if (timeout.value) {
      clearTimeout(timeout.value);
    }
    timeout.value = setTimeout(() => {
      callback(...args);
    }, delay);
  };

  onUnmounted(() => {
    if (timeout.value) {
      clearTimeout(timeout.value);
    }
  });

  return debouncedFunction;
}
