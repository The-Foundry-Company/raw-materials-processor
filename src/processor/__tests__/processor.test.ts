import { describe, it, expect } from 'vitest';
import { process, validateInput } from '../index';
import {
  isFunctional,
  resolveVariant,
  stripNamespace,
  PROCESSED_BLOCKS,
} from '../rules';
import type { RawInput } from '../types';

// ── Helper to build a simple RawInput ──

function makeInput(
  entries: { raw: string; results: { item: string; total: number }[] }[]
): RawInput {
  return entries.map((e) => ({
    RawItem: e.raw,
    TotalEstimate: 0,
    Steps: [],
    Results: e.results.map((r) => ({
      ResultItem: r.item,
      ResultTotal: r.total,
    })),
  }));
}

// ═══════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════

describe('validateInput', () => {
  it('accepts valid input', () => {
    const input = makeInput([
      { raw: 'minecraft:dirt', results: [{ item: 'minecraft:dirt', total: 10 }] },
    ]);
    expect(validateInput(input)).toBe(true);
  });

  it('rejects non-array input', () => {
    expect(validateInput({})).toBe(false);
    expect(validateInput('hello')).toBe(false);
    expect(validateInput(null)).toBe(false);
  });

  it('rejects array with invalid items', () => {
    expect(validateInput([{ foo: 'bar' }])).toBe(false);
    expect(validateInput([{ RawItem: 'x' }])).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// Classification: Functional items
// ═══════════════════════════════════════════════════════════

describe('isFunctional', () => {
  it('matches exact functional items', () => {
    expect(isFunctional('torch')).toBe(true);
    expect(isFunctional('lantern')).toBe(true);
    expect(isFunctional('sea_lantern')).toBe(true);
    expect(isFunctional('glowstone')).toBe(true);
    expect(isFunctional('iron_bars')).toBe(true);
    expect(isFunctional('lodestone')).toBe(true);
    expect(isFunctional('bell')).toBe(true);
    expect(isFunctional('glass')).toBe(true);
    expect(isFunctional('glass_pane')).toBe(true);
    expect(isFunctional('tinted_glass')).toBe(true);
  });

  it('doors/fences/signs are no longer functional (decomposed to base)', () => {
    expect(isFunctional('spruce_door')).toBe(false);
    expect(isFunctional('dark_oak_trapdoor')).toBe(false);
    expect(isFunctional('birch_fence')).toBe(false);
    expect(isFunctional('birch_fence_gate')).toBe(false);
    expect(isFunctional('oak_sign')).toBe(false);
    expect(isFunctional('oak_button')).toBe(false);
    expect(isFunctional('stone_pressure_plate')).toBe(false);
  });

  it('hanging signs remain functional', () => {
    expect(isFunctional('oak_hanging_sign')).toBe(true);
    expect(isFunctional('spruce_hanging_sign')).toBe(true);
  });

  it('iron/copper doors remain functional via waxed/oxidized prefix', () => {
    // oxidized_copper_trapdoor starts with 'oxidized_' → functional
    expect(isFunctional('oxidized_copper_trapdoor')).toBe(true);
    expect(isFunctional('waxed_copper_block')).toBe(true);
  });

  it('matches terracotta patterns', () => {
    expect(isFunctional('cyan_terracotta')).toBe(true);
    expect(isFunctional('white_terracotta')).toBe(true);
    expect(isFunctional('terracotta')).toBe(true);
    expect(isFunctional('orange_glazed_terracotta')).toBe(true);
  });

  it('matches stained glass pane patterns', () => {
    expect(isFunctional('black_stained_glass_pane')).toBe(true);
    expect(isFunctional('red_stained_glass_pane')).toBe(true);
  });

  it('matches waxed/oxidized items', () => {
    expect(isFunctional('waxed_copper_block')).toBe(true);
    expect(isFunctional('oxidized_copper_trapdoor')).toBe(true);
  });

  it('does not match non-functional items', () => {
    expect(isFunctional('dirt')).toBe(false);
    expect(isFunctional('sandstone')).toBe(false);
    expect(isFunctional('stone_bricks')).toBe(false);
    expect(isFunctional('red_sandstone_stairs')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// Classification: Processed blocks
// ═══════════════════════════════════════════════════════════

describe('PROCESSED_BLOCKS', () => {
  it('includes multi-material and non-block-base processed blocks', () => {
    expect(PROCESSED_BLOCKS.has('mossy_stone_bricks')).toBe(true);
    expect(PROCESSED_BLOCKS.has('bricks')).toBe(true);
    expect(PROCESSED_BLOCKS.has('nether_bricks')).toBe(true);
    expect(PROCESSED_BLOCKS.has('red_nether_bricks')).toBe(true);
    expect(PROCESSED_BLOCKS.has('prismarine_bricks')).toBe(true);
    expect(PROCESSED_BLOCKS.has('dark_prismarine')).toBe(true);
    expect(PROCESSED_BLOCKS.has('purpur_block')).toBe(true);
    expect(PROCESSED_BLOCKS.has('mud_bricks')).toBe(true);
    expect(PROCESSED_BLOCKS.has('packed_mud')).toBe(true);
    expect(PROCESSED_BLOCKS.has('bamboo_block')).toBe(true);
  });

  it('does not include single-chain decomposable blocks', () => {
    expect(PROCESSED_BLOCKS.has('stone_bricks')).toBe(false);
    expect(PROCESSED_BLOCKS.has('polished_diorite')).toBe(false);
    expect(PROCESSED_BLOCKS.has('deepslate_tiles')).toBe(false);
    expect(PROCESSED_BLOCKS.has('tuff_bricks')).toBe(false);
    expect(PROCESSED_BLOCKS.has('smooth_sandstone')).toBe(false);
    expect(PROCESSED_BLOCKS.has('smooth_stone')).toBe(false);
    expect(PROCESSED_BLOCKS.has('polished_blackstone_bricks')).toBe(false);
  });

  it('does not include raw blocks', () => {
    expect(PROCESSED_BLOCKS.has('dirt')).toBe(false);
    expect(PROCESSED_BLOCKS.has('sandstone')).toBe(false);
    expect(PROCESSED_BLOCKS.has('cobblestone')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// Variant resolution
// ═══════════════════════════════════════════════════════════

describe('resolveVariant', () => {
  it('resolves generic suffix variants', () => {
    expect(resolveVariant('sandstone_stairs')).toEqual({ base: 'sandstone', ratio: 1 });
    expect(resolveVariant('sandstone_slab')).toEqual({ base: 'sandstone', ratio: 2 });
    expect(resolveVariant('diorite_wall')).toEqual({ base: 'diorite', ratio: 1 });
  });

  it('resolves generic prefix variants', () => {
    expect(resolveVariant('chiseled_red_sandstone')).toEqual({ base: 'red_sandstone', ratio: 1 });
    expect(resolveVariant('cut_red_sandstone')).toEqual({ base: 'red_sandstone', ratio: 1 });
  });

  it('resolves special mappings for pluralization', () => {
    expect(resolveVariant('deepslate_tile_stairs')).toEqual({ base: 'deepslate_tiles', ratio: 1 });
    expect(resolveVariant('deepslate_tile_slab')).toEqual({ base: 'deepslate_tiles', ratio: 2 });
    expect(resolveVariant('tuff_brick_stairs')).toEqual({ base: 'tuff_bricks', ratio: 1 });
    expect(resolveVariant('tuff_brick_slab')).toEqual({ base: 'tuff_bricks', ratio: 2 });
    expect(resolveVariant('chiseled_tuff_bricks')).toEqual({ base: 'tuff_bricks', ratio: 1 });
    expect(resolveVariant('brick_stairs')).toEqual({ base: 'bricks', ratio: 1 });
    expect(resolveVariant('brick_slab')).toEqual({ base: 'bricks', ratio: 2 });
    expect(resolveVariant('brick_wall')).toEqual({ base: 'bricks', ratio: 1 });
  });

  it('resolves wood → planks mappings', () => {
    expect(resolveVariant('birch_slab')).toEqual({ base: 'birch_planks', ratio: 2 });
    expect(resolveVariant('birch_stairs')).toEqual({ base: 'birch_planks', ratio: 1 });
    expect(resolveVariant('warped_stairs')).toEqual({ base: 'warped_planks', ratio: 1 });
    expect(resolveVariant('warped_slab')).toEqual({ base: 'warped_planks', ratio: 2 });
    expect(resolveVariant('dark_oak_stairs')).toEqual({ base: 'dark_oak_planks', ratio: 1 });
  });

  it('decomposes wood doors to logs', () => {
    expect(resolveVariant('oak_door')).toEqual({ base: 'oak_log', ratio: 2 });
    expect(resolveVariant('spruce_door')).toEqual({ base: 'spruce_log', ratio: 2 });
    expect(resolveVariant('bamboo_door')).toEqual({ base: 'bamboo_block', ratio: 1 });
  });

  it('decomposes wood signs to logs', () => {
    expect(resolveVariant('oak_sign')).toEqual({ base: 'oak_log', ratio: 24 / 13 });
    expect(resolveVariant('birch_wall_sign')).toEqual({ base: 'birch_log', ratio: 24 / 13 });
  });

  it('decomposes wood buttons and pressure plates to logs', () => {
    expect(resolveVariant('oak_button')).toEqual({ base: 'oak_log', ratio: 4 });
    expect(resolveVariant('spruce_pressure_plate')).toEqual({ base: 'spruce_log', ratio: 2 });
  });

  it('decomposes planks to logs', () => {
    expect(resolveVariant('oak_planks')).toEqual({ base: 'oak_log', ratio: 4 });
    expect(resolveVariant('spruce_planks')).toEqual({ base: 'spruce_log', ratio: 4 });
    expect(resolveVariant('bamboo_planks')).toEqual({ base: 'bamboo_block', ratio: 2 });
    expect(resolveVariant('crimson_planks')).toEqual({ base: 'crimson_stem', ratio: 4 });
    expect(resolveVariant('warped_planks')).toEqual({ base: 'warped_stem', ratio: 4 });
  });

  it('decomposes single-chain processed blocks to raw base', () => {
    expect(resolveVariant('stone_bricks')).toEqual({ base: 'stone', ratio: 1 });
    expect(resolveVariant('cracked_stone_bricks')).toEqual({ base: 'stone', ratio: 1 });
    expect(resolveVariant('smooth_stone')).toEqual({ base: 'stone', ratio: 1 });
    expect(resolveVariant('polished_diorite')).toEqual({ base: 'diorite', ratio: 1 });
    expect(resolveVariant('polished_granite')).toEqual({ base: 'granite', ratio: 1 });
    expect(resolveVariant('deepslate_tiles')).toEqual({ base: 'cobbled_deepslate', ratio: 1 });
    expect(resolveVariant('deepslate_bricks')).toEqual({ base: 'cobbled_deepslate', ratio: 1 });
    expect(resolveVariant('tuff_bricks')).toEqual({ base: 'tuff', ratio: 1 });
    expect(resolveVariant('polished_blackstone_bricks')).toEqual({ base: 'blackstone', ratio: 1 });
    expect(resolveVariant('polished_blackstone')).toEqual({ base: 'blackstone', ratio: 1 });
    expect(resolveVariant('smooth_sandstone')).toEqual({ base: 'sandstone', ratio: 1 });
    expect(resolveVariant('end_stone_bricks')).toEqual({ base: 'end_stone', ratio: 1 });
    expect(resolveVariant('bamboo_mosaic')).toEqual({ base: 'bamboo_planks', ratio: 1 });
    expect(resolveVariant('purpur_pillar')).toEqual({ base: 'purpur_block', ratio: 1 });
  });

  it('decomposes stripped wood items to non-stripped form', () => {
    expect(resolveVariant('stripped_oak_log')).toEqual({ base: 'oak_log', ratio: 1 });
    expect(resolveVariant('stripped_spruce_wood')).toEqual({ base: 'spruce_wood', ratio: 1 });
    expect(resolveVariant('stripped_crimson_stem')).toEqual({ base: 'crimson_stem', ratio: 1 });
    expect(resolveVariant('stripped_warped_hyphae')).toEqual({ base: 'warped_hyphae', ratio: 1 });
    expect(resolveVariant('stripped_bamboo_block')).toEqual({ base: 'bamboo_block', ratio: 1 });
  });

  it('decomposes non-wood items', () => {
    expect(resolveVariant('iron_door')).toEqual({ base: 'iron_ingot', ratio: 0.5 });
    expect(resolveVariant('iron_trapdoor')).toEqual({ base: 'iron_ingot', ratio: 0.25 });
    expect(resolveVariant('stone_button')).toEqual({ base: 'stone', ratio: 1 });
    expect(resolveVariant('stone_pressure_plate')).toEqual({ base: 'stone', ratio: 0.5 });
    expect(resolveVariant('heavy_weighted_pressure_plate')).toEqual({ base: 'iron_ingot', ratio: 0.5 });
    expect(resolveVariant('light_weighted_pressure_plate')).toEqual({ base: 'gold_ingot', ratio: 0.5 });
  });

  it('returns null for non-variant items', () => {
    expect(resolveVariant('dirt')).toBeNull();
    expect(resolveVariant('obsidian')).toBeNull();
    expect(resolveVariant('torch')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// Phase 1: Deduplication (same item from multiple RawItem groups → MAX)
// ═══════════════════════════════════════════════════════════

describe('deduplication', () => {
  it('takes MAX when same ResultItem appears in multiple groups', () => {
    const input = makeInput([
      {
        raw: 'minecraft:iron_block',
        results: [
          { item: 'minecraft:iron_bars', total: 46 },
          { item: 'minecraft:lantern', total: 46 },
        ],
      },
      {
        raw: 'minecraft:iron_ingot',
        results: [
          { item: 'minecraft:iron_bars', total: 46 },
          { item: 'minecraft:lantern', total: 46 },
        ],
      },
      {
        raw: 'minecraft:iron_nugget',
        results: [{ item: 'minecraft:lantern', total: 46 }],
      },
    ]);

    const result = process(input);
    const ironBars = result.find((r) => r.Item === 'minecraft:iron_bars');
    const lantern = result.find((r) => r.Item === 'minecraft:lantern');

    // Should be MAX(46, 46) = 46, not 46+46 = 92
    expect(ironBars?.Quantity).toBe(46);
    expect(lantern?.Quantity).toBe(46);
  });

  it('takes MAX when quantities differ (generic wood item → logs)', () => {
    const input = makeInput([
      { raw: 'minecraft:a', results: [{ item: 'minecraft:chest', total: 8 }] },
      { raw: 'minecraft:b', results: [{ item: 'minecraft:chest', total: 5 }] },
    ]);
    const result = process(input);
    // MAX(8, 5) = 8 chests → 8 × 8 planks = 64 → ceil(64/4) = 16 oak_log (default)
    expect(result.find((r) => r.Item === 'minecraft:oak_log')?.Quantity).toBe(16);
    expect(result.find((r) => r.Item === 'minecraft:chest')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// Phase 3: Variant consolidation with ratios
// ═══════════════════════════════════════════════════════════

describe('variant consolidation', () => {
  it('stairs consolidate 1:1', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:sandstone_stairs', total: 88 }] },
    ]);
    const result = process(input);
    // 88 stairs → 88 sandstone (1:1)
    expect(result.find((r) => r.Item === 'minecraft:sandstone')?.Quantity).toBe(88);
  });

  it('slabs consolidate 1:2 with ceil', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:sandstone_slab', total: 14 }] },
    ]);
    const result = process(input);
    // 14 slabs → ceil(14/2) = 7 sandstone
    expect(result.find((r) => r.Item === 'minecraft:sandstone')?.Quantity).toBe(7);
  });

  it('slabs consolidate 1:2 with ceil on odd numbers', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:sandstone_slab', total: 15 }] },
    ]);
    const result = process(input);
    // 15 slabs → ceil(15/2) = 8 sandstone
    expect(result.find((r) => r.Item === 'minecraft:sandstone')?.Quantity).toBe(8);
  });

  it('walls consolidate 1:1', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:diorite_wall', total: 92 }] },
    ]);
    const result = process(input);
    expect(result.find((r) => r.Item === 'minecraft:diorite')?.Quantity).toBe(92);
  });

  it('chiseled_ prefix consolidates 1:1', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:chiseled_red_sandstone', total: 836 }] },
    ]);
    const result = process(input);
    expect(result.find((r) => r.Item === 'minecraft:red_sandstone')?.Quantity).toBe(836);
  });

  it('cut_ prefix consolidates 1:1', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:cut_red_sandstone', total: 32 }] },
    ]);
    const result = process(input);
    expect(result.find((r) => r.Item === 'minecraft:red_sandstone')?.Quantity).toBe(32);
  });

  it('accumulates multiple variants of the same base', () => {
    const input = makeInput([
      {
        raw: 'minecraft:x',
        results: [
          { item: 'minecraft:red_sandstone', total: 42 },
          { item: 'minecraft:red_sandstone_stairs', total: 1 },
          { item: 'minecraft:chiseled_red_sandstone', total: 836 },
          { item: 'minecraft:cut_red_sandstone', total: 32 },
        ],
      },
    ]);
    const result = process(input);
    // red_sandstone is PASS_THROUGH here because RawItem != ResultItem, but it's not functional/processed
    // Actually, red_sandstone has no special classification, it'll be PASS_THROUGH since it's not in functional/processed
    // Wait - let me re-check. red_sandstone is not in PROCESSED_BLOCKS, not functional, and resolveVariant returns null.
    // So it falls through to PASS_THROUGH.
    // stairs: 1 (1:1), chiseled_: 836 (1:1), cut_: 32 (1:1) all → red_sandstone
    // direct red_sandstone: 42 as PASS_THROUGH
    // Total: 42 + 1 + 836 + 32 = 911
    expect(result.find((r) => r.Item === 'minecraft:red_sandstone')?.Quantity).toBe(911);
  });
});

// ═══════════════════════════════════════════════════════════
// Special mapping tests
// ═══════════════════════════════════════════════════════════

describe('special mappings', () => {
  it('tuff_brick variants → tuff (via tuff_bricks)', () => {
    const input = makeInput([
      {
        raw: 'minecraft:tuff',
        results: [
          { item: 'minecraft:chiseled_tuff_bricks', total: 146 },
          { item: 'minecraft:tuff_brick_slab', total: 56 },
          { item: 'minecraft:tuff_brick_stairs', total: 342 },
        ],
      },
    ]);
    const result = process(input);
    // chiseled_tuff_bricks → tuff_bricks: 146, tuff_brick_slab → tuff_bricks: 28, tuff_brick_stairs → tuff_bricks: 342
    // tuff_bricks: 516 → tuff: 516 (Phase 3b)
    expect(result.find((r) => r.Item === 'minecraft:tuff')?.Quantity).toBe(516);
  });

  it('brick variants → bricks', () => {
    const input = makeInput([
      {
        raw: 'minecraft:clay',
        results: [
          { item: 'minecraft:brick_stairs', total: 284 },
          { item: 'minecraft:bricks', total: 22 },
        ],
      },
    ]);
    const result = process(input);
    // brick_stairs → bricks: 284 (1:1)
    // bricks: 22 (PROCESSED_BLOCK, kept as-is)
    // Total: 284 + 22 = 306
    expect(result.find((r) => r.Item === 'minecraft:bricks')?.Quantity).toBe(306);
  });

  it('deepslate_tile variants → cobbled_deepslate (via deepslate_tiles)', () => {
    const input = makeInput([
      {
        raw: 'minecraft:cobbled_deepslate',
        results: [
          { item: 'minecraft:deepslate_tile_slab', total: 8 },
          { item: 'minecraft:deepslate_tile_stairs', total: 172 },
        ],
      },
    ]);
    const result = process(input);
    // slab: 4 + stairs: 172 = 176 deepslate_tiles → 176 cobbled_deepslate (Phase 3b)
    expect(result.find((r) => r.Item === 'minecraft:cobbled_deepslate')?.Quantity).toBe(176);
  });

  it('birch wood variants → birch_log (via birch_planks)', () => {
    const input = makeInput([
      {
        raw: 'minecraft:birch_log',
        results: [
          { item: 'minecraft:birch_slab', total: 16 },
          { item: 'minecraft:birch_stairs', total: 8 },
        ],
      },
    ]);
    const result = process(input);
    // slab: 8 + stairs: 8 = 16 birch_planks → ceil(16/4) = 4 birch_log (Phase 3b)
    expect(result.find((r) => r.Item === 'minecraft:birch_log')?.Quantity).toBe(4);
  });

  it('warped_stairs → warped_stem (via warped_planks)', () => {
    const input = makeInput([
      {
        raw: 'minecraft:warped_stem',
        results: [{ item: 'minecraft:warped_stairs', total: 155 }],
      },
    ]);
    const result = process(input);
    // 155 warped_planks → ceil(155/4) = 39 warped_stem (Phase 3b)
    expect(result.find((r) => r.Item === 'minecraft:warped_stem')?.Quantity).toBe(39);
  });
});

// ═══════════════════════════════════════════════════════════
// Pass-through items
// ═══════════════════════════════════════════════════════════

describe('pass-through', () => {
  it('keeps items where RawItem == ResultItem (non-decomposable)', () => {
    const input = makeInput([
      { raw: 'minecraft:obsidian', results: [{ item: 'minecraft:obsidian', total: 30 }] },
      { raw: 'minecraft:dirt', results: [{ item: 'minecraft:dirt', total: 350 }] },
    ]);
    const result = process(input);
    expect(result.find((r) => r.Item === 'minecraft:obsidian')?.Quantity).toBe(30);
    expect(result.find((r) => r.Item === 'minecraft:dirt')?.Quantity).toBe(350);
  });

  it('decomposes stripped pass-through items to base form', () => {
    const input = makeInput([
      {
        raw: 'minecraft:stripped_spruce_log',
        results: [{ item: 'minecraft:stripped_spruce_log', total: 187 }],
      },
    ]);
    const result = process(input);
    expect(result.find((r) => r.Item === 'minecraft:spruce_log')?.Quantity).toBe(187);
    expect(result.find((r) => r.Item === 'minecraft:stripped_spruce_log')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// Generic wood items → dominant log type (Phase 3c)
// ═══════════════════════════════════════════════════════════

describe('generic wood item decomposition', () => {
  it('chest decomposes to default oak_log when no other logs present', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:chest', total: 4 }] },
    ]);
    const result = process(input);
    // 4 chests × 8 planks = 32 → ceil(32/4) = 8 oak_log
    expect(result.find((r) => r.Item === 'minecraft:oak_log')?.Quantity).toBe(8);
    expect(result.find((r) => r.Item === 'minecraft:chest')).toBeUndefined();
  });

  it('crafting_table decomposes to default oak_log', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:crafting_table', total: 3 }] },
    ]);
    const result = process(input);
    // 3 tables × 4 planks = 12 → ceil(12/4) = 3 oak_log
    expect(result.find((r) => r.Item === 'minecraft:oak_log')?.Quantity).toBe(3);
  });

  it('composter decomposes to default oak_log', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:composter', total: 2 }] },
    ]);
    const result = process(input);
    // 2 composters × 3.5 planks = 7 → ceil(7/4) = 2 oak_log
    expect(result.find((r) => r.Item === 'minecraft:oak_log')?.Quantity).toBe(2);
  });

  it('ladder decomposes to default oak_log', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:ladder', total: 4 }] },
    ]);
    const result = process(input);
    // 4 ladders × 3.5 planks = 14 → ceil(14/4) = 4 oak_log
    expect(result.find((r) => r.Item === 'minecraft:oak_log')?.Quantity).toBe(4);
  });

  it('merges into dominant log type (spruce_log)', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [
        { item: 'minecraft:chest', total: 4 },
        { item: 'minecraft:spruce_door', total: 10 },
      ]},
    ]);
    const result = process(input);
    // spruce_door:10 → ceil(10/2)=5 spruce_log (Phase 3a/3b)
    // chest:4 → 32 planks → ceil(32/4)=8 → merge into spruce_log (dominant)
    // Total spruce_log: 5 + 8 = 13
    expect(result.find((r) => r.Item === 'minecraft:spruce_log')?.Quantity).toBe(13);
    expect(result.find((r) => r.Item === 'minecraft:chest')).toBeUndefined();
  });

  it('merges into bamboo_block with correct ratio when dominant', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [
        { item: 'minecraft:chest', total: 2 },
        { item: 'minecraft:bamboo_stairs', total: 40 },
      ]},
    ]);
    const result = process(input);
    // bamboo_stairs:40 → 40 bamboo_planks → ceil(40/2)=20 bamboo_block (Phase 3b)
    // chest:2 → 16 planks → ceil(16/2)=8 bamboo_block (bamboo ratio)
    // Total bamboo_block: 20 + 8 = 28
    expect(result.find((r) => r.Item === 'minecraft:bamboo_block')?.Quantity).toBe(28);
  });
});

