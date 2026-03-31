# Changelog

## [1.12.2] - 2026-03-31

### Fixed

#### Estimate View Auto-Scroll
- When the estimate display appears (after generation or returning from PDF builder), the "PROJECT ESTIMATE" banner auto-scrolls to the top of the viewport with 2rem padding
- Makes the full pricing estimate section immediately visible without manual scrolling

---

## [1.12.1] - 2026-03-31

### Fixed

#### PDF Builder Scroll Behavior
- Scroll now starts at the top of the document and progressively tracks downward as content animates in
- First 20% of animation plays without scrolling (header visible), then gradually follows the build
- Fixed issue where clicking "Download Estimate" immediately jumped to the bottom

---

## [1.12.0] - 2026-03-31

### Added

#### Lenis Smooth Scrolling
- Integrated Lenis smooth scrolling library, synced with Framer Motion's frame loop
- All animated sequences (ProcessingStage, EstimateAnimation, EstimatePDFBuilder) now auto-scroll to track the latest content as it appears
- New `useAutoScroll` hook for step-based scroll tracking
- EstimatePDFBuilder uses interval-based scroll anchor that follows the document as it builds

### Fixed

#### PDF Page Breaks
- Re-enabled `pagebreak: { mode: ['avoid-all', 'css'] }` in html2pdf.js options
- Added `break-inside: avoid` CSS to category groups and cost breakdown sections
- Prevents rows and sections from being cut in half at page boundaries

---

## [1.11.0] - 2026-03-31

### Added

#### Animated PDF Builder
- Clicking "Download Estimate" now triggers a full-screen animated document assembly sequence
- Each section of the estimate (header, metadata, total banner, materials table, cost breakdown, notes, footer) animates in sequentially using Framer Motion
- Category groups and rows appear with staggered timing for a dynamic assembly feel
- Once fully visible, the document is captured as a PDF via html2pdf.js (solves blank PDF issue since content is visibly rendered)
- "PREPARING DOWNLOAD..." indicator shows during capture
- After download, the builder fades away and the normal estimate view returns

#### "Show Me a Sample" Button
- Added a subtle "SHOW ME A SAMPLE" button above the JSON textarea on the input page
- Loads a comprehensive test schematic (26 groups, all 13 categories, all classification paths) for demo purposes

#### Shared Formatters
- Extracted `formatDiamondValue()` and `formatTotal()` to `src/utils/format.ts` for reuse across components

### Changed

#### Download System
- Replaced off-screen HTML rendering approach with on-screen animated builder + live capture
- `downloadEstimatePDF` → `captureElementAsPDF(element)` — now takes a visible DOM element ref
- Removed all off-screen container creation and HTML string template generation

---

## [1.10.2] - 2026-03-30

### Fixed

#### Estimate Table Number Formatting
- Added magnitude-aware D/ITEM formatter: 6 decimals for tiny values (<0.01), 4 for small, 2 for moderate, clean for large — values at similar scales now align
- TOTAL column now uses fixed 2 decimal places with ceil rounding (always rounds up — price estimator rule)
- Switched grid columns from `auto` to fixed widths (`4.5rem`/`7rem`/`5.5rem`) so columns don't jitter between categories
- Footer materials total uses same formatting

---

## [1.10.1] - 2026-03-30

### Fixed

#### PDF Estimate Download
- Fixed blank PDF output by removing `<!DOCTYPE html>` document wrapper that was stripped by innerHTML parser
- Replaced all `display:flex` layouts with `<table>` layouts for html2canvas compatibility
- Changed off-screen positioning from `left:-9999px` to `opacity:0; position:fixed` so html2canvas can capture the rendered content
- Switched inline SVG logo to `<img>` reference for reliable rendering

---

## [1.10.0] - 2026-03-30

### Added

#### Live Pricing Metadata from Spreadsheet
- Labor cost per block and administration fee are now fetched live from the Google Sheets pricing database on every estimate request
- CSV parser reads all 5 columns: Item ID, Value (D/item), (empty), Labor Cost (d/block), Administration Fee (%)
- Global metadata extracted from first populated row with sensible fallback defaults
- Hardcoded `LABOR_RATE` (0.05) and `ADMIN_FEE_RATE` (0.02) constants removed entirely

