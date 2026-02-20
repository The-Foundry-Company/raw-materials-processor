import { describe, it, expect } from 'vitest';
import { process, validateInput } from '../index';
import type { RawInput, RawItemGroup } from '../types';

// ── Helpers ──

function makeGroup(raw: string, results: { item: string; total: number }[]): RawItemGroup {
  return {
    RawItem: raw,
    TotalEstimate: 0,
    Steps: [],
    Results: results.map((r) => ({ ResultItem: r.item, ResultTotal: r.total })),
  };
}

function qty(result: ReturnType<typeof process>, item: string): number | undefined {
  return result.find((r) => r.Item === item)?.Quantity;
}

// ═══════════════════════════════════════════════════════════
// EMPTY & MINIMAL INPUTS
// ═══════════════════════════════════════════════════════════

describe('empty and minimal inputs', () => {
  it('returns empty array for empty input', () => {
    expect(process([])).toEqual([]);
  });

  it('handles single pass-through item', () => {
    const input: RawInput = [
      makeGroup('minecraft:dirt', [{ item: 'minecraft:dirt', total: 1 }]),
    ];
    const result = process(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ Item: 'minecraft:dirt', Quantity: 1 });
  });

  it('handles single functional item', () => {
    const input: RawInput = [
      makeGroup('minecraft:oak_log', [{ item: 'minecraft:chest', total: 3 }]),
    ];
    const result = process(input);
    expect(result).toHaveLength(1);
    expect(qty(result, 'minecraft:chest')).toBe(3);
  });

  it('handles single variant item', () => {
    const input: RawInput = [
      makeGroup('minecraft:stone', [{ item: 'minecraft:stone_stairs', total: 10 }]),
    ];
    const result = process(input);
    expect(result).toHaveLength(1);
    expect(qty(result, 'minecraft:stone')).toBe(10);
  });

  it('handles group with empty results array', () => {
    const input: RawInput = [{
      RawItem: 'minecraft:air',
      TotalEstimate: 0,
      Steps: [],
      Results: [],
    }];
    const result = process(input);
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════
// DEDUPLICATION STRESS TESTS
// ═══════════════════════════════════════════════════════════

describe('deduplication stress tests', () => {
  it('deduplicates across 5 groups referencing the same item', () => {
    const input: RawInput = [
      makeGroup('minecraft:a', [{ item: 'minecraft:torch', total: 10 }]),
      makeGroup('minecraft:b', [{ item: 'minecraft:torch', total: 20 }]),
      makeGroup('minecraft:c', [{ item: 'minecraft:torch', total: 15 }]),
      makeGroup('minecraft:d', [{ item: 'minecraft:torch', total: 20 }]),
      makeGroup('minecraft:e', [{ item: 'minecraft:torch', total: 5 }]),
    ];
    const result = process(input);
    // MAX of 10, 20, 15, 20, 5 = 20
    expect(qty(result, 'minecraft:torch')).toBe(20);
  });

  it('deduplicates with identical quantities across all groups', () => {
    const input: RawInput = [
      makeGroup('minecraft:a', [{ item: 'minecraft:lantern', total: 50 }]),
      makeGroup('minecraft:b', [{ item: 'minecraft:lantern', total: 50 }]),
      makeGroup('minecraft:c', [{ item: 'minecraft:lantern', total: 50 }]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:lantern')).toBe(50);
  });

  it('deduplicates variants that appear in multiple raw groups', () => {
    const input: RawInput = [
      makeGroup('minecraft:cobblestone', [{ item: 'minecraft:stone_stairs', total: 100 }]),
      makeGroup('minecraft:quartz', [{ item: 'minecraft:stone_stairs', total: 80 }]),
    ];
    const result = process(input);
    // MAX(100, 80) = 100 stairs → 100 stone (1:1)
    expect(qty(result, 'minecraft:stone')).toBe(100);
  });

  it('does not cross-contaminate different items during dedup', () => {
    const input: RawInput = [
      makeGroup('minecraft:a', [
        { item: 'minecraft:torch', total: 10 },
        { item: 'minecraft:lantern', total: 30 },
      ]),
      makeGroup('minecraft:b', [
        { item: 'minecraft:torch', total: 15 },
        { item: 'minecraft:lantern', total: 20 },
      ]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:torch')).toBe(15);
    expect(qty(result, 'minecraft:lantern')).toBe(30);
  });
});

// ═══════════════════════════════════════════════════════════
// ALL VARIANT TYPES
// ═══════════════════════════════════════════════════════════

describe('all variant types', () => {
  it('handles stairs correctly (1:1)', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [{ item: 'minecraft:granite_stairs', total: 64 }]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:granite')).toBe(64);
  });

  it('handles slabs correctly (1:2 with ceil)', () => {
    const tests = [
      { count: 10, expected: 5 },   // even
      { count: 11, expected: 6 },   // odd
      { count: 1, expected: 1 },    // minimum
      { count: 2, expected: 1 },    // exact division
      { count: 99, expected: 50 },  // large odd
      { count: 100, expected: 50 }, // large even
    ];
    for (const { count, expected } of tests) {
      const input: RawInput = [
        makeGroup('minecraft:x', [{ item: 'minecraft:granite_slab', total: count }]),
      ];
      const result = process(input);
      expect(qty(result, 'minecraft:granite')).toBe(expected);
    }
  });

  it('handles walls correctly (1:1)', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [{ item: 'minecraft:andesite_wall', total: 44 }]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:andesite')).toBe(44);
  });

  it('handles chiseled_ prefix (1:1)', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [{ item: 'minecraft:chiseled_sandstone', total: 30 }]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:sandstone')).toBe(30);
  });

  it('handles cut_ prefix (1:1)', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [{ item: 'minecraft:cut_sandstone', total: 25 }]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:sandstone')).toBe(25);
  });

  it('accumulates stairs + slabs + walls of same base', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:granite_stairs', total: 100 },
        { item: 'minecraft:granite_slab', total: 50 },
        { item: 'minecraft:granite_wall', total: 30 },
      ]),
    ];
    const result = process(input);
    // 100 (stairs 1:1) + 25 (slabs ceil(50/2)) + 30 (walls 1:1) = 155
    expect(qty(result, 'minecraft:granite')).toBe(155);
  });

  it('accumulates chiseled + cut + stairs + slabs of same base', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:chiseled_sandstone', total: 20 },
        { item: 'minecraft:cut_sandstone', total: 10 },
        { item: 'minecraft:sandstone_stairs', total: 40 },
        { item: 'minecraft:sandstone_slab', total: 16 },
      ]),
    ];
    const result = process(input);
    // 20 + 10 + 40 + ceil(16/2)=8 = 78
    expect(qty(result, 'minecraft:sandstone')).toBe(78);
  });
});

