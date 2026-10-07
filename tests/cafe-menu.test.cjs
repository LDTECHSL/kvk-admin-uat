const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/pages/cafe/menu/form-model.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const context = { exports: {}, FormData };
vm.runInNewContext(compiled.outputText, context);
const { validateMenuForm, buildMenuPayload } = context.exports;
const meal = {
  name: 'Breakfast', category: 1, price: '1200', description: 'Eggs and toast', facts: 'Freshly made',
  ingredients: ['Eggs', 'Toast'], portionSize: '2', preparationTimeInMinutes: '15', isActive: true,
};

test('creation requires name, positive price and image', () => {
  const errors = validateMenuForm({ ...meal, name: '', price: '0' }, false);
  assert.ok(errors.name); assert.ok(errors.price); assert.ok(errors.image);
  assert.equal(Object.keys(validateMenuForm(meal, true)).length, 0);
});
test('meals enforce portion and preparation rules while coffee does not require meal fields', () => {
  for (const portionSize of ['', '0', '5', '1.5']) {
    assert.ok(validateMenuForm({ ...meal, portionSize }, true).portionSize);
  }
  for (const preparationTimeInMinutes of ['', '-1', '61', '0.5']) {
    assert.ok(validateMenuForm({ ...meal, preparationTimeInMinutes }, true).preparationTimeInMinutes);
  }
  assert.equal(Object.keys(validateMenuForm({ ...meal, preparationTimeInMinutes: '0' }, true)).length, 0);
  assert.equal(Object.keys(validateMenuForm({ ...meal, category: 4, portionSize: '0', preparationTimeInMinutes: '0' }, true)).length, 0);
});
test('payload maps meal includes to Ingredients and carries all backend fields', () => {
  const payload = buildMenuPayload(meal);
  for (const [key, value] of Object.entries({ Name: 'Breakfast', Category: '1', Price: '1200', Description: 'Eggs and toast', Facts: 'Freshly made', Ingredients: 'Eggs,Toast', PortionSize: '2', PreparationTimeInMinutes: '15', IsActive: 'true' })) {
    assert.equal(payload.get(key), value);
  }
  assert.equal(payload.has('Id'), false);
  assert.equal(payload.has('Image'), false);
});
test('status updates preserve menu details and omit image so the current image is kept', () => {
  const payload = buildMenuPayload({ ...meal, isActive: false }, 'menu-id');
  assert.equal(payload.get('Id'), 'menu-id');
  assert.equal(payload.get('IsActive'), 'false');
  assert.equal(payload.get('Ingredients'), 'Eggs,Toast');
  assert.equal(payload.get('PortionSize'), '2');
  assert.equal(payload.get('PreparationTimeInMinutes'), '15');
  assert.equal(payload.has('Image'), false);
});
test('new images are submitted and invalid categories are rejected', () => {
  const image = new File(['image'], 'coffee.png', { type: 'image/png' });
  const payload = buildMenuPayload({ ...meal, category: 4 }, undefined, image);
  assert.equal(payload.get('Image').name, 'coffee.png');
  assert.ok(validateMenuForm({ ...meal, category: 99 }, true).category);
});
