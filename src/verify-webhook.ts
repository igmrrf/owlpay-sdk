export async function verifyWebhookSignature(
  payload: string | Uint8Array,
  harborSignatureHeader: string,
  secret: string,
): Promise<boolean> {
  // Parse "t=<timestamp>,v1=<hex>" format sent in the "harbor-signature" header
  const parts: Record<string, string> = {};
  for (const segment of harborSignatureHeader.split(',')) {
    const idx = segment.indexOf('=');
    if (idx === -1) continue;
    parts[segment.slice(0, idx)] = segment.slice(idx + 1);
  }

  const timestamp = parts['t'];
  const sigHex = parts['v1'];
  if (!timestamp || !sigHex) return false;
  if (sigHex.length % 2 !== 0) return false;

  const sigBytes = new Uint8Array(sigHex.length / 2);
  for (let i = 0; i < sigHex.length; i += 2) {
    const byte = parseInt(sigHex.slice(i, i + 2), 16);
    if (isNaN(byte)) return false;
    sigBytes[i / 2] = byte;
  }

  const enc = new TextEncoder();
  const bodyStr = typeof payload === 'string' ? payload : new TextDecoder().decode(payload);
  // Harbor signs "{timestamp}.{body}"
  const signedPayload = enc.encode(`${timestamp}.${bodyStr}`);

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  return crypto.subtle.verify('HMAC', key, sigBytes, signedPayload);
}
