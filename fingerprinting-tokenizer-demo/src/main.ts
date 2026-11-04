import { PCPFingerprintingTokenizer } from 'pcp-client-javascript-sdk';

const form = document.querySelector<HTMLFormElement>('#setup')!;
const button = document.querySelector<HTMLButtonElement>('#initialize')!;
const result = document.querySelector<HTMLElement>('#result')!;
document.querySelector<HTMLInputElement>('#partner')!.value =
  import.meta.env.VITE_PAYLA_PARTNER_ID ?? '';
document.querySelector<HTMLInputElement>('#merchant')!.value =
  import.meta.env.VITE_PARTNER_MERCHANT_ID ?? '';
let tokenizer: PCPFingerprintingTokenizer | undefined;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  button.disabled = true;
  result.textContent = 'Initializing fingerprinting…';
  tokenizer?.destroy();
  try {
    tokenizer = await PCPFingerprintingTokenizer.create(
      '#fingerprinting',
      String(data.get('environment')),
      String(data.get('partner')).trim(),
      String(data.get('merchant')).trim(),
      String(data.get('session')).trim() || undefined,
    );
    result.textContent = JSON.stringify(
      {
        sessionId: tokenizer.getUniqueId(),
        deviceToken: tokenizer.getSnippetToken(),
      },
      null,
      2,
    );
  } catch (error) {
    result.textContent = error instanceof Error ? error.message : 'Fingerprinting failed.';
  } finally {
    button.disabled = false;
  }
});
window.addEventListener('pagehide', () => tokenizer?.destroy());
