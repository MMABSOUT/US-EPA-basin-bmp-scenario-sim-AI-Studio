import { BmpCostComponent, ParcelInput } from '../types/model';
import { SeededRng } from './distributions';

export const FT_TO_M = 0.3048;

export function getBmpNameByCps(cps: number): string {
  const map: Record<number, string> = {
    327: 'Land Retirement',
    329: 'Residue Management (No-Till)',
    340: 'Cover Crop',
    391: 'Riparian Forest Buffer',
    412: 'Grassed Waterway',
    590: 'Nutrient Management',
    605: 'Bioreactor',
    606: 'Subsurface Drain',
    656: 'Constructed Wetland',
  };
  return map[cps] || `CPS ${cps}`;
}

export function sampleBmpUnitCostUsdPerHa(
  cps: number,
  costComponents: BmpCostComponent[],
  rng: SeededRng
): number {
  const components = costComponents.filter((c) => c.cps === cps);
  if (components.length === 0) {
    // Default fallback unit costs based on NRCS FY25 data
    const fallbacks: Record<number, number> = {
      329: 33, // planting adjustment + transition
      340: 95, // seed + establishment + termination
      412: 7000, // earthwork + vegetation ($/ha of buffer)
      590: 38, // soil testing + planning + application
      656: 22000, // wetland earthwork + vegetation ($/ha of pool)
      327: 120,
      605: 5000,
    };
    return fallbacks[cps] || 50;
  }

  let totalUnitCost = 0;
  for (const comp of components) {
    const costSample = rng.sampleFromStats(comp.stats, 'positive');
    totalUnitCost += Math.max(0, costSample);
  }
  return totalUnitCost;
}

export interface BmpGeometryCostResult {
  cost_usd: number;
  treatment_fraction: number;
  buffer_area_ha?: number;
  linear_length_m?: number;
  wetland_area_ha?: number;
  catchment_to_wetland_ratio?: number;
}

export function calculateBmpCostAndGeometry(
  cps: number,
  parcel: ParcelInput,
  bufferDepthFt: number,
  costComponents: BmpCostComponent[],
  rng: SeededRng,
  deterministic = false
): BmpGeometryCostResult {
  const unitCostUsdPerHa = sampleBmpUnitCostUsdPerHa(cps, costComponents, rng);

  if (cps === 412) {
    // Grassed Waterway / Buffer
    // Perimeter fraction: min 0.1, max 0.3, mean 0.2
    const perimFraction = deterministic ? 0.2 : rng.uniform(0.1, 0.3);
    const linearLengthM = parcel.perim_m * perimFraction;
    const bufferDepthM = bufferDepthFt * FT_TO_M;
    const bufferAreaHa = (linearLengthM * bufferDepthM) / 10000.0;
    // Portion of parcel treated: min 0.2, max 0.4, mean 0.3
    const treatmentFraction = deterministic ? 0.3 : rng.uniform(0.2, 0.4);
    const costUsd = bufferAreaHa * unitCostUsdPerHa;

    return {
      cost_usd: Math.max(1, costUsd),
      treatment_fraction: Math.max(0, Math.min(1.0, treatmentFraction)),
      buffer_area_ha: bufferAreaHa,
      linear_length_m: linearLengthM,
    };
  }

  if (cps === 656) {
    // Constructed Wetland
    // Pool area: min 0.1, max 4.0, median 0.81 ha
    const poolAreaStats = { min: 0.1, p25: 0.4, p50: 0.81, p75: 2.0, max: 4.0 };
    let wetlandAreaHa = deterministic ? 0.81 : rng.piecewiseQuantileSample(poolAreaStats);
    // Wetland pool cannot exceed parcel area
    wetlandAreaHa = Math.min(wetlandAreaHa, parcel.area_ha);

    // Catchment ratio: min 1.0, median 5.0, max 100.0
    const ratioStats = { min: 1.0, p25: 2.0, p50: 5.0, p75: 10.0, max: 100.0 };
    const catchmentRatio = deterministic ? 5.0 : rng.piecewiseQuantileSample(ratioStats);

    const costUsd = wetlandAreaHa * unitCostUsdPerHa;
    const treatmentFraction = 1.0; // treats contributing drainage

    return {
      cost_usd: Math.max(10, costUsd),
      treatment_fraction: treatmentFraction,
      wetland_area_ha: wetlandAreaHa,
      catchment_to_wetland_ratio: catchmentRatio,
    };
  }

  // Infield practices (329 No-Till, 340 Cover Crop, 590 Nutrient Mgmt, 327 Land Retirement)
  // Treats 100% of the parcel
  const costUsd = parcel.area_ha * unitCostUsdPerHa;
  return {
    cost_usd: Math.max(1, costUsd),
    treatment_fraction: 1.0,
  };
}

export function computeCostWeightedProbabilities(
  cpsCodes: number[],
  avgParcelAreaHa: number,
  avgPerimM: number,
  bufferDepthFt: number,
  costComponents: BmpCostComponent[]
): number[] {
  const dummyRng = new SeededRng(42);
  const costs: number[] = [];

  for (const cps of cpsCodes) {
    const dummyParcel: ParcelInput = {
      pid: 'avg',
      area_ha: avgParcelAreaHa,
      perim_m: avgPerimM,
    };
    const geom = calculateBmpCostAndGeometry(cps, dummyParcel, bufferDepthFt, costComponents, dummyRng, true);
    costs.push(Math.max(0.01, geom.cost_usd));
  }

  // Inverse cost weights
  const inv = costs.map((c) => 1.0 / c);
  const sumInv = inv.reduce((a, b) => a + b, 0);
  return inv.map((v) => v / sumInv);
}
