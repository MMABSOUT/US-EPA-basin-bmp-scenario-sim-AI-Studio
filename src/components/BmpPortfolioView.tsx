import React, { useState } from 'react';
import { Layers, ShieldAlert, DollarSign, Sprout, Search, CheckCircle, XCircle } from 'lucide-react';
import { SimulationResult } from '../types/model';
import { getBmpNameByCps } from '../sim/costModel';

interface BmpPortfolioViewProps {
  result: SimulationResult | null;
}

export const BmpPortfolioView: React.FC<BmpPortfolioViewProps> = ({ result }) => {
  const [filterCps, setFilterCps] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  if (!result || result.allPlacements.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <Layers className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-slate-300">No BMP Placement Data</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Run a simulation to view individual BMP assignments, practice frequencies, and cost distributions.
        </p>
      </div>
    );
  }

  // Aggregate stats by CPS code
  const cpsMap: Record<
    number,
    { count: number; totalCost: number; failedCount: number; treatedMassTN: number }
  > = {};

  for (const pl of result.allPlacements) {
    if (!cpsMap[pl.cps]) {
      cpsMap[pl.cps] = { count: 0, totalCost: 0, failedCount: 0, treatedMassTN: 0 };
    }
    cpsMap[pl.cps].count++;
    cpsMap[pl.cps].totalCost += pl.cost_usd;
    if (pl.failed) cpsMap[pl.cps].failedCount++;
    cpsMap[pl.cps].treatedMassTN += pl.treated_mass_kg.TN || 0;
  }

  // Filter placements
  const filteredPlacements = result.allPlacements.filter((pl) => {
    if (filterCps !== 'all' && pl.cps !== filterCps) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        String(pl.pid).toLowerCase().includes(q) ||
        pl.bmp_name.toLowerCase().includes(q) ||
        String(pl.cps).includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPlacements.length / pageSize);
  const pagedList = filteredPlacements.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      {/* Practice Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {Object.entries(cpsMap).map(([cpsStr, data]) => {
          const cps = Number(cpsStr);
          const name = getBmpNameByCps(cps);
          const avgCost = data.count > 0 ? data.totalCost / data.count : 0;
          const failRate = data.count > 0 ? (data.failedCount / data.count) * 100 : 0;

          return (
            <div
              key={cps}
              onClick={() => {
                setFilterCps(filterCps === cps ? 'all' : cps);
                setPage(1);
              }}
              className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition select-none ${
                filterCps === cps
                  ? 'border-emerald-500 bg-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono font-semibold text-emerald-400">CPS {cps}</span>
                <span className="text-[10px] text-slate-500">{data.count} placed</span>
              </div>
              <h4 className="text-xs font-semibold text-slate-100 mt-1 line-clamp-1">{name}</h4>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Avg Cost:</span>
                <span className="text-amber-300 font-semibold">${Math.round(avgCost).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono mt-0.5">
                <span className="text-slate-400">Failure:</span>
                <span className={failRate > 0 ? 'text-rose-400' : 'text-slate-400'}>
                  {failRate.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* BMP Placements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-100">BMP Implementation Log</h3>
            <span className="text-xs text-slate-500">
              ({filteredPlacements.length} records)
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PID or practice..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  Prev
                </button>
                <span className="text-slate-400 text-xs">
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/60 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
              <tr>
                <th className="py-2.5 px-3">Step</th>
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Parcel PID</th>
                <th className="py-2.5 px-3">CPS</th>
                <th className="py-2.5 px-3 font-sans">Practice Name</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Cost ($)</th>
                <th className="py-2.5 px-3 text-right">Treated TN (kg)</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">Removed TN (kg)</th>
                <th className="py-2.5 px-3 text-right">Geometry / Area</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {pagedList.map((pl, i) => (
                <tr key={`${pl.scenario}-${pl.step}-${i}`} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-500">#{pl.step}</td>
                  <td className="py-2 px-3 text-slate-400">Scen {pl.scenario}</td>
                  <td className="py-2 px-3 font-semibold text-slate-100">{String(pl.pid)}</td>
                  <td className="py-2 px-3 text-emerald-400 font-semibold">{pl.cps}</td>
                  <td className="py-2 px-3 font-sans text-slate-200">{pl.bmp_name}</td>
                  <td className="py-2 px-3 text-center">
                    {pl.failed ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800">
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        Operational
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-amber-300 font-semibold">
                    ${Math.round(pl.cost_usd).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {pl.treated_mass_kg.TN.toFixed(1)}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-300 font-semibold">
                    {pl.removed_mass_kg.TN.toFixed(1)}
                  </td>
                  <td className="py-2 px-3 text-right text-[11px] text-slate-400">
                    {pl.buffer_area_ha !== undefined
                      ? `${pl.buffer_area_ha.toFixed(2)} ha buffer`
                      : pl.wetland_area_ha !== undefined
                      ? `${pl.wetland_area_ha.toFixed(2)} ha pool`
                      : 'Infield (100%)'}
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
