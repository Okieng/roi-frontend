import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCurrency, formatDecimal, calculate, validateInputs } from '../src/utils/decimalFormat.js';
const fields = (a,b,c) => ({ad_spend:a,other_costs:b,total_revenue:c});
test('Indonesian parsing preserves cents and rejects malformed or negative amounts', () => {
 assert.equal(parseCurrency('1.500.000,50'),'1500000.50');
 assert.equal(parseCurrency('9999999999999999,99'),'9999999999999999.99');
 assert.equal(parseCurrency('1500000'),'1500000');
 for (const input of ['', '-200', '1e5', '1.23', '1,234', 'abc', '12.34.567']) assert.equal(parseCurrency(input),null);
});
test('PRD example and zero revenue', () => {
 assert.deepEqual(calculate(fields('200000','500000','1000000')), {total_cost:'700000.00',profit:'300000.00',roi_percentage:'42.8571',margin_percent:'30.0000',status:'Untung'});
 assert.equal(calculate(fields('1','0','0')).roi_percentage,'-100.0000');
 assert.equal(calculate(fields('1','0','0')).margin_percent,null);
 assert.equal(calculate(fields('1','0','1')).status,'Impas');
});
test('limits, empty fields and zero total are invalid', () => {
 assert.ok(validateInputs(fields('0','0','1')).total_cost);
 assert.ok(validateInputs(fields('','0','1')).ad_spend);
 assert.ok(validateInputs(fields('9999999999999999.99','0.01','1')).total_cost);
 assert.deepEqual(validateInputs(fields('9999999999999999.98','0.01','1')),{});
});
test('large amounts retain cents and output negative signs', () => {
 assert.equal(calculate(fields('9999999999999999.98','0.01','9999999999999999.98')).profit,'-0.01');
 assert.equal(formatDecimal('9999999999999999.99'),'9.999.999.999.999.999,99');
 assert.equal(formatDecimal('-300000'),'-300.000');
 assert.equal(formatDecimal('42.8571',true),'42,86');
});
