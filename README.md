# Raw Materials Processor

A client-side web application for the **Foundry Company**, a Minecraft construction company. Engineers paste raw material JSON exports from schematic analysis tools and receive a clean, consolidated materials list ready for the Materials Source Provider (MSP).

## The Problem

When architects export schematics, the export tool decomposes items too aggressively:

- Torches become coal + sticks
- Sandstone becomes raw sand
- Iron splits across blocks, ingots, and nuggets
- The same crafted item (e.g., `lantern`) appears in multiple raw material groups with the same quantity

This produces a messy, over-decomposed list that's impractical for material sourcing. **This processor reverses that decomposition**, consolidating everything back into the actual blocks and items needed for construction.

## Tech Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** (brutalist aesthetic with Foundry Company branding)
- **Framer Motion** (stage transitions and processing animation)
- **Vitest** (160 unit/integration tests)
- No backend — all processing runs client-side
- Deploys to **Vercel** as a static site

## Quick Start

```bash
npm install
npm run dev      # Start dev server
npm test         # Run all 160 tests
npm run build    # Production build
```

## Project Structure

```
src/
  processor/
    types.ts              # TypeScript interfaces
    rules.ts              # Classification rules, variant mappings, ratios
    index.ts              # process() function — the 4-phase engine
    __tests__/
      processor.test.ts   # Core unit tests + sample data integration test
      extensive.test.ts   # Stress tests, edge cases, all variant types
      fake-lists.test.ts  # 5 realistic fake project lists
  components/
    Header.tsx            # Logo + title
    InputStage.tsx        # JSON textarea + submit
    ProcessingStage.tsx   # Animated loading sequence
    OutputStage.tsx       # Results table + download buttons
  utils/
    download.ts           # JSON and TXT download helpers
  App.tsx                 # Stage state management
  main.tsx                # Entry point
  index.css               # Tailwind + global styles
```

---

## Processing Engine — Complete Technical Reference

This section documents the processing engine in enough detail to recreate it from scratch.

### Input Format

The engine accepts a JSON array of `RawItemGroup` objects:

```typescript
interface ResultEntry {
  ResultItem: string;    // e.g., "minecraft:red_sandstone_stairs"
  ResultTotal: number;   // e.g., 88
}

interface RawItemGroup {
  RawItem: string;       // The raw material, e.g., "minecraft:sand"
  TotalEstimate: number; // Ignored by processor (used by export tool)
  Steps: unknown[];      // Ignored by processor
  Results: ResultEntry[];// The actual items this raw material produces
}
```

A single `ResultItem` can appear in multiple `RawItemGroup`s. For example, `minecraft:lantern` might appear under `iron_block`, `iron_ingot`, `iron_nugget`, `oak_log`, `coal_block`, and `coal` — all with the same `ResultTotal: 46`. These are **not additive** — they represent the same build need decomposed through different raw material paths.

### Output Format

```typescript
interface ProcessedItem {
  Item: string;      // e.g., "minecraft:red_sandstone"
  Quantity: number;  // e.g., 911
}
```

Output is a flat array sorted alphabetically by `Item`.

---

### The 4-Phase Algorithm

#### Phase 1: Flatten & Deduplicate

**Goal:** Extract all `Results` entries across all `RawItemGroup`s into a single flat map. When the same `ResultItem` appears in multiple groups, take the **MAX** `ResultTotal`, not the sum.

**Why MAX, not SUM:** The export tool decomposes the same final item through multiple raw material paths. If a build needs 46 lanterns, the tool might list that need under `iron_block` (for the iron), `iron_ingot`, `iron_nugget`, `oak_log` (for sticks), `coal_block`, and `coal`. Each listing says "ResultTotal: 46" — it's the same 46 lanterns, not 6 x 46 = 276. Taking the MAX correctly captures the actual quantity.

**Implementation:**

```
for each RawItemGroup:
  for each ResultEntry in group.Results:
    if ResultItem already in map:
      map[ResultItem] = MAX(existing, ResultTotal)
    else:
      map[ResultItem] = ResultTotal
```

