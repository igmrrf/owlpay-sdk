import { describe, test, expect } from 'bun:test';
import { verifyWebhookSignature } from '../src/verify-webhook.ts';

const SECRET = 'test-webhook-secret-32-chars-long';
const PAYLOAD = '{"type":"transfer.status.completed","data":{"uuid":"txfr_abc"}}';
const TIMESTAMP = '1689066169';

async function makeHeader(payload: string, secret: string, timestamp = TIMESTAMP): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${payload}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `t=${timestamp},v1=${hex}`;
}

describe('verifyWebhookSignature', () => {
  test('valid harbor-signature header returns true', async () => {
    const header = await makeHeader(PAYLOAD, SECRET);
    expect(await verifyWebhookSignature(PAYLOAD, header, SECRET)).toBe(true);
  });

  test('wrong secret returns false', async () => {
    const header = await makeHeader(PAYLOAD, SECRET);
    expect(await verifyWebhookSignature(PAYLOAD, header, 'wrong-secret')).toBe(false);
  });

  test('tampered payload returns false', async () => {
    const header = await makeHeader(PAYLOAD, SECRET);
    expect(await verifyWebhookSignature('{"type":"tampered"}', header, SECRET)).toBe(false);
  });

  test('tampered timestamp returns false', async () => {
    const header = await makeHeader(PAYLOAD, SECRET, TIMESTAMP);
    const tampered = header.replace(`t=${TIMESTAMP}`, 't=9999999999');
    expect(await verifyWebhookSignature(PAYLOAD, tampered, SECRET)).toBe(false);
  });

  test('wrong v1 signature returns false', async () => {
    const header = `t=${TIMESTAMP},v1=${'a'.repeat(64)}`;
    expect(await verifyWebhookSignature(PAYLOAD, header, SECRET)).toBe(false);
  });

  test('missing t= field returns false', async () => {
    const header = await makeHeader(PAYLOAD, SECRET);
    const noTimestamp = header.replace(`t=${TIMESTAMP},`, '');
    expect(await verifyWebhookSignature(PAYLOAD, noTimestamp, SECRET)).toBe(false);
  });

  test('missing v1= field returns false', async () => {
    expect(await verifyWebhookSignature(PAYLOAD, `t=${TIMESTAMP}`, SECRET)).toBe(false);
  });

  test('empty header returns false', async () => {
    expect(await verifyWebhookSignature(PAYLOAD, '', SECRET)).toBe(false);
  });

  test('odd-length hex in v1 returns false', async () => {
    expect(await verifyWebhookSignature(PAYLOAD, `t=${TIMESTAMP},v1=abc`, SECRET)).toBe(false);
  });

  test('Uint8Array payload verifies correctly', async () => {
    const payloadBytes = new TextEncoder().encode(PAYLOAD);
    const header = await makeHeader(PAYLOAD, SECRET);
    expect(await verifyWebhookSignature(payloadBytes, header, SECRET)).toBe(true);
  });

  test('Uint8Array payload with tampered data returns false', async () => {
    const payloadBytes = new TextEncoder().encode(PAYLOAD);
    const header = await makeHeader('different payload', SECRET);
    expect(await verifyWebhookSignature(payloadBytes, header, SECRET)).toBe(false);
  });

  test('different timestamps produce different signatures', async () => {
    const h1 = await makeHeader(PAYLOAD, SECRET, '1000000000');
    const h2 = await makeHeader(PAYLOAD, SECRET, '2000000000');
    expect(h1).not.toBe(h2);
    expect(await verifyWebhookSignature(PAYLOAD, h1, SECRET)).toBe(true);
    expect(await verifyWebhookSignature(PAYLOAD, h2, SECRET)).toBe(true);
    // Cross-verify: h1 sig does not pass with h2's timestamp embedded
    expect(await verifyWebhookSignature(PAYLOAD, h1.replace('1000000000', '2000000000'), SECRET)).toBe(false);
  });
});
