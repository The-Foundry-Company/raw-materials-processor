# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server with hot reload
npm run build      # tsc -b && vite build → dist/
npm test           # Vitest in watch mode (223 tests)
npx vitest run     # Run tests once without watch
npx vitest run src/processor/__tests__/processor.test.ts  # Run a single test file
npx vitest run -t "test name pattern"                     # Run tests matching a pattern
```

## Architecture

Client-side-only React app that processes over-decomposed Minecraft schematic material exports back into consolidated build materials lists. No backend — all processing runs in-browser. Deployed as static files to Vercel.

**Tech:** React 18 + TypeScript (strict) + Vite + Tailwind CSS 3 + Framer Motion

### Processing Engine (`src/processor/`)

The core business logic is a pure function `process()` in `index.ts` that runs a **4-phase algorithm**:

1. **Flatten & Deduplicate** — Collect all `Results` entries; when the same `ResultItem` appears in multiple groups, take **MAX** (never sum — the export tool lists the same item through multiple raw material paths)
2. **Classify** — Each item is categorized in priority order: PASS_THROUGH → FUNCTIONAL → PROCESSED_BLOCK → VARIANT → UNKNOWN
3. **Consolidate** — Convert variants to base blocks using stonecutter ratios (`ceil(count / ratio)`), then **recursively resolve** intermediate items (e.g., `stone_brick_slab` → `stone_bricks` → `stone`)
4. **Format & Sort** — Output as `{ Item, Quantity }[]` sorted alphabetically

Classification rules and all mappings live in `rules.ts`. Key concepts:
- **Functional items:** Crafted items kept as-is (torches, doors, chests, etc.) — matched by exact set, prefix patterns (`waxed_*`), and suffix patterns (`_door`, `_fence`, etc.)
- **Processed blocks:** Already-processed blocks that are line items themselves (stone_bricks, smooth_stone, etc.)
- **Variants:** Items that consolidate to a base via suffix (`_stairs` 1:1, `_slab` 1:2, `_wall` 1:1) or prefix (`chiseled_`, `cut_`)
- **Special mapping table:** Handles pluralization edge cases (`brick_stairs` → `bricks`, not `brick`) and wood variants → planks
- **Single-chain decomposition:** Processed blocks → raw base (planks → logs at 4:1, polished_granite → granite, etc.)
- **Stripped wood:** `stripped_*` items decompose 1:1 to their non-stripped base form

- **Excluded items:** `dirt` and `grass_block` are silently dropped (not collected by material providers)

Type definitions are in `types.ts`. Namespace helpers `stripNamespace()`/`addNamespace()` handle the `minecraft:` prefix.

### Material Categories (`src/processor/categories.ts`)

Output items are grouped into 13 ordered categories (Wood, Stone, Brick, Terracotta, Concrete, Glass, Wool & Fabric, Copper, Metal, Lighting, Redstone, Functional, Other). `categorizeItem()` assigns a category based on set membership, prefix/suffix patterns, and `isLogType()` from rules. Categories control grouping in the output table and TXT downloads.

### Pretext Integration (`src/lib/pretext.ts`, `src/hooks/usePretext.ts`)

Uses `@chenglou/pretext` for text measurement and layout (orphan/widow prevention via `findTightWidth()`). The `usePretext` hook waits for custom fonts to load, caches `prepare()` calls, and exposes `measureHeight`/`shrinkwrap` helpers. Used by `PretextBlock` component. **Critical:** Never use `ResizeObserver` with Pretext — use sync `clientWidth` + `window.resize` + RAF gate instead.

### Estimate Engine (`src/utils/`)

The estimate generator in `pricing.ts` fetches live pricing from a published Google Sheets CSV on every estimate request (no caching). The spreadsheet has 5 columns: Item ID, Value (D/item), (empty), Labor Cost (d/block), Administration Fee (%). Key functions:

- **`fetchPricingData()`** — Returns `PricingData` containing `entries: PricingEntry[]` + `metadata: PricingMetadata` (labor rate + admin fee parsed from first populated row)
- **`parseCSV()`** — Parses all 5 CSV columns; extracts global metadata from columns 4-5 (first non-empty value wins). Falls back to defaults if columns are missing.
- **`generateEstimate()`** — Three-step matching cascade: exact → fuzzy → missing. Fuzzy matching uses Levenshtein distance with tiered thresholds (`src/utils/fuzzy.ts`)
- **`calculateProjectEstimate(estimate, metadata)`** — Full project costing using live rates from the spreadsheet. `PricingMetadata` carries `laborRate` (d/block) and `adminFeeRate` (fractional).

Types: `PricingMetadata`, `PricingData`, `MatchType` (`exact` | `fuzzy` | `missing`), `ProjectEstimate` (wraps items + cost breakdown + `laborRate` + `adminFeeRate`)

The estimate download renders a styled HTML document and exports it as a PDF via `html2pdf.js` (dynamically imported). The PDF includes the Foundry Company logo, materials breakdown by category with subtotals, cost breakdown, and notes.

### UI (`src/components/`)

Three-stage state machine managed in `App.tsx`:
- **InputStage** — JSON textarea + file upload (FileReader API)
- **ProcessingStage** — Animated progress bar with dynamic, data-driven step reveals
- **OutputStage** — Results table + JSON/TXT download buttons + estimate generator + PDF estimate download

Each stage is a presentational component that communicates via callbacks (`onSubmit`, `onComplete`, `onReset`). No state management library — just `useState` in App.

### Styling

Brutalist design with Foundry Company branding. Custom colors in `tailwind.config.ts`:
- `foundry-yellow: #F4D03F`, `foundry-dark: #2D2D2D`
- Fonts: Guton Sans Serif (UI), IBM Plex Mono (data/code) — self-hosted in `public/fonts/`

## Testing

Five test files across two directories (223 total):

`src/processor/__tests__/`:
- `processor.test.ts` — Core unit tests + integration (59 tests)
- `extensive.test.ts` — Stress tests, all variant types, edge cases (79 tests)
- `fake-lists.test.ts` — 5 realistic project material lists (38 tests)

`src/utils/__tests__/`:
- `fuzzy.test.ts` — Levenshtein distance, similarity, fuzzy matching thresholds (23 tests)
- `pricing.test.ts` — CSV parsing, metadata extraction, estimate generation, match counting, project totals with dynamic rates (24 tests)

Tests cover classification accuracy, deduplication (MAX behavior), variant ratios, recursive chain resolution, fuzzy matching edge cases, and project cost arithmetic.

## Key Design Decisions

- **Stonecutter ratios** are used (not crafting table) because they're the most material-efficient method
- **Pass-through items** (where `RawItem == ResultItem`) skip classification, *unless* they can be decomposed (e.g., stripped logs)
- **Recursive resolution** in Phase 3b loops until no more intermediate items can be resolved
- **`minecraft:` prefix** is stripped internally for matching, re-added for output
