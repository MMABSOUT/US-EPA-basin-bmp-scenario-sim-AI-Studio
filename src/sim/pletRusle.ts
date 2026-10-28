import { ClimateForcing, ParcelInput, Pollutant } from '../types/model';
import { SeededRng } from './distributions';

export const INCH_OVER_HA_TO_LITERS = 254_000.0;
export const TON_PER_ACRE_TO_KG_PER_HA = 907.18474 / 0.40468564224; // ~2241.70

// Standard PLET reference lookup table for (land_cover, hsg) -> (CN, infiltration_fraction)
export const DEFAULT_PLET_HYDROLOGY_LOOKUP: Record<string, Record<'A' | 'B' | 'C' | 'D', { cn: number; infiltration_fraction: number }>> = {
  urban: {
    A: { cn: 83, infiltration_fraction: 0.36 },
    B: { cn: 89, infiltration_fraction: 0.24 },
    C: { cn: 92, infiltration_fraction: 0.12 },
    D: { cn: 93, infiltration_fraction: 0.06 },
  },
  cropland: {
    A: { cn: 67, infiltration_fraction: 0.45 },
    B: { cn: 78, infiltration_fraction: 0.30 },
    C: { cn: 85, infiltration_fraction: 0.15 },
    D: { cn: 89, infiltration_fraction: 0.075 },
  },
  pastureland: {
    A: { cn: 49, infiltration_fraction: 0.45 },
    B: { cn: 69, infiltration_fraction: 0.30 },
    C: { cn: 79, infiltration_fraction: 0.15 },
    D: { cn: 84, infiltration_fraction: 0.075 },
  },
  forest: {
    A: { cn: 36, infiltration_fraction: 0.45 },
    B: { cn: 60, infiltration_fraction: 0.30 },
    C: { cn: 73, infiltration_fraction: 0.15 },
    D: { cn: 79, infiltration_fraction: 0.075 },
  },
  user_defined: {
    A: { cn: 70, infiltration_fraction: 0.35 },
    B: { cn: 80, infiltration_fraction: 0.25 },
    C: { cn: 85, infiltration_fraction: 0.15 },
    D: { cn: 90, infiltration_fraction: 0.08 },
  },
};

export interface PletHydrologyDiagnostics {
  event_rainfall_in: number;
  event_runoff_in: number;
  annual_storm_runoff_in: number;
  annual_runoff_in: number;
  annual_infiltration_in: number;
  sediment_load_rate_kg_ha_yr: number;
  runoff_volume_l_ha: number;
  infiltration_volume_l_ha: number;
}

export function calculatePletRunoffInches(
  forcing: ClimateForcing,
  cn: number,
  iaRatio = 0.0
): {
  event_rainfall: number;
  event_runoff: number;
  annual_storm_runoff: number;
  annual_total_runoff: number;
} {
  const runoffDays = (forcing.rain_days || 150) * (forcing.runoff_day_fraction || 0.42);

  let eventRainfall: number;
  if (forcing.avg_rain_in !== undefined && forcing.avg_rain_in > 0) {
    eventRainfall = forcing.avg_rain_in;
  } else if (forcing.annual_precip_in && forcing.rain_correction_fraction && runoffDays > 0) {
    eventRainfall = (forcing.annual_precip_in * forcing.rain_correction_fraction) / runoffDays;
  } else {
    eventRainfall = 0.6; // default 0.6 in
  }

  if (runoffDays <= 0 || cn <= 0) {
    return {
      event_rainfall: eventRainfall,
      event_runoff: 0,
      annual_storm_runoff: 0,
      annual_total_runoff: 0,
    };
  }

  const retention = Math.max(0, 1000.0 / cn - 10.0);
  const initialAbstraction = iaRatio * retention;

  let eventRunoff = 0;
  if (eventRainfall > initialAbstraction) {
    const numerator = Math.pow(eventRainfall - initialAbstraction, 2);
    const denominator = eventRainfall - initialAbstraction + retention;
    eventRunoff = denominator > 0 ? numerator / denominator : 0;
  }

  const annualStormRunoff = eventRunoff * runoffDays;
  const runoffMultiplier = forcing.runoff_multiplier ?? 1.0;
  const annualTotalRunoff = annualStormRunoff * runoffMultiplier;

  return {
    event_rainfall: eventRainfall,
    event_runoff: eventRunoff,
    annual_storm_runoff: annualStormRunoff,
    annual_total_runoff: annualTotalRunoff,
  };
}

export function calculatePletInfiltrationInches(
  forcing: ClimateForcing,
  infiltrationFraction: number
): number {
  let correctedAnnualPrecip: number;
  const runoffDays = (forcing.rain_days || 150) * (forcing.runoff_day_fraction || 0.42);

  if (forcing.avg_rain_in !== undefined && forcing.avg_rain_in > 0) {
    correctedAnnualPrecip = forcing.avg_rain_in * runoffDays;
  } else if (forcing.annual_precip_in && forcing.rain_correction_fraction) {
    correctedAnnualPrecip = forcing.annual_precip_in * forcing.rain_correction_fraction;
  } else {
    correctedAnnualPrecip = 0.6 * runoffDays;
  }

  const gwMultiplier = forcing.groundwater_multiplier ?? 1.0;
  return correctedAnnualPrecip * infiltrationFraction * gwMultiplier;
}