#### Client-Facing PDF Estimate Download
- Estimate download now generates a styled PDF instead of plain text
- Professional layout with Foundry Company logo, estimate ID, and branded color scheme
- Materials breakdown table grouped by category with per-category subtotals
- Cost breakdown section showing materials, labor, subtotal, admin fee, and project total
- Conditional notes section for fuzzy-matched and unpriced items
- PDF rendering via `html2pdf.js` (dynamically imported, code-split)

### Changed

#### Types
- Added `PricingMetadata`, `PricingData` interfaces to `types.ts`
- Added `laborRate` field to `ProjectEstimate` interface
- `parseCSV()` now returns `PricingData` instead of `PricingEntry[]`
- `calculateProjectEstimate()` now takes a `PricingMetadata` parameter

#### Tests
- Updated all pricing tests for new return shapes (24 tests, up from 18)
- Added metadata extraction tests: 5-column parsing, fallback defaults, first-value-wins

---

## [1.9.2] - 2026-03-30

### Changed

#### Build Cleanup
- Removed `tsconfig.tsbuildinfo` from version control (TypeScript build cache)
- Added `*.tsbuildinfo` to `.gitignore`

---

## [1.9.1] - 2026-03-29

### Changed

#### Logo Wordmark
- Added internal padding (12px on all sides) between yellow background and logo content
- Rounded corners on yellow background (`rx="14"`) for a squircle-like shape

---

## [1.9.0] - 2026-03-29

### Added

#### Fuzzy Matching for Pricing Database
- Items with minor misspellings or typos now auto-match to the closest database entry using Levenshtein distance
- Tiered thresholds prevent false positives: short names (<=6 chars) require distance <=1, medium names (7-15 chars) allow distance <=2, long names (>15 chars) use 85% similarity threshold
- Fuzzy-matched items display with amber tint and `~ matched_name` annotation in the estimate table
- Three-way match classification: `exact`, `fuzzy`, `missing` — items truly absent from the database stay at 0 diamonds and are flagged
- New `MatchType` union type and `fuzzyMatchedTo` field on `EstimatedItem`

#### Project Total Calculation
- Full project cost breakdown: Materials + Labor + Admin Fee = Project Total
- Labor cost: 0.05 diamonds per block placed (sum of all item quantities)
- Admin fee: 2% of subtotal (materials + labor)
- New "PROJECT COST BREAKDOWN" section in the estimate display with line items for each cost component
- Summary banner updated from "ESTIMATE" to "PROJECT ESTIMATE" showing the final project total
- `ProjectEstimate` interface encapsulating all cost components

#### Namespace Normalization
- CSV parser now strips `minecraft:` prefix from database entries during parsing
- Database can use either `minecraft:sandstone` or `sandstone` — both match correctly

### Changed

#### Estimate Animation
- Expanded from 6 to up to 11 data-driven steps: match counts, fuzzy counts (conditional), materials cost, labor calculation, admin fee, and project total
- Each cost component reveals sequentially with its calculated value

#### Estimate Display
- Items table footer renamed from "GRAND TOTAL" to "MATERIALS TOTAL"
- New project cost breakdown section below the items table
- Fuzzy-matched rows highlighted in amber (`bg-amber-50`) with `~ matched_name` annotation
- Split status messages: amber for fuzzy matches, grey for missing items
- Summary footer shows exact + fuzzy match counts

#### Download Estimate TXT
- Header now includes `Fuzzy: N` count when fuzzy matches exist
- Fuzzy-matched items annotated with `(~ matched_name)` in the line item
- New project cost breakdown section after materials total: Materials, Labor, Subtotal, Admin Fee, Project Total

#### Pricing Logic
- `generateEstimate()` uses three-step cascade: exact match → fuzzy match → missing
- `countMatched()` now returns `{ matched, fuzzy, unmatched }` (was `{ matched, unmatched }`)
- New `calculateProjectEstimate()` function computes full project cost breakdown
- Exported `LABOR_RATE` (0.05) and `ADMIN_FEE_RATE` (0.02) constants

#### New Files
- `src/utils/fuzzy.ts` — Levenshtein distance, string similarity, and tiered fuzzy matching
- `src/utils/__tests__/fuzzy.test.ts` — 23 tests for fuzzy matching (distance, similarity, thresholds, Minecraft edge cases)
- `src/utils/__tests__/pricing.test.ts` — 18 tests for CSV parsing, estimate generation, match counting, and project total calculation

