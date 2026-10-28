import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingDown,
  Calculator,
  Layers,
  MapPin,
  CloudRain,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { SimulationControls } from './components/SimulationControls';
import { OutletTrajectoriesView } from './components/OutletTrajectoriesView';
import { ScenarioMetricsView } from './components/ScenarioMetricsView';
import { BmpPortfolioView } from './components/BmpPortfolioView';
import { ParcelExplorerView } from './components/ParcelExplorerView';
import { PletDiagnosticsView } from './components/PletDiagnosticsView';
import { ConfigEditorView } from './components/ConfigEditorView';
import { PRESETS } from './data/presets';
import { SimulationConfig, SimulationResult } from './types/model';
import { runSimulation } from './sim/simulator';

type ActiveTab = 'trajectories' | 'metrics' | 'portfolio' | 'parcels' | 'diagnostics' | 'config';

export function App() {
  const [currentPresetId, setCurrentPresetId] = useState<string>('east_fork_plet_deterministic');
  const activePreset = PRESETS[currentPresetId] || PRESETS.east_fork_plet_deterministic;

  const [config, setConfig] = useState<SimulationConfig>(activePreset.config);
  const [parcels, setParcels] = useState(activePreset.parcels);
  const [outlets, setOutlets] = useState(activePreset.outlets);
  const [efficiencies, setEfficiencies] = useState(activePreset.efficiencies);
  const [costComponents, setCostComponents] = useState(activePreset.costComponents);
  const [climateForcing, setClimateForcing] = useState(activePreset.climateForcing);

  const [activeTab, setActiveTab] = useState<ActiveTab>('trajectories');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentScenarioNum, setCurrentScenarioNum] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Switch preset
  const handleSelectPreset = (presetId: string) => {
    const p = PRESETS[presetId];
    if (!p) return;
    setCurrentPresetId(presetId);
    setConfig(p.config);
    setParcels(p.parcels);
    setOutlets(p.outlets);
    setEfficiencies(p.efficiencies);
    setCostComponents(p.costComponents);
    setClimateForcing(p.climateForcing);
  };

  // Run simulation
  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    setProgress(0);
    setCurrentScenarioNum(1);

    // Run asynchronously to allow UI renders
    setTimeout(() => {
      try {
        const simResult = runSimulation(
          config,
          parcels,
          outlets,
          efficiencies,
          costComponents,
          climateForcing,
          (prog, curScen) => {
            setProgress(prog);
            setCurrentScenarioNum(curScen);
          }
        );
        setResult(simResult);
      } catch (err) {
        console.error('Simulation failed:', err);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  }, [config, parcels, outlets, efficiencies, costComponents, climateForcing]);

  // Initial simulation run on load
  useEffect(() => {
    handleRunSimulation();
  }, [currentPresetId]);

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'trajectories', label: 'Outlet Trajectories', icon: TrendingDown },
    { id: 'metrics', label: 'Scenario Metrics', icon: Calculator },
    { id: 'portfolio', label: 'BMP Portfolio', icon: Layers },
    { id: 'parcels', label: 'Parcel Ledger', icon: MapPin },
    { id: 'diagnostics', label: 'PLET Diagnostics', icon: CloudRain },
    { id: 'config', label: 'Config & Export', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentPresetId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        isRunning={isRunning}
        totalParcels={parcels.length}
        totalOutlets={outlets.length}
        loadMode={config.load_generation.mode}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Preset Description Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-emerald-400">{activePreset.name}:</span>
            <span className="text-slate-300">{activePreset.description}</span>
          </div>
          <span className="text-slate-500 font-mono hidden sm:inline">
            Seed: {config.random_seed}
          </span>
        </div>

        {/* Simulation Controls Component */}
        <SimulationControls
          config={config}
          onChangeConfig={setConfig}
          isRunning={isRunning}
          progress={progress}
          currentScenarioNum={currentScenarioNum}
          onRun={handleRunSimulation}
          executionTimeMs={result?.executionTimeMs}
        />

        {/* Navigation Tabs */}
        <div className="border-b border-slate-800 flex space-x-1 sm:space-x-2 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-300 bg-slate-900/90'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Views */}
        <div className="animate-fadeIn">
          {activeTab === 'trajectories' && (
            <OutletTrajectoriesView result={result} outlets={outlets} />
          )}

          {activeTab === 'metrics' && <ScenarioMetricsView result={result} />}

          {activeTab === 'portfolio' && <BmpPortfolioView result={result} />}

          {activeTab === 'parcels' && (
            <ParcelExplorerView parcels={parcels} loadMode={config.load_generation.mode} />
          )}

          {activeTab === 'diagnostics' && (
            <PletDiagnosticsView
              forcing={climateForcing}
              sampleParcel={parcels[0] || { pid: 1, area_ha: 40, perim_m: 2500 }}
            />
          )}

          {activeTab === 'config' && (
            <ConfigEditorView
              config={config}
              efficiencies={efficiencies}
              costComponents={costComponents}
              result={result}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          Basin BMP Scenario Simulator • Based on EPA PLET and NRCS conservation practice standards • Probabilistic Monte Carlo watershed modeling
        </p>
      </footer>
    </div>
  );
}
export default App;
