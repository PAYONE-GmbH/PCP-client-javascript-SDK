import { beforeEach, expect, it } from 'vitest';
import { showError } from './ui';

beforeEach(() => {
  document.body.innerHTML = '<p id="status"></p>';
});

it('shows Google PaymentsError details as text instead of a generic payment failure', () => {
  showError({ statusCode: 'DEVELOPER_ERROR', statusMessage: '<request rejected>' });
  expect(document.querySelector('#status')!.textContent).toBe(
    'DEVELOPER_ERROR: <request rejected>',
  );
  expect(document.querySelector('#status')!.children).toHaveLength(0);
});

it('preserves ordinary script errors and handles unknown errors', () => {
  showError(new Error('Failed to load wallet script: https://pay.google.com/gp/p/js/pay.js'));
  expect(document.querySelector('#status')!.textContent).toContain('Failed to load wallet script');
  showError(null);
  expect(document.querySelector('#status')!.textContent).toBe('Payment failed.');
});