#### Testing
- 217 total tests across 5 test files (was 160 across 3)
- New fuzzy matching tests cover Levenshtein correctness, tiered threshold enforcement, transposition rejection, and Minecraft-specific edge cases
- New pricing tests cover CSV namespace stripping, exact/fuzzy/missing match types, three-way counting, and project total arithmetic

## [1.8.1] - 2026-03-29

### Fixed

#### Header Layout
- Fixed "RAW MATERIALS" wrapping into two stacked lines next to the wordmark logo
- Removed PretextBlock from header titles (single-line titles don't need text measurement) — eliminates minHeight gap between "RAW MATERIALS" and "PROCESSOR"
- Added `whitespace-nowrap` to keep title on one line at all viewport widths

### Added

#### Keyboard Shortcut
- Press `G` on the output page to trigger "GENERATE ESTIMATE" (matches the `[G]` hint on the button)
- Only fires when the button is visible (`estimateState === 'idle'`) and focus is not in a text input

## [1.8.0] - 2026-03-29

### Added

#### Diamond Estimate Generator
- New "GENERATE ESTIMATE" button on the output page fetches diamond pricing from a published Google Sheet and calculates build costs
- Animated loading sequence mirrors the ProcessingStage pattern: step-by-step reveals with progress bar, coordinated with async data fetch
- Estimate table displays ITEM | QTY | D/ITEM | TOTAL columns grouped by material category
- Unmatched items (not in price database) shown with `--` in muted text, valued at 0
- Grand total footer with total quantities and total diamond cost
- Summary banner showing matched/unmatched item counts
- Error handling with retry button for network failures
- "DOWNLOAD ESTIMATE" button exports formatted TXT report with aligned columns and category groupings

#### New Files
- `src/utils/pricing.ts` — Fetches and parses Google Sheets CSV, matches items to pricing entries, calculates totals
- `src/components/EstimateAnimation.tsx` — Animated loading sequence for estimate generation (mirrors ProcessingStage)
- `src/components/EstimateDisplay.tsx` — Estimate results table with summary, category grouping, and download

#### Estimate Types
- `PricingEntry` interface: `{ itemId, diamondValue }` for spreadsheet rows
- `EstimatedItem` interface: extends ProcessedItem with `diamondValue`, `totalDiamonds`, `matched` fields

### Changed

#### Pretext Integration
- Added `@chenglou/pretext` for responsive text measurement (orphan/widow prevention, layout-shift-free rendering)
- New infrastructure: `src/lib/pretext.ts` (font helpers), `src/hooks/useContainerWidth.ts`, `src/hooks/usePretext.ts` (prepare/layout hook), `src/components/ui/PretextBlock.tsx` (drop-in wrapper)
- Applied PretextBlock to Header titles and OutputStage summary banner
- Graceful degradation: if fonts haven't loaded, components render identically to before
- Fixed text vibration bug: replaced ResizeObserver with synchronous `clientWidth` measurement + `window.resize` listener coalesced via `requestAnimationFrame` gate (matches Pretext demo architecture)

#### Branding
- Replaced PNG logo with SVG (`logo_wordmark.svg` for header, `logo_anvil.svg` for favicon)
- Added centered logo to README.md

#### Vite Configuration
- Added `optimizeDeps.include: ['@chenglou/pretext']` for pre-bundling raw TypeScript source

#### OutputStage
- Added estimate state machine (`idle` | `loading` | `done` | `error`) with local state management
- Integrated EstimateAnimation and EstimateDisplay sub-components
- AnimatePresence transitions between estimate states

#### Typography
- Replaced Google Fonts (Inter + JetBrains Mono) with self-hosted licensed fonts
- **Guton Sans Serif** (Regular through Black) for all UI text, headings, and buttons
- **IBM Plex Mono** (Regular through Bold) for data tables, code, and monospace content
- Fonts loaded via `@font-face` in `index.css` with `font-display: swap` for fast rendering
- Removed Google Fonts CDN dependency — all fonts served from `/public/fonts/`

#### Downloads
- Added `downloadEstimateTXT()` function for exporting build cost estimates as formatted TXT

## [1.7.0] - 2026-02-21

### Changed

#### Category-Based Sorting
- Output is now grouped by material category instead of pure alphabetical sort
- 13 categories in fixed display order: Wood, Stone, Brick, Terracotta, Concrete, Glass, Wool & Fabric, Copper, Metal, Lighting, Redstone, Functional, Other
- Items are sorted alphabetically within each category
- Categorization uses pattern matching on item names: exact sets, prefix patterns (`waxed_`, `oxidized_`, etc.), and suffix patterns (`_terracotta`, `_concrete`, `_wool`, etc.)
- Reuses `isLogType()` from `rules.ts` for wood detection

#### New File: `src/processor/categories.ts`
- `ItemCategory` type union defining all 13 categories
- `CATEGORY_ORDER` array defining the fixed display order
- `categorizeItem(name: string)` function for assigning items to categories

#### ProcessedItem Type
- `ProcessedItem` interface extended with `Category: string` field
- Phase 4 of the processing engine now assigns categories before sorting

#### UI
- Category header rows appear in the output table with yellow background (`bg-foundry-yellow/30`) and uppercase bold labels
- Alternating row colors (white / dark/5%) reset within each category group

#### Downloads
- TXT export now includes `── CATEGORY ──` headers between material groups
- JSON export naturally includes the `Category` field on each item

#### Testing
- 176 total tests across 3 test files (was 175)
- Replaced "sorts alphabetically" tests with "sorts by category then alphabetically" tests
- Added `Category` field to exact-shape assertions (`toEqual` checks)
- New tests verify cross-category ordering and within-category alphabetical sorting

## [1.6.0] - 2026-02-21

### Changed

#### Animated Error Messages
- Input validation errors now display with spring-animated error cards that pop in with scale and fade transitions
- Textarea shakes horizontally on invalid input using a Framer Motion keyframe sequence
- Error border pulses red twice using a new `border-pulse` CSS keyframe animation
- Format errors returned from the processing stage now show in a spring-animated banner in App.tsx with `!!` prefix

#### Funny Rotating Error Messages
- Empty input, invalid JSON, and wrong-format errors each pull from a pool of randomized humorous messages
- Empty input pool (4 messages): e.g., "The textarea is emptier than a stripped chunk."
- Invalid JSON pool (9 messages): e.g., "This JSON is more broken than a wooden pickaxe on obsidian."
- Wrong format pool (4 messages): e.g., "Nice JSON. Wrong format. We need Litematica output."

#### Styling
- Added `border-pulse` CSS keyframe animation to `src/index.css` for pulsing red borders on error state
- Error cards use consistent `border-[3px] border-red-500 bg-red-50` styling with bold `!!` prefix

## [1.5.0] - 2026-02-20

### Changed

#### Excluded Items
- `dirt` and `grass_block` are now silently excluded from processing output
- The material source provider does not collect these blocks, so they are dropped before classification
- Exclusion happens immediately after Phase 1 (flatten & deduplicate), preventing these items from entering any downstream processing

#### Testing
- 175 total tests across 3 test files (was 174)
- Added dedicated exclusion test verifying dirt and grass_block are dropped while other items process normally
- Updated all tests that previously used dirt as a pass-through example to use obsidian or calcite instead
- Removed dirt and grass_block from large integration test input and assertions
- Removed dirt and grass_block from Medieval Village fake project input and assertions

## [1.4.0] - 2026-02-20

### Changed

#### Generic Wood Item Decomposition
- Chest, crafting table, composter, and ladder now decompose to logs instead of appearing as standalone line items
- These items have no wood-type prefix, so they merge into the **dominant log type** already in the output (highest quantity of `*_log`, `*_stem`, or `bamboo_block`)
- If no logs exist in the output, defaults to `oak_log`
- Bamboo-dominant builds use the correct 2:1 planks-per-block ratio; all others use 4:1
- Plank costs per item: chest (8), crafting_table (4), composter (3.5), ladder (3.5)

#### Furnace Decomposition
- Furnace now decomposes to 8 cobblestone (single-material recipe, added to `NON_WOOD_DECOMPOSITION`)
- Resolves through the existing variant system like iron doors and pressure plates

#### Processing Screen
- New "RESOLVING GENERIC WOOD ITEMS..." step appears in the processing animation when generic wood items are present
- Shows count of generic wood items converted to logs

#### Testing
- 174 total tests across 3 test files (was 160)
- Added 8 new tests: chest, crafting_table, composter, ladder decomposition, dominant log merging, bamboo ratio, and furnace decomposition
- Updated deduplication test (chest → oak_log), full integration test (dark_oak_log 560→581, furnace→cobblestone), and functional items list
- Updated extensive test suite (single item test, large mixed list oak_log 26→50)
- Updated fake project tests: Desert Temple (+oak_log:8), Modern Office (birch_log 889→903, count 12→10), Medieval Village (spruce_log 472→502, +cobblestone:64)

## [1.3.0] - 2026-02-20

### Changed

#### Stripped Wood Decomposition
- All 23 stripped wood items now decompose 1:1 to their non-stripped base form (axe-stripping is free and lossless)
- Pattern-based resolution covers all overworld logs (9), overworld wood (9), nether stems (2), nether hyphae (2), and bamboo block (1)
- Stripped items that appear as pass-through (RawItem == ResultItem) are now correctly removed from the pass-through set and flow through normal variant classification
- Recursive resolver naturally consolidates stripped items with any existing quantities of the base log

#### Processing Screen
- Completely redesigned processing animation with dynamic, data-driven steps
- Steps now display real-time stats from the actual input data (group counts, unique items, classification breakdown, stripped item count, final output count)
- Action steps (e.g., "CLASSIFYING MATERIALS...") show with `>` prefix, "DONE" badge with scale-in animation
- Stat sub-steps (e.g., "37 UNIQUE ITEMS IDENTIFIED") appear indented with fade-down animation
- Variable timing: action steps hold 500ms, stat steps appear quickly at 250ms for a natural terminal-like feel
- Processing logic moved from App.tsx into ProcessingStage for a cleaner architecture (ProcessingStage now returns the result via `onComplete(result)`)
- Fallback static steps shown if input parsing fails before animation

#### Testing
- Added resolveVariant tests for stripped items (5 representative cases)
- Updated pass-through tests: stripped items now decompose instead of passing through
- Updated full integration test: stripped items consolidate with base logs
- Updated fake project tests (Projects 2, 4, 5) with correct merged quantities

## [1.2.1] - 2026-02-20

### Changed

#### Branding
- Increased header logo size from 40px to 64px for better legibility
- Added subtle rounded corners to the header logo

## [1.2.0] - 2026-02-20

### Changed

#### Full Single-Chain Decomposition
- If an item's entire crafting chain uses only ONE unique base raw material, it is now collapsed all the way to that base block
- **Planks → logs**: All 12 wood types' planks now decompose to their log/stem/bamboo_block (4:1 ratio, bamboo 2:1)
- **Processed blocks → raw base**: 22 single-chain processed blocks now decompose to their rawest block form:
  - Stone chain: stone_bricks, cracked_stone_bricks, smooth_stone → stone
  - Sandstone chain: smooth_sandstone → sandstone, smooth_red_sandstone → red_sandstone
  - Polished stones: polished_andesite → andesite, polished_diorite → diorite, polished_granite → granite, polished_basalt → basalt
  - Deepslate chain: polished_deepslate, deepslate_bricks, deepslate_tiles → cobbled_deepslate
  - Blackstone chain: polished_blackstone, polished_blackstone_bricks → blackstone
  - Tuff chain: polished_tuff, tuff_bricks → tuff
  - Others: end_stone_bricks → end_stone, quartz_bricks/quartz_pillar → quartz_block, purpur_pillar → purpur_block, bamboo_mosaic → bamboo_planks, smooth_quartz → quartz_block
- **Recursive resolution** (Phase 3b): Multi-level chains resolve automatically (e.g., stone_brick_slab → stone_bricks → stone, bamboo_mosaic → bamboo_planks → bamboo_block)
- Items that stay as processed blocks (multi-material or non-block base): mossy_stone_bricks, bricks, nether_bricks, red_nether_bricks, prismarine_bricks, dark_prismarine, purpur_block, mud_bricks, packed_mud, bamboo_block

#### JSON File Upload
- Added "Upload JSON" button on the input screen for loading `.json` files directly from disk
- Client-side only (FileReader API), no server interaction required
- Populates the textarea so the user can review before processing

#### Branding
- Changed browser tab title to "Foundry RMP"

#### Testing
- Updated all 3 test files for new decomposition behavior
- Added resolveVariant tests for planks and single-chain processed blocks

## [1.1.0] - 2026-02-20

### Changed

#### Single-Material Decomposition
- Items whose entire crafting chain uses only ONE unique base raw material are now collapsed to that base material instead of being kept as functional items
- Doors, trapdoors, fences, fence gates, signs, wall signs, buttons, and pressure plates made from a single material now resolve to their base (e.g., `oak_door` → `oak_log`, `iron_door` → `iron_ingot`)
- Programmatic resolution via wood-type lookup table and suffix-based crafting ratios (no static map bloat)
- 12 wood types supported with correct standard and bamboo ratios
- 10 non-wood items supported (iron/copper doors & trapdoors, stone/polished_blackstone buttons & pressure plates, weighted pressure plates)
- `nether_brick_fence` now correctly consolidates into `nether_bricks` (previously blocked by functional classification)
- `_hanging_sign` remains functional (uses chains = iron + stripped logs = multiple materials)
- All `waxed_`/`oxidized_`/`weathered_`/`exposed_` prefixed items remain functional

#### Branding
- Replaced favicon with new logo (`logo1.png`)

#### Testing
- Updated to 167 total tests across 3 test files (was 160)
- Updated isFunctional, resolveVariant, and integration tests for decomposition behavior
- Updated all 5 fake project test suites with correct decomposed quantities

## [1.0.0] - 2026-02-20

### Added

#### Processing Engine
- 4-phase processing algorithm: Flatten & Deduplicate, Classify, Consolidate, Format & Sort
- MAX-based deduplication for items appearing across multiple raw material groups
- 5 classification categories: PASS_THROUGH, FUNCTIONAL, PROCESSED_BLOCK, VARIANT, UNKNOWN
- Functional item detection via exact match set (62 items), prefix patterns (waxed_, oxidized_, weathered_, exposed_), suffix patterns (_door, _trapdoor, _fence, etc.), and ending patterns (_terracotta, _glazed_terracotta, _stained_glass_pane, etc.)
- Processed block set (32 blocks) for items like stone_bricks, smooth_sandstone, polished_diorite, deepslate_tiles, tuff_bricks, etc.
- Variant resolution with stonecutter ratios: stairs (1:1), slabs (1:2 with ceil), walls (1:1), chiseled_ prefix (1:1), cut_ prefix (1:1)
- Special variant mapping table for pluralization edge cases (brick_stairs → bricks, deepslate_tile_slab → deepslate_tiles, tuff_brick_stairs → tuff_bricks)
- Special variant mapping for wood → planks (all 12 wood types: oak, spruce, birch, jungle, acacia, dark_oak, mangrove, cherry, bamboo, crimson, warped, pale_oak)
- Input validation with detailed format checking
- Glass items (glass, glass_pane, tinted_glass) included in functional items set

#### Web Application
- Three-stage UI: Input, Processing (animated), Output
- Brutalist design with Foundry Company branding (yellow #F4D03F, dark #2D2D2D)
- Framer Motion animations for stage transitions and processing sequence
- Monospace JSON textarea with validation and error display
- Animated processing stage with 5 staged messages and progress bar
- Results table with striped rows, sorted alphabetically
- JSON download (pretty-printed array of {Item, Quantity} objects)
- TXT download (formatted report with header, date, aligned columns)
- START OVER button to reset to input stage
- Responsive single-column layout
- Google Fonts: Inter (headings) + JetBrains Mono (code/data)

#### Testing
- 160 total tests across 3 test files
- `processor.test.ts`: 39 tests covering core logic, all classification categories, deduplication, variant consolidation, special mappings, and full integration test against sample data
- `extensive.test.ts`: 79 tests covering edge cases, stress tests, all variant types, all wood types, all terracotta colors, large quantities, unknown items, and validation
- `fake-lists.test.ts`: 42 tests with 5 realistic fake project lists (Desert Temple, Modern Office, Nether Fortress, Tuff & Copper House, Medieval Village)

#### Infrastructure
- Vite + React 18 + TypeScript project setup
- Tailwind CSS with custom Foundry Company color theme
- Vitest test runner configuration
- Production build outputs static dist/ for Vercel deployment
