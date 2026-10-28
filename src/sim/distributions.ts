import { DistributionStats } from '../types/model';

/**
 * Seedable Pseudo-Random Number Generator (Mulberry32 + SplitMix32)
 * Provides reproducible Monte Carlo runs identical to seeded numpy RNGs.
 */
export class SeededRng {
  private s: number;

  constructor(seed: number) {
    this.s = Math.floor(seed) >>> 0;
  }

  // Returns float in [0, 1)
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Uniform in [min, max]
  uniform(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  // Box-Muller transform for standard Normal(0, 1)
  normal(mean = 0, sd = 1): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * sd;
  }

  // Choice from array with probability weights
  choice<T>(items: T[], weights?: number[]): T {
    if (!weights || weights.length === 0) {
      const idx = Math.floor(this.next() * items.length);
      return items[Math.min(idx, items.length - 1)];
    }
    const sum = weights.reduce((a, b) => a + b, 0);
    const r = this.next() * sum;
    let acc = 0;
    for (let i = 0; i < items.length; i++) {
      acc += weights[i];
      if (r <= acc) return items[i];
    }
    return items[items.length - 1];
  }

  // Truncated Normal sampling
  truncNormal(mean: number, sd: number, low?: number, high?: number, maxTries = 30): number {
    if (sd === 0) {
      if ((low !== undefined && mean < low) || (high !== undefined && mean > high)) {
        throw new Error(`Deterministic normal value ${mean} is outside truncation bounds [${low}, ${high}]`);
      }
      return mean;
    }

    const inBounds = (v: number) =>
      (low === undefined || v >= low) && (high === undefined || v <= high);

    for (let i = 0; i < maxTries; i++) {
      const sample = this.normal(mean, sd);
      if (inBounds(sample)) {
        return sample;
      }
    }

    // Fallback: clamp or return mean if mean is in bounds
    if (inBounds(mean)) return mean;
    if (low !== undefined && high !== undefined) {
      return (low + high) / 2;
    }
    return low !== undefined ? low : (high !== undefined ? high : mean);
  }

  // Piecewise quantile linear interpolation (e.g. min, p05, p50, p95, max)
  piecewiseQuantileSample(stats: DistributionStats): number {
    const pts: [number, number][] = [];
    const minVal = stats.min !== undefined ? stats.min : stats.p05;
    const maxVal = stats.max !== undefined ? stats.max : stats.p95;

    if (minVal === undefined || maxVal === undefined) {
      throw new Error("Piecewise quantile sample requires min and max bounds");
    }

    pts.push([0.0, minVal]);
    if (stats.p05 !== undefined) pts.push([0.05, stats.p05]);
    if (stats.p10 !== undefined) pts.push([0.10, stats.p10]);
    if (stats.p25 !== undefined) pts.push([0.25, stats.p25]);
    if (stats.p50 !== undefined) pts.push([0.50, stats.p50]);
    if (stats.p75 !== undefined) pts.push([0.75, stats.p75]);
    if (stats.p90 !== undefined) pts.push([0.90, stats.p90]);
    if (stats.p95 !== undefined) pts.push([0.95, stats.p95]);
    pts.push([1.0, maxVal]);

    pts.sort((a, b) => a[0] - b[0]);

    const u = this.next();
    for (let i = 0; i < pts.length - 1; i++) {
      const [p0, q0] = pts[i];
      const [p1, q1] = pts[i + 1];
      if (u >= p0 && u <= p1) {
        if (p1 === p0) return q0;
        const t = (u - p0) / (p1 - p0);
        return q0 + t * (q1 - q0);
      }
    }
    return maxVal;
  }

  // Draw one sample from distribution statistics
  sampleFromStats(
    stats: DistributionStats,
    kind?: 'efficiency' | 'load_rate' | 'nonnegative' | 'fraction' | 'cn' | 'ia_ratio' | 'positive'
  ): number {
    let sample: number;

    if (stats.value !== undefined) {
      sample = stats.value;
    } else if (
      stats.min !== undefined &&
      stats.max !== undefined &&
      (stats.p05 !== undefined || stats.p50 !== undefined || stats.p95 !== undefined)
    ) {
      sample = this.piecewiseQuantileSample(stats);
    } else if (
      stats.min !== undefined &&
      stats.max !== undefined &&
      stats.mean !== undefined &&
      stats.sd === undefined
    ) {
      // Legacy min + mean + max triangular-like proxy
      const sd = Math.max((stats.max - stats.min) / 4.0, 1e-12);
      sample = this.truncNormal(stats.mean, sd, stats.min, stats.max);
    } else if (
      stats.min !== undefined &&
      stats.max !== undefined &&
      stats.mean === undefined &&
      stats.sd === undefined
    ) {
      // Uniform distribution [min, max]
      sample = this.uniform(stats.min, stats.max);
    } else if (stats.mean !== undefined && stats.sd !== undefined) {
      // Normal / Truncated Normal
      const low = stats.min ?? (kind === 'nonnegative' || kind === 'load_rate' ? 0 : undefined);
      const high = stats.max ?? (kind === 'efficiency' || kind === 'fraction' ? 1.0 : undefined);
      sample = this.truncNormal(stats.mean, stats.sd, low, high);
    } else if (stats.mean !== undefined) {
      sample = stats.mean;
    } else if (stats.p50 !== undefined) {
      sample = stats.p50;
    } else {
      throw new Error(`Insufficient distribution statistics to sample: ${JSON.stringify(stats)}`);
    }

    // Physical domain enforcement
    if (kind === 'efficiency') {
      // Efficiencies can be negative (signed BMP effects), but cannot exceed 1.0
      if (sample > 1.0) sample = 1.0;
    } else if (kind === 'nonnegative' || kind === 'load_rate') {
      if (sample < 0) sample = 0;
    } else if (kind === 'fraction') {
      sample = Math.max(0, Math.min(1.0, sample));
    } else if (kind === 'cn') {
      sample = Math.max(1.0, Math.min(100.0, sample));
    }

    return sample;
  }
}

/**
 * Child seed generator for scenario reproducibility
 */
export function deriveChildSeed(baseSeed: number, scenarioIndex: number): number {
  let h = (baseSeed + scenarioIndex * 0x9e3779b9) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
