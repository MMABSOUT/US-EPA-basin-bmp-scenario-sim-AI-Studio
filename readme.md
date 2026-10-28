# Basin BMP Scenario Simulator (Web Application)

An interactive, probabilistic basin-scale best management practice (BMP) scenario simulator built with React, TypeScript, Vite, and Tailwind CSS.

## Overview

`basin-bmp-scenario-sim` evaluates how uncertainty in pollutant generation, BMP placement, effectiveness, costs, and failure affects basin and outlet pollutant-load outcomes. It provides a full Monte Carlo scenario framework for annualized parcel and outlet nutrient loads (Total Nitrogen, Total Phosphorus, and Total Suspended Solids).

## Features

- **Dual Load-Generation Modes**:
  - **PLET / RUSLE Mode**: Uses EPA PLET-style Curve Number (CN) hydrology, event rainfall depth, annual runoff and infiltration volumes, and RUSLE gross soil loss ($R \times K \times LS \times C \times P$) to establish surface and subsurface pathway loads.
  - **Statistical Mode**: Direct parcel load-rate inputs partitioned across user-defined pathways (surface, shallow subsurface, deep subsurface).
- **Comprehensive BMP Conservation Practices**:
  - Infield practices: Residue Management / No-Till (CPS 329), Cover Crops (CPS 340), Nutrient Management (CPS 590), Land Retirement (CPS 327).
  - Buffer practices: Grassed Waterways (CPS 412) with perimeter and buffer depth geometry.
  - Edge-of-field structures: Constructed Wetlands (CPS 656) with pool area heuristics and upstream contributing parcel treatment.
- **Probabilistic Monte Carlo Engine**:
  - Full distribution sampling (fixed value, Normal / truncated normal, uniform, and piecewise percentile interpolation).
  - BMP failure rates and realized performance reduction.
  - Reproducible seed sequence generation (`random_seed`).
  - Serial stacking: subsequent practices operate on remaining parcel loads.
- **Economic & Cost Modeling**:
  - Component-based NRCS costing (seed, establishment, termination, grading, earthwork, vegetation).
  - Optional cost-weighted BMP selection favoring lower-cost practices.
  - Stopping criteria on maximum BMP count (`bmp_limit_n`) or total budget (`bmp_limit_usd`).
- **Interactive Visualizations**:
  - **Outlet Trajectories**: Multi-scenario trajectories comparing Load vs BMP Count and Cost ($) with TMDL / water quality target thresholds and attainment probability.
  - **Scenario Metrics**: Mass-based summaries (baseline mass, treated baseline mass, removed mass, realized efficiency, overall reduction) avoiding premature ratio averaging.
  - **BMP Portfolio**: Implementation breakdown, cost curves, and step-by-step placement ledger.
  - **Parcel Universe Explorer**: Search, filter, and sort parcels by land cover, Hydrologic Soil Group (HSG), area, and delivery ratios.
  - **PLET Diagnostics**: Event runoff depth, infiltration, CN matrix, and RUSLE soil erosion parameters.
  - **YAML & CSV Export**: Real-time export of YAML configuration and CSV scenario summaries.

## Getting Started

### Development
```bash
npm install
npm run dev
```

The application will start on port 3000 (`http://localhost:3000`).

### Production Build
```bash
npm run build
```