export function calculateRusleSedimentKgHaYr(parcel: ParcelInput): number {
  const rusle = parcel.rusle;
  if (!rusle || rusle.r === undefined || rusle.k === undefined || rusle.ls === undefined || rusle.c === undefined || rusle.p === undefined) {
    return 0;
  }
  const grossTonAc = (rusle.r ?? 175) * (rusle.k ?? 0.32) * (rusle.ls ?? 1.8) * (rusle.c ?? 0.22) * (rusle.p ?? 0.7);
  const sdr = rusle.sdr ?? 1.0;
  return grossTonAc * sdr * TON_PER_ACRE_TO_KG_PER_HA;
}

export function calculateParcelPletPathwayLoads(
  parcel: ParcelInput,
  forcing: ClimateForcing,
  pollutants: Pollutant[]
): {
  surface_areal_kg_ha: Record<Pollutant, number>;
  subsurface_areal_kg_ha: Record<Pollutant, number>;
  diagnostics: PletHydrologyDiagnostics;
} {
  const lc = (parcel.land_cover?.toLowerCase() || 'cropland') as keyof typeof DEFAULT_PLET_HYDROLOGY_LOOKUP;
  const hsg = parcel.hsg || 'B';
  const lookup = DEFAULT_PLET_HYDROLOGY_LOOKUP[lc]?.[hsg] || DEFAULT_PLET_HYDROLOGY_LOOKUP.cropland.B;

  const cn = parcel.curve_number ?? lookup.cn;
  const infFrac = parcel.infiltration_fraction ?? lookup.infiltration_fraction;

  const runoff = calculatePletRunoffInches(forcing, cn, forcing.ia_ratio ?? 0.0);
  const infiltrationIn = calculatePletInfiltrationInches(forcing, infFrac);

  const runoffLHa = runoff.annual_total_runoff * INCH_OVER_HA_TO_LITERS;
  const infiltrationLHa = infiltrationIn * INCH_OVER_HA_TO_LITERS;

  const sedimentKgHa = calculateRusleSedimentKgHaYr(parcel);
  const enrichmentRatio = parcel.rusle?.enrichment_ratio ?? 1.0;
  const hasRusle = sedimentKgHa > 0;

  const surfaceLoads: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };
  const subsurfaceLoads: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };

  const surfaceConc = parcel.surface_concentrations || {};
  const subsurfaceConc = parcel.subsurface_concentrations || {};

  for (const pol of pollutants) {
    let runoffAreal = 0;
    if (pol !== 'TSS' || !hasRusle) {
      const conc = surfaceConc[pol] ?? (pol === 'TN' ? 4.4 : pol === 'TP' ? 0.35 : 120.0); // mg/L
      runoffAreal = (conc * runoffLHa) / 1_000_000.0; // kg/ha
    }

    let subsurfaceAreal = 0;
    if (pol !== 'TSS') {
      const gwConc = subsurfaceConc[pol] ?? (pol === 'TN' ? 5.5 : pol === 'TP' ? 0.08 : 0); // mg/L
      subsurfaceAreal = (gwConc * infiltrationLHa) / 1_000_000.0; // kg/ha
    }

    if (pol === 'TSS') {
      surfaceLoads[pol] = hasRusle ? sedimentKgHa : runoffAreal;
      subsurfaceLoads[pol] = 0;
    } else if (pol === 'TN') {
      const sedFraction = (parcel.rusle?.sediment_n_pct ?? 0.15) / 100.0;
      surfaceLoads[pol] = runoffAreal + sedimentKgHa * sedFraction * enrichmentRatio;
      subsurfaceLoads[pol] = subsurfaceAreal;
    } else if (pol === 'TP') {
      const sedFraction = (parcel.rusle?.sediment_p_pct ?? 0.05) / 100.0;
      surfaceLoads[pol] = runoffAreal + sedimentKgHa * sedFraction * enrichmentRatio;
      subsurfaceLoads[pol] = subsurfaceAreal;
    }
  }

  const diagnostics: PletHydrologyDiagnostics = {
    event_rainfall_in: runoff.event_rainfall,
    event_runoff_in: runoff.event_runoff,
    annual_storm_runoff_in: runoff.annual_storm_runoff,
    annual_runoff_in: runoff.annual_total_runoff,
    annual_infiltration_in: infiltrationIn,
    sediment_load_rate_kg_ha_yr: sedimentKgHa,
    runoff_volume_l_ha: runoffLHa,
    infiltration_volume_l_ha: infiltrationLHa,
  };

  return {
    surface_areal_kg_ha: surfaceLoads,
    subsurface_areal_kg_ha: subsurfaceLoads,
    diagnostics,
  };
}
