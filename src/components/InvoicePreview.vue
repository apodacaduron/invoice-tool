<script setup lang="ts">
import Scalable from './Scalable.vue';
</script>

<template>
    <div class="w-full p-4 flex h-[calc(100vh-60px)]">
        <div class="bg-black p-4 flex-1 rounded-lg h-full">
            <Scalable>
                <div class="w-[8.5in] h-[11in] bg-white"></div>
            </Scalable>
        </div>
    </div>
</template>