<script setup>
import { ref, watch } from 'vue';
import { parseCurrency, formatDecimal } from '../utils/decimalFormat';
const props = defineProps({ modelValue: { default: '' }, label: String, id: String, hint: String, error: String, disabled: Boolean });
const emit = defineEmits(['update:modelValue']);
const raw = ref(props.modelValue ? formatDecimal(props.modelValue) : '');
const focused = ref(false);
watch(() => props.modelValue, value => { if (!focused.value) raw.value = value ? formatDecimal(value) : ''; });
function input(event) { raw.value = event.target.value; emit('update:modelValue', parseCurrency(raw.value) ?? ''); }
function blur() { focused.value = false; const value = parseCurrency(raw.value); if (value !== null) raw.value = formatDecimal(value); }
</script>
<template><div class="field"><label :for="id">{{ label }}</label><div class="currency-wrap" :class="{ invalid: error }"><span aria-hidden="true">Rp</span><input :id="id" :value="raw" :disabled="disabled" type="text" inputmode="decimal" required autocomplete="off" :aria-invalid="!!error" :aria-describedby="`${id}-hint`" @focus="focused = true" @input="input" @blur="blur"></div><small :id="`${id}-hint`" :class="error ? 'error' : 'muted'">{{ error || hint }}</small></div></template>
