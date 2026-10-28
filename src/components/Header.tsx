import React from 'react';
import { Layers, Activity, Database, Droplet, Sparkles, BookOpen } from 'lucide-react';
import { PRESETS } from '../data/presets';

interface HeaderProps {
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;
  isRunning: boolean;
  totalParcels: number;
  totalOutlets: number;
  loadMode: 'statistical' | 'plet_rusle';
}

export const Header: React.FC<HeaderProps> = ({
  currentPresetId,
  onSelectPreset,
  isRunning,
  totalParcels,
  totalOutlets,
  loadMode,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Droplet className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Basin BMP Scenario Simulator
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  v0.1.0-web
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Probabilistic basin-scale Monte Carlo water-quality & conservation practice simulator
              </p>
            </div>
          </div>

          {/* Preset Selector & Quick Stats */}
          <div className="flex items-center space-x-3">
            {/* Mode Indicator */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-slate-400">Mode:</span>
              <span className="font-semibold text-teal-300 uppercase tracking-wider text-[11px]">
                {loadMode === 'plet_rusle' ? 'PLET / RUSLE' : 'Statistical'}
              </span>
            </div>

            {/* Basin Scope */}
            <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-1 rounded-lg border border-slate-800">
              <span>{totalParcels} parcels</span>
              <span className="text-slate-600">•</span>
              <span>{totalOutlets} outlet</span>
            </div>

            {/* Preset Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-400 hidden sm:inline">Preset:</span>
              <select
                value={currentPresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                disabled={isRunning}
                className="bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition disabled:opacity-50 cursor-pointer"
              >
                {Object.values(PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
