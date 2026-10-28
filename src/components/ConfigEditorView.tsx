import React, { useState } from 'react';
import yaml from 'js-yaml';
import { Code, Download, FileText, Check, Copy } from 'lucide-react';
import { BmpCostComponent, BmpEfficiencyRecord, SimulationConfig, SimulationResult } from '../types/model';

interface ConfigEditorViewProps {
  config: SimulationConfig;
  efficiencies: BmpEfficiencyRecord[];
  costComponents: BmpCostComponent[];
  result: SimulationResult | null;
}

export const ConfigEditorView: React.FC<ConfigEditorViewProps> = ({
  config,
  efficiencies,
  costComponents,
  result,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate canonical YAML representation matching run_model.py
  const yamlContent = yaml.dump({
    verbose: true,
    outputs: './outputs/run_scenario',
    random_seed: config.random_seed,
    domain: 'examples/east_fork/inputs/domain/domain.gpkg',
    parcels: 'examples/east_fork/inputs/parcels/parcels.gpkg',
    outlets: 'examples/east_fork/inputs/outlets/outlets.gpkg',
    pollutants: config.pollutants,
    cps: config.cps,
    bmp_efficiency: 'examples/east_fork/inputs/bmps/bmp_efficiency.csv',
    bmp_cost: 'examples/east_fork/inputs/bmps/bmp_cost.csv',
    load_generation: config.load_generation,
    pollutant_load_rate_pathway_fractions: config.pollutant_load_rate_pathway_fractions,
    n_scenarios: config.n_scenarios,
    bmp_limit_n: config.bmp_limit_n,
    bmp_limit_usd: config.bmp_limit_usd,
    buffer_depth_ft: config.buffer_depth_ft,
    bmp_fail_rate: config.bmp_fail_rate,
    bmp_fail_reduction: config.bmp_fail_reduction,
    bmp_sel_prob_via_costs: config.bmp_sel_prob_via_costs,
    deterministic_parcel_order: config.deterministic_parcel_order,
    deterministic_bmp_type_order: config.deterministic_bmp_type_order,
    deterministic_bmp_design_parameters: config.deterministic_bmp_design_parameters,
  });

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadYaml = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'basin_simulation_config.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportScenariosCsv = () => {
    if (!result || result.scenarios.length === 0) return;
    const header = [
      'scenario',
      'bmp_count',
      'failed_count',
      'cost_usd',
      'baseline_mass_tn_kg',
      'removed_mass_tn_kg',
      'overall_reduction_tn_fraction',
      'realized_efficiency_tn',
      'baseline_mass_tp_kg',
      'removed_mass_tp_kg',
      'overall_reduction_tp_fraction',
      'realized_efficiency_tp',
    ].join(',');

    const rows = result.scenarios.map((s) =>
      [
        s.scenario,
        s.bmp_count,
        s.failed_count,
        s.total_cost_usd,
        s.baseline_mass_kg.TN.toFixed(2),
        s.removed_mass_kg.TN.toFixed(2),
        s.overall_reduction_fraction.TN.toFixed(4),
        s.realized_efficiency.TN.toFixed(4),
        s.baseline_mass_kg.TP.toFixed(2),
        s.removed_mass_kg.TP.toFixed(2),
        s.overall_reduction_fraction.TP.toFixed(4),
        s.realized_efficiency.TP.toFixed(4),
      ].join(',')
    );

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_scenarios_summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Export Actions Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <span>Export Simulation Inputs & Outputs</span>
          </h3>
          <p className="text-xs text-slate-400">
            Download results in canonical CSV format or export the active configuration YAML
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadYaml}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Download config.yaml</span>
          </button>

          <button
            onClick={handleExportScenariosCsv}
            disabled={!result}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-medium shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Scenarios CSV</span>
          </button>
        </div>
      </div>

      {/* YAML Preview and Copy */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Code className="w-4 h-4 text-teal-400" />
            <span>YAML Configuration Document</span>
          </h3>
          <button
            onClick={handleCopyYaml}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy YAML'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96">
          {yamlContent}
        </pre>
      </div>

      {/* BMP Efficiencies Reference Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Loaded BMP Efficiency Parameters ({efficiencies.length} entries)
        </h3>
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/80 text-slate-300 sticky top-0 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2 px-3">CPS</th>
                <th className="py-2 px-3 font-sans">Practice</th>
                <th className="py-2 px-3">Pollutant</th>
                <th className="py-2 px-3">Pathway</th>
                <th className="py-2 px-3 text-right">Value / Mean</th>
                <th className="py-2 px-3 text-right">Min - Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {efficiencies.map((e, idx) => (
                <tr key={`${e.cps}-${e.pollutant}-${e.pathway}-${idx}`} className="hover:bg-slate-800/40">
                  <td className="py-1.5 px-3 text-emerald-400 font-semibold">{e.cps}</td>
                  <td className="py-1.5 px-3 font-sans text-slate-200">{e.name}</td>
                  <td className="py-1.5 px-3 font-semibold text-teal-300">{e.pollutant}</td>
                  <td className="py-1.5 px-3 capitalize text-slate-400">{e.pathway}</td>
                  <td className="py-1.5 px-3 text-right font-semibold text-slate-100">
                    {e.stats.value !== undefined
                      ? (e.stats.value * 100).toFixed(1) + '%'
                      : e.stats.mean !== undefined
                      ? (e.stats.mean * 100).toFixed(1) + '%'
                      : 'N/A'}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-400">
                    {e.stats.min !== undefined && e.stats.max !== undefined
                      ? `${(e.stats.min * 100).toFixed(0)}% - ${(e.stats.max * 100).toFixed(0)}%`
                      : 'Fixed'}
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