// ═══════════════════════════════════════════════════════════
// ALL WOOD TYPES → PLANKS
// ═══════════════════════════════════════════════════════════

describe('wood type → planks consolidation', () => {
  const woodTypes = [
    'oak', 'spruce', 'birch', 'jungle', 'acacia',
    'dark_oak', 'mangrove', 'cherry', 'bamboo',
    'crimson', 'warped', 'pale_oak',
  ];

  for (const wood of woodTypes) {
    it(`${wood}_stairs → ${wood}_planks`, () => {
      const input: RawInput = [
        makeGroup('minecraft:x', [{ item: `minecraft:${wood}_stairs`, total: 20 }]),
      ];
      const result = process(input);
      expect(qty(result, `minecraft:${wood}_planks`)).toBe(20);
    });

    it(`${wood}_slab → ${wood}_planks (1:2)`, () => {
      const input: RawInput = [
        makeGroup('minecraft:x', [{ item: `minecraft:${wood}_slab`, total: 20 }]),
      ];
      const result = process(input);
      expect(qty(result, `minecraft:${wood}_planks`)).toBe(10);
    });
  }

  it('accumulates stairs + slabs for birch_planks', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:birch_stairs', total: 30 },
        { item: 'minecraft:birch_slab', total: 20 },
      ]),
    ];
    const result = process(input);
    // 30 + ceil(20/2) = 30 + 10 = 40
    expect(qty(result, 'minecraft:birch_planks')).toBe(40);
  });
});