describe('furnace decomposition', () => {
  it('furnace decomposes to cobblestone', () => {
    const input = makeInput([
      { raw: 'minecraft:x', results: [{ item: 'minecraft:furnace', total: 5 }] },
    ]);
    const result = process(input);
    // 5 furnaces × 8 cobblestone = 40
    expect(result.find((r) => r.Item === 'minecraft:cobblestone')?.Quantity).toBe(40);
    expect(result.find((r) => r.Item === 'minecraft:furnace')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// Output format
// ═══════════════════════════════════════════════════════════

describe('output format', () => {
  it('sorts alphabetically by Item', () => {
    const input = makeInput([
      { raw: 'minecraft:z', results: [{ item: 'minecraft:z', total: 1 }] },
      { raw: 'minecraft:a', results: [{ item: 'minecraft:a', total: 1 }] },
      { raw: 'minecraft:m', results: [{ item: 'minecraft:m', total: 1 }] },
    ]);
    const result = process(input);
    const items = result.map((r) => r.Item);
    expect(items).toEqual([...items].sort());
  });

  it('has Item and Quantity fields', () => {
    const input = makeInput([
      { raw: 'minecraft:dirt', results: [{ item: 'minecraft:dirt', total: 10 }] },
    ]);
    const result = process(input);
    expect(result[0]).toHaveProperty('Item');
    expect(result[0]).toHaveProperty('Quantity');
  });
});

// ═══════════════════════════════════════════════════════════
// Full integration test against sample data
// ═══════════════════════════════════════════════════════════

describe('full integration test - sample data', () => {
  // Reconstruct the sample data inline for test independence
  const sampleInput: RawInput = [
    {
      RawItem: 'minecraft:cobbled_deepslate', TotalEstimate: 176, Steps: [],
      Results: [
        { ResultItem: 'minecraft:deepslate_tile_slab', ResultTotal: 8 },
        { ResultItem: 'minecraft:deepslate_tile_stairs', ResultTotal: 172 },
      ],
    },
    {
      RawItem: 'minecraft:red_sand', TotalEstimate: 3644, Steps: [],
      Results: [
        { ResultItem: 'minecraft:red_sandstone', ResultTotal: 42 },
        { ResultItem: 'minecraft:red_sandstone_stairs', ResultTotal: 1 },
        { ResultItem: 'minecraft:chiseled_red_sandstone', ResultTotal: 836 },
        { ResultItem: 'minecraft:cut_red_sandstone', ResultTotal: 32 },
      ],
    },
    {
      RawItem: 'minecraft:obsidian', TotalEstimate: 30, Steps: [],
      Results: [{ ResultItem: 'minecraft:obsidian', ResultTotal: 30 }],
    },
    {
      RawItem: 'minecraft:prismarine_shard', TotalEstimate: 280, Steps: [],
      Results: [{ ResultItem: 'minecraft:sea_lantern', ResultTotal: 70 }],
    },
    {
      RawItem: 'minecraft:prismarine_crystals', TotalEstimate: 350, Steps: [],
      Results: [{ ResultItem: 'minecraft:sea_lantern', ResultTotal: 70 }],
    },
    {
      RawItem: 'minecraft:glowstone_dust', TotalEstimate: 224, Steps: [],
      Results: [{ ResultItem: 'minecraft:glowstone', ResultTotal: 56 }],
    },
    {
      RawItem: 'minecraft:spruce_log', TotalEstimate: 3, Steps: [],
      Results: [{ ResultItem: 'minecraft:spruce_door', ResultTotal: 4 }],
    },
    {
      RawItem: 'minecraft:stripped_spruce_log', TotalEstimate: 187, Steps: [],
      Results: [{ ResultItem: 'minecraft:stripped_spruce_log', ResultTotal: 187 }],
    },
    {
      RawItem: 'minecraft:dark_oak_log', TotalEstimate: 38, Steps: [],
      Results: [{ ResultItem: 'minecraft:dark_oak_trapdoor', ResultTotal: 50 }],
    },
    {
      RawItem: 'minecraft:iron_block', TotalEstimate: 7, Steps: [],
      Results: [
        { ResultItem: 'minecraft:iron_bars', ResultTotal: 46 },
        { ResultItem: 'minecraft:lodestone', ResultTotal: 16 },
        { ResultItem: 'minecraft:lantern', ResultTotal: 46 },
      ],
    },
    {
      RawItem: 'minecraft:iron_ingot', TotalEstimate: 11, Steps: [],
      Results: [
        { ResultItem: 'minecraft:iron_bars', ResultTotal: 46 },
        { ResultItem: 'minecraft:lodestone', ResultTotal: 16 },
        { ResultItem: 'minecraft:lantern', ResultTotal: 46 },
      ],
    },
    {
      RawItem: 'minecraft:iron_nugget', TotalEstimate: 8, Steps: [],
      Results: [{ ResultItem: 'minecraft:lantern', ResultTotal: 46 }],
    },
    {
      RawItem: 'minecraft:oak_log', TotalEstimate: 61, Steps: [],
      Results: [
        { ResultItem: 'minecraft:chest', ResultTotal: 8 },
        { ResultItem: 'minecraft:torch', ResultTotal: 1 },
        { ResultItem: 'minecraft:birch_fence', ResultTotal: 8 },
        { ResultItem: 'minecraft:crafting_table', ResultTotal: 5 },
        { ResultItem: 'minecraft:lectern', ResultTotal: 28 },
        { ResultItem: 'minecraft:oak_sign', ResultTotal: 22 },
        { ResultItem: 'minecraft:lantern', ResultTotal: 46 },
      ],
    },
    {
      RawItem: 'minecraft:coal_block', TotalEstimate: 1, Steps: [],
      Results: [
        { ResultItem: 'minecraft:torch', ResultTotal: 1 },
        { ResultItem: 'minecraft:lantern', ResultTotal: 46 },
      ],
    },
    {
      RawItem: 'minecraft:coal', TotalEstimate: 4, Steps: [],
      Results: [
        { ResultItem: 'minecraft:torch', ResultTotal: 1 },
        { ResultItem: 'minecraft:lantern', ResultTotal: 46 },
      ],
    },
    {
      RawItem: 'minecraft:calcite', TotalEstimate: 160, Steps: [],
      Results: [{ ResultItem: 'minecraft:calcite', ResultTotal: 160 }],
    },
    {
      RawItem: 'minecraft:cobblestone', TotalEstimate: 1009, Steps: [],
      Results: [
        { ResultItem: 'minecraft:stone_bricks', ResultTotal: 213 },
        { ResultItem: 'minecraft:polished_diorite_stairs', ResultTotal: 84 },
        { ResultItem: 'minecraft:furnace', ResultTotal: 5 },
        { ResultItem: 'minecraft:diorite_wall', ResultTotal: 92 },
        { ResultItem: 'minecraft:smooth_stone', ResultTotal: 56 },
        { ResultItem: 'minecraft:lodestone', ResultTotal: 16 },
        { ResultItem: 'minecraft:cracked_stone_bricks', ResultTotal: 396 },
      ],
    },
    {
      RawItem: 'minecraft:cactus', TotalEstimate: 20, Steps: [],
      Results: [
        { ResultItem: 'minecraft:cyan_terracotta', ResultTotal: 246 },
        { ResultItem: 'minecraft:green_glazed_terracotta', ResultTotal: 32 },
      ],
    },
    {
      RawItem: 'minecraft:clay', TotalEstimate: 1534, Steps: [],
      Results: [
        { ResultItem: 'minecraft:brick_stairs', ResultTotal: 284 },
        { ResultItem: 'minecraft:terracotta', ResultTotal: 20 },
        { ResultItem: 'minecraft:white_terracotta', ResultTotal: 217 },
        { ResultItem: 'minecraft:orange_glazed_terracotta', ResultTotal: 47 },
        { ResultItem: 'minecraft:yellow_terracotta', ResultTotal: 229 },
        { ResultItem: 'minecraft:cyan_terracotta', ResultTotal: 246 },
        { ResultItem: 'minecraft:bricks', ResultTotal: 22 },
        { ResultItem: 'minecraft:purple_glazed_terracotta', ResultTotal: 46 },
        { ResultItem: 'minecraft:red_glazed_terracotta', ResultTotal: 20 },
        { ResultItem: 'minecraft:yellow_glazed_terracotta', ResultTotal: 45 },
        { ResultItem: 'minecraft:brown_terracotta', ResultTotal: 44 },
        { ResultItem: 'minecraft:light_blue_terracotta', ResultTotal: 256 },
        { ResultItem: 'minecraft:green_glazed_terracotta', ResultTotal: 32 },
      ],
    },
    {
      RawItem: 'minecraft:flowering_azalea_leaves', TotalEstimate: 18, Steps: [],
      Results: [{ ResultItem: 'minecraft:flowering_azalea_leaves', ResultTotal: 18 }],
    },
    {
      RawItem: 'minecraft:stripped_warped_stem', TotalEstimate: 14, Steps: [],
      Results: [{ ResultItem: 'minecraft:stripped_warped_stem', ResultTotal: 14 }],
    },
    {
      RawItem: 'minecraft:grass_block', TotalEstimate: 372, Steps: [],
      Results: [{ ResultItem: 'minecraft:grass_block', ResultTotal: 372 }],
    },
    {
      RawItem: 'minecraft:sand', TotalEstimate: 1640, Steps: [],
      Results: [
        { ResultItem: 'minecraft:sandstone_slab', ResultTotal: 14 },
        { ResultItem: 'minecraft:smooth_sandstone_stairs', ResultTotal: 88 },
        { ResultItem: 'minecraft:sandstone', ResultTotal: 217 },
        { ResultItem: 'minecraft:smooth_sandstone', ResultTotal: 92 },
        { ResultItem: 'minecraft:black_stained_glass_pane', ResultTotal: 62 },
      ],
    },
    {
      RawItem: 'minecraft:ink_sac', TotalEstimate: 3, Steps: [],
      Results: [{ ResultItem: 'minecraft:black_stained_glass_pane', ResultTotal: 62 }],
    },
    {
      RawItem: 'minecraft:flowering_azalea', TotalEstimate: 6, Steps: [],
      Results: [{ ResultItem: 'minecraft:flowering_azalea', ResultTotal: 6 }],
    },
    {
      RawItem: 'minecraft:stripped_pale_oak_log', TotalEstimate: 38, Steps: [],
      Results: [{ ResultItem: 'minecraft:stripped_pale_oak_log', ResultTotal: 38 }],
    },
    {
      RawItem: 'minecraft:blue_orchid', TotalEstimate: 32, Steps: [],
      Results: [{ ResultItem: 'minecraft:light_blue_terracotta', ResultTotal: 256 }],
    },
    {
      RawItem: 'minecraft:warped_stem', TotalEstimate: 59, Steps: [],
      Results: [{ ResultItem: 'minecraft:warped_stairs', ResultTotal: 155 }],
    },
    {
      RawItem: 'minecraft:cocoa_beans', TotalEstimate: 6, Steps: [],
      Results: [{ ResultItem: 'minecraft:brown_terracotta', ResultTotal: 44 }],
    },
    {
      RawItem: 'minecraft:chorus_fruit', TotalEstimate: 4, Steps: [],
      Results: [{ ResultItem: 'minecraft:end_rod', ResultTotal: 16 }],
    },
    {
      RawItem: 'minecraft:blaze_rod', TotalEstimate: 4, Steps: [],
      Results: [{ ResultItem: 'minecraft:end_rod', ResultTotal: 16 }],
    },
    {
      RawItem: 'minecraft:dandelion', TotalEstimate: 35, Steps: [],
      Results: [
        { ResultItem: 'minecraft:yellow_terracotta', ResultTotal: 229 },
        { ResultItem: 'minecraft:yellow_glazed_terracotta', ResultTotal: 45 },
      ],
    },
    {
      RawItem: 'minecraft:beetroot', TotalEstimate: 6, Steps: [],
      Results: [
        { ResultItem: 'minecraft:purple_glazed_terracotta', ResultTotal: 46 },
        { ResultItem: 'minecraft:red_glazed_terracotta', ResultTotal: 20 },
      ],
    },
    {
      RawItem: 'minecraft:rabbit_hide', TotalEstimate: 168, Steps: [],
      Results: [{ ResultItem: 'minecraft:lectern', ResultTotal: 14 }],
    },
    {
      RawItem: 'minecraft:sugar_cane', TotalEstimate: 126, Steps: [],
      Results: [{ ResultItem: 'minecraft:lectern', ResultTotal: 14 }],
    },
    {
      RawItem: 'minecraft:copper_block', TotalEstimate: 89, Steps: [],
      Results: [
        { ResultItem: 'minecraft:waxed_copper_block', ResultTotal: 78 },
        { ResultItem: 'minecraft:oxidized_copper_trapdoor', ResultTotal: 12 },
        { ResultItem: 'minecraft:lightning_rod', ResultTotal: 23 },
      ],
    },
    {
      RawItem: 'minecraft:copper_ingot', TotalEstimate: 6, Steps: [],
      Results: [
        { ResultItem: 'minecraft:waxed_copper_block', ResultTotal: 78 },
        { ResultItem: 'minecraft:oxidized_copper_trapdoor', ResultTotal: 12 },
        { ResultItem: 'minecraft:lightning_rod', ResultTotal: 23 },
      ],
    },
    {
      RawItem: 'minecraft:stripped_birch_log', TotalEstimate: 476, Steps: [],
      Results: [{ ResultItem: 'minecraft:stripped_birch_log', ResultTotal: 476 }],
    },
    {
      RawItem: 'minecraft:birch_log', TotalEstimate: 81, Steps: [],
      Results: [
        { ResultItem: 'minecraft:birch_slab', ResultTotal: 16 },
        { ResultItem: 'minecraft:birch_door', ResultTotal: 4 },
        { ResultItem: 'minecraft:birch_trapdoor', ResultTotal: 92 },
        { ResultItem: 'minecraft:birch_fence', ResultTotal: 8 },
        { ResultItem: 'minecraft:birch_stairs', ResultTotal: 8 },
      ],
    },
    {
      RawItem: 'minecraft:lapis_block', TotalEstimate: 2, Steps: [],
      Results: [
        { ResultItem: 'minecraft:cyan_terracotta', ResultTotal: 246 },
        { ResultItem: 'minecraft:purple_glazed_terracotta', ResultTotal: 46 },
      ],
    },
    {
      RawItem: 'minecraft:lapis_lazuli', TotalEstimate: 1, Steps: [],
      Results: [
        { ResultItem: 'minecraft:cyan_terracotta', ResultTotal: 246 },
        { ResultItem: 'minecraft:purple_glazed_terracotta', ResultTotal: 46 },
      ],
    },
    {
      RawItem: 'minecraft:stripped_dark_oak_log', TotalEstimate: 522, Steps: [],
      Results: [{ ResultItem: 'minecraft:stripped_dark_oak_log', ResultTotal: 522 }],
    },
    {
      RawItem: 'minecraft:nether_quartz_ore', TotalEstimate: 176, Steps: [],
      Results: [
        { ResultItem: 'minecraft:polished_diorite_stairs', ResultTotal: 84 },
        { ResultItem: 'minecraft:diorite_wall', ResultTotal: 92 },
      ],
    },
    {
      RawItem: 'minecraft:dirt', TotalEstimate: 350, Steps: [],
      Results: [{ ResultItem: 'minecraft:dirt', ResultTotal: 350 }],
    },
    {
      RawItem: 'minecraft:tuff', TotalEstimate: 516, Steps: [],
      Results: [
        { ResultItem: 'minecraft:chiseled_tuff_bricks', ResultTotal: 146 },
        { ResultItem: 'minecraft:tuff_brick_slab', ResultTotal: 56 },
        { ResultItem: 'minecraft:tuff_brick_stairs', ResultTotal: 342 },
      ],
    },
    {
      RawItem: 'minecraft:blackstone', TotalEstimate: 208, Steps: [],
      Results: [{ ResultItem: 'minecraft:polished_blackstone_bricks', ResultTotal: 208 }],
    },
    {
      RawItem: 'minecraft:open_eyeblossom', TotalEstimate: 6, Steps: [],
      Results: [{ ResultItem: 'minecraft:orange_glazed_terracotta', ResultTotal: 47 }],
    },
    {
      RawItem: 'minecraft:honeycomb', TotalEstimate: 78, Steps: [],
      Results: [{ ResultItem: 'minecraft:waxed_copper_block', ResultTotal: 78 }],
    },
    {
      RawItem: 'minecraft:bone', TotalEstimate: 10, Steps: [],
      Results: [{ ResultItem: 'minecraft:white_terracotta', ResultTotal: 217 }],
    },
    {
      RawItem: 'minecraft:bell', TotalEstimate: 2, Steps: [],
      Results: [{ ResultItem: 'minecraft:bell', ResultTotal: 2 }],
    },
  ];

  it('processes sample data correctly', () => {
    const result = process(sampleInput);

    // Helper to look up result
    const qty = (item: string) =>
      result.find((r) => r.Item === `minecraft:${item}`)?.Quantity;

    // Key consolidated items — single-chain decomposition resolves to raw base
    expect(qty('red_sandstone')).toBe(911);
    expect(qty('tuff')).toBe(516);
    expect(qty('bricks')).toBe(306);
    expect(qty('sandstone')).toBe(404);
    expect(qty('cobbled_deepslate')).toBe(176);
    expect(qty('diorite')).toBe(176);
    expect(qty('stone')).toBe(665);
    expect(qty('blackstone')).toBe(208);
    // warped_stem: 39 (from stairs) + 14 (stripped_warped_stem) = 53
    expect(qty('warped_stem')).toBe(53);
    // birch_log: 79 (from slabs/doors/etc) + 476 (stripped_birch_log) = 555
    expect(qty('birch_log')).toBe(555);

    // Functional items kept as-is
    expect(qty('sea_lantern')).toBe(70);
    expect(qty('glowstone')).toBe(56);
    expect(qty('torch')).toBe(1);
    expect(qty('lantern')).toBe(46);
    expect(qty('iron_bars')).toBe(46);
    expect(qty('lodestone')).toBe(16);
    expect(qty('bell')).toBe(2);
    expect(qty('lectern')).toBe(28);
    expect(qty('end_rod')).toBe(16);
    // furnace:5 → cobblestone: ceil(5/(1/8)) = 40
    expect(qty('cobblestone')).toBe(40);
    expect(qty('lightning_rod')).toBe(23);
    // Decomposed items → logs (including planks→logs from Phase 3b)
    // spruce_door:4 → ceil(4/2) = 2 spruce_log + 187 stripped_spruce_log = 189
    expect(qty('spruce_log')).toBe(189);
    // dark_oak_trapdoor:50 → ceil(50/(4/3)) = ceil(37.5) = 38 dark_oak_log + 522 stripped = 560
    // + Phase 3c: chest:8 + crafting_table:5 → 8×8+5×4 = 84 planks → ceil(84/4) = 21 (dark_oak is dominant)
    expect(qty('dark_oak_log')).toBe(581);
    // birch_door:4→2, birch_trapdoor:92→69, birch_fence:8→4 = 75 birch_log
    // + birch_planks:16 → ceil(16/4)=4 birch_log (Phase 3b)
    // Total: 75+4 = 79
    // oak_sign:22 → 12 oak_log (generic wood goes to dominant dark_oak_log)
    expect(qty('oak_log')).toBe(12);
    expect(qty('waxed_copper_block')).toBe(78);
    expect(qty('oxidized_copper_trapdoor')).toBe(12);
    expect(qty('black_stained_glass_pane')).toBe(62);

    // Terracotta items
    expect(qty('terracotta')).toBe(20);
    expect(qty('white_terracotta')).toBe(217);
    expect(qty('yellow_terracotta')).toBe(229);
    expect(qty('cyan_terracotta')).toBe(246);
    expect(qty('brown_terracotta')).toBe(44);
    expect(qty('light_blue_terracotta')).toBe(256);
    expect(qty('orange_glazed_terracotta')).toBe(47);
    expect(qty('purple_glazed_terracotta')).toBe(46);
    expect(qty('red_glazed_terracotta')).toBe(20);
    expect(qty('yellow_glazed_terracotta')).toBe(45);
    expect(qty('green_glazed_terracotta')).toBe(32);

    // Stripped items decomposed into base logs (verified above)
    // pale_oak_log: 38 (from stripped_pale_oak_log, no other source)
    expect(qty('pale_oak_log')).toBe(38);

    // Pass-through items
    expect(qty('obsidian')).toBe(30);
    expect(qty('dirt')).toBe(350);
    expect(qty('calcite')).toBe(160);
    expect(qty('grass_block')).toBe(372);
    expect(qty('flowering_azalea_leaves')).toBe(18);
    expect(qty('flowering_azalea')).toBe(6);
  });

  it('produces alphabetically sorted output', () => {
    const result = process(sampleInput);
    const items = result.map((r) => r.Item);
    const sorted = [...items].sort();
    expect(items).toEqual(sorted);
  });

  it('has no duplicate items in output', () => {
    const result = process(sampleInput);
    const items = result.map((r) => r.Item);
    const unique = new Set(items);
    expect(unique.size).toBe(items.length);
  });
});

// ═══════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════

describe('edge cases', () => {
  it('handles empty input', () => {
    const result = process([]);
    expect(result).toEqual([]);
  });

  it('handles single-item input', () => {
    const input = makeInput([
      { raw: 'minecraft:dirt', results: [{ item: 'minecraft:dirt', total: 1 }] },
    ]);
    const result = process(input);
    expect(result).toEqual([{ Item: 'minecraft:dirt', Quantity: 1 }]);
  });

  it('handles item with no namespace prefix', () => {
    expect(stripNamespace('dirt')).toBe('dirt');
    expect(stripNamespace('minecraft:dirt')).toBe('dirt');
  });
});