**After Phase 1, we also build a pass-through set:** any `ResultItem` that equals its parent `RawItem` (e.g., `obsidian` producing `obsidian`, `dirt` producing `dirt`) is marked as pass-through.

#### Phase 2: Classify Each Item

Each deduplicated item is classified into one of 5 categories. Classification is checked **in this order** (first match wins):

##### 1. PASS_THROUGH

**Condition:** The item's `ResultItem` equals the `RawItem` in any group.

**Examples:** `obsidian`, `dirt`, `grass_block`, `stripped_spruce_log`, `calcite`, `flowering_azalea`

**Behavior:** Keep the item as-is with its original quantity.

##### 2. FUNCTIONAL

**Condition:** The item is a crafted/placed item that should not be decomposed further. Checked via:

**Exact match set** (62 items):
```
torch, soul_torch, lantern, soul_lantern, sea_lantern, glowstone,
end_rod, lightning_rod, chest, trapped_chest, ender_chest,
crafting_table, furnace, blast_furnace, smoker, lectern, bell,
lodestone, iron_bars, chain, anvil, brewing_stand, enchanting_table,
beacon, conduit, respawn_anchor, campfire, soul_campfire, bookshelf,
chiseled_bookshelf, flower_pot, armor_stand, item_frame,
glow_item_frame, painting, bed, barrel, composter, grindstone,
smithing_table, stonecutter, cartography_table, fletching_table,
loom, hopper, dropper, dispenser, observer, piston, sticky_piston,
redstone_lamp, daylight_detector, target, tnt, ladder, scaffolding,
glass, glass_pane, tinted_glass
```

**Prefix patterns** (item starts with):
```
waxed_       → waxed_copper_block, waxed_exposed_copper, etc.
oxidized_    → oxidized_copper_trapdoor, etc.
weathered_   → weathered_copper, etc.
exposed_     → exposed_copper, etc.
```

**Suffix patterns** (item ends with):
```
_door, _trapdoor, _fence, _fence_gate, _sign, _hanging_sign,
_wall_sign, _pressure_plate, _button
```

**Ending patterns** (item ends with):
```
_terracotta, _stained_glass_pane, _stained_glass,
_glazed_terracotta, _carpet, _banner, _candle, _bed,
_shulker_box, _concrete, _concrete_powder, _wool
```

**Special case:** Plain `terracotta` (uncolored) is also functional.

**Behavior:** Keep the item as-is with its original quantity.

##### 3. PROCESSED_BLOCK

**Condition:** The item is in the processed blocks set — blocks that have been crafted/smelted into a specific form and should be kept as their own line item.

**The set includes:**
```
stone_bricks, cracked_stone_bricks, mossy_stone_bricks, smooth_stone,
smooth_sandstone, smooth_red_sandstone, smooth_quartz,
polished_andesite, polished_diorite, polished_granite,
polished_deepslate, polished_blackstone, polished_blackstone_bricks,
polished_basalt, polished_tuff, deepslate_bricks, deepslate_tiles,
tuff_bricks, bricks, nether_bricks, red_nether_bricks,
end_stone_bricks, prismarine_bricks, dark_prismarine,
purpur_block, purpur_pillar, quartz_bricks, quartz_pillar,
mud_bricks, packed_mud, bamboo_mosaic, bamboo_block
```

**Important:** `chiseled_*` and `cut_*` items are **NOT** processed blocks — they are variants (see below). This is critical: `chiseled_red_sandstone` consolidates to `red_sandstone`, it does not stay as its own line.

**Behavior:** Keep the item as-is. However, if variant items consolidate INTO a processed block (e.g., `stone_brick_stairs` → `stone_bricks`), the quantities accumulate.

##### 4. VARIANT

**Condition:** The item can be resolved to a base block via suffix stripping, prefix stripping, or a special mapping table. Resolution is checked in this order:

