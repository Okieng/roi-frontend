import { computed, reactive } from 'vue';
import { calculate, validateInputs } from '../utils/decimalFormat';
export function useRoiCalculator() {
 const values = reactive({ ad_spend: '200000', other_costs: '500000', total_revenue: '1000000' });
 return { values, errors: computed(() => validateInputs(values)), result: computed(() => calculate(values)) };
}
