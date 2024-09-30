import { ref, onMounted, onBeforeUnmount, Ref } from 'vue';

export function useResizeObserver(targetElementRef: Ref<HTMLElement | null>, callback: (entry: ResizeObserverEntry) => void) {
  const observer = ref<ResizeObserver | null>(null);

  onMounted(() => {
    if (targetElementRef.value) {
      observer.value = new ResizeObserver((entries) => {
        if (entries.length) {
          callback(entries[0]);
        }
      });
      observer.value.observe(targetElementRef.value);
    }
  });

  onBeforeUnmount(() => {
    if (observer.value && targetElementRef.value) {
      observer.value.unobserve(targetElementRef.value);
      observer.value.disconnect();
    }
  });
}
