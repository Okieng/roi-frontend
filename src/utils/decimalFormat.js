import Decimal from 'decimal.js';
export const D = Decimal.clone({ precision: 48, rounding: Decimal.ROUND_HALF_UP });
export const inputKeys = ['ad_spend', 'other_costs', 'total_revenue'];
export function parseCurrency(raw) {
 const value = raw.trim();
 if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return null;
 const canonical = value.replaceAll('.', '').replace(',', '.');
 return /^\d{1,16}(?:\.\d{1,2})?$/.test(canonical) ? canonical : null;
}
export function formatDecimal(value, percent = false) {
 if (value === null || value === undefined) return '—';
 const [integer, fraction] = new D(value).toFixed(2).split('.');
 return integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (percent || fraction !== '00' ? ',' + fraction : '');
}
export const money = value => value == null ? '—' : `Rp ${formatDecimal(value)}`;
export function validateInputs(values) {
 const errors = {};
 for (const key of inputKeys) if (typeof values[key] !== 'string' || !/^\d{1,16}(\.\d{1,2})?$/.test(values[key])) errors[key] = 'Masukkan angka nonnegatif, maksimal 16 digit dan 2 desimal.';
 if (!errors.ad_spend && !errors.other_costs) {
  const total = new D(values.ad_spend).plus(values.other_costs);
  if (total.isZero()) errors.total_cost = 'Total biaya harus lebih besar dari Rp 0.';
  else if (total.gt('9999999999999999.99')) errors.total_cost = 'Total biaya maksimal Rp 9.999.999.999.999.999,99.';
 }
 return errors;
}
export function margin(profit, revenue) { return new D(revenue).gt(0) ? new D(profit).div(revenue).times(100).toFixed(4) : null; }
export function calculate(values) {
 if (Object.keys(validateInputs(values)).length) return null;
 const total = new D(values.ad_spend).plus(values.other_costs);
 const profit = new D(values.total_revenue).minus(total);
 return { total_cost: total.toFixed(2), profit: profit.toFixed(2), roi_percentage: profit.div(total).times(100).toFixed(4), margin_percent: margin(profit, values.total_revenue), status: profit.gt(0) ? 'Untung' : profit.lt(0) ? 'Rugi' : 'Impas' };
}
