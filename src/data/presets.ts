import {
  BmpCostComponent,
  BmpEfficiencyRecord,
  ClimateForcing,
  OutletTarget,
  ParcelInput,
  SimulationConfig,
} from '../types/model';

// Real NRCS Ohio Cost Components from examples/east_fork/inputs/bmps/bmp_cost_deterministic.csv
export const DEFAULT_BMP_COSTS_DETERMINISTIC: BmpCostComponent[] = [
  { cps: 340, cps_name: 'Cover Crops', cost_component: 'seed', unit: 'USD/ha', stats: { value: 40 }, notes: 'Cereal rye representative' },
  { cps: 340, cps_name: 'Cover Crops', cost_component: 'establishment', unit: 'USD/ha', stats: { value: 25 }, notes: 'Fall establishment drill/broadcast' },
  { cps: 340, cps_name: 'Cover Crops', cost_component: 'termination', unit: 'USD/ha', stats: { value: 30 }, notes: 'Spring chemical/mechanical termination' },
  { cps: 329, cps_name: 'Residue Management (No-Till)', cost_component: 'planting_equipment_adjustment', unit: 'USD/ha', stats: { value: 25 } },
  { cps: 329, cps_name: 'Residue Management (No-Till)', cost_component: 'management_transition', unit: 'USD/ha', stats: { value: 8 } },
  { cps: 590, cps_name: 'Nutrient Management', cost_component: 'soil_testing_analysis', unit: 'USD/ha', stats: { value: 3 } },
  { cps: 590, cps_name: 'Nutrient Management', cost_component: 'planning_recordkeeping', unit: 'USD/ha', stats: { value: 20 } },
  { cps: 590, cps_name: 'Nutrient Management', cost_component: 'application_management', unit: 'USD/ha', stats: { value: 15 } },
  { cps: 412, cps_name: 'Grassed Waterway', cost_component: 'earthwork_grading', unit: 'USD/ha', stats: { value: 6000 } },
  { cps: 412, cps_name: 'Grassed Waterway', cost_component: 'vegetation_establishment', unit: 'USD/ha', stats: { value: 1000 } },
  { cps: 656, cps_name: 'Constructed Wetland', cost_component: 'earthwork', unit: 'USD/ha', stats: { value: 14000 } },
  { cps: 656, cps_name: 'Constructed Wetland', cost_component: 'wetland_vegetation', unit: 'USD/ha', stats: { value: 8000 } },
];

export const DEFAULT_BMP_COSTS_STOCHASTIC: BmpCostComponent[] = [
  { cps: 340, cps_name: 'Cover Crops', cost_component: 'seed', unit: 'USD/ha', stats: { min: 35, p05: 40, p50: 52, p95: 72, max: 85 } },
  { cps: 340, cps_name: 'Cover Crops', cost_component: 'establishment', unit: 'USD/ha', stats: { min: 12, p05: 25, p50: 48, p95: 80, max: 100 } },
  { cps: 340, cps_name: 'Cover Crops', cost_component: 'termination', unit: 'USD/ha', stats: { min: 20, p05: 30, p50: 55, p95: 90, max: 120 } },
  { cps: 329, cps_name: 'Residue Management (No-Till)', cost_component: 'planting_equipment_adjustment', unit: 'USD/ha', stats: { min: 20, p05: 25, p50: 40, p95: 70, max: 90 } },
  { cps: 329, cps_name: 'Residue Management (No-Till)', cost_component: 'management_transition', unit: 'USD/ha', stats: { min: 5, p05: 8, p50: 17, p95: 35, max: 50 } },
  { cps: 590, cps_name: 'Nutrient Management', cost_component: 'soil_testing_analysis', unit: 'USD/ha', stats: { min: 2, p05: 3, p50: 8, p95: 20, max: 30 } },
  { cps: 590, cps_name: 'Nutrient Management', cost_component: 'planning_recordkeeping', unit: 'USD/ha', stats: { min: 15, p05: 20, p50: 30, p95: 50, max: 70 } },
  { cps: 590, cps_name: 'Nutrient Management', cost_component: 'application_management', unit: 'USD/ha', stats: { min: 10, p05: 15, p50: 40, p95: 75, max: 100 } },
  { cps: 412, cps_name: 'Grassed Waterway', cost_component: 'earthwork_grading', unit: 'USD/ha', stats: { min: 5000, p05: 6000, p50: 8000, p95: 14000, max: 18000 } },
  { cps: 412, cps_name: 'Grassed Waterway', cost_component: 'vegetation_establishment', unit: 'USD/ha', stats: { min: 800, p05: 1000, p50: 1800, p95: 3500, max: 4500 } },
  { cps: 656, cps_name: 'Constructed Wetland', cost_component: 'earthwork', unit: 'USD/ha', stats: { min: 12000, p05: 14000, p50: 16400, p95: 24000, max: 30000 } },
  { cps: 656, cps_name: 'Constructed Wetland', cost_component: 'wetland_vegetation', unit: 'USD/ha', stats: { min: 6000, p05: 8000, p50: 12500, p95: 21000, max: 26000 } },
];

