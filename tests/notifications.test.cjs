const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src/lib', file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const context = { exports: {}, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled.outputText, context);
  return context.exports;
}

test('concurrent success and errors remain separate and subscribers see dismissals', () => {
  const { notify, notificationStore: store } = load('notifications.ts');
  let updates = 0;
  const unsubscribe = store.subscribe(() => updates++);
  const success = notify.success('Package created.');
  const error = notify.error('Service has future bookings.');
  assert.equal(store.getSnapshot().length, 2);
  assert.equal(store.getSnapshot()[1].description, 'Service has future bookings.');
  store.dismiss(success);
  assert.equal(store.getSnapshot()[0].id, error);
  assert.equal(updates, 3);
  unsubscribe();
  store.dismiss(error);
  assert.equal(updates, 3);
});

test('duplicate loads do not overlap, and the same message can be shown again after dismissal', () => {
  const { notify, notificationStore: store } = load('notifications.ts');
  const first = notify.error('Failed to load members.');
  assert.equal(notify.error('Failed to load members.'), first);
  assert.equal(store.getSnapshot().length, 1);
  store.dismiss(first);
  assert.notEqual(notify.error('Failed to load members.'), first);
});

test('closing an alert calls its callback once without removing other messages', () => {
  const { notify, notificationStore: store } = load('notifications.ts');
  let closed = 0;
  const id = store.show({ variant: 'warning', description: 'Check details.', onClose: () => closed++, autoCloseMs: 0 });
  notify.success('Saved.');
  store.dismiss(id);
  store.dismiss(id);
  assert.equal(closed, 1);
  assert.equal(store.getSnapshot().length, 1);
});

test('validation reports submitted field errors together, and valid forms stay quiet', () => {
  const { notifyValidation, notificationStore: store } = load('notifications.ts');
  notifyValidation({});
  assert.equal(store.getSnapshot().length, 0);
  notifyValidation({ title: 'Title is required.', image: undefined, price: 'Invalid price.' });
  assert.equal(store.getSnapshot().length, 1);
  assert.equal(store.getSnapshot()[0].description, 'Title is required. Invalid price.');
});

test('feedback survives clearing page state and supports nullable messages and functional setters', () => {
  const notifications = load('notifications.ts');
  let state;
  const react = {
    useState: initial => { state = initial; return [initial, next => { state = next; }]; },
    useRef: initial => ({ current: initial }),
    useCallback: callback => callback,
  };
  const { useFeedbackState } = load('use-feedback-state.ts', { react, './notifications': notifications });
  const [, setFeedback] = useFeedbackState(null, 'success');
  setFeedback('Trainer assigned.');
  setFeedback(previous => `${previous} Updated.`);
  setFeedback(null);
  assert.equal(state, null);
  assert.equal(notifications.notificationStore.getSnapshot().length, 2);
  assert.equal(notifications.notificationStore.getSnapshot()[1].description, 'Trainer assigned. Updated.');
});
