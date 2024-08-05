import { Request } from '../interfaces/index.js';

export const createHash = async (
  request: Omit<Request, 'hash'>,
  pmiPortalKey: string,
): Promise<string> => {
  const requestValues = [
    request.aid,
    request.api_version,
    request.encoding,
    request.mid,
    request.mode,
    request.portalid,
    request.request,
    request.responsetype,
    request.storecarddata,
  ];

  const dataToHash = requestValues.join('');

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pmiPortalKey),
    { name: 'HMAC', hash: 'SHA-384' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(dataToHash),
  );

  const hash = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return hash;
};

export const encodeToBase64 = (str: string): string => {
  // Convert string to UTF-8 byte array
  const utf8Bytes = new TextEncoder().encode(str);

  // Convert byte array to base64 string
  let binaryString = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binaryString += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binaryString);
};