// PLET Efficiencies from examples/east_fork/inputs/bmps/bmp_efficiency_plet_deterministic.csv
export const PLET_EFFICIENCIES_DETERMINISTIC: BmpEfficiencyRecord[] = [
  { cps: 340, name: 'Cover Crop', pollutant: 'TN', pathway: 'surface', stats: { value: 0.20 }, notes: 'CBP 2015' },
  { cps: 340, name: 'Cover Crop', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TP', pathway: 'surface', stats: { value: 0.07 }, notes: 'CBP 2015' },
  { cps: 340, name: 'Cover Crop', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.10 }, notes: 'CBP 2015' },
  { cps: 340, name: 'Cover Crop', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },

  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TN', pathway: 'surface', stats: { value: 0.13 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TP', pathway: 'surface', stats: { value: 0.69 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.79 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },

  { cps: 590, name: 'Nutrient Management', pollutant: 'TN', pathway: 'surface', stats: { value: 0.22 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TP', pathway: 'surface', stats: { value: 0.56 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.00 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },

  { cps: 412, name: 'Grassed Waterway (Buffer 35ft)', pollutant: 'TN', pathway: 'surface', stats: { value: 0.34 }, notes: 'USEPA 2010' },
  { cps: 412, name: 'Grassed Waterway (Buffer 35ft)', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 412, name: 'Grassed Waterway (Buffer 35ft)', pollutant: 'TP', pathway: 'surface', stats: { value: 0.44 }, notes: 'USEPA 2010' },
  { cps: 412, name: 'Grassed Waterway (Buffer 35ft)', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 412, name: 'Grassed Waterway (Buffer 35ft)', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.53 }, notes: 'USEPA 2010' },
  { cps: 412, name: 'Grassed Waterway (Buffer 35ft)', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },

  { cps: 656, name: 'Constructed Wetland', pollutant: 'TN', pathway: 'surface', stats: { value: 0.45 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TP', pathway: 'surface', stats: { value: 0.50 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.75 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },
];

export const PLET_EFFICIENCIES_STOCHASTIC: BmpEfficiencyRecord[] = [
  { cps: 340, name: 'Cover Crop', pollutant: 'TN', pathway: 'surface', stats: { min: 0.15, mean: 0.20, max: 0.28 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TP', pathway: 'surface', stats: { min: 0.05, mean: 0.07, max: 0.12 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TSS', pathway: 'surface', stats: { min: 0.08, mean: 0.10, max: 0.15 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },

  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TN', pathway: 'surface', stats: { min: 0.10, mean: 0.13, max: 0.18 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TP', pathway: 'surface', stats: { min: 0.40, mean: 0.69, max: 0.85 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TSS', pathway: 'surface', stats: { min: 0.65, mean: 0.79, max: 0.90 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },

  { cps: 590, name: 'Nutrient Management', pollutant: 'TN', pathway: 'surface', stats: { min: 0.15, mean: 0.22, max: 0.30 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TP', pathway: 'surface', stats: { min: 0.35, mean: 0.56, max: 0.70 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.00 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },

  { cps: 412, name: 'Grassed Waterway', pollutant: 'TN', pathway: 'surface', stats: { min: 0.20, mean: 0.34, max: 0.46 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TP', pathway: 'surface', stats: { min: 0.30, mean: 0.44, max: 0.55 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TSS', pathway: 'surface', stats: { min: 0.40, mean: 0.53, max: 0.68 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },

  { cps: 656, name: 'Constructed Wetland', pollutant: 'TN', pathway: 'surface', stats: { min: 0.30, mean: 0.45, max: 0.60 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TN', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TP', pathway: 'surface', stats: { min: 0.35, mean: 0.50, max: 0.65 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TP', pathway: 'subsurface', stats: { value: 0.00 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TSS', pathway: 'surface', stats: { min: 0.55, mean: 0.75, max: 0.88 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TSS', pathway: 'subsurface', stats: { value: 0.00 } },
];

// Statistical Literature Efficiencies (3 pathways)
export const LIT_EFFICIENCIES_DETERMINISTIC: BmpEfficiencyRecord[] = [
  { cps: 340, name: 'Cover Crop', pollutant: 'TN', pathway: 'surface', stats: { value: 0.35 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TN', pathway: 'shallow subsurface', stats: { value: 0.45 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TN', pathway: 'deep subsurface', stats: { value: 0.25 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TP', pathway: 'surface', stats: { value: 0.40 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TP', pathway: 'shallow subsurface', stats: { value: 0.10 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TP', pathway: 'deep subsurface', stats: { value: 0.05 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.60 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TSS', pathway: 'shallow subsurface', stats: { value: 0.15 } },
  { cps: 340, name: 'Cover Crop', pollutant: 'TSS', pathway: 'deep subsurface', stats: { value: 0.00 } },

  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TN', pathway: 'surface', stats: { value: 0.15 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TN', pathway: 'shallow subsurface', stats: { value: 0.05 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TN', pathway: 'deep subsurface', stats: { value: 0.05 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TP', pathway: 'surface', stats: { value: 0.50 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TP', pathway: 'shallow subsurface', stats: { value: -0.05 }, notes: 'Signed effect: can release dissolved P' },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TP', pathway: 'deep subsurface', stats: { value: 0.02 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.70 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TSS', pathway: 'shallow subsurface', stats: { value: 0.05 } },
  { cps: 329, name: 'Residue Management (No-Till)', pollutant: 'TSS', pathway: 'deep subsurface', stats: { value: 0.00 } },

  { cps: 590, name: 'Nutrient Management', pollutant: 'TN', pathway: 'surface', stats: { value: 0.30 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TN', pathway: 'shallow subsurface', stats: { value: 0.40 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TN', pathway: 'deep subsurface', stats: { value: 0.35 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TP', pathway: 'surface', stats: { value: 0.40 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TP', pathway: 'shallow subsurface', stats: { value: 0.25 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TP', pathway: 'deep subsurface', stats: { value: 0.15 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.05 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TSS', pathway: 'shallow subsurface', stats: { value: 0.00 } },
  { cps: 590, name: 'Nutrient Management', pollutant: 'TSS', pathway: 'deep subsurface', stats: { value: 0.00 } },

  { cps: 412, name: 'Grassed Waterway', pollutant: 'TN', pathway: 'surface', stats: { value: 0.20 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TN', pathway: 'shallow subsurface', stats: { value: 0.05 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TN', pathway: 'deep subsurface', stats: { value: 0.00 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TP', pathway: 'surface', stats: { value: 0.35 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TP', pathway: 'shallow subsurface', stats: { value: 0.10 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TP', pathway: 'deep subsurface', stats: { value: 0.02 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.65 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TSS', pathway: 'shallow subsurface', stats: { value: 0.15 } },
  { cps: 412, name: 'Grassed Waterway', pollutant: 'TSS', pathway: 'deep subsurface', stats: { value: 0.00 } },

  { cps: 656, name: 'Constructed Wetland', pollutant: 'TN', pathway: 'surface', stats: { value: 0.45 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TN', pathway: 'shallow subsurface', stats: { value: 0.30 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TN', pathway: 'deep subsurface', stats: { value: 0.15 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TP', pathway: 'surface', stats: { value: 0.50 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TP', pathway: 'shallow subsurface', stats: { value: 0.25 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TP', pathway: 'deep subsurface', stats: { value: 0.10 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TSS', pathway: 'surface', stats: { value: 0.75 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TSS', pathway: 'shallow subsurface', stats: { value: 0.40 } },
  { cps: 656, name: 'Constructed Wetland', pollutant: 'TSS', pathway: 'deep subsurface', stats: { value: 0.00 } },
];

export const EAST_FORK_OUTLETS: OutletTarget[] = [
  {
    oid: '1',
    name: 'Lower East Fork Watershed (Confluence Outlet)',
    description: 'Mouth of the East Fork Little Miami River at the Little Miami River confluence near Milford, OH',
    targets: {
      TN: 271764, // kg/yr
      TP: 55076,  // kg/yr
      TSS: 1800000,
    },
    baseline_means: {
      TN: 489542, // kg/yr
      TP: 79303,  // kg/yr
      TSS: 3500000,
    },
  },
];

export const EAST_FORK_CLIMATE_FORCING: ClimateForcing = {
  avg_rain_in: 0.598,
  annual_precip_in: 41.5,
  rain_days: 153.6,
  rain_correction_fraction: 0.85,
  runoff_day_fraction: 0.422,
  ia_ratio: 0.0,
  sediment_multiplier: 1.0,
  sediment_delivery_multiplier: 1.0,
  runoff_multiplier: 1.0,
  groundwater_multiplier: 1.0,
};

// Generates representative agricultural parcels for East Fork watershed
export function generateEastForkParcels(count = 120, seed = 42): ParcelInput[] {
  const parcels: ParcelInput[] = [];
  const lcs = ['cropland', 'cropland', 'cropland', 'cropland', 'pastureland', 'urban', 'forest'];
  const hsgs: ('A' | 'B' | 'C' | 'D')[] = ['B', 'B', 'C', 'C', 'B', 'D'];

  for (let i = 1; i <= count; i++) {
    // Deterministic pseudo-random variation based on parcel index
    const area = 15.0 + ((i * 17) % 65) + ((i * 3) % 11) * 0.4; // 15 to 85 ha
    const perim = Math.sqrt(area * 10000) * 4.2; // ~1500 - 3500 m

    const lc = lcs[i % lcs.length];
    const hsg = hsgs[i % hsgs.length];

    const upList: (string | number)[] = [];
    if (i > 3 && i % 3 === 0) upList.push(i - 1);
    if (i > 5 && i % 4 === 0) upList.push(i - 2);

    parcels.push({
      pid: i,
      area_ha: parseFloat(area.toFixed(2)),
      perim_m: parseFloat(perim.toFixed(1)),
      selection_weight: 1.0,
      land_cover: lc,
      hsg,
      upstream_pids: upList,
      outlet_ids: ['1'],
      rusle: {
        r: 175.0,
        k: 0.32,
        ls: 1.8,
        c: lc === 'cropland' ? 0.22 : lc === 'pastureland' ? 0.04 : 0.005,
        p: 0.70,
        sdr: 0.85,
        sediment_n_pct: 0.15,
        sediment_p_pct: 0.05,
        enrichment_ratio: 1.2,
      },
      surface_concentrations: {
        TN: 4.4,
        TP: 0.35,
        TSS: 120.0,
      },
      subsurface_concentrations: {
        TN: 5.5,
        TP: 0.08,
      },
      baseline_load_rates: {
        TN: { value: 25.0, units: 'kg/ha/year' },
        TP: { value: 1.3, units: 'kg/ha/year' },
        TSS: { value: 250.0, units: 'kg/ha/year' },
      },
      delivery_ratios: {
        sdr_f_to_s: 0.90,
        sdr_s_to_o: 0.95,
        ndr_f_to_s: 0.92,
        ndr_s_to_o: 0.96,
      },
    });
  }
  return parcels;
}

export interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  config: SimulationConfig;
  parcels: ParcelInput[];
  outlets: OutletTarget[];
  efficiencies: BmpEfficiencyRecord[];
  costComponents: BmpCostComponent[];
  climateForcing: ClimateForcing;
}

export const PRESETS: Record<string, PresetDefinition> = {
  east_fork_plet_deterministic: {
    id: 'east_fork_plet_deterministic',
    name: 'East Fork PLET (Deterministic)',
    description: 'PLET/RUSLE hydrological mode with deterministic parameters, 10 scenarios, 500 BMP limit',
    config: {
      load_generation: { mode: 'plet_rusle' },
      pollutants: ['TN', 'TP', 'TSS'],
      cps: [340, 329, 590, 412, 656],
      n_scenarios: 10,
      bmp_limit_n: 150,
      buffer_depth_ft: 35,
      bmp_fail_rate: 0.0,
      bmp_fail_reduction: 0.0,
      bmp_sel_prob_via_costs: false,
      deterministic_parcel_order: true,
      deterministic_bmp_type_order: true,
      deterministic_bmp_design_parameters: true,
      random_seed: 42,
    },
    parcels: generateEastForkParcels(80, 42),
    outlets: EAST_FORK_OUTLETS,
    efficiencies: PLET_EFFICIENCIES_DETERMINISTIC,
    costComponents: DEFAULT_BMP_COSTS_DETERMINISTIC,
    climateForcing: EAST_FORK_CLIMATE_FORCING,
  },
  east_fork_plet_stochastic: {
    id: 'east_fork_plet_stochastic',
    name: 'East Fork PLET (Stochastic)',
    description: 'PLET/RUSLE mode with full Monte Carlo uncertainty on BMP performance, costing, and random parcel/practice selection',
    config: {
      load_generation: { mode: 'plet_rusle' },
      pollutants: ['TN', 'TP', 'TSS'],
      cps: [340, 329, 590, 412, 656],
      n_scenarios: 25,
      bmp_limit_n: 200,
      bmp_limit_usd: 500000,
      buffer_depth_ft: 35,
      bmp_fail_rate: 0.08,
      bmp_fail_reduction: 0.50,
      bmp_sel_prob_via_costs: true,
      deterministic_parcel_order: false,
      deterministic_bmp_type_order: false,
      deterministic_bmp_design_parameters: false,
      random_seed: 101,
    },
    parcels: generateEastForkParcels(80, 101),
    outlets: EAST_FORK_OUTLETS,
    efficiencies: PLET_EFFICIENCIES_STOCHASTIC,
    costComponents: DEFAULT_BMP_COSTS_STOCHASTIC,
    climateForcing: EAST_FORK_CLIMATE_FORCING,
  },
  east_fork_lit_deterministic: {
    id: 'east_fork_lit_deterministic',
    name: 'East Fork Statistical Mode (Deterministic)',
    description: 'Literature statistical mode with 3 pathways (surface 30%, shallow subsurface 40%, deep subsurface 30%)',
    config: {
      load_generation: { mode: 'statistical' },
      pollutants: ['TN', 'TP', 'TSS'],
      cps: [340, 329, 590, 412, 656],
      n_scenarios: 10,
      bmp_limit_n: 150,
      buffer_depth_ft: 35,
      bmp_fail_rate: 0.0,
      bmp_fail_reduction: 0.0,
      bmp_sel_prob_via_costs: false,
      deterministic_parcel_order: true,
      deterministic_bmp_type_order: true,
      deterministic_bmp_design_parameters: true,
      random_seed: 42,
      pollutant_load_rate_pathway_fractions: {
        surface: 0.30,
        'shallow subsurface': 0.40,
        'deep subsurface': 0.30,
      },
    },
    parcels: generateEastForkParcels(80, 42),
    outlets: EAST_FORK_OUTLETS,
    efficiencies: LIT_EFFICIENCIES_DETERMINISTIC,
    costComponents: DEFAULT_BMP_COSTS_DETERMINISTIC,
    climateForcing: EAST_FORK_CLIMATE_FORCING,
  },
  synthetic_fast: {
    id: 'synthetic_fast',
    name: 'Synthetic Quick Test Basin',
    description: 'Small 6-parcel test basin with 2 outlets for rapid interactive exploration and testing',
    config: {
      load_generation: { mode: 'plet_rusle' },
      pollutants: ['TN', 'TP'],
      cps: [340, 329, 412],
      n_scenarios: 5,
      bmp_limit_n: 20,
      buffer_depth_ft: 35,
      bmp_fail_rate: 0.05,
      bmp_fail_reduction: 0.5,
      bmp_sel_prob_via_costs: false,
      deterministic_parcel_order: false,
      deterministic_bmp_type_order: false,
      deterministic_bmp_design_parameters: false,
      random_seed: 202501,
    },
    parcels: [
      { pid: 'P1', area_ha: 25.0, perim_m: 2000, land_cover: 'cropland', hsg: 'B', outlet_ids: ['O1'], upstream_pids: [] },
      { pid: 'P2', area_ha: 35.0, perim_m: 2400, land_cover: 'cropland', hsg: 'C', outlet_ids: ['O1'], upstream_pids: ['P1'] },
      { pid: 'P3', area_ha: 18.0, perim_m: 1700, land_cover: 'pastureland', hsg: 'B', outlet_ids: ['O1'], upstream_pids: [] },
      { pid: 'P4', area_ha: 42.0, perim_m: 2700, land_cover: 'cropland', hsg: 'B', outlet_ids: ['O2'], upstream_pids: ['P2'] },
      { pid: 'P5', area_ha: 12.0, perim_m: 1400, land_cover: 'urban', hsg: 'C', outlet_ids: ['O2'], upstream_pids: [] },
      { pid: 'P6', area_ha: 30.0, perim_m: 2200, land_cover: 'forest', hsg: 'A', outlet_ids: ['O2'], upstream_pids: [] },
    ],
    outlets: [
      { oid: 'O1', name: 'Upper Creek Confluence', targets: { TN: 1200, TP: 150 }, baseline_means: { TN: 2200, TP: 280 } },
      { oid: 'O2', name: 'Main River Outlet', targets: { TN: 3500, TP: 400 }, baseline_means: { TN: 6500, TP: 720 } },
    ],
    efficiencies: PLET_EFFICIENCIES_DETERMINISTIC.filter((e) => ['TN', 'TP'].includes(e.pollutant)),
    costComponents: DEFAULT_BMP_COSTS_DETERMINISTIC,
    climateForcing: EAST_FORK_CLIMATE_FORCING,
  },
};