// ═══════════════════════════════════════════════════════════
// SPECIAL MAPPING EDGE CASES (pluralization)
// ═══════════════════════════════════════════════════════════

describe('pluralization special mappings', () => {
  it('all deepslate_tile variants → deepslate_tiles', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:deepslate_tile_stairs', total: 100 },
        { item: 'minecraft:deepslate_tile_slab', total: 30 },
        { item: 'minecraft:deepslate_tile_wall', total: 20 },
      ]),
    ];
    const result = process(input);
    // 100 + ceil(30/2)=15 + 20 = 135
    expect(qty(result, 'minecraft:deepslate_tiles')).toBe(135);
  });

  it('all tuff_brick variants → tuff_bricks', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:tuff_brick_stairs', total: 50 },
        { item: 'minecraft:tuff_brick_slab', total: 22 },
        { item: 'minecraft:tuff_brick_wall', total: 10 },
        { item: 'minecraft:chiseled_tuff_bricks', total: 40 },
      ]),
    ];
    const result = process(input);
    // 50 + ceil(22/2)=11 + 10 + 40 = 111
    expect(qty(result, 'minecraft:tuff_bricks')).toBe(111);
  });

  it('all brick variants → bricks', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:brick_stairs', total: 200 },
        { item: 'minecraft:brick_slab', total: 50 },
        { item: 'minecraft:brick_wall', total: 30 },
      ]),
    ];
    const result = process(input);
    // 200 + ceil(50/2)=25 + 30 = 255
    expect(qty(result, 'minecraft:bricks')).toBe(255);
  });

  it('all stone_brick variants → stone_bricks', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:stone_brick_stairs', total: 60 },
        { item: 'minecraft:stone_brick_slab', total: 40 },
        { item: 'minecraft:stone_brick_wall', total: 20 },
      ]),
    ];
    const result = process(input);
    // 60 + ceil(40/2)=20 + 20 = 100
    expect(qty(result, 'minecraft:stone_bricks')).toBe(100);
  });

  it('all nether_brick variants → nether_bricks (including fence)', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:nether_brick_stairs', total: 40 },
        { item: 'minecraft:nether_brick_slab', total: 10 },
        { item: 'minecraft:nether_brick_wall', total: 15 },
        { item: 'minecraft:nether_brick_fence', total: 8 },
      ]),
    ];
    const result = process(input);
    // stairs: 40, slab: ceil(10/2)=5, wall: 15 = 60
    // nether_brick_fence → nether_bricks via SPECIAL_VARIANT_MAP (no longer blocked by FUNCTIONAL)
    // fence: 8 (ratio 1 from special map)
    // Total: 40 + 5 + 15 + 8 = 68
    expect(qty(result, 'minecraft:nether_bricks')).toBe(68);
    expect(qty(result, 'minecraft:nether_brick_fence')).toBeUndefined();
  });

  it('polished_blackstone_brick variants → polished_blackstone_bricks', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:polished_blackstone_brick_stairs', total: 80 },
        { item: 'minecraft:polished_blackstone_brick_slab', total: 24 },
      ]),
    ];
    const result = process(input);
    // 80 + ceil(24/2)=12 = 92
    expect(qty(result, 'minecraft:polished_blackstone_bricks')).toBe(92);
  });
});

// ═══════════════════════════════════════════════════════════
// FUNCTIONAL ITEM CATEGORIES
// ═══════════════════════════════════════════════════════════

