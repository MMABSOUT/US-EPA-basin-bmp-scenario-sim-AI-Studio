import React from 'react';
import { Droplet, Info, CloudRain, Mountain, ShieldCheck } from 'lucide-react';
import { ClimateForcing, ParcelInput } from '../types/model';
import {
  calculatePletInfiltrationInches,
  calculatePletRunoffInches,
  DEFAULT_PLET_HYDROLOGY_LOOKUP,
  INCH_OVER_HA_TO_LITERS,
  TON_PER_ACRE_TO_KG_PER_HA,
} from '../sim/pletRusle';

interface PletDiagnosticsViewProps {
  forcing: ClimateForcing;
  sampleParcel: ParcelInput;
}

export const PletDiagnosticsView: React.FC<PletDiagnosticsViewProps> = ({
  forcing,
  sampleParcel,
}) => {
  const lc = (sampleParcel.land_cover?.toLowerCase() || 'cropland') as keyof typeof DEFAULT_PLET_HYDROLOGY_LOOKUP;
  const hsg = sampleParcel.hsg || 'B';
  const lookup = DEFAULT_PLET_HYDROLOGY_LOOKUP[lc]?.[hsg] || DEFAULT_PLET_HYDROLOGY_LOOKUP.cropland.B;

  const cn = sampleParcel.curve_number ?? lookup.cn;
  const infFrac = sampleParcel.infiltration_fraction ?? lookup.infiltration_fraction;

  const runoff = calculatePletRunoffInches(forcing, cn, forcing.ia_ratio ?? 0.0);
  const infiltrationIn = calculatePletInfiltrationInches(forcing, infFrac);

  const runoffLiters = runoff.annual_total_runoff * INCH_OVER_HA_TO_LITERS;
  const infiltrationLiters = infiltrationIn * INCH_OVER_HA_TO_LITERS;

  const rusle = sampleParcel.rusle || { r: 175, k: 0.32, ls: 1.8, c: 0.22, p: 0.7, sdr: 0.85 };
  const grossTonAc = (rusle.r ?? 175) * (rusle.k ?? 0.32) * (rusle.ls ?? 1.8) * (rusle.c ?? 0.22) * (rusle.p ?? 0.7);
  const sedLoadKgHaYr = grossTonAc * (rusle.sdr ?? 0.85) * TON_PER_ACRE_TO_KG_PER_HA;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Annual Runoff Depth</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {runoff.annual_total_runoff.toFixed(2)} in/yr
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {(runoffLiters / 1000).toLocaleString()} m³ water / ha
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Annual Infiltration Depth</span>
            <Droplet className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-300 mt-1">
            {infiltrationIn.toFixed(2)} in/yr
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {(infiltrationLiters / 1000).toLocaleString()} m³ water / ha
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Curve Number (CN)</span>
            <Mountain className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {cn}
          </div>
          <span className="text-[10px] text-slate-500 capitalize">
            {sampleParcel.land_cover || 'Cropland'} • Soil Group {hsg}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>RUSLE Sediment Yield</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {sedLoadKgHaYr.toFixed(0)} kg/ha/yr
          </div>
          <span className="text-[10px] text-slate-500">
            Gross: {grossTonAc.toFixed(2)} ton/ac/yr
          </span>
        </div>
      </div>

      {/* Equations and Physical Formulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
          <Info className="w-5 h-5 text-emerald-400" />
          <span>PLET & RUSLE Formulation Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 space-y-2">
            <h4 className="font-semibold text-emerald-400 text-xs font-sans uppercase tracking-wider">
              1. PLET Runoff Formulation
            </h4>
            <p className="text-slate-400">
              Retention: <span className="text-slate-200">S = (1000 / CN) - 10 = {(1000 / cn - 10).toFixed(2)} in</span>
            </p>
            <p className="text-slate-400">
              Event Rainfall: <span className="text-slate-200">P = {runoff.event_rainfall.toFixed(3)} in/event</span>
            </p>
            <p className="text-slate-400">
              Event Runoff Depth:{' '}
              <span className="text-slate-200">
                Q = (P - Iₐ)² / (P - Iₐ + S) = {runoff.event_runoff.toFixed(3)} in
              </span>
            </p>
            <p className="text-slate-400">
              Corrected Runoff Days:{' '}
              <span className="text-slate-200">
                {(forcing.rain_days * forcing.runoff_day_fraction).toFixed(1)} days/yr
              </span>
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 space-y-2">
            <h4 className="font-semibold text-teal-400 text-xs font-sans uppercase tracking-wider">
              2. RUSLE Soil Erosion Formulation
            </h4>
            <p className="text-slate-400">
              Gross Soil Loss: <span className="text-slate-200">A = R × K × LS × C × P = {grossTonAc.toFixed(2)} tons/ac</span>
            </p>
            <p className="text-slate-400">
              Delivery to Stream:{' '}
              <span className="text-slate-200">SDR = {rusle.sdr ?? 0.85}</span>
            </p>
            <p className="text-slate-400">
              Unit Conversion:{' '}
              <span className="text-slate-200">1 ton/ac = 2,241.70 kg/ha</span>
            </p>
            <p className="text-slate-400">
              Sediment-Bound TN / TP:{' '}
              <span className="text-slate-200">0.15% N, 0.05% P with Enrichment = 1.20</span>
            </p>
          </div>
        </div>
      </div>

      {/* PLET Hydrology Reference Lookup Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-100">
          EPA PLET Hydrology Reference Matrix (Curve Number & Infiltration)
        </h3>
        <p className="text-xs text-slate-400">
          Resolved curve numbers and infiltration fractions by land-cover classification and Hydrologic Soil Group (HSG)
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/60 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
              <tr>
                <th className="py-2.5 px-3 font-sans">Land Cover</th>
                <th className="py-2.5 px-3 text-center">HSG A (CN / Inf)</th>
                <th className="py-2.5 px-3 text-center">HSG B (CN / Inf)</th>
                <th className="py-2.5 px-3 text-center">HSG C (CN / Inf)</th>
                <th className="py-2.5 px-3 text-center">HSG D (CN / Inf)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {Object.entries(DEFAULT_PLET_HYDROLOGY_LOOKUP).map(([lcKey, hsgMap]) => (
                <tr key={lcKey} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-sans font-medium capitalize text-slate-100">
                    {lcKey}
                  </td>
                  {(['A', 'B', 'C', 'D'] as const).map((h) => {
                    const row = hsgMap[h];
                    const isSelected = lc === lcKey && hsg === h;
                    return (
                      <td
                        key={h}
                        className={`py-2.5 px-3 text-center ${
                          isSelected ? 'bg-emerald-950/60 font-bold text-emerald-300 border border-emerald-700' : ''
                        }`}
                      >
                        <span className="text-emerald-400">{row.cn}</span>
                        <span className="text-slate-500 mx-1.5">•</span>
                        <span className="text-cyan-400">{(row.infiltration_fraction * 100).toFixed(1)}%</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
