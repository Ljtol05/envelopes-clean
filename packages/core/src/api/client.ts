// Minimal shared API client for web + mobile
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiClientOptions {
  baseUrl: string;
  getAuthToken?: () => string | undefined | null;
  extraHeaders?: Record<string, string>;
}

export class ApiClient {
  private opts: ApiClientOptions;
  constructor(opts: ApiClientOptions) {
    this.opts = opts;
  }

  private buildUrl(path: string) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${this.opts.baseUrl.replace(/\/$/, '')}${p}`;
  }

  async request<T = unknown>(method: HttpMethod, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    const token = this.opts.getAuthToken?.();
    const hdrs: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(this.opts.extraHeaders || {}),
      ...(headers || {}),
    };
    const res = await fetch(this.buildUrl(path), {
      method,
      headers: hdrs,
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const ct = res.headers.get('content-type') || '';
    const txt = await res.text();
    const data = ct.includes('application/json') && txt ? JSON.parse(txt) : txt;
    if (!res.ok) {
      const err = new Error((data && data.error) || res.statusText || 'Request failed');
      // @ts-expect-error annotate response
      err.status = res.status;
      // @ts-expect-error annotate response
      err.body = data;
      throw err;
    }
    return data as T;
  }

  get<T = unknown>(path: string, headers?: Record<string, string>) { return this.request<T>('GET', path, undefined, headers); }
  post<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) { return this.request<T>('POST', path, body, headers); }
  put<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) { return this.request<T>('PUT', path, body, headers); }
  delete<T = unknown>(path: string, headers?: Record<string, string>) { return this.request<T>('DELETE', path, undefined, headers); }
}
