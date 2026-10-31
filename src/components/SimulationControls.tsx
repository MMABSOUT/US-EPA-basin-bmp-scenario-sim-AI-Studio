import React, { useState } from 'react';
import { Play, RotateCcw, Sliders, Dices, AlertTriangle, ShieldAlert, DollarSign, CheckCircle2 } from 'lucide-react';
import { SimulationConfig } from '../types/model';

interface SimulationControlsProps {
  config: SimulationConfig;
  onChangeConfig: (newConfig: SimulationConfig) => void;
  isRunning: boolean;
  progress: number;
  currentScenarioNum: number;
  onRun: () => void;
  executionTimeMs?: number;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  config,
  onChangeConfig,
  isRunning,
  progress,
  currentScenarioNum,
  onRun,
  executionTimeMs,
}) => {
  const [isRolling, setIsRolling] = useState(false);

  const updateField = <K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  const handleRandomizeSeed = () => {
    setIsRolling(true);
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    updateField('random_seed', newSeed);
    setTimeout(() => setIsRolling(false), 500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top row: Main Action + Quick Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Monte Carlo Simulation Controls
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {executionTimeMs !== undefined && !isRunning && (
            <div className="text-xs text-slate-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulated in <span className="text-emerald-300 font-mono font-medium">{executionTimeMs.toFixed(1)}ms</span></span>
            </div>
          )}

          <button
            onClick={onRun}
            disabled={isRunning}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-4 h-4 fill-white ${isRunning ? 'animate-pulse' : ''}`} />
            <span>{isRunning ? `Simulating Scenario ${currentScenarioNum}/${config.n_scenarios}...` : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar when running */}
      {isRunning && (
        <div className="space-y-1.5 animate-fadeIn">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Executing Monte Carlo scenarios...</span>
            <span className="font-mono text-emerald-400 font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid of parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs">
        {/* Scenarios (N) */}
        <div className="space-y-1">
          <label htmlFor="input-n-scenarios" className="text-slate-400 font-medium flex items-center justify-between cursor-pointer">
            <span>Scenarios (N)</span>
          </label>
          <input
            id="input-n-scenarios"
            type="number"
            min="1"
            max="1000"
            value={config.n_scenarios}
            onChange={(e) => updateField('n_scenarios', Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isRunning}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500 block">Monte Carlo replicates</span>
        </div>

        {/* BMP Limit (N) */}
        <div className="space-y-1">
          <label htmlFor="input-bmp-limit-n" className="text-slate-400 font-medium flex items-center justify-between cursor-pointer">
            <span>BMP Count Limit</span>
          </label>
          <input
            id="input-bmp-limit-n"
            type="number"
            min="1"
            max="2000"
            value={config.bmp_limit_n}
            onChange={(e) => updateField('bmp_limit_n', Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isRunning}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500 block">Max practices per scenario</span>
        </div>

        {/* Budget Limit (USD) */}
        <div className="space-y-1">
          <label htmlFor="input-bmp-limit-usd" className="text-slate-400 font-medium flex items-center justify-between cursor-pointer">
            <span>Budget Limit ($)</span>
          </label>
          <input
            id="input-bmp-limit-usd"
            type="number"
            min="0"
            step="10000"
            placeholder="No limit"
            value={config.bmp_limit_usd ?? ''}
            onChange={(e) =>
              updateField(
                'bmp_limit_usd',
                e.target.value ? Math.max(0, parseFloat(e.target.value)) : undefined
              )
            }
            disabled={isRunning}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500 block">Optional stopping rule</span>
        </div>

        {/* Failure Rate */}
        <div className="space-y-1">
          <label htmlFor="input-bmp-fail-rate" className="text-slate-400 font-medium flex items-center justify-between cursor-pointer">
            <span>Failure Prob (P)</span>
          </label>
          <input
            id="input-bmp-fail-rate"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={config.bmp_fail_rate}
            onChange={(e) =>
              updateField('bmp_fail_rate', Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))
            }
            disabled={isRunning}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500 block">Probability BMP fails</span>
        </div>

        {/* Failure Reduction */}
        <div className="space-y-1">
          <label htmlFor="input-bmp-fail-reduction" className="text-slate-400 font-medium flex items-center justify-between cursor-pointer">
            <span>Fail Reduction</span>
          </label>
          <input
            id="input-bmp-fail-reduction"
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={config.bmp_fail_reduction}
            onChange={(e) =>
              updateField('bmp_fail_reduction', Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))
            }
            disabled={isRunning}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500 block">Eff. loss on failure</span>
        </div>

        {/* Random Seed */}
        <div className="space-y-1">
          <label htmlFor="input-random-seed" className="text-slate-400 font-medium flex items-center justify-between cursor-pointer">
            <span>Random Seed</span>
            <button
              type="button"
              onClick={handleRandomizeSeed}
              disabled={isRunning}
              title="Generate new random seed"
              aria-label="Generate new random seed"
              className="text-slate-400 hover:text-emerald-400 transition cursor-pointer p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
            >
              <Dices className={`w-3.5 h-3.5 transition-transform duration-500 ${isRolling ? 'rotate-180 text-emerald-400 scale-110' : ''}`} />
            </button>
          </label>
          <input
            id="input-random-seed"
            type="number"
            value={config.random_seed}
            onChange={(e) => updateField('random_seed', parseInt(e.target.value) || 42)}
            disabled={isRunning}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500 block">Reproducible sequence</span>
        </div>
      </div>

      {/* Secondary Toggles */}
      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300 border-t border-slate-800/60">
        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.bmp_sel_prob_via_costs}
            onChange={(e) => updateField('bmp_sel_prob_via_costs', e.target.checked)}
            disabled={isRunning}
            className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
          />
          <span>Cost-Weighted Practice Selection</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.deterministic_parcel_order}
            onChange={(e) => updateField('deterministic_parcel_order', e.target.checked)}
            disabled={isRunning}
            className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
          />
          <span>Deterministic Parcel Order</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.deterministic_bmp_type_order}
            onChange={(e) => updateField('deterministic_bmp_type_order', e.target.checked)}
            disabled={isRunning}
            className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
          />
          <span>Deterministic BMP Order</span>
        </label>

        <div className="flex items-center space-x-1.5 ml-auto text-slate-400">
          <span>Buffer Depth:</span>
          <span className="font-mono text-slate-200">{config.buffer_depth_ft} ft</span>
        </div>
      </div>
    </div>
  );
};
