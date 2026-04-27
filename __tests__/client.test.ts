import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { OwlPayClient } from '../src/client.ts';

const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('OwlPayClient', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  });

  // ── URL routing ─────────────────────────────────────────────────────────────

  test('sandbox environment uses sandbox base URL', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      capturedUrl = input.toString();
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.get('/api/v1/test');
    expect(capturedUrl).toStartWith('https://harbor-sandbox.owlpay.com');
  });

  test('production environment uses production base URL', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      capturedUrl = input.toString();
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'production');
    await client.get('/api/v1/test');
    expect(capturedUrl).toStartWith('https://harbor.owlpay.com');
  });

  test('default environment is sandbox', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      capturedUrl = input.toString();
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key');
    await client.get('/api/v1/test');
    expect(capturedUrl).toStartWith('https://harbor-sandbox.owlpay.com');
  });

  // ── GET request ─────────────────────────────────────────────────────────────

  test('GET sets X-API-KEY header', async () => {
    let capturedHeaders: Headers | null = null;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers as HeadersInit);
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('my-secret-api-key', 'sandbox');
    await client.get('/api/v1/test');
    expect(capturedHeaders?.get('X-API-KEY')).toBe('my-secret-api-key');
  });

  test('GET does not add X-Idempotency-Key', async () => {
    let capturedHeaders: Headers | null = null;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers as HeadersInit);
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.get('/api/v1/test');
    expect(capturedHeaders?.get('X-Idempotency-Key')).toBeNull();
  });

  test('GET appends query params to URL', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      capturedUrl = input.toString();
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.get('/api/v1/customers', { page: '2', limit: '10' });
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('limit')).toBe('10');
  });

  test('GET sends no body', async () => {
    let capturedBody: BodyInit | null | undefined = undefined;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = init?.body;
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.get('/api/v1/customers');
    expect(capturedBody).toBeNull();
  });

  // ── POST request ─────────────────────────────────────────────────────────────

  test('POST auto-generates UUID idempotency key', async () => {
    let capturedHeaders: Headers | null = null;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers as HeadersInit);
      return jsonResponse({ data: {} });
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.post('/api/v1/customers', { type: 'individual' });
    const key = capturedHeaders?.get('X-Idempotency-Key');
    expect(key).not.toBeNull();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test('POST preserves custom idempotency key', async () => {
    let capturedHeaders: Headers | null = null;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers as HeadersInit);
      return jsonResponse({ data: {} });
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.post('/api/v1/customers', {}, { idempotencyKey: 'my-custom-idem-key' });
    expect(capturedHeaders?.get('X-Idempotency-Key')).toBe('my-custom-idem-key');
  });

  test('POST serialises body as JSON', async () => {
    let capturedBody = '';
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = init?.body as string ?? '';
      return jsonResponse({ data: {} });
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    const payload = { type: 'individual', first_name: 'Alice', email: 'alice@example.com' };
    await client.post('/api/v1/customers', payload);
    expect(JSON.parse(capturedBody)).toEqual(payload);
  });

  // ── PATCH request ────────────────────────────────────────────────────────────

  test('PATCH adds X-Idempotency-Key', async () => {
    let capturedHeaders: Headers | null = null;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers as HeadersInit);
      return jsonResponse({ data: {} });
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.patch('/api/v1/wallets/wallet_123', { description: 'updated' });
    expect(capturedHeaders?.get('X-Idempotency-Key')).not.toBeNull();
  });

  // ── DELETE request ───────────────────────────────────────────────────────────

  test('DELETE sends correct method', async () => {
    let capturedMethod = '';
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedMethod = init?.method ?? '';
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.delete('/api/v1/webhooks/sub_123');
    expect(capturedMethod).toBe('DELETE');
  });

  test('DELETE does not add X-Idempotency-Key', async () => {
    let capturedHeaders: Headers | null = null;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers as HeadersInit);
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.delete('/api/v1/webhooks/sub_123');
    expect(capturedHeaders?.get('X-Idempotency-Key')).toBeNull();
  });

  // ── Error handling ───────────────────────────────────────────────────────────

  test('4xx throws error with message from response body', async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ message: 'Not found' }, 404),
    ) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await expect(client.get('/api/v1/customers/nonexistent')).rejects.toThrow('Not found');
  });

  test('4xx error has status property set', async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ message: 'Unauthorized' }, 401),
    ) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    try {
      await client.get('/api/v1/customers');
      expect(true).toBe(false); // unreachable
    } catch (err) {
      expect((err as { status: number }).status).toBe(401);
    }
  });

  // ── Retry behavior ───────────────────────────────────────────────────────────

  describe('retry on 5xx', () => {
    beforeEach(() => {
      // Make setTimeout instant so retry tests don't take 7 seconds
      globalThis.setTimeout = ((fn: () => void) => {
        fn();
        return 0;
      }) as unknown as typeof setTimeout;
    });

    afterEach(() => {
      globalThis.setTimeout = originalSetTimeout;
    });

    test('succeeds on 4th attempt after 3 consecutive 5xx', async () => {
      let callCount = 0;
      globalThis.fetch = mock(async () => {
        callCount++;
        if (callCount < 4) {
          return jsonResponse({ message: 'Server Error' }, 500);
        }
        return jsonResponse({ data: { uuid: 'ok' } }, 200);
      }) as unknown as typeof fetch;

      const client = new OwlPayClient('test-api-key', 'sandbox');
      const result = await client.get<{ data: { uuid: string } }>('/api/v1/test');
      expect(result.data.uuid).toBe('ok');
      expect(callCount).toBe(4); // 1 original + 3 retries
    });

    test('throws after 4 consecutive 5xx (3 retries exhausted)', async () => {
      let callCount = 0;
      globalThis.fetch = mock(async () => {
        callCount++;
        return jsonResponse({ message: 'Service Unavailable' }, 503);
      }) as unknown as typeof fetch;

      const client = new OwlPayClient('test-api-key', 'sandbox');
      await expect(client.get('/api/v1/test')).rejects.toThrow('Service Unavailable');
      expect(callCount).toBe(4); // 1 original + 3 retries
    });

    test('4xx is not retried', async () => {
      let callCount = 0;
      globalThis.fetch = mock(async () => {
        callCount++;
        return jsonResponse({ message: 'Bad Request' }, 400);
      }) as unknown as typeof fetch;

      const client = new OwlPayClient('test-api-key', 'sandbox');
      await expect(client.get('/api/v1/test')).rejects.toThrow();
      expect(callCount).toBe(1); // no retries on 4xx
    });

    test('retries on 429 and succeeds on next attempt', async () => {
      let callCount = 0;
      globalThis.fetch = mock(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(JSON.stringify({ message: 'Too Many Requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Retry-After': '0' },
          });
        }
        return jsonResponse({ data: { ok: true } }, 200);
      }) as unknown as typeof fetch;

      const client = new OwlPayClient('test-api-key', 'sandbox');
      const result = await client.get<{ data: { ok: boolean } }>('/api/v1/test');
      expect(result.data.ok).toBe(true);
      expect(callCount).toBe(2);
    });

    test('throws after 4 consecutive 429 responses', async () => {
      let callCount = 0;
      globalThis.fetch = mock(async () => {
        callCount++;
        return new Response(JSON.stringify({ message: 'Too Many Requests' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '0' },
        });
      }) as unknown as typeof fetch;

      const client = new OwlPayClient('test-api-key', 'sandbox');
      await expect(client.get('/api/v1/test')).rejects.toThrow('Too Many Requests');
      expect(callCount).toBe(4);
    });
  });

  // ── Environment property ─────────────────────────────────────────────────────

  test('exposes environment as sandbox', () => {
    const client = new OwlPayClient('key', 'sandbox');
    expect(client.environment).toBe('sandbox');
  });

  test('exposes environment as production', () => {
    const client = new OwlPayClient('key', 'production');
    expect(client.environment).toBe('production');
  });

  // ── API key guard ────────────────────────────────────────────────────────────

  test('throws on empty string API key', () => {
    expect(() => new OwlPayClient('')).toThrow('OwlPay API key is required');
  });

  // ── Content-Type header ──────────────────────────────────────────────────────

  test('GET does not send Content-Type header', async () => {
    let capturedHeaders: Headers | null = null;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers as HeadersInit);
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.get('/api/v1/test');
    expect(capturedHeaders?.get('Content-Type')).toBeNull();
  });

  test('DELETE does not send Content-Type header', async () => {
    let capturedHeaders: Headers | null = null;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers as HeadersInit);
      return jsonResponse({});
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.delete('/api/v1/test/123');
    expect(capturedHeaders?.get('Content-Type')).toBeNull();
  });

  test('POST sends Content-Type: application/json', async () => {
    let capturedHeaders: Headers | null = null;
    globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers as HeadersInit);
      return jsonResponse({ data: {} });
    }) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    await client.post('/api/v1/test', { foo: 'bar' });
    expect(capturedHeaders?.get('Content-Type')).toBe('application/json');
  });

  // ── Error code propagation ───────────────────────────────────────────────────

  test('error.code is populated from response body code field', async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ message: 'Validation failed', code: 'INVALID_AMOUNT' }, 422),
    ) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    try {
      await client.post('/api/v1/test', {});
      expect(true).toBe(false); // unreachable
    } catch (err) {
      expect((err as { code?: string }).code).toBe('INVALID_AMOUNT');
    }
  });

  test('error.code is undefined when response body has no code field', async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ message: 'Not found' }, 404),
    ) as unknown as typeof fetch;

    const client = new OwlPayClient('test-api-key', 'sandbox');
    try {
      await client.get('/api/v1/test');
      expect(true).toBe(false); // unreachable
    } catch (err) {
      expect((err as { code?: string }).code).toBeUndefined();
    }
  });
});
