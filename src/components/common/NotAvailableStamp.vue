<template>
  <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
    <div
      :class="[
        'rotate-[-18deg] border-red-500 text-red-500 font-black tracking-widest uppercase',
        size === 'sm'
          ? 'border-2 text-[10px] px-2 py-0.5'
          : 'border-4 text-2xl px-4 py-1',
      ]"
    >
      {{ size === 'sm' ? 'UNAVAILABLE' : 'NOT AVAILABLE' }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  size: { type: String, default: 'lg' },
});
</script>
