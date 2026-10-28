/**
 * Core type definitions for Basin BMP Scenario Simulator
 */

export type Pollutant = 'TN' | 'TP' | 'TSS';
export type LoadMode = 'statistical' | 'plet_rusle';

export type PathwayName = 'surface' | 'subsurface' | 'shallow subsurface' | 'deep subsurface';

export interface DistributionStats {
  value?: number;
  mean?: number;
  sd?: number;
  min?: number;
  max?: number;
  p05?: number;
  p10?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p90?: number;
  p95?: number;
  sample_group?: string;
  units?: string;
  notes?: string;
}

export interface ParcelInput {
  pid: string | number;
  area_ha: number;
  perim_m: number;
  selection_weight?: number; // relative weight or probability
  land_cover?: string; // 'cropland', 'urban', 'pastureland', 'forest'
  hsg?: 'A' | 'B' | 'C' | 'D'; // Hydrologic Soil Group
  upstream_pids?: (string | number)[];
  outlet_ids?: string[];
  // For statistical mode
  baseline_load_rates?: Record<Pollutant, DistributionStats | number>;
  // For PLET mode overrides
  curve_number?: number;
  infiltration_fraction?: number;
  surface_concentrations?: Partial<Record<Pollutant, number>>;
  subsurface_concentrations?: Partial<Record<Pollutant, number>>;
  rusle?: {
    r?: number;
    k?: number;
    ls?: number;
    c?: number;
    p?: number;
    sdr?: number;
    sediment_n_pct?: number;
    sediment_p_pct?: number;
    enrichment_ratio?: number;
  };
  delivery_ratios?: {
    sdr_f_to_s?: number;
    sdr_s_to_o?: number;
    ndr_f_to_s?: number;
    ndr_s_to_o?: number;
  };
}

export interface OutletTarget {
  oid: string;
  name?: string;
  description?: string;
  targets: Partial<Record<Pollutant, number>>; // kg/yr
  baseline_means?: Partial<Record<Pollutant, number>>; // kg/yr
}

export interface BmpEfficiencyRecord {
  cps: number;
  name: string;
  pollutant: Pollutant;
  pathway: string;
  stats: DistributionStats;
  notes?: string;
}

export interface BmpCostComponent {
  cps: number;
  cps_name: string;
  cost_component: string;
  unit: string; // 'USD/ha', 'USD/m', etc.
  stats: DistributionStats;
  notes?: string;
}

export interface PletHydrologyRow {
  land_cover: string;
  hsg: 'A' | 'B' | 'C' | 'D';
  cn: number;
  infiltration_fraction: number;
}

export interface ClimateForcing {
  avg_rain_in?: number;
  annual_precip_in?: number;
  rain_days: number;
  rain_correction_fraction?: number;
  runoff_day_fraction: number;
  ia_ratio?: number;
  sediment_multiplier?: number;
  sediment_delivery_multiplier?: number;
  runoff_multiplier?: number;
  groundwater_multiplier?: number;
}

export interface SimulationConfig {
  load_generation: {
    mode: LoadMode;
  };
  pollutants: Pollutant[];
  cps: number[];
  n_scenarios: number;
  bmp_limit_n: number;
  bmp_limit_usd?: number;
  buffer_depth_ft: number;
  bmp_fail_rate: number;
  bmp_fail_reduction: number;
  bmp_sel_prob_via_costs: boolean;
  deterministic_parcel_order: boolean;
  deterministic_bmp_type_order: boolean;
  deterministic_bmp_design_parameters: boolean;
  random_seed: number;
  // Pathway splitting for statistical mode
  pollutant_load_rate_pathway_fractions?: Record<string, number>;
}

export interface BmpPlacementRecord {
  scenario: number;
  step: number;
  pid: string | number;
  cps: number;
  bmp_name: string;
  failed: boolean;
  cost_usd: number;
  total_cost_usd: number;
  treatment_fraction: number;
  buffer_area_ha?: number;
  linear_length_m?: number;
  wetland_area_ha?: number;
  catchment_to_wetland_ratio?: number;
  impacted_pids?: (string | number)[];
  efficiencies: Record<Pollutant, Record<string, number>>;
  treated_mass_kg: Record<Pollutant, number>;
  removed_mass_kg: Record<Pollutant, number>;
}

export interface TrajectoryPoint {
  step: number;
  bmp_count: number;
  cost_usd: number;
  total_load: Record<Pollutant, number>;
  percent_reduction: Record<Pollutant, number>;
  attained: Record<Pollutant, boolean>;
}

export interface ScenarioMetricRow {
  scenario: number;
  total_cost_usd: number;
  bmp_count: number;
  failed_count: number;
  baseline_mass_kg: Record<Pollutant, number>;
  treated_baseline_mass_kg: Record<Pollutant, number>;
  removed_mass_kg: Record<Pollutant, number>;
  treatment_exposure_fraction: Record<Pollutant, number>;
  realized_efficiency: Record<Pollutant, number>;
  overall_reduction_fraction: Record<Pollutant, number>;
  final_outlet_load_kg: Record<string, Record<Pollutant, number>>;
  attained: Record<string, Record<Pollutant, boolean>>;
}

export interface DescriptiveStats {
  count: number;
  mean: number;
  std: number;
  min: number;
  p25: number;
  p50: number;
  p75: number;
  max: number;
}

export interface SimulationResult {
  config: SimulationConfig;
  parcels: ParcelInput[];
  outlets: OutletTarget[];
  scenarios: ScenarioMetricRow[];
  trajectoriesByScenario: Record<number, TrajectoryPoint[]>;
  allPlacements: BmpPlacementRecord[];
  summaryByPollutant: Record<Pollutant, {
    baseline_mass: DescriptiveStats;
    removed_mass: DescriptiveStats;
    realized_efficiency: DescriptiveStats;
    overall_reduction: DescriptiveStats;
  }>;
  costSummary: DescriptiveStats;
  bmpCountSummary: DescriptiveStats;
  attainmentProbabilities: Record<string, Record<Pollutant, number>>; // oid -> pollutant -> probability (0-1)
  executionTimeMs: number;
}
