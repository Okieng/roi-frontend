import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc';

test('auth form display conditions bind to the register prop, not an API function', () => {
 const filename = 'src/components/AuthForm.vue';
 const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename });
 const script = compileScript(descriptor, { id: 'auth-form' });
 assert.equal(script.bindings.register, 'props');
 const template = compileTemplate({
  source: descriptor.template.content,
  filename,
  id: 'auth-form',
  compilerOptions: { bindingMetadata: script.bindings },
 });
 assert.deepEqual(template.errors, []);
 assert.match(template.code, /\$props\.register/);
 assert.doesNotMatch(template.code, /\$setup(?:\.register|\["register"\])/);
});
