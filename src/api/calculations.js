import { client } from './client';
export const saveCalculation = payload => client.post('/calculations', payload).then(r => r.data.data);
export const getCalculations = (page, signal) => client.get('/calculations', { params: { page }, signal }).then(r => r.data);
