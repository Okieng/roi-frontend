import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import CalculatorView from '../views/CalculatorView.vue';
import HistoryView from '../views/HistoryView.vue';
export const router = createRouter({ history: createWebHistory(), routes: [
 { path: '/', redirect: '/calculator' },
 { path: '/login', component: LoginView, meta: { guest: true } },
 { path: '/register', component: RegisterView, meta: { guest: true } },
 { path: '/calculator', component: CalculatorView },
 { path: '/history', component: HistoryView },
 { path: '/:pathMatch(.*)*', redirect: '/' },
] });
router.beforeEach(async to => {
 const auth = useAuthStore();
 if (!auth.checked) await auth.validate();
 if (auth.sessionError) return true;
 if (!to.meta.guest && !auth.user) return '/login';
 if (to.meta.guest && auth.user) return '/calculator';
});
