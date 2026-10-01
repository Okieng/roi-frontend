import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getUser } from '../api/auth';
import { errorMessage, retryDelay } from '../api/client';
const storageKey = 'roi-token';
export const useAuthStore = defineStore('auth', () => {
 const token = ref(sessionStorage.getItem(storageKey));
 const user = ref(null);
 const checked = ref(!token.value);
 const sessionError = ref('');
 const validating = ref(false);
 const retryAt = ref(0);
 let pending;
 function clear() { token.value = null; user.value = null; checked.value = true; sessionError.value = ''; retryAt.value = 0; sessionStorage.removeItem(storageKey); }
 function accept(data) { clear(); token.value = data.token; user.value = data.user; sessionStorage.setItem(storageKey, data.token); }
 async function validate() {
  if (pending) return pending;
  if (Date.now() < retryAt.value) return;
  if (!token.value) { checked.value = true; return; }
  validating.value = true; sessionError.value = '';
  const currentToken = token.value;
  pending = (async () => {
   try { const profile = await getUser(); if (token.value === currentToken) { user.value = profile; checked.value = true; } }
   catch (error) { if (token.value === currentToken) { if (error.response?.status === 401) clear(); else { sessionError.value = errorMessage(error); retryAt.value = Date.now() + retryDelay(error) * 1000; } } }
   finally { validating.value = false; pending = null; }
  })();
  return pending;
 }
 return { token, user, checked, sessionError, validating, retryAt, clear, accept, validate };
});
