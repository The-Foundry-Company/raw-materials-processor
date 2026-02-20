# Changelog

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
