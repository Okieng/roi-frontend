<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';
const auth = useAuthStore();
const router = useRouter();
const now = ref(Date.now());
const clock = setInterval(() => { now.value = Date.now(); }, 1000);
onUnmounted(() => clearInterval(clock));
const retrySeconds = computed(() => Math.max(0, Math.ceil((auth.retryAt - now.value) / 1000)));
function logout() { auth.clear(); router.replace('/login'); }
async function retry() { await auth.validate(); if (!auth.sessionError) router.replace(auth.user ? '/calculator' : '/login'); }
</script>
<template>
 <a class="skip-link" href="#main">Lewati ke konten</a>
 <header class="site-header"><div class="header-inner">
  <RouterLink class="brand" to="/"><span class="brand-icon" aria-hidden="true">↗</span><span>ROI<span class="brand-light">kalkulator</span></span></RouterLink>
  <nav v-if="auth.user" aria-label="Navigasi utama"><RouterLink to="/calculator">Kalkulator</RouterLink><RouterLink to="/history">Riwayat</RouterLink></nav>
  <div v-if="auth.user" class="account"><span class="user-name">{{ auth.user.name }}</span><button class="text-button" @click="logout">Keluar</button></div>
  <span v-else class="header-note">Keputusan lebih terukur.</span>
 </div></header>
 <main id="main">
  <section v-if="auth.sessionError || auth.validating" class="panel session-state" aria-live="polite">
   <h1>{{ auth.validating ? 'Memvalidasi sesi…' : 'Sesi belum dapat diverifikasi' }}</h1>
   <p>{{ auth.sessionError || 'Tunggu sebentar, kami sedang memeriksa sesi Anda.' }}</p>
   <button v-if="auth.sessionError" class="primary" :disabled="auth.validating || retrySeconds > 0" @click="retry">{{ retrySeconds ? `Coba lagi dalam ${retrySeconds} detik` : 'Coba lagi' }}</button>
  </section>
  <RouterView v-else :key="auth.user?.id || 'guest'" />
 </main>
 <footer class="site-footer"><span>ROI kalkulator</span><span>Angka yang jelas. Keputusan yang lebih baik.</span></footer>
</template>
