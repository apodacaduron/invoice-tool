<template>
  <div ref="scalableRef" class="scalable">
    <div ref="scalableContentRef" :class="['scalable__content']">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResizeObserver } from "@/composables/useResizeObserver";
import { onMounted, ref } from "vue";

const scalableRef = ref<HTMLDivElement | null>(null);
const scalableContentRef = ref<HTMLDivElement | null>(null);
const handleScale = () => {
  if (!scalableContentRef.value || !scalableRef.value) {
    return;
  }
  const currentWidth = scalableContentRef.value.offsetWidth;
  const currentHeight = scalableContentRef.value.offsetHeight;
  const availableHeight = scalableRef.value.offsetHeight;
  const availableWidth = scalableRef.value.offsetWidth;
  let scaleX = availableWidth / currentWidth;
  let scaleY = availableHeight / currentHeight;
  scaleX = Math.min(scaleX, scaleY);
  scaleY = scaleX;
  const translationX = (availableWidth - currentWidth * scaleX) / 2;
  const translationY = (availableHeight - currentHeight * scaleY) / 2;
  scalableContentRef.value.style.transform = [
    `translate3d(${translationX}px, ${translationY}px, 0)`,
    `scale3d(${scaleX}, ${scaleY}, 1)`,
  ].join(" ");
  scalableContentRef.value.style.transformOrigin = "0 0";
};
useResizeObserver(scalableRef, handleScale);
useResizeObserver(scalableContentRef, handleScale);
onMounted(() => {
  handleScale();
});
</script>

<style scoped lang="scss">
.scalable {
  @apply w-full h-full;
  &__content {
    @apply w-max flex;
    @apply will-change-transform;
  }
}
</style>
