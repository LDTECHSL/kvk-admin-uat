const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/pages/car-wash/catalog-form-model.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const context = { exports: {} };
vm.runInNewContext(compiled.outputText, context);
const { validateCatalogForm, validateImage } = context.exports;
const service = {
  title: 'Full wash', description: 'A complete exterior wash', price: '500',
  pricesWithoutDiscounts: '0', features: ['Exterior wash'], isActive: true, serviceIds: [],
};

test('new services require every cashier field, including an image', () => {
  const errors = validateCatalogForm({ ...service, title: '', description: '', price: '', features: [''] }, false, 0, true, false);
  for (const field of ['title', 'description', 'price', 'features', 'image']) assert.ok(errors[field]);
  assert.equal(Object.keys(validateCatalogForm(service, false, 0, true, true)).length, 0);
});
test('editing preserves the existing image without requiring a new upload', () => {
  assert.equal(Object.keys(validateCatalogForm(service, false, 0, false, false)).length, 0);
});
test('service prices must be positive and feature lists cannot exceed five', () => {
  assert.ok(validateCatalogForm({ ...service, price: '0' }, false, 0, false, false).price);
  assert.ok(validateCatalogForm({ ...service, price: '-10' }, false, 0, false, false).price);
  assert.ok(validateCatalogForm({ ...service, features: Array(6).fill('Wash') }, false, 0, false, false).features);
});
test('packages require services and cannot cost more than their calculated regular total', () => {
  assert.ok(validateCatalogForm(service, true, 0, false, false).serviceIds);
  const packageForm = { ...service, serviceIds: ['wash'], features: [] };
  assert.ok(validateCatalogForm(packageForm, true, 400, false, false).price);
  assert.equal(Object.keys(validateCatalogForm(packageForm, true, 600, true, true)).length, 0);
});
test('uploads accept supported images up to 5 MB and reject invalid files', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
    assert.equal(validateImage({ type, size: 5 * 1024 * 1024 }), undefined);
  }
  assert.ok(validateImage({ type: 'application/pdf', size: 100 }));
  assert.ok(validateImage({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }));
  assert.ok(validateImage({ type: 'image/png', size: 0 }));
});
