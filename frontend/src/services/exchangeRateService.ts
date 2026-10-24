import { api } from "../lib/axios";

export interface ExchangeRateResponse {
  from: string;
  to: string;
  rate: number;
  source: "frankfurter" | "exchangerate-api" | null;
  stale: boolean;
}

export const exchangeRateService = {
  getRate: (from: string, to: string) =>
    api.get<ExchangeRateResponse>("/exchange-rate", { params: { from, to } }),
};