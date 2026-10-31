# Palette's Journal - Critical UX Learnings

## 2025-05-18 - Form Input Accessibility & Tactile Micro-Interactions in Simulation Controls
**Learning:** In scientific simulation apps with dense numeric parameter grids, form labels are frequently rendered as simple `<span>` elements without programmatic `htmlFor`/`id` bindings. This breaks screen reader identification and makes clicking on labels ineffective. Furthermore, icon-only randomization buttons (such as RNG seed re-rolls) often lack accessible names (`aria-label`) and visual confirmation beyond the number changing.
**Action:** Pair every parameter input with explicit `htmlFor`/`id` bindings and cursor feedback (`cursor-pointer` on label), provide descriptive `aria-label` attributes on icon-only trigger buttons, and supply quick, playful micro-animations (e.g. 500ms rotation transition on dice/refresh icons) with clear keyboard focus rings (`focus-visible:ring-1`).
