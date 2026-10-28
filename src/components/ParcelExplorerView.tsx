import React, { useState } from 'react';
import { MapPin, Search, Filter, ArrowUpDown } from 'lucide-react';
import { ParcelInput, Pollutant } from '../types/model';
import { DEFAULT_PLET_HYDROLOGY_LOOKUP } from '../sim/pletRusle';

interface ParcelExplorerViewProps {
  parcels: ParcelInput[];
  loadMode: 'statistical' | 'plet_rusle';
}

export const ParcelExplorerView: React.FC<ParcelExplorerViewProps> = ({
  parcels,
  loadMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLc, setSelectedLc] = useState<string>('all');
  const [selectedHsg, setSelectedHsg] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'pid' | 'area' | 'load'>('pid');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter & sort
  const filtered = parcels.filter((p) => {
    if (selectedLc !== 'all' && p.land_cover?.toLowerCase() !== selectedLc) return false;
    if (selectedHsg !== 'all' && p.hsg !== selectedHsg) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        String(p.pid).toLowerCase().includes(q) ||
        (p.land_cover && p.land_cover.toLowerCase().includes(q))
      );
    }
    return true;
  });

  filtered.sort((a, b) => {
    let diff = 0;
    if (sortBy === 'pid') {
      diff = Number(a.pid) - Number(b.pid);
    } else if (sortBy === 'area') {
      diff = a.area_ha - b.area_ha;
    }
    return sortAsc ? diff : -diff;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const landCovers = Array.from(new Set(parcels.map((p) => p.land_cover?.toLowerCase()).filter(Boolean)));
  const hsgs = Array.from(new Set(parcels.map((p) => p.hsg).filter(Boolean)));

  const totalArea = parcels.reduce((sum, p) => sum + p.area_ha, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>Watershed Parcel Universe</span>
          </h3>
          <p className="text-xs text-slate-400">
            {parcels.length} parcels • Total Area: <span className="text-slate-200 font-mono font-medium">{totalArea.toFixed(1)} ha</span> ({(totalArea * 2.47105).toFixed(0)} acres)
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Land Cover Filter */}
          <select
            value={selectedLc}
            onChange={(e) => {
              setSelectedLc(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value="all">All Land Covers</option>
            {landCovers.map((lc) => (
              <option key={lc} value={lc}>
                {lc}
              </option>
            ))}
          </select>

          {/* HSG Filter */}
          <select
            value={selectedHsg}
            onChange={(e) => {
              setSelectedHsg(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value="all">All Soil Groups (HSG)</option>
            {hsgs.map((h) => (
              <option key={h} value={h}>
                HSG {h}
              </option>
            ))}
          </select>

          {/* Sort By Area Toggle */}
          <button
            onClick={() => {
              if (sortBy === 'area') {
                setSortAsc(!sortAsc);
              } else {
                setSortBy('area');
                setSortAsc(false);
              }
            }}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition ${
              sortBy === 'area'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>Area</span>
          </button>
        </div>
      </div>

      {/* Parcels Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-800/60 text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
            <tr>
              <th className="py-2.5 px-3">PID</th>
              <th className="py-2.5 px-3 text-right">Area (ha)</th>
              <th className="py-2.5 px-3 text-right">Perimeter (m)</th>
              <th className="py-2.5 px-3 font-sans">Land Cover</th>
              <th className="py-2.5 px-3 text-center">HSG</th>
              <th className="py-2.5 px-3 text-right">CN</th>
              <th className="py-2.5 px-3 text-right">Inf. Frac</th>
              <th className="py-2.5 px-3 text-right">Upstream Links</th>
              <th className="py-2.5 px-3 text-right">Delivery (SDR / NDR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {paged.map((p) => {
              const lc = (p.land_cover?.toLowerCase() || 'cropland') as keyof typeof DEFAULT_PLET_HYDROLOGY_LOOKUP;
              const hsg = p.hsg || 'B';
              const lookup = DEFAULT_PLET_HYDROLOGY_LOOKUP[lc]?.[hsg] || DEFAULT_PLET_HYDROLOGY_LOOKUP.cropland.B;
              const cn = p.curve_number ?? lookup.cn;
              const inf = p.infiltration_fraction ?? lookup.infiltration_fraction;

              return (
                <tr key={String(p.pid)} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-semibold text-slate-100">{String(p.pid)}</td>
                  <td className="py-2 px-3 text-right text-emerald-300 font-semibold">
                    {p.area_ha.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {p.perim_m.toFixed(0)}
                  </td>
                  <td className="py-2 px-3 font-sans capitalize text-slate-200">
                    {p.land_cover || 'Cropland'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-teal-300 border border-slate-700">
                      {p.hsg || 'B'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-amber-300">{cn}</td>
                  <td className="py-2 px-3 text-right text-cyan-300">{(inf * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right text-[11px] text-slate-400">
                    {p.upstream_pids && p.upstream_pids.length > 0
                      ? p.upstream_pids.join(', ')
                      : 'None (headwater)'}
                  </td>
                  <td className="py-2 px-3 text-right text-[11px] text-slate-400">
                    {p.delivery_ratios
                      ? `${(p.delivery_ratios.sdr_f_to_s ?? 1) * (p.delivery_ratios.sdr_s_to_o ?? 1)} / ${(p.delivery_ratios.ndr_f_to_s ?? 1) * (p.delivery_ratios.ndr_s_to_o ?? 1)}`
                      : '1.0 / 1.0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3">
          <span>
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length} parcels
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