describe('functional item categories', () => {
  it('keeps all exact functional items as-is', () => {
    const functionals = [
      'torch', 'soul_torch', 'lantern', 'soul_lantern', 'sea_lantern',
      'glowstone', 'end_rod', 'lightning_rod', 'chest', 'crafting_table',
      'furnace', 'lectern', 'bell', 'lodestone', 'iron_bars',
      'glass', 'glass_pane', 'tinted_glass',
    ];

    for (const item of functionals) {
      const input: RawInput = [
        makeGroup('minecraft:x', [{ item: `minecraft:${item}`, total: 42 }]),
      ];
      const result = process(input);
      expect(qty(result, `minecraft:${item}`)).toBe(42);
    }
  });

  it('keeps all 16 colored terracotta as functional', () => {
    const colors = [
      'white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime',
      'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue',
      'brown', 'green', 'red', 'black',
    ];
    for (const color of colors) {
      const input: RawInput = [
        makeGroup('minecraft:x', [{ item: `minecraft:${color}_terracotta`, total: 10 }]),
      ];
      const result = process(input);
      expect(qty(result, `minecraft:${color}_terracotta`)).toBe(10);
    }
  });

  it('keeps all glazed terracotta as functional', () => {
    const colors = [
      'white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime',
      'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue',
      'brown', 'green', 'red', 'black',
    ];
    for (const color of colors) {
      const input: RawInput = [
        makeGroup('minecraft:x', [{ item: `minecraft:${color}_glazed_terracotta`, total: 5 }]),
      ];
      const result = process(input);
      expect(qty(result, `minecraft:${color}_glazed_terracotta`)).toBe(5);
    }
  });

  it('keeps stained glass panes as functional', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:red_stained_glass_pane', total: 32 },
        { item: 'minecraft:blue_stained_glass_pane', total: 16 },
      ]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:red_stained_glass_pane')).toBe(32);
    expect(qty(result, 'minecraft:blue_stained_glass_pane')).toBe(16);
  });

  it('keeps waxed copper variants as functional', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:waxed_copper_block', total: 78 },
        { item: 'minecraft:waxed_exposed_copper', total: 20 },
        { item: 'minecraft:waxed_weathered_copper', total: 15 },
        { item: 'minecraft:waxed_oxidized_copper', total: 10 },
      ]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:waxed_copper_block')).toBe(78);
    expect(qty(result, 'minecraft:waxed_exposed_copper')).toBe(20);
    expect(qty(result, 'minecraft:waxed_weathered_copper')).toBe(15);
    expect(qty(result, 'minecraft:waxed_oxidized_copper')).toBe(10);
  });

  it('decomposes wood doors/trapdoors to logs', () => {
    const woodToLog: Record<string, string> = {
      oak: 'oak_log', spruce: 'spruce_log', birch: 'birch_log',
      jungle: 'jungle_log', acacia: 'acacia_log', dark_oak: 'dark_oak_log',
      crimson: 'crimson_stem', warped: 'warped_stem',
    };
    for (const [wood, log] of Object.entries(woodToLog)) {
      const input: RawInput = [
        makeGroup('minecraft:x', [
          { item: `minecraft:${wood}_door`, total: 4 },
          { item: `minecraft:${wood}_trapdoor`, total: 8 },
        ]),
      ];
      const result = process(input);
      // door:4 → ceil(4/2)=2, trapdoor:8 → ceil(8/(4/3))=ceil(6)=6 → total 8 logs
      expect(qty(result, `minecraft:${log}`)).toBe(8);
      expect(qty(result, `minecraft:${wood}_door`)).toBeUndefined();
      expect(qty(result, `minecraft:${wood}_trapdoor`)).toBeUndefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════
// PROCESSED BLOCK TESTS
// ═══════════════════════════════════════════════════════════

describe('processed blocks kept as-is', () => {
  it('keeps stone_bricks as processed block', () => {
    const input: RawInput = [
      makeGroup('minecraft:cobblestone', [{ item: 'minecraft:stone_bricks', total: 213 }]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:stone_bricks')).toBe(213);
  });

  it('keeps smooth_sandstone as processed block', () => {
    const input: RawInput = [
      makeGroup('minecraft:sand', [{ item: 'minecraft:smooth_sandstone', total: 92 }]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:smooth_sandstone')).toBe(92);
  });

  it('keeps polished_blackstone_bricks as processed block', () => {
    const input: RawInput = [
      makeGroup('minecraft:blackstone', [{ item: 'minecraft:polished_blackstone_bricks', total: 208 }]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:polished_blackstone_bricks')).toBe(208);
  });

  it('smooth_sandstone_stairs consolidates to smooth_sandstone (processed block as base)', () => {
    const input: RawInput = [
      makeGroup('minecraft:sand', [
        { item: 'minecraft:smooth_sandstone', total: 92 },
        { item: 'minecraft:smooth_sandstone_stairs', total: 88 },
      ]),
    ];
    const result = process(input);
    // smooth_sandstone: 92 (processed block) + 88 (stairs → smooth_sandstone) = 180
    expect(qty(result, 'minecraft:smooth_sandstone')).toBe(180);
  });

  it('polished_diorite_stairs consolidates to polished_diorite', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [{ item: 'minecraft:polished_diorite_stairs', total: 84 }]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:polished_diorite')).toBe(84);
  });
});

// ═══════════════════════════════════════════════════════════
// MIXED CATEGORY TEST - LARGE FAKE LIST
// ═══════════════════════════════════════════════════════════

describe('large mixed fake list', () => {
  it('processes a complex list with all categories', () => {
    const input: RawInput = [
      // Pass-through
      makeGroup('minecraft:obsidian', [{ item: 'minecraft:obsidian', total: 100 }]),
      makeGroup('minecraft:dirt', [{ item: 'minecraft:dirt', total: 500 }]),
      makeGroup('minecraft:netherrack', [{ item: 'minecraft:netherrack', total: 200 }]),

      // Functional items from various raw sources
      makeGroup('minecraft:iron_ingot', [
        { item: 'minecraft:iron_bars', total: 64 },
        { item: 'minecraft:lantern', total: 32 },
        { item: 'minecraft:chest', total: 12 },
      ]),
      makeGroup('minecraft:iron_block', [
        { item: 'minecraft:iron_bars', total: 64 },  // same as above, should dedup to 64
        { item: 'minecraft:lantern', total: 32 },
      ]),
      makeGroup('minecraft:copper_ingot', [
        { item: 'minecraft:lightning_rod', total: 16 },
        { item: 'minecraft:waxed_copper_block', total: 32 },
      ]),

      // Processed blocks
      makeGroup('minecraft:cobblestone', [
        { item: 'minecraft:stone_bricks', total: 300 },
        { item: 'minecraft:smooth_stone', total: 100 },
        { item: 'minecraft:cracked_stone_bricks', total: 50 },
      ]),

      // Variants that consolidate
      makeGroup('minecraft:sand', [
        { item: 'minecraft:sandstone', total: 200 },
        { item: 'minecraft:sandstone_slab', total: 40 },
        { item: 'minecraft:sandstone_stairs', total: 60 },
        { item: 'minecraft:chiseled_sandstone', total: 30 },
        { item: 'minecraft:cut_sandstone', total: 10 },
      ]),
      makeGroup('minecraft:red_sand', [
        { item: 'minecraft:red_sandstone', total: 150 },
        { item: 'minecraft:red_sandstone_stairs', total: 20 },
        { item: 'minecraft:chiseled_red_sandstone', total: 100 },
      ]),

      // Wood variants
      makeGroup('minecraft:oak_log', [
        { item: 'minecraft:oak_stairs', total: 50 },
        { item: 'minecraft:oak_slab', total: 30 },
        { item: 'minecraft:oak_door', total: 6 },
        { item: 'minecraft:oak_sign', total: 10 },
      ]),

      // Terracotta (functional)
      makeGroup('minecraft:clay', [
        { item: 'minecraft:white_terracotta', total: 128 },
        { item: 'minecraft:cyan_terracotta', total: 64 },
        { item: 'minecraft:orange_glazed_terracotta', total: 32 },
        { item: 'minecraft:bricks', total: 48 },
        { item: 'minecraft:brick_stairs', total: 200 },
      ]),

      // Tuff
      makeGroup('minecraft:tuff', [
        { item: 'minecraft:tuff_brick_stairs', total: 100 },
        { item: 'minecraft:tuff_brick_slab', total: 40 },
        { item: 'minecraft:chiseled_tuff_bricks', total: 60 },
      ]),
    ];

    const result = process(input);

    // Pass-through
    expect(qty(result, 'minecraft:obsidian')).toBe(100);
    expect(qty(result, 'minecraft:dirt')).toBe(500);
    expect(qty(result, 'minecraft:netherrack')).toBe(200);

    // Functional (deduplicated)
    expect(qty(result, 'minecraft:iron_bars')).toBe(64);
    expect(qty(result, 'minecraft:lantern')).toBe(32);
    expect(qty(result, 'minecraft:chest')).toBe(12);
    expect(qty(result, 'minecraft:lightning_rod')).toBe(16);
    expect(qty(result, 'minecraft:waxed_copper_block')).toBe(32);
    // oak_door:6 → ceil(6/2)=3 oak_log, oak_sign:10 → ceil(10/(24/13))=ceil(5.417)=6 oak_log
    // Total oak_log: 3+6 = 9
    expect(qty(result, 'minecraft:oak_log')).toBe(9);
    expect(qty(result, 'minecraft:white_terracotta')).toBe(128);
    expect(qty(result, 'minecraft:cyan_terracotta')).toBe(64);
    expect(qty(result, 'minecraft:orange_glazed_terracotta')).toBe(32);

    // Processed blocks
    expect(qty(result, 'minecraft:stone_bricks')).toBe(300);
    expect(qty(result, 'minecraft:smooth_stone')).toBe(100);
    expect(qty(result, 'minecraft:cracked_stone_bricks')).toBe(50);

    // Sandstone variants consolidated
    // sandstone: 200 (direct) + ceil(40/2)=20 (slabs) + 60 (stairs) + 30 (chiseled) + 10 (cut) = 320
    expect(qty(result, 'minecraft:sandstone')).toBe(320);

    // Red sandstone variants
    // 150 (direct) + 20 (stairs) + 100 (chiseled) = 270
    expect(qty(result, 'minecraft:red_sandstone')).toBe(270);

    // Oak planks: 50 (stairs) + ceil(30/2)=15 (slabs) = 65
    expect(qty(result, 'minecraft:oak_planks')).toBe(65);

    // Bricks: 48 (processed) + 200 (brick_stairs) = 248
    expect(qty(result, 'minecraft:bricks')).toBe(248);

    // Tuff bricks: 100 (stairs) + ceil(40/2)=20 (slabs) + 60 (chiseled) = 180
    expect(qty(result, 'minecraft:tuff_bricks')).toBe(180);

    // Alphabetically sorted
    const items = result.map((r) => r.Item);
    expect(items).toEqual([...items].sort());

    // No duplicates
    expect(new Set(items).size).toBe(items.length);
  });
});

// ═══════════════════════════════════════════════════════════
// LARGE QUANTITY STRESS TEST
// ═══════════════════════════════════════════════════════════

describe('large quantities', () => {
  it('handles very large numbers', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:granite_stairs', total: 999999 },
        { item: 'minecraft:granite_slab', total: 999999 },
        { item: 'minecraft:granite_wall', total: 999999 },
      ]),
    ];
    const result = process(input);
    // 999999 + ceil(999999/2)=500000 + 999999 = 2499998
    expect(qty(result, 'minecraft:granite')).toBe(2499998);
  });

  it('handles quantity of 1', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [{ item: 'minecraft:granite_slab', total: 1 }]),
    ];
    const result = process(input);
    // ceil(1/2) = 1
    expect(qty(result, 'minecraft:granite')).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════
// UNKNOWN / FALLBACK ITEMS
// ═══════════════════════════════════════════════════════════

describe('unknown items', () => {
  it('keeps unknown items as-is', () => {
    const input: RawInput = [
      makeGroup('minecraft:x', [
        { item: 'minecraft:totally_made_up_block', total: 42 },
      ]),
    ];
    const result = process(input);
    expect(qty(result, 'minecraft:totally_made_up_block')).toBe(42);
  });

  it('handles items without minecraft: prefix', () => {
    const input: RawInput = [
      makeGroup('modded:custom_ore', [
        { item: 'modded:custom_block', total: 10 },
      ]),
    ];
    const result = process(input);
    expect(qty(result, 'modded:custom_block')).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════
// VALIDATION TESTS
// ═══════════════════════════════════════════════════════════

describe('input validation', () => {
  it('validates correct input', () => {
    const input: RawInput = [
      makeGroup('minecraft:dirt', [{ item: 'minecraft:dirt', total: 10 }]),
    ];
    expect(validateInput(input)).toBe(true);
  });

  it('rejects string', () => {
    expect(validateInput('hello')).toBe(false);
  });

  it('rejects number', () => {
    expect(validateInput(42)).toBe(false);
  });

  it('rejects null', () => {
    expect(validateInput(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validateInput(undefined)).toBe(false);
  });

  it('rejects object (non-array)', () => {
    expect(validateInput({ RawItem: 'x', Results: [] })).toBe(false);
  });

  it('rejects array of primitives', () => {
    expect(validateInput([1, 2, 3])).toBe(false);
  });

  it('rejects items missing RawItem', () => {
    expect(validateInput([{ Results: [] }])).toBe(false);
  });

  it('rejects items missing Results', () => {
    expect(validateInput([{ RawItem: 'x' }])).toBe(false);
  });

  it('rejects items with non-array Results', () => {
    expect(validateInput([{ RawItem: 'x', Results: 'not an array' }])).toBe(false);
  });

  it('rejects results missing ResultItem', () => {
    expect(validateInput([{ RawItem: 'x', Results: [{ ResultTotal: 10 }] }])).toBe(false);
  });

  it('rejects results missing ResultTotal', () => {
    expect(validateInput([{ RawItem: 'x', Results: [{ ResultItem: 'y' }] }])).toBe(false);
  });

  it('accepts empty array', () => {
    expect(validateInput([])).toBe(true);
  });

  it('accepts items with extra fields', () => {
    expect(validateInput([{
      RawItem: 'x',
      TotalEstimate: 100,
      Steps: [],
      Results: [{ ResultItem: 'y', ResultTotal: 10, ExtraField: 'ok' }],
      ExtraTopLevel: true,
    }])).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// MANY GROUPS PERFORMANCE (not timing, just correctness)
// ═══════════════════════════════════════════════════════════

describe('many groups', () => {
  it('handles 100 groups correctly', () => {
    const groups: RawInput = [];
    for (let i = 0; i < 100; i++) {
      groups.push(
        makeGroup(`minecraft:raw_${i}`, [
          { item: `minecraft:item_${i}`, total: i + 1 },
        ])
      );
    }
    const result = process(groups);
    expect(result).toHaveLength(100);
    for (let i = 0; i < 100; i++) {
      expect(qty(result, `minecraft:item_${i}`)).toBe(i + 1);
    }
  });

  it('handles 50 groups all producing the same variant', () => {
    const groups: RawInput = [];
    for (let i = 0; i < 50; i++) {
      groups.push(
        makeGroup(`minecraft:raw_${i}`, [
          { item: 'minecraft:sandstone_stairs', total: 10 + i },
        ])
      );
    }
    const result = process(groups);
    // MAX of 10, 11, 12, ..., 59 = 59
    // 59 stairs → 59 sandstone
    expect(qty(result, 'minecraft:sandstone')).toBe(59);
  });
});
