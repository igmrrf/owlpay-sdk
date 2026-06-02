// OwlPay Harbor API client — requires fetch (Node 20+, Bun, Deno, browsers)

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  idempotencyKey?: string;
  params?: Record<string, string>;
}

/**
 * Low-level HTTP client for the OwlPay Harbor API.
 * Handles authentication, idempotency keys, and automatic retries.
 * @param apiKey - Your OwlPay API key. Store in an environment variable; never hard-code.
 * @param environment - `'sandbox'` (default) or `'production'`
 * @param options.timeoutMs - Per-attempt timeout in milliseconds (default: 30 000)
 */
export class OwlPayClient {
  readonly environment: 'sandbox' | 'production';
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeoutMs: number;

  constructor(
    apiKey: string,
    environment: 'sandbox' | 'production' = 'sandbox',
    { timeoutMs = 30_000 }: { timeoutMs?: number } = {},
  ) {
    if (!apiKey) throw new Error('OwlPay API key is required');
    this.environment = environment;
    this.timeoutMs = timeoutMs;
    this.baseURL =
      environment === 'sandbox'
        ? 'https://harbor-sandbox.owlpay.com'
        : 'https://harbor.owlpay.com';

    this.defaultHeaders = {
      'X-API-KEY': apiKey,
      Accept: 'application/json',
    };
  }

  async request<T>(
    method: Method,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const isMutating = ['POST', 'PATCH', 'PUT'].includes(method);
    const headers: Record<string, string> = { ...this.defaultHeaders };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (isMutating) {
      headers['X-Idempotency-Key'] = options.idempotencyKey ?? crypto.randomUUID();
    }

    let url = `${this.baseURL}${path}`;
    if (options.params) {
      url += '?' + new URLSearchParams(options.params).toString();
    }

    const attempt = async (retryCount = 0): Promise<T> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      let res: Response;
      try {
        res = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : null,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        if (res.status === 429 && retryCount < 3) {
          const retryAfter = res.headers.get('Retry-After');
          let delay: number;
          if (retryAfter) {
            const seconds = parseInt(retryAfter, 10);
            delay = isNaN(seconds)
              ? Math.max(0, new Date(retryAfter).getTime() - Date.now())
              : seconds * 1000;
          } else {
            delay = 1000 * 2 ** retryCount;
          }
          await new Promise((r) => setTimeout(r, delay));
          return attempt(retryCount + 1);
        }

        if (res.status >= 500 && retryCount < 3) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** retryCount));
          return attempt(retryCount + 1);
        }

        const err = await res.json().catch(() => ({ message: res.statusText }));
        const error = new Error(
          (err as { message?: string }).message ?? 'OwlPay API error',
        ) as Error & { status: number; body: unknown; code?: string };
        error.status = res.status;
        error.body = err;
        error.code = (err as { code?: string }).code;
        throw error;
      }

      return res.json() as Promise<T>;
    };

    return attempt();
  }

  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, params ? { params } : {});
  }

  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, opts);
  }

  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, opts);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}
