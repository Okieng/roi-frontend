import axios from 'axios';
export const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://apiroi.invwedd.my.id/api';
export const mixedContent = window.location.protocol === 'https:' && new URL(apiBaseURL, window.location.origin).protocol === 'http:';
export const client = axios.create({ baseURL: apiBaseURL, timeout: 20000, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } });
client.interceptors.request.use(config => {
 if (mixedContent) throw new Error('API belum menggunakan HTTPS. Konfigurasikan endpoint HTTPS atau proxy sebelum melanjutkan.');
 return config;
});
export function errorMessage(error, login = false) {
 const status = error.response?.status;
 if (status === 401) return login ? 'Email atau kata sandi salah.' : 'Sesi tidak valid. Silakan masuk kembali.';
 if (status === 403) return 'Akses ditolak. Anda tidak memiliki izin untuk data ini.';
 if (status === 429) return 'Terlalu banyak percobaan. Silakan coba lagi setelah jeda.';
 if (status === 422) return error.response.data.message || 'Periksa kembali isian Anda.';
 return mixedContent ? 'API belum menggunakan HTTPS. Konfigurasikan endpoint HTTPS atau proxy.' : 'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.';
}
export function retryDelay(error) {
 const value = error.response?.headers?.['retry-after'];
 if (!value) return error.response?.status === 429 ? 60 : 0;
 return /^\d+$/.test(value) ? Number(value) : Math.max(0, Math.ceil((Date.parse(value) - Date.now()) / 1000)) || 60;
}
