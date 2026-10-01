<script setup>
defineProps({ label: String, value: String, note: String, tone: String });
</script>
<template><div class="metric" :class="tone"><span>{{ label }}</span><strong>{{ value }}</strong><small v-if="note">{{ note }}</small></div></template>
