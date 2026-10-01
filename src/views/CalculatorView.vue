<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import CurrencyInput from '../components/CurrencyInput.vue';
import MetricCard from '../components/MetricCard.vue';
import { useRoiCalculator } from '../composables/useRoiCalculator';
import { money, formatDecimal, margin, D } from '../utils/decimalFormat';
import { saveCalculation } from '../api/calculations';
import { errorMessage, retryDelay } from '../api/client';
const { values, errors, result } = useRoiCalculator();
const busy = ref(false), message = ref(''), saved = ref(null), serverErrors = ref({}), cooldown = ref(0);
const interval = setInterval(() => { if(cooldown.value > 0) cooldown.value--; },1000);
onUnmounted(() => clearInterval(interval));
watch(values, () => { saved.value = null; message.value = ''; serverErrors.value = {}; });
const display = computed(() => saved.value ? { ...saved.value, margin_percent: margin(saved.value.profit,saved.value.total_revenue), status: new D(saved.value.profit).gt(0) ? 'Untung' : new D(saved.value.profit).lt(0) ? 'Rugi' : 'Impas' } : result.value);
async function save() {
 if (busy.value || !result.value || cooldown.value) return;
 busy.value = true; message.value = ''; serverErrors.value = {}; saved.value = null;
 try { saved.value = await saveCalculation(Object.fromEntries(Object.entries(values).map(([key,value]) => [key,new D(value).toFixed(2)]))); }
 catch(error) { message.value = errorMessage(error); serverErrors.value = error.response?.data?.errors || {}; cooldown.value = retryDelay(error); }
 finally { busy.value = false; }
}
</script>
<template>
 <section class="hero"><span class="eyebrow">KALKULATOR ROI IKLAN</span><h1>Hitung ROI Kampanye Iklan Anda<br class="desktop-break"> <span>Secara Real-Time</span></h1><p>Pahami ke mana biaya Anda pergi, dan berapa hasil yang kembali.</p><span class="live-label"><i></i> Perhitungan langsung, tanpa menunggu</span></section>
 <div class="calculator-grid page-width">
  <section class="panel parameters"><div class="section-heading"><span class="section-icon" aria-hidden="true">≡</span><div><h2>Parameter Kampanye</h2><p>Masukkan angka dari kampanye Anda.</p></div></div>
   <form @submit.prevent="save">
    <CurrencyInput id="ad_spend" v-model="values.ad_spend" label="Biaya Iklan" hint="Total anggaran yang dibelanjakan untuk iklan." :error="serverErrors.ad_spend?.[0] || errors.ad_spend" :disabled="busy" />
    <CurrencyInput id="other_costs" v-model="values.other_costs" label="Biaya Lain" hint="Biaya tambahan yang ingin diperhitungkan." :error="serverErrors.other_costs?.[0] || errors.other_costs" :disabled="busy" />
    <CurrencyInput id="total_revenue" v-model="values.total_revenue" label="Total Pendapatan" hint="Seluruh pendapatan yang dihasilkan kampanye." :error="serverErrors.total_revenue?.[0] || errors.total_revenue" :disabled="busy" />
    <div class="total-row"><span>Total biaya kampanye</span><strong>{{ money(display?.total_cost) }}</strong></div>
    <p v-if="errors.total_cost || serverErrors.ad_spend" class="error" role="alert">{{ errors.total_cost || serverErrors.ad_spend?.[0] }}</p>
    <button class="primary full" :disabled="!result || busy || cooldown > 0">{{ busy ? 'Menyimpan…' : cooldown ? `Coba lagi dalam ${cooldown} detik` : 'Simpan Perhitungan' }}<span aria-hidden="true">↗</span></button>
    <p class="form-note">Tersimpan secara privat di riwayat akun Anda.</p>
    <p v-if="message" class="notice error" role="alert">{{ message }}</p>
    <p v-if="saved" class="notice success" role="status">Perhitungan berhasil disimpan. Hasil server ditampilkan. <RouterLink to="/history">Lihat riwayat →</RouterLink></p>
   </form>
  </section>
  <section class="results"><div class="results-heading"><h2>Hasil Perhitungan</h2><span>{{ saved ? 'Hasil tersimpan' : 'Preview langsung' }}</span></div>
   <div class="roi-card"><div class="roi-top"><span>Return on Investment</span><span v-if="display" class="status">{{ display.status }}</span></div><div class="roi-value">{{ formatDecimal(display?.roi_percentage, true) }}<span v-if="display">%</span></div><p>{{ display ? `Setiap Rp 100 total biaya menghasilkan ${money(new D(display.profit).abs().div(display.total_cost).times(100))} ${display.status === 'Rugi' ? 'kerugian' : 'laba'}.` : 'Lengkapi input dengan total biaya lebih dari nol.' }}</p></div>
   <div class="metrics-grid"><MetricCard label="Pendapatan" :value="money(saved?.total_revenue ?? (result ? values.total_revenue : null))" /><MetricCard label="Total Biaya" :value="money(display?.total_cost)" /><MetricCard label="Laba / Rugi" :value="money(display?.profit)" :tone="display?.status === 'Rugi' ? 'negative' : 'positive'" /><MetricCard label="Margin Laba" :value="display?.margin_percent != null ? `${formatDecimal(display.margin_percent,true)}%` : '—'" note="Laba ÷ pendapatan × 100%" /></div>
   <aside class="summary"><h3>Angka di balik hasil Anda</h3><p>ROI = (Pendapatan − Total biaya) ÷ Total biaya × 100%. Total biaya mencakup biaya iklan dan biaya lain.</p><p>Hasil bergantung pada angka yang Anda masukkan. Margin laba tidak tersedia jika pendapatan nol.</p></aside>
  </section>
 </div>
</template>