**Step A — Special mapping table** (checked first, overrides generic stripping):

These exist because naive suffix/prefix stripping produces wrong base blocks:

| Variant | Base Block | Why Special |
|---------|-----------|-------------|
| `deepslate_tile_slab` | `deepslate_tiles` | Pluralization (not `deepslate_tile`) |
| `deepslate_tile_stairs` | `deepslate_tiles` | Pluralization |
| `deepslate_tile_wall` | `deepslate_tiles` | Pluralization |
| `tuff_brick_slab` | `tuff_bricks` | Pluralization |
| `tuff_brick_stairs` | `tuff_bricks` | Pluralization |
| `tuff_brick_wall` | `tuff_bricks` | Pluralization |
| `chiseled_tuff_bricks` | `tuff_bricks` | Pluralization |
| `chiseled_tuff` | `tuff` | Direct mapping |
| `brick_slab` | `bricks` | Pluralization (not `brick`) |
| `brick_stairs` | `bricks` | Pluralization |
| `brick_wall` | `bricks` | Pluralization |
| `stone_brick_slab` | `stone_bricks` | Pluralization |
| `stone_brick_stairs` | `stone_bricks` | Pluralization |
| `stone_brick_wall` | `stone_bricks` | Pluralization |
| `mossy_stone_brick_*` | `mossy_stone_bricks` | Pluralization |
| `deepslate_brick_*` | `deepslate_bricks` | Pluralization |
| `nether_brick_*` | `nether_bricks` | Pluralization |
| `red_nether_brick_*` | `red_nether_bricks` | Pluralization |
| `end_stone_brick_*` | `end_stone_bricks` | Pluralization |
| `mud_brick_*` | `mud_bricks` | Pluralization |
| `prismarine_brick_*` | `prismarine_bricks` | Pluralization |
| `polished_blackstone_brick_*` | `polished_blackstone_bricks` | Pluralization |
| `oak_slab`/`oak_stairs` | `oak_planks` | Wood → planks |
| `spruce_slab`/`spruce_stairs` | `spruce_planks` | Wood → planks |
| `birch_slab`/`birch_stairs` | `birch_planks` | Wood → planks |
| `jungle_slab`/`jungle_stairs` | `jungle_planks` | Wood → planks |
| `acacia_slab`/`acacia_stairs` | `acacia_planks` | Wood → planks |
| `dark_oak_slab`/`dark_oak_stairs` | `dark_oak_planks` | Wood → planks |
| `mangrove_slab`/`mangrove_stairs` | `mangrove_planks` | Wood → planks |
| `cherry_slab`/`cherry_stairs` | `cherry_planks` | Wood → planks |
| `bamboo_slab`/`bamboo_stairs` | `bamboo_planks` | Wood → planks |
| `bamboo_mosaic_slab`/`stairs` | `bamboo_mosaic` | Special base |
| `crimson_slab`/`crimson_stairs` | `crimson_planks` | Wood → planks |
| `warped_slab`/`warped_stairs` | `warped_planks` | Wood → planks |
| `pale_oak_slab`/`pale_oak_stairs` | `pale_oak_planks` | Wood → planks |

**Step B — Suffix-based variants** (if no special mapping matched):

| Suffix | Ratio | Meaning |
|--------|-------|---------|
| `_stairs` | 1:1 | 1 stair needs 1 base block (stonecutter recipe) |
| `_slab` | 1:2 | 2 slabs from 1 base block; use `ceil(count / 2)` |
| `_wall` | 1:1 | 1 wall needs 1 base block |

The base block is the item name with the suffix removed: `sandstone_stairs` → `sandstone`.

**Step C — Prefix-based variants** (if no suffix matched):

| Prefix | Ratio |
|--------|-------|
| `chiseled_` | 1:1 |
| `cut_` | 1:1 |

The base block is the item name with the prefix removed: `chiseled_red_sandstone` → `red_sandstone`.

