import { ref, onMounted, onUnmounted, Ref } from 'vue';

interface ElementSize {
  width: number;
  height: number;
}

export function useResizeObserver(elementRef: Ref<HTMLElement | null>) {
  const elementSize = ref<ElementSize>({ width: 0, height: 0 });

  let observer: ResizeObserver | null = null;

  const updateSize = (entries: ResizeObserverEntry[]) => {
    if (!entries.length) return;
    const { width, height } = entries[0].contentRect;
    elementSize.value = { width, height };
  };

  onMounted(() => {
    if (elementRef.value) {
      observer = new ResizeObserver(updateSize);
      observer.observe(elementRef.value);
    }
  });

  onUnmounted(() => {
    if (observer && elementRef.value) {
      observer.unobserve(elementRef.value);
    }
  });

  return { elementSize };
}
