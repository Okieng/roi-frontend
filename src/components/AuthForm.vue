<script setup>
import { reactive, ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { login, register as registerAccount } from '../api/auth';
import { useAuthStore } from '../stores/auth';
import { errorMessage, retryDelay, mixedContent } from '../api/client';
const props = defineProps({ register: Boolean });
const form = reactive({ name: '', email: '', password: '', password_confirmation: '' });
const fields = ref({}); const message = ref(''); const busy = ref(false); const cooldown = ref(0);
const auth = useAuthStore(); const router = useRouter();
const interval = setInterval(() => { if(cooldown.value > 0) cooldown.value--; },1000);
onUnmounted(() => clearInterval(interval));
async function submit() {
 if (busy.value || cooldown.value) return;
 fields.value = {}; message.value = '';
 if (props.register && form.password !== form.password_confirmation) { fields.value.password_confirmation = ['Konfirmasi kata sandi tidak sama.']; return; }
 busy.value = true;
 try { auth.clear(); const data = await (props.register ? registerAccount({...form}) : login({email:form.email,password:form.password})); auth.accept(data); await router.replace('/calculator'); }
 catch(error) { fields.value = error.response?.data?.errors || {}; message.value = errorMessage(error, !props.register); cooldown.value = retryDelay(error); }
 finally { busy.value = false; }
}
</script>
<template>
 <div class="auth-layout">
  <section class="auth-intro"><span class="eyebrow">KENALI KINERJA KAMPANYE ANDA</span><h1>Setiap biaya punya cerita.<br><span>Temukan hasilnya.</span></h1><p>Ubah angka kampanye menjadi gambaran yang jelas. Hitung ROI, pahami laba, dan simpan perhitungan Anda dalam satu tempat.</p><div class="auth-facts"><span>Perhitungan real-time</span><span>Riwayat privat</span></div><div class="formula-art" aria-hidden="true"><span>Pendapatan − Total biaya</span><div></div><span>Total biaya</span><b>× 100%</b></div></section>
  <section class="panel auth-panel"><h2>{{ register ? 'Buat akun Anda' : 'Selamat datang kembali' }}</h2><p>{{ register ? 'Mulai ukur hasil kampanye Anda.' : 'Masuk untuk melanjutkan perhitungan Anda.' }}</p>
   <form @submit.prevent="submit">
    <div v-if="register" class="field"><label for="name">Nama lengkap</label><input id="name" v-model="form.name" required maxlength="255" autocomplete="name" :aria-invalid="!!fields.name" aria-describedby="name-error"><small id="name-error" class="error">{{ fields.name?.[0] }}</small></div>
    <div class="field"><label for="email">Email</label><input id="email" v-model="form.email" type="email" required maxlength="255" autocomplete="email" placeholder="nama@contoh.com" :aria-invalid="!!fields.email" aria-describedby="email-error"><small id="email-error" class="error">{{ fields.email?.[0] }}</small></div>
    <div class="field"><label for="password">Kata sandi</label><input id="password" v-model="form.password" type="password" required :minlength="register ? 8 : undefined" :autocomplete="register ? 'new-password' : 'current-password'" :aria-invalid="!!fields.password" aria-describedby="password-error"><small id="password-error" :class="fields.password ? 'error' : 'muted'">{{ fields.password?.[0] || (register ? 'Gunakan minimal 8 karakter.' : '') }}</small></div>
    <div v-if="register" class="field"><label for="confirmation">Konfirmasi kata sandi</label><input id="confirmation" v-model="form.password_confirmation" type="password" required autocomplete="new-password" :aria-invalid="!!fields.password_confirmation" aria-describedby="confirmation-error"><small id="confirmation-error" class="error">{{ fields.password_confirmation?.[0] }}</small></div>
    <p v-if="message || mixedContent" class="notice error" role="alert">{{ message || 'API perlu HTTPS atau proxy HTTPS sebelum aplikasi dapat digunakan pada halaman ini.' }}</p>
    <button class="primary full" :disabled="busy || cooldown > 0 || mixedContent">{{ busy ? 'Memproses…' : cooldown ? `Coba lagi dalam ${cooldown} detik` : register ? 'Buat akun' : 'Masuk' }}<span v-if="!busy && !cooldown" aria-hidden="true">→</span></button>
   </form>
   <p class="auth-switch">{{ register ? 'Sudah punya akun?' : 'Belum punya akun?' }} <RouterLink :to="register ? '/login' : '/register'">{{ register ? 'Masuk' : 'Daftar sekarang' }}</RouterLink></p>
  </section>
 </div>
</template>
