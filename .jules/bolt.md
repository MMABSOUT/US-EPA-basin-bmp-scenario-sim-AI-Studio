# Bolt's Performance Journal

## 2025-10-31 - Incremental Load Tracking in Monte Carlo Simulation Engine
**Learning:** In iterative watershed BMP simulations with trajectories recorded at frequent intervals, evaluating total remaining basin load and routed outlet loads from scratch takes $O(P \times \text{parcels} \times \text{pathways})$ work per step, dominating CPU time (consuming >70% of execution). Precomputing static parcel routing parameters, indexing efficiency records by `(cps, pollutant, pathway)`, and maintaining running load totals incrementally upon each BMP mass removal drops trajectory evaluation to $O(1)$ and speeds up the entire simulation run by ~72% (from ~202 ms to ~56 ms).
**Action:** When simulating progressive mitigation or reduction algorithms with step-by-step trajectory recording, always maintain running load accumulators incrementally rather than recalculating aggregate parcel universe loads per step.