**Behavior:** Convert to base block quantity using `ceil(count / ratio)` and accumulate into the base block's total.

##### 5. UNKNOWN (fallback)

**Condition:** None of the above matched.

**Behavior:** Keep as-is (treated like PASS_THROUGH).

#### Phase 3: Consolidate Variants

For each VARIANT item, calculate the base blocks needed and accumulate:

```
baseBlocksNeeded = ceil(variantCount / ratio)
baseBlockTotal += baseBlocksNeeded
```

All other classifications (FUNCTIONAL, PROCESSED_BLOCK, PASS_THROUGH, UNKNOWN) keep their quantities as-is and are added directly to the output map. If a variant resolves to a base block that also appears as a PROCESSED_BLOCK or PASS_THROUGH, their quantities combine.

**Example — red_sandstone consolidation:**

| Source Item | Quantity | Classification | Contribution to `red_sandstone` |
|-------------|----------|---------------|-------------------------------|
| `red_sandstone` | 42 | PASS_THROUGH | +42 |
| `red_sandstone_stairs` | 1 | VARIANT (1:1) | +1 |
| `chiseled_red_sandstone` | 836 | VARIANT (1:1) | +836 |
| `cut_red_sandstone` | 32 | VARIANT (1:1) | +32 |
| **Total** | | | **911** |

**Example — tuff_bricks consolidation:**

| Source Item | Quantity | Classification | Contribution to `tuff_bricks` |
|-------------|----------|---------------|------------------------------|
| `chiseled_tuff_bricks` | 146 | VARIANT (1:1) | +146 |
| `tuff_brick_slab` | 56 | VARIANT (1:2) | +ceil(56/2) = +28 |
| `tuff_brick_stairs` | 342 | VARIANT (1:1) | +342 |
| **Total** | | | **516** |

#### Phase 4: Format & Sort

Convert the output map to an array of `{ Item, Quantity }` objects, sorted alphabetically by `Item`. The `minecraft:` namespace prefix is preserved in all item names.

---

### Namespace Handling

All items use the `minecraft:` namespace prefix in the input/output. Internally, classification and variant resolution strip the prefix for matching (e.g., `minecraft:red_sandstone_stairs` → `red_sandstone_stairs`), then re-add it when writing to the output.

### Key Design Decisions

1. **MAX not SUM for deduplication** — The export tool lists the same need under multiple raw materials. Summing would wildly inflate quantities.

2. **Stonecutter ratios** — We use stonecutter conversion rates (1:1 for stairs/walls, 1:2 for slabs) because the stonecutter is the most material-efficient crafting method.

