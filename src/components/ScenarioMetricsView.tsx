import React, { useState } from 'react';
import { BarChart3, Calculator, Download, DollarSign, Percent, Scale, Filter } from 'lucide-react';
import { DescriptiveStats, Pollutant, SimulationResult } from '../types/model';

interface ScenarioMetricsViewProps {
  result: SimulationResult | null;
}

export const ScenarioMetricsView: React.FC<ScenarioMetricsViewProps> = ({ result }) => {
  const [selectedPollutant, setSelectedPollutant] = useState<Pollutant>('TN');
  const [scenarioPage, setScenarioPage] = useState(1);
  const pageSize = 15;

  if (!result || result.scenarios.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <Calculator className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-slate-300">No Metrics Generated Yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Run a simulation to generate mass-based performance summaries, realized efficiencies, and statistical distributions.
        </p>
      </div>
    );
  }

  const polSummary = result.summaryByPollutant[selectedPollutant];
  const formatNum = (v: number, decimals = 1) =>
    Number.isFinite(v) ? v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : 'N/A';
  const formatPercent = (v: number) =>
    Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : 'N/A';

  const rows: { label: string; unit: string; stats: DescriptiveStats; isPercent?: boolean }[] = [
    { label: 'Baseline Mass', unit: 'kg/yr', stats: polSummary.baseline_mass },
    { label: 'Removed Mass', unit: 'kg/yr', stats: polSummary.removed_mass },
    { label: 'Realized Efficiency', unit: '%', stats: polSummary.realized_efficiency, isPercent: true },
    { label: 'Overall Reduction', unit: '%', stats: polSummary.overall_reduction, isPercent: true },
    { label: 'Total Investment Cost', unit: 'USD', stats: result.costSummary },
    { label: 'BMP Count', unit: 'practices', stats: result.bmpCountSummary },
  ];

  // Paginated scenario list
  const totalScenarios = result.scenarios.length;
  const totalPages = Math.ceil(totalScenarios / pageSize);
  const pagedScenarios = result.scenarios.slice((scenarioPage - 1) * pageSize, scenarioPage * pageSize);

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mean Mass Removed</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {formatNum(polSummary.removed_mass.mean, 0)} kg
          </div>
          <span className="text-[10px] text-slate-500">{selectedPollutant} annualized reduction</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Reduction</span>
            <Percent className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-300 mt-1">
            {formatPercent(polSummary.overall_reduction.mean)}
          </div>
          <span className="text-[10px] text-slate-500">Median: {formatPercent(polSummary.overall_reduction.p50)}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Realized Efficiency</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {formatPercent(polSummary.realized_efficiency.mean)}
          </div>
          <span className="text-[10px] text-slate-500">Removed / Treated Baseline</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mean Cost</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            ${formatNum(result.costSummary.mean, 0)}
          </div>
          <span className="text-[10px] text-slate-500">Avg across {result.scenarios.length} runs</span>
        </div>
      </div>

      {/* Statistical Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <span>Mass-Based Performance Summary</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cross-scenario distribution statistics calculated without averaging ratios prematurely
            </p>
          </div>

          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            {(['TN', 'TP', 'TSS'] as Pollutant[]).map((pol) => (
              <button
                key={pol}
                onClick={() => setSelectedPollutant(pol)}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  selectedPollutant === pol
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pol}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/60 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
              <tr>
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3 text-right">Mean</th>
                <th className="py-2.5 px-3 text-right">Std Dev</th>
                <th className="py-2.5 px-3 text-right">Min</th>
                <th className="py-2.5 px-3 text-right">P25</th>
                <th className="py-2.5 px-3 text-right font-bold text-emerald-400">Median (P50)</th>
                <th className="py-2.5 px-3 text-right">P75</th>
                <th className="py-2.5 px-3 text-right">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {rows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-100">{row.label}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{row.unit}</td>
                  <td className="py-2.5 px-3 text-right">
                    {row.isPercent ? formatPercent(row.stats.mean) : formatNum(row.stats.mean)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {row.isPercent ? formatPercent(row.stats.std) : formatNum(row.stats.std)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {row.isPercent ? formatPercent(row.stats.min) : formatNum(row.stats.min)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {row.isPercent ? formatPercent(row.stats.p25) : formatNum(row.stats.p25)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-emerald-300">
                    {row.isPercent ? formatPercent(row.stats.p50) : formatNum(row.stats.p50)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {row.isPercent ? formatPercent(row.stats.p75) : formatNum(row.stats.p75)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {row.isPercent ? formatPercent(row.stats.max) : formatNum(row.stats.max)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Breakdown Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Individual Scenario Outcomes</h3>
            <p className="text-xs text-slate-400">
              Displaying {pagedScenarios.length} of {totalScenarios} Monte Carlo runs
            </p>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setScenarioPage((p) => Math.max(1, p - 1))}
                disabled={scenarioPage === 1}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
              >
                Prev
              </button>
              <span className="text-slate-400">
                Page {scenarioPage} of {totalPages}
              </span>
              <button
                onClick={() => setScenarioPage((p) => Math.min(totalPages, p + 1))}
                disabled={scenarioPage === totalPages}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/60 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
              <tr>
                <th className="py-2 px-3">Scenario</th>
                <th className="py-2 px-3 text-right">BMP Count</th>
                <th className="py-2 px-3 text-right">Failed</th>
                <th className="py-2 px-3 text-right">Cost ($)</th>
                <th className="py-2 px-3 text-right">Baseline (kg)</th>
                <th className="py-2 px-3 text-right text-emerald-400">Removed (kg)</th>
                <th className="py-2 px-3 text-right">% Reduction</th>
                <th className="py-2 px-3 text-right">Realized Eff.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {pagedScenarios.map((s) => (
                <tr key={s.scenario} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-semibold text-slate-100">#{s.scenario}</td>
                  <td className="py-2 px-3 text-right">{s.bmp_count}</td>
                  <td className="py-2 px-3 text-right text-rose-400">{s.failed_count}</td>
                  <td className="py-2 px-3 text-right text-amber-300">${s.total_cost_usd.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">{Math.round(s.baseline_mass_kg[selectedPollutant]).toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-emerald-300 font-semibold">
                    {Math.round(s.removed_mass_kg[selectedPollutant]).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {(s.overall_reduction_fraction[selectedPollutant] * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-right text-cyan-300">
                    {(s.realized_efficiency[selectedPollutant] * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
