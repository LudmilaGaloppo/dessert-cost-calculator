import type { Unit } from '@dessert-cost/shared';

export const UNITS = ['g', 'kg', 'ml', 'l', 'unit'] as const;
export const UNIT_DIMENSIONS: Record<Unit, string> = { g: 'mass', kg: 'mass', ml: 'volume', l: 'volume', unit: 'count' };
