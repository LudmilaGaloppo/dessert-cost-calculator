import type { CostSettings } from '@dessert-cost/shared';
import { request } from './request';

/** Recupera la configuración general usada por los cálculos de producción. */
export async function getCostSettings(signal?: AbortSignal): Promise<CostSettings> {
  return (await request<{ settings: CostSettings }>('/api/settings/costs', { signal })).settings;
}

/** Valida en la API y persiste el valor general de una hora de trabajo. */
export async function saveHourlyRate(hourlyRate: number): Promise<CostSettings> {
  return (await request<{ settings: CostSettings }>('/api/settings/costs', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hourlyRate }),
  })).settings;
}

/** Guarda los promedios diarios usados por la estimación sencilla de energía. */
export async function saveEnergySettings(gasDailyAverage: number, electricityDailyAverage: number): Promise<CostSettings> {
  return (await request<{ settings: CostSettings }>('/api/settings/energy', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gasDailyAverage, electricityDailyAverage }),
  })).settings;
}
