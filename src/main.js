import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { useAuthStore } from './stores/auth';
import { client } from './api/client';
import './style.css';
const app = createApp(App);
app.use(createPinia());
const auth = useAuthStore();
client.interceptors.request.use(config => {
 if (!config.url.startsWith('/auth/') && auth.token) config.headers.Authorization = `Bearer ${auth.token}`;
 return config;
});
client.interceptors.response.use(response => response, error => {
 if (error.response?.status === 401 && !error.config.url.startsWith('/auth/') && error.config.headers.Authorization === `Bearer ${auth.token}`) { auth.clear(); router.replace('/login'); }
 return Promise.reject(error);
});
app.use(router);
app.mount('#app');