3. **`ceil()` for slabs** — If a build needs 15 slabs, you need `ceil(15/2) = 8` base blocks (you can't use half a block).

4. **Special mapping table** — Generic suffix stripping fails for plural forms (`brick_stairs` → `brick` is wrong, should be `bricks`) and wood items (`birch_stairs` → `birch` is wrong, should be `birch_planks`). The special mapping table handles all known edge cases.

5. **Classification priority** — PASS_THROUGH > FUNCTIONAL > PROCESSED_BLOCK > VARIANT > UNKNOWN. This ensures that items like `nether_brick_fence` (which matches both `_fence` functional suffix and `nether_brick_` variant mapping) are correctly classified as functional.

---

### Expected Output for Sample Data

Key consolidated items when processing the sample file:

| Item | Quantity | How |
|------|----------|-----|
| `red_sandstone` | 911 | 42 direct + 1 stairs + 836 chiseled + 32 cut |
| `tuff_bricks` | 516 | 146 chiseled + 28 slabs + 342 stairs |
| `cracked_stone_bricks` | 396 | Processed block, kept as-is |
| `grass_block` | 372 | Pass-through |
| `dirt` | 350 | Pass-through |
| `bricks` | 306 | 22 processed + 284 stairs |
| `light_blue_terracotta` | 256 | Functional, kept as-is |
| `cyan_terracotta` | 246 | Functional, kept as-is |
| `yellow_terracotta` | 229 | Functional, kept as-is |
| `sandstone` | 224 | 217 direct + 7 from 14 slabs |
| `white_terracotta` | 217 | Functional, kept as-is |
| `stone_bricks` | 213 | Processed block, kept as-is |
| `polished_blackstone_bricks` | 208 | Processed block, kept as-is |
| `stripped_spruce_log` | 187 | Pass-through |
| `smooth_sandstone` | 180 | 92 processed + 88 stairs |
| `deepslate_tiles` | 176 | 4 from 8 slabs + 172 stairs |
| `calcite` | 160 | Pass-through |
| `warped_planks` | 155 | 155 stairs |
| `diorite` | 92 | 92 walls |
| `birch_trapdoor` | 92 | Functional, kept as-is |
| `polished_diorite` | 84 | 84 from stairs |
| `waxed_copper_block` | 78 | Functional, kept as-is |
| `sea_lantern` | 70 | Functional, kept as-is |
| `black_stained_glass_pane` | 62 | Functional, kept as-is |
| `smooth_stone` | 56 | Processed block, kept as-is |
| `glowstone` | 56 | Functional, kept as-is |
| `dark_oak_trapdoor` | 50 | Functional, kept as-is |
| `lantern` | 46 | Functional, MAX across sources |
| `iron_bars` | 46 | Functional, MAX across sources |
| `birch_planks` | 16 | 8 from 16 slabs + 8 stairs |

---

## Web App

### Three Stages

1. **Input** — Paste raw materials JSON, click PROCESS
2. **Processing** — Animated loading sequence (~3s artificial delay with staged messages)
3. **Output** — Results table with DOWNLOAD JSON / DOWNLOAD TXT buttons, START OVER to reset

### Branding

- **Yellow:** `#F4D03F` (from Foundry Company logo)
- **Dark:** `#2D2D2D` (from logo)
- **Background:** Off-white `#f5f5f0`
- Brutalist aesthetic: thick 3px borders, sharp corners, heavy sans-serif type
- Fonts: Inter (headings/UI) + JetBrains Mono (JSON/table data)

### Downloads

- **JSON** — Pretty-printed array of `{ Item, Quantity }` objects
- **TXT** — Human-readable report with header, date, item count, and aligned item x quantity lines

---

## Testing

```bash
npm test              # Run all 160 tests
npx vitest run        # Run once (no watch)
```

### Test Coverage

**`processor.test.ts`** (39 tests)
- Input validation (valid, invalid, edge cases)
- Classification accuracy for all categories
- Deduplication (MAX behavior)
- Variant consolidation with ratios
- Special mapping tests (pluralization, wood → planks)
- Full integration test against sample data with 40+ assertions

**`extensive.test.ts`** (79 tests)
- Empty/minimal inputs
- Deduplication stress (5+ groups, identical quantities)
- All variant types (stairs, slabs, walls, chiseled, cut)
- All 12 wood types → planks
- All pluralization special mappings
- All 16 colored terracotta + glazed variants
- All functional item categories (doors, trapdoors, fences, signs, glass)
- Processed block behavior
- Large quantities (999,999+)
- Unknown/modded items
- 100-group performance test
- Comprehensive validation edge cases

**`fake-lists.test.ts`** (42 tests)
- 5 realistic fake project lists inspired by actual sample data:
  - **Desert Temple Expansion** — Heavy sandstone variants + glazed terracotta
  - **Modern Office Building** — Glass, polished stone, copper, birch wood
  - **Nether Fortress Rebuild** — Nether bricks, blackstone, deepslate
  - **Tuff & Copper Modern House** — 1.21+ tuff bricks, copper oxidation states
  - **Medieval Village** — Mixed wood types, stone brick variants, terracotta roofs

---

## Deployment

Build produces a static `dist/` directory ready for Vercel:

```bash
npm run build
```

Deploy to Vercel via `vercel` CLI or connect the GitHub repository.
