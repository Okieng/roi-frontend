<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getCalculations } from '../api/calculations';
import { money, formatDecimal, margin } from '../utils/decimalFormat';
import { errorMessage, retryDelay } from '../api/client';
const rows = ref([]), meta = ref({current_page:1,last_page:1,total:0}), busy = ref(false), error = ref(''), cooldown = ref(0);
let controller;
const interval = setInterval(() => { if(cooldown.value > 0) cooldown.value--; },1000);
async function load(page = meta.value.current_page) {
 if (busy.value || cooldown.value) return;
 controller = new AbortController(); busy.value = true; error.value = ''; rows.value = [];
 try { const response = await getCalculations(page,controller.signal); rows.value = response.data; meta.value = response.meta; }
 catch(e) { if(e.code !== 'ERR_CANCELED') { error.value = errorMessage(e); cooldown.value = retryDelay(e); } }
 finally { busy.value = false; }
}
const date = value => new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
const percent = value => value == null ? '—' : `${formatDecimal(value,true)}%`;
onMounted(() => load());
onUnmounted(() => { controller?.abort(); clearInterval(interval); });
</script>
<template><div class="page-width history-page"><div class="history-heading"><div><span class="eyebrow">RIWAYAT KAMPANYE</span><h1>Perhitungan Anda</h1><p>Lihat kembali angka dan hasil yang telah Anda simpan.</p></div><RouterLink class="primary" to="/calculator">Hitung lagi <span aria-hidden="true">+</span></RouterLink></div>
 <section class="panel history-panel" :aria-busy="busy">
  <div v-if="busy" class="empty-state" role="status"><h2>Memuat riwayat…</h2><p>Sedang mengambil perhitungan Anda.</p></div>
  <div v-else-if="error" class="empty-state"><p class="error" role="alert">{{ error }}</p><button class="primary" :disabled="cooldown > 0" @click="load()">{{ cooldown ? `Coba lagi dalam ${cooldown} detik` : 'Coba lagi' }}</button></div>
  <div v-else-if="!rows.length" class="empty-state"><span class="empty-icon" aria-hidden="true">↗</span><h2>Riwayat Anda dimulai di sini</h2><p>Simpan perhitungan pertama untuk melihat hasilnya kembali.</p><RouterLink class="primary" to="/calculator">Buka kalkulator</RouterLink></div>
  <template v-else><div class="table-wrap"><table><thead><tr><th>Tanggal & waktu</th><th>Biaya iklan</th><th>Biaya lain</th><th>Pendapatan</th><th>Total biaya</th><th>Laba / rugi</th><th>ROI</th><th>Margin laba</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id"><td>{{ date(row.created_at) }}</td><td>{{ money(row.ad_spend) }}</td><td>{{ money(row.other_costs) }}</td><td>{{ money(row.total_revenue) }}</td><td>{{ money(row.total_cost) }}</td><td>{{ money(row.profit) }}</td><td class="roi-cell">{{ percent(row.roi_percentage) }}</td><td>{{ percent(margin(row.profit,row.total_revenue)) }}</td></tr></tbody></table></div>
   <div class="history-cards"><article v-for="row in rows" :key="row.id" class="history-card"><h2>{{ date(row.created_at) }}</h2><dl><template v-for="[label,value] in [['Biaya iklan',money(row.ad_spend)],['Biaya lain',money(row.other_costs)],['Pendapatan',money(row.total_revenue)],['Total biaya',money(row.total_cost)],['Laba / rugi',money(row.profit)],['ROI',percent(row.roi_percentage)],['Margin laba',percent(margin(row.profit,row.total_revenue))]]" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></template></dl></article></div>
   <div class="pagination"><span>{{ meta.total }} perhitungan · Halaman {{ meta.current_page }} dari {{ meta.last_page }}</span><div><button class="secondary" :disabled="busy || meta.current_page <= 1" @click="load(meta.current_page - 1)">Sebelumnya</button><button class="secondary" :disabled="busy || meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)">Berikutnya</button></div></div>
  </template>
 </section><p class="history-note">Margin laba = laba ÷ pendapatan × 100%. Waktu ditampilkan sesuai zona waktu perangkat Anda.</p>
 </div></template>
