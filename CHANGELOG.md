# Changelog

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
