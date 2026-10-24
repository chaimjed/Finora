import { BadGatewayException, Injectable, Logger } from '@nestjs/common';

export type RateSource = 'frankfurter' | 'exchangerate-api';

export interface RateResult {
  rate: number;
  source: RateSource | null; 
  stale: boolean;            
}

interface CacheEntry {
  rate: number;
  source: RateSource;
  fetchedAt: number;
}

interface Provider {
  name: RateSource;
  fetchRate: (from: string, to: string, signal: AbortSignal) => Promise<number>;
}

const FRESH_TTL_MS = 60 * 60 * 1000;              
const STALE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; 
const REQUEST_TIMEOUT_MS = 8000;

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<RateResult>>();

  private readonly providers: Provider[] = [
    {
      name: 'frankfurter',
      fetchRate: async (from, to, signal) => {
        const res = await fetch(`https://api.frankfurter.dev/v2/rate/${from}/${to}`, { signal });
        if (!res.ok) throw new Error(`frankfurter HTTP ${res.status}`);
        const data = (await res.json()) as { rate?: unknown };
        return this.assertRate(data.rate);
      },
    },
    {
      name: 'exchangerate-api',
      fetchRate: async (from, to, signal) => {
        const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, { signal });
        if (!res.ok) throw new Error(`exchangerate-api HTTP ${res.status}`);
        const data = (await res.json()) as { result?: string; rates?: Record<string, unknown> };
        if (data.result !== 'success') throw new Error('exchangerate-api reported an error');
        return this.assertRate(data.rates?.[to]);
      },
    },
  ];

  async getRate(from: string, to: string): Promise<RateResult> {
    if (from === to) return { rate: 1, source: null, stale: false };

    const key = `${from}_${to}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < FRESH_TTL_MS) {
      return { rate: cached.rate, source: cached.source, stale: false };
    }

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const promise = this.refresh(key, from, to, cached).finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  private async refresh(key: string, from: string, to: string, cached?: CacheEntry): Promise<RateResult> {
    try {
      const { rate, source } = await this.fetchFromProviders(from, to);
      this.cache.set(key, { rate, source, fetchedAt: Date.now() });
      return { rate, source, stale: false };
    } catch (err) {
      if (cached && Date.now() - cached.fetchedAt < STALE_MAX_AGE_MS) {
        this.logger.warn(`Using last known rate for ${from}->${to} (${this.reason(err)})`);
        return { rate: cached.rate, source: cached.source, stale: true };
      }
      this.logger.error(`Exchange rate unavailable for ${from}->${to}: ${this.reason(err)}`);
      throw new BadGatewayException(
        'Could not fetch the exchange rate automatically — please enter it manually.',
      );
    }
  }

  private async fetchFromProviders(from: string, to: string): Promise<{ rate: number; source: RateSource }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await Promise.any(
        this.providers.map(async (p) => ({
          rate: await p.fetchRate(from, to, controller.signal),
          source: p.name,
        })),
      );
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }

  private assertRate(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error('missing or invalid rate');
    }
    return value;
  }

  private reason(err: unknown): string {
    if (err instanceof AggregateError) return err.errors.map((e) => this.reason(e)).join(' | ');
    if (err instanceof Error) {
      return err.name === 'AbortError' || err.name === 'TimeoutError' ? 'timeout' : err.message;
    }
    return String(err);
  }
}