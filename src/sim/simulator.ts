import {
  BmpCostComponent,
  BmpEfficiencyRecord,
  BmpPlacementRecord,
  ClimateForcing,
  DescriptiveStats,
  OutletTarget,
  ParcelInput,
  Pollutant,
  ScenarioMetricRow,
  SimulationConfig,
  SimulationResult,
  TrajectoryPoint,
} from '../types/model';
import { deriveChildSeed, SeededRng } from './distributions';
import { calculateParcelPletPathwayLoads } from './pletRusle';
import {
  calculateBmpCostAndGeometry,
  computeCostWeightedProbabilities,
  getBmpNameByCps,
} from './costModel';

export function computeDescriptiveStats(values: number[]): DescriptiveStats {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) {
    return { count: 0, mean: 0, std: 0, min: 0, p25: 0, p50: 0, p75: 0, max: 0 };
  }

  finite.sort((a, b) => a - b);
  const n = finite.length;
  const mean = finite.reduce((a, b) => a + b, 0) / n;
  const variance =
    n > 1
      ? finite.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
      : 0;
  const std = Math.sqrt(variance);

  const getPercentile = (p: number) => {
    const idx = (n - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return finite[lower] * (1 - weight) + finite[upper] * weight;
  };

  return {
    count: n,
    mean,
    std,
    min: finite[0],
    p25: getPercentile(0.25),
    p50: getPercentile(0.50),
    p75: getPercentile(0.75),
    max: finite[n - 1],
  };
}

export function runSimulation(
  config: SimulationConfig,
  parcels: ParcelInput[],
  outlets: OutletTarget[],
  efficiencies: BmpEfficiencyRecord[],
  costComponents: BmpCostComponent[],
  climateForcing: ClimateForcing,
  onProgress?: (progress: number, currentScenario: number) => void
): SimulationResult {
  const startTime = performance.now();
  const scenarios: ScenarioMetricRow[] = [];
  const trajectoriesByScenario: Record<number, TrajectoryPoint[]> = {};
  const allPlacements: BmpPlacementRecord[] = [];

  const pollutants = config.pollutants;
  const cpsList = config.cps;

  // Parcel areas & perimeters
  const avgAreaHa =
    parcels.reduce((sum, p) => sum + p.area_ha, 0) / Math.max(1, parcels.length);
  const avgPerimM =
    parcels.reduce((sum, p) => sum + p.perim_m, 0) / Math.max(1, parcels.length);

  // BMP selection probabilities
  let bmpSelectionProbs: number[];
  if (config.bmp_sel_prob_via_costs) {
    bmpSelectionProbs = computeCostWeightedProbabilities(
      cpsList,
      avgAreaHa,
      avgPerimM,
      config.buffer_depth_ft,
      costComponents
    );
  } else {
    bmpSelectionProbs = cpsList.map(() => 1.0 / cpsList.length);
  }

  // Parcel selection probabilities
  const parcelWeights = parcels.map((p) => p.selection_weight ?? 1.0);
  const sumWeights = parcelWeights.reduce((a, b) => a + b, 0);
  const parcelProbs = parcelWeights.map((w) => w / sumWeights);

  // Upstream adjacency lookup for wetland allocation
  const upstreamMap: Record<string, string[]> = {};
  for (const p of parcels) {
    upstreamMap[String(p.pid)] = (p.upstream_pids || []).map(String);
  }

  // Run each Monte Carlo scenario
  for (let sIdx = 0; sIdx < config.n_scenarios; sIdx++) {
    const childSeed = deriveChildSeed(config.random_seed, sIdx);
    const rng = new SeededRng(childSeed);

    // Initial load state per parcel and pathway
    // Pathways: in PLET mode ['surface', 'subsurface'], in Statistical mode defined by fractions
    const pathways =
      config.load_generation.mode === 'plet_rusle'
        ? ['surface', 'subsurface']
        : Object.keys(config.pollutant_load_rate_pathway_fractions || {
            surface: 0.3,
            'shallow subsurface': 0.4,
            'deep subsurface': 0.3,
          });

    // Tracking current pathway loads: parcel_idx -> pollutant -> pathway -> kg
    const parcelPathwayLoads: Record<number, Record<Pollutant, Record<string, number>>> = {};
    const baselineParcelMass: Record<number, Record<Pollutant, number>> = {};
    const parcelEverTreated: Record<number, Record<Pollutant, boolean>> = {};

    for (let pIdx = 0; pIdx < parcels.length; pIdx++) {
      const p = parcels[pIdx];
      parcelPathwayLoads[pIdx] = { TN: {}, TP: {}, TSS: {} };
      baselineParcelMass[pIdx] = { TN: 0, TP: 0, TSS: 0 };
      parcelEverTreated[pIdx] = { TN: false, TP: false, TSS: false };

      if (config.load_generation.mode === 'plet_rusle') {
        const pletLoads = calculateParcelPletPathwayLoads(p, climateForcing, pollutants);
        for (const pol of pollutants) {
          const surfAreal = pletLoads.surface_areal_kg_ha[pol];
          const subAreal = pletLoads.subsurface_areal_kg_ha[pol];
          const surfKg = surfAreal * p.area_ha;
          const subKg = subAreal * p.area_ha;

          parcelPathwayLoads[pIdx][pol]['surface'] = surfKg;
          parcelPathwayLoads[pIdx][pol]['subsurface'] = subKg;
          baselineParcelMass[pIdx][pol] = surfKg + subKg;
        }
      } else {
        // Statistical mode
        const fractions = config.pollutant_load_rate_pathway_fractions || {
          surface: 0.3,
          'shallow subsurface': 0.4,
          'deep subsurface': 0.3,
        };

        for (const pol of pollutants) {
          let baseRateKgHaYr = 10.0;
          if (p.baseline_load_rates?.[pol]) {
            const raw = p.baseline_load_rates[pol];
            baseRateKgHaYr =
              typeof raw === 'number'
                ? raw
                : rng.sampleFromStats(raw, 'load_rate');
          } else {
            baseRateKgHaYr = pol === 'TN' ? 25.0 : pol === 'TP' ? 1.3 : 250.0;
          }

          const totalKg = baseRateKgHaYr * p.area_ha;
          baselineParcelMass[pIdx][pol] = totalKg;

          for (const path of pathways) {
            const frac = fractions[path] ?? 1.0 / pathways.length;
            parcelPathwayLoads[pIdx][pol][path] = totalKg * frac;
          }
        }
      }
    }

    // Baseline total basin mass
    const baselineMassTotal: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };
    for (const pol of pollutants) {
      baselineMassTotal[pol] = Object.values(baselineParcelMass).reduce(
        (sum, m) => sum + m[pol],
        0
      );
    }

    // Helper to calculate total routed load reaching outlets
    const getOutletLoads = () => {
      const outLoads: Record<string, Record<Pollutant, number>> = {};
      for (const out of outlets) {
        outLoads[out.oid] = { TN: 0, TP: 0, TSS: 0 };
      }

      for (let pIdx = 0; pIdx < parcels.length; pIdx++) {
        const p = parcels[pIdx];
        const deliv = p.delivery_ratios || {
          sdr_f_to_s: 1.0,
          sdr_s_to_o: 1.0,
          ndr_f_to_s: 1.0,
          ndr_s_to_o: 1.0,
        };
        const sdr = (deliv.sdr_f_to_s ?? 1.0) * (deliv.sdr_s_to_o ?? 1.0);
        const ndr = (deliv.ndr_f_to_s ?? 1.0) * (deliv.ndr_s_to_o ?? 1.0);

        const assignedOutlets = p.outlet_ids && p.outlet_ids.length > 0 ? p.outlet_ids : [outlets[0]?.oid || '1'];

        for (const pol of pollutants) {
          const ratio = pol === 'TSS' ? sdr : ndr;
          let currentParcelLoad = 0;
          for (const path of pathways) {
            currentParcelLoad += parcelPathwayLoads[pIdx][pol][path] || 0;
          }
          const routed = currentParcelLoad * ratio;
          for (const oid of assignedOutlets) {
            if (outLoads[oid]) {
              outLoads[oid][pol] += routed;
            }
          }
        }
      }
      return outLoads;
    };

    // Helper to calculate basin remaining load
    const getBasinRemainingLoads = () => {
      const rem: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };
      for (const pol of pollutants) {
        for (let pIdx = 0; pIdx < parcels.length; pIdx++) {
          for (const path of pathways) {
            rem[pol] += parcelPathwayLoads[pIdx][pol][path] || 0;
          }
        }
      }
      return rem;
    };

    // Trajectory tracking
    const trajectory: TrajectoryPoint[] = [];
    let cumulativeCostUsd = 0;
    let bmpCount = 0;
    let failedCount = 0;
    let deterministicParcelCursor = 0;
    let deterministicBmpCursor = 0;

    // Record baseline point
    const baselineBasin = getBasinRemainingLoads();
    trajectory.push({
      step: 0,
      bmp_count: 0,
      cost_usd: 0,
      total_load: { ...baselineBasin },
      percent_reduction: { TN: 0, TP: 0, TSS: 0 },
      attained: {
        TN: false,
        TP: false,
        TSS: false,
      },
    });

    // BMP placement loop
    while (
      bmpCount < config.bmp_limit_n &&
      (config.bmp_limit_usd === undefined || cumulativeCostUsd < config.bmp_limit_usd)
    ) {
      // 1. Select parcel
      let selectedParcelIdx: number;
      if (config.deterministic_parcel_order) {
        selectedParcelIdx = deterministicParcelCursor % parcels.length;
        deterministicParcelCursor++;
      } else {
        selectedParcelIdx = rng.choice(
          parcels.map((_, i) => i),
          parcelProbs
        );
      }
      const parcel = parcels[selectedParcelIdx];

      // 2. Select BMP CPS
      let selectedCps: number;
      if (config.deterministic_bmp_type_order) {
        selectedCps = cpsList[deterministicBmpCursor % cpsList.length];
        deterministicBmpCursor++;
      } else {
        selectedCps = rng.choice(cpsList, bmpSelectionProbs);
      }

      // 3. Compute cost and geometry
      const geom = calculateBmpCostAndGeometry(
        selectedCps,
        parcel,
        config.buffer_depth_ft,
        costComponents,
        rng,
        config.deterministic_bmp_design_parameters
      );

      // Check failure
      const isFailed = rng.next() < config.bmp_fail_rate;
      if (isFailed) failedCount++;
      const failMultiplier = isFailed
        ? Math.max(0, 1.0 - config.bmp_fail_reduction)
        : 1.0;

      // 4. Sample efficiencies per pollutant and pathway
      const sampledEfficiencies: Record<Pollutant, Record<string, number>> = {
        TN: {},
        TP: {},
        TSS: {},
      };

      for (const pol of pollutants) {
        for (const path of pathways) {
          // Look up matching efficiency row
          const effRec = efficiencies.find(
            (e) =>
              e.cps === selectedCps &&
              e.pollutant === pol &&
              e.pathway.toLowerCase() === path.toLowerCase()
          );

          let effVal = 0;
          if (effRec) {
            effVal = rng.sampleFromStats(effRec.stats, 'efficiency');
          } else {
            // Default efficiencies if not explicitly supplied
            if (path.includes('surface')) {
              effVal = pol === 'TSS' ? 0.6 : pol === 'TP' ? 0.4 : 0.3;
            } else {
              effVal = pol === 'TSS' ? 0.0 : pol === 'TP' ? 0.1 : 0.15;
            }
          }
          sampledEfficiencies[pol][path] = effVal * failMultiplier;
        }
      }

      // 5. Apply BMP reduction & serial stacking
      const treatedMassKg: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };
      const removedMassKg: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };

      // Determine impacted parcels (e.g. wetland impacts upstream parcels too)
      let impactedIndices: number[] = [selectedParcelIdx];
      if (selectedCps === 656) {
        // Constructed wetland upstream drainage allocation
        const upPids = upstreamMap[String(parcel.pid)] || [];
        for (const upPid of upPids) {
          const upIdx = parcels.findIndex((p) => String(p.pid) === upPid);
          if (upIdx >= 0 && !impactedIndices.includes(upIdx)) {
            impactedIndices.push(upIdx);
          }
        }
      }

      for (const targetIdx of impactedIndices) {
        for (const pol of pollutants) {
          parcelEverTreated[targetIdx][pol] = true;
          for (const path of pathways) {
            const currentLoad = parcelPathwayLoads[targetIdx][pol][path] || 0;
            const eff = sampledEfficiencies[pol][path] || 0;
            const fraction = geom.treatment_fraction;

            treatedMassKg[pol] += currentLoad * fraction;

            // Load cannot become negative, but signed negative efficiency can increase load
            const removed = currentLoad * fraction * eff;
            const newLoad = Math.max(0, currentLoad - removed);

            removedMassKg[pol] += currentLoad - newLoad;
            parcelPathwayLoads[targetIdx][pol][path] = newLoad;
          }
        }
      }

      cumulativeCostUsd += geom.cost_usd;
      bmpCount++;

      // Record placement
      const placement: BmpPlacementRecord = {
        scenario: sIdx + 1,
        step: bmpCount,
        pid: parcel.pid,
        cps: selectedCps,
        bmp_name: getBmpNameByCps(selectedCps),
        failed: isFailed,
        cost_usd: geom.cost_usd,
        total_cost_usd: cumulativeCostUsd,
        treatment_fraction: geom.treatment_fraction,
        buffer_area_ha: geom.buffer_area_ha,
        linear_length_m: geom.linear_length_m,
        wetland_area_ha: geom.wetland_area_ha,
        catchment_to_wetland_ratio: geom.catchment_to_wetland_ratio,
        impacted_pids: impactedIndices.map((i) => parcels[i].pid),
        efficiencies: sampledEfficiencies,
        treated_mass_kg: treatedMassKg,
        removed_mass_kg: removedMassKg,
      };

      // Keep only sample placements to save memory if very high limit
      if (sIdx === 0 || allPlacements.length < 2000) {
        allPlacements.push(placement);
      }

      // Record trajectory at intervals (or every step if count <= 100)
      if (bmpCount <= 100 || bmpCount % Math.ceil(config.bmp_limit_n / 50) === 0 || bmpCount === config.bmp_limit_n) {
        const curBasin = getBasinRemainingLoads();
        const curOutlet = getOutletLoads();
        const primaryOutlet = outlets[0]?.oid || '1';

        const pt: TrajectoryPoint = {
          step: bmpCount,
          bmp_count: bmpCount,
          cost_usd: cumulativeCostUsd,
          total_load: { ...curBasin },
          percent_reduction: {
            TN: baselineBasin.TN > 0 ? ((baselineBasin.TN - curBasin.TN) / baselineBasin.TN) * 100 : 0,
            TP: baselineBasin.TP > 0 ? ((baselineBasin.TP - curBasin.TP) / baselineBasin.TP) * 100 : 0,
            TSS: baselineBasin.TSS > 0 ? ((baselineBasin.TSS - curBasin.TSS) / baselineBasin.TSS) * 100 : 0,
          },
          attained: {
            TN: outlets[0]?.targets.TN ? (curOutlet[primaryOutlet]?.TN ?? 0) <= outlets[0].targets.TN : false,
            TP: outlets[0]?.targets.TP ? (curOutlet[primaryOutlet]?.TP ?? 0) <= outlets[0].targets.TP : false,
            TSS: outlets[0]?.targets.TSS ? (curOutlet[primaryOutlet]?.TSS ?? 0) <= outlets[0].targets.TSS : false,
          },
        };
        trajectory.push(pt);
      }
    }

    trajectoriesByScenario[sIdx + 1] = trajectory;

    // Calculate Scenario Mass Summaries
    const finalBasinLoads = getBasinRemainingLoads();
    const finalOutletLoads = getOutletLoads();

    const treatedBaselineMass: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };
    const removedMass: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };
    const exposureFraction: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };
    const realizedEfficiency: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };
    const overallReduction: Record<Pollutant, number> = { TN: 0, TP: 0, TSS: 0 };
    const attained: Record<string, Record<Pollutant, boolean>> = {};

    for (const out of outlets) {
      attained[out.oid] = { TN: false, TP: false, TSS: false };
      for (const pol of pollutants) {
        if (out.targets[pol] !== undefined) {
          attained[out.oid][pol] = (finalOutletLoads[out.oid]?.[pol] ?? 0) <= (out.targets[pol] ?? 0);
        }
      }
    }

    for (const pol of pollutants) {
      // Baseline mass of parcels that received at least one BMP
      let treatedBase = 0;
      for (let pIdx = 0; pIdx < parcels.length; pIdx++) {
        if (parcelEverTreated[pIdx][pol]) {
          treatedBase += baselineParcelMass[pIdx][pol];
        }
      }
      treatedBaselineMass[pol] = treatedBase;

      const base = baselineMassTotal[pol];
      const finalLoad = finalBasinLoads[pol];
      const rem = Math.max(0, base - finalLoad);
      removedMass[pol] = rem;

      exposureFraction[pol] = base > 0 ? treatedBase / base : 0;
      realizedEfficiency[pol] = treatedBase > 0 ? rem / treatedBase : 0;
      overallReduction[pol] = base > 0 ? rem / base : 0;
    }

    scenarios.push({
      scenario: sIdx + 1,
      total_cost_usd: cumulativeCostUsd,
      bmp_count: bmpCount,
      failed_count: failedCount,
      baseline_mass_kg: baselineMassTotal,
      treated_baseline_mass_kg: treatedBaselineMass,
      removed_mass_kg: removedMass,
      treatment_exposure_fraction: exposureFraction,
      realized_efficiency: realizedEfficiency,
      overall_reduction_fraction: overallReduction,
      final_outlet_load_kg: finalOutletLoads,
      attained,
    });

    if (onProgress) {
      onProgress(((sIdx + 1) / config.n_scenarios) * 100, sIdx + 1);
    }
  }

  // Aggregate descriptive stats across scenarios
  const summaryByPollutant: any = {};
  for (const pol of pollutants) {
    summaryByPollutant[pol] = {
      baseline_mass: computeDescriptiveStats(scenarios.map((s) => s.baseline_mass_kg[pol])),
      removed_mass: computeDescriptiveStats(scenarios.map((s) => s.removed_mass_kg[pol])),
      realized_efficiency: computeDescriptiveStats(scenarios.map((s) => s.realized_efficiency[pol])),
      overall_reduction: computeDescriptiveStats(scenarios.map((s) => s.overall_reduction_fraction[pol])),
    };
  }

  const costSummary = computeDescriptiveStats(scenarios.map((s) => s.total_cost_usd));
  const bmpCountSummary = computeDescriptiveStats(scenarios.map((s) => s.bmp_count));

  // Attainment probabilities
  const attainmentProbabilities: Record<string, Record<Pollutant, number>> = {};
  for (const out of outlets) {
    attainmentProbabilities[out.oid] = { TN: 0, TP: 0, TSS: 0 };
    for (const pol of pollutants) {
      const attainedCount = scenarios.filter((s) => s.attained[out.oid]?.[pol]).length;
      attainmentProbabilities[out.oid][pol] = attainedCount / Math.max(1, scenarios.length);
    }
  }

  const executionTimeMs = performance.now() - startTime;

  return {
    config,
    parcels,
    outlets,
    scenarios,
    trajectoriesByScenario,
    allPlacements,
    summaryByPollutant,
    costSummary,
    bmpCountSummary,
    attainmentProbabilities,
    executionTimeMs,
  };
}
