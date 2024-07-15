export interface Request {
  request: string;
  responsetype: string;
  mode: string;
  mid: string;
  aid: string;
  portalid: string;
  encoding: string;
  storecarddata: string;
  checktype?: string;
  hash: string;
}

export const createHash = async (
  request: Omit<Request, 'hash'>,
  pmiPortalKey: string,
): Promise<string> => {
  const requestValues = [
    request.aid,
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
