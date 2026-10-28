import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Target, TrendingDown, DollarSign, Layers, Award } from 'lucide-react';
import { OutletTarget, Pollutant, SimulationResult } from '../types/model';

interface OutletTrajectoriesViewProps {
  result: SimulationResult | null;
  outlets: OutletTarget[];
}

export const OutletTrajectoriesView: React.FC<OutletTrajectoriesViewProps> = ({
  result,
  outlets,
}) => {
  const [selectedPollutant, setSelectedPollutant] = useState<Pollutant>('TN');
  const [xAxisMode, setXAxisMode] = useState<'count' | 'cost'>('count');
  const [yAxisMode, setYAxisMode] = useState<'load' | 'reduction'>('load');

  if (!result || Object.keys(result.trajectoriesByScenario).length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <TrendingDown className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-slate-300">No Simulation Data Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Configure parameters above and click "Run Simulation" to generate outlet trajectories, load reduction curves, and target attainment statistics.
        </p>
      </div>
    );
  }

  const primaryOutlet = outlets[0] || { oid: '1', name: 'Basin Outlet', targets: {}, baseline_means: {} };
  const targetLoad = primaryOutlet.targets[selectedPollutant];
  const baselineMean = primaryOutlet.baseline_means?.[selectedPollutant];
  const attainmentRate = (result.attainmentProbabilities[primaryOutlet.oid]?.[selectedPollutant] ?? 0) * 100;

  // Process trajectory points for Recharts
  // Combine all scenarios into aligned steps
  const maxStep = Math.max(
    ...Object.values(result.trajectoriesByScenario).map((t) => (t.length > 0 ? t[t.length - 1].step : 0))
  );

  // Group by step index
  const stepMap: Record<number, { count: number; costSum: number; loads: number[]; reductions: number[] }> = {};
  for (const pts of Object.values(result.trajectoriesByScenario)) {
    for (const pt of pts) {
      if (!stepMap[pt.step]) {
        stepMap[pt.step] = { count: pt.bmp_count, costSum: 0, loads: [], reductions: [] };
      }
      stepMap[pt.step].costSum += pt.cost_usd;
      stepMap[pt.step].loads.push(pt.total_load[selectedPollutant] || 0);
      stepMap[pt.step].reductions.push(pt.percent_reduction[selectedPollutant] || 0);
    }
  }

  const chartData = Object.keys(stepMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((step) => {
      const data = stepMap[step];
      const n = data.loads.length || 1;
      const sortedLoads = [...data.loads].sort((a, b) => a - b);
      const sortedRed = [...data.reductions].sort((a, b) => a - b);

      const medianLoad = sortedLoads[Math.floor(sortedLoads.length / 2)] || 0;
      const p10Load = sortedLoads[Math.floor(sortedLoads.length * 0.1)] || sortedLoads[0] || 0;
      const p90Load = sortedLoads[Math.floor(sortedLoads.length * 0.9)] || sortedLoads[sortedLoads.length - 1] || 0;

      const medianRed = sortedRed[Math.floor(sortedRed.length / 2)] || 0;
      const avgCost = data.costSum / n;

      return {
        step,
        bmp_count: data.count,
        cost_usd: Math.round(avgCost),
        median_load: Math.round(medianLoad),
        p10_load: Math.round(p10Load),
        p90_load: Math.round(p90Load),
        median_reduction: parseFloat(medianRed.toFixed(2)),
      };
    });

  const pollutantUnits: Record<Pollutant, string> = {
    TN: 'kg Total Nitrogen / yr',
    TP: 'kg Total Phosphorus / yr',
    TSS: 'kg Total Suspended Solids / yr',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-emerald-400" />
            <span>Outlet Trajectories & Water Quality Targets</span>
          </h2>
          <p className="text-xs text-slate-400">
            Outlet: <span className="text-slate-200 font-medium">{primaryOutlet.name || primaryOutlet.oid}</span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pollutant Tabs */}
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

          {/* X Axis Mode */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setXAxisMode('count')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                xAxisMode === 'count'
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BMP Count
            </button>
            <button
              onClick={() => setXAxisMode('cost')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                xAxisMode === 'cost'
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cost ($)
            </button>
          </div>

          {/* Y Axis Mode */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setYAxisMode('load')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                yAxisMode === 'load'
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Load (kg)
            </button>
            <button
              onClick={() => setYAxisMode('reduction')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                yAxisMode === 'reduction'
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              % Reduction
            </button>
          </div>
        </div>
      </div>

      {/* Target Attainment Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Target Load</span>
            <Target className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">
            {targetLoad !== undefined ? `${targetLoad.toLocaleString()} kg` : 'None specified'}
          </div>
          <span className="text-[10px] text-slate-500">TMDL / WQ Standard</span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Final Median Load</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {chartData.length > 0
              ? `${chartData[chartData.length - 1].median_load.toLocaleString()} kg`
              : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500">
            {chartData.length > 0 ? `${chartData[chartData.length - 1].median_reduction}% median reduction` : ''}
          </span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Target Attainment</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            {targetLoad !== undefined ? `${attainmentRate.toFixed(1)}%` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500">
            {targetLoad !== undefined
              ? `${result.scenarios.filter((s) => s.attained[primaryOutlet.oid]?.[selectedPollutant]).length}/${result.scenarios.length} scenarios meet target`
              : 'No target configured'}
          </span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80 sm:h-96 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey={xAxisMode === 'count' ? 'bmp_count' : 'cost_usd'}
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) =>
                xAxisMode === 'cost' ? `$${(v / 1000).toFixed(0)}k` : `${v}`
              }
              label={{
                value: xAxisMode === 'count' ? 'Cumulative BMP Count' : 'Total Investment Cost (USD)',
                position: 'insideBottom',
                offset: -10,
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) =>
                yAxisMode === 'reduction'
                  ? `${v}%`
                  : v >= 1000000
                  ? `${(v / 1000000).toFixed(1)}M`
                  : v >= 1000
                  ? `${(v / 1000).toFixed(0)}k`
                  : `${v}`
              }
              label={{
                value: yAxisMode === 'reduction' ? 'Load Reduction (%)' : `Annual Load (${selectedPollutant} kg/yr)`,
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(val: any, name: any) => {
                if (name === 'Median Reduction') return [`${val}%`, name];
                if (typeof val === 'number') return [`${val.toLocaleString()} kg`, name];
                return [val, name];
              }}
              labelFormatter={(l) =>
                xAxisMode === 'cost' ? `Cost: $${Number(l).toLocaleString()}` : `BMP Count: ${l}`
              }
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />

            {/* Target Line */}
            {yAxisMode === 'load' && targetLoad !== undefined && (
              <ReferenceLine
                y={targetLoad}
                stroke="#f43f5e"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Target: ${targetLoad.toLocaleString()} kg`,
                  fill: '#fb7185',
                  position: 'top',
                  fontSize: 11,
                }}
              />
            )}

            {yAxisMode === 'load' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="median_load"
                  name="Median Scenario Load"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="p90_load"
                  name="90th Percentile (Upper Bound)"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p10_load"
                  name="10th Percentile (Lower Bound)"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="median_reduction"
                name="Median Reduction (%)"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/60 pt-3">
        <span>Units: {pollutantUnits[selectedPollutant]}</span>
        <span>Monte Carlo envelope derived from {result.scenarios.length} replicated scenarios</span>
      </div>
    </div>
  );
};
