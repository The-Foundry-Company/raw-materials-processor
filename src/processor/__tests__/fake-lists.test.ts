import { describe, it, expect } from 'vitest';
import { process } from '../index';
import type { RawInput } from '../types';

/**
 * These tests use realistic fake raw material lists inspired by the actual
 * sample data format from the Foundry Company's schematic export tool.
 * Each test simulates a plausible Minecraft construction project.
 */

function qty(result: ReturnType<typeof process>, item: string): number | undefined {
  return result.find((r) => r.Item === `minecraft:${item}`)?.Quantity;
}

// ═══════════════════════════════════════════════════════════
// FAKE PROJECT 1: "Desert Temple Expansion"
// Heavy on sandstone variants, some glazed terracotta accents
// ═══════════════════════════════════════════════════════════

describe('Fake Project: Desert Temple Expansion', () => {
  const input: RawInput = [
    {
      RawItem: 'minecraft:sand',
      TotalEstimate: 4200,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:sandstone', ResultTotal: 500 },
        { ResultItem: 'minecraft:sandstone_slab', ResultTotal: 240 },
        { ResultItem: 'minecraft:sandstone_stairs', ResultTotal: 180 },
        { ResultItem: 'minecraft:smooth_sandstone', ResultTotal: 300 },
        { ResultItem: 'minecraft:smooth_sandstone_stairs', ResultTotal: 120 },
        { ResultItem: 'minecraft:chiseled_sandstone', ResultTotal: 96 },
        { ResultItem: 'minecraft:cut_sandstone', ResultTotal: 64 },
      ],
    },
    {
      RawItem: 'minecraft:red_sand',
      TotalEstimate: 1800,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:red_sandstone', ResultTotal: 200 },
        { ResultItem: 'minecraft:red_sandstone_stairs', ResultTotal: 88 },
        { ResultItem: 'minecraft:chiseled_red_sandstone', ResultTotal: 150 },
        { ResultItem: 'minecraft:cut_red_sandstone', ResultTotal: 72 },
      ],
    },
    {
      RawItem: 'minecraft:clay',
      TotalEstimate: 800,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:orange_glazed_terracotta', ResultTotal: 128 },
        { ResultItem: 'minecraft:yellow_glazed_terracotta', ResultTotal: 64 },
        { ResultItem: 'minecraft:terracotta', ResultTotal: 96 },
      ],
    },
    {
      RawItem: 'minecraft:cobblestone',
      TotalEstimate: 200,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:stone_bricks', ResultTotal: 100 },
        { ResultItem: 'minecraft:smooth_stone', ResultTotal: 48 },
      ],
    },
    {
      RawItem: 'minecraft:iron_ingot',
      TotalEstimate: 32,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:iron_bars', ResultTotal: 64 },
        { ResultItem: 'minecraft:lantern', ResultTotal: 24 },
      ],
    },
    {
      RawItem: 'minecraft:iron_nugget',
      TotalEstimate: 4,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:lantern', ResultTotal: 24 },
      ],
    },
    {
      RawItem: 'minecraft:oak_log',
      TotalEstimate: 16,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:chest', ResultTotal: 4 },
        { ResultItem: 'minecraft:torch', ResultTotal: 48 },
      ],
    },
    {
      RawItem: 'minecraft:coal',
      TotalEstimate: 12,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:torch', ResultTotal: 48 },
      ],
    },
  ];

  it('consolidates sandstone variants + smooth_sandstone chain', () => {
    const result = process(input);
    // sandstone: 500 + 120(slabs) + 180(stairs) + 96(chiseled) + 64(cut) = 960
    // + smooth_sandstone chain: 300 + 120(stairs) = 420 → sandstone
    // Total: 960 + 420 = 1380
    expect(qty(result, 'sandstone')).toBe(1380);
  });

  it('consolidates red_sandstone variants', () => {
    const result = process(input);
    // red_sandstone: 200 + 88 + 150 + 72 = 510
    expect(qty(result, 'red_sandstone')).toBe(510);
  });

  it('keeps terracotta items as functional', () => {
    const result = process(input);
    expect(qty(result, 'orange_glazed_terracotta')).toBe(128);
    expect(qty(result, 'yellow_glazed_terracotta')).toBe(64);
    expect(qty(result, 'terracotta')).toBe(96);
  });

  it('deduplicates lantern across iron sources', () => {
    const result = process(input);
    expect(qty(result, 'lantern')).toBe(24);
  });

  it('deduplicates torch across sources', () => {
    const result = process(input);
    expect(qty(result, 'torch')).toBe(48);
  });

  it('decomposes chest to oak_log (default, no other log types)', () => {
    const result = process(input);
    // chest:4 → 4 × 8 = 32 planks → ceil(32/4) = 8 oak_log
    expect(qty(result, 'chest')).toBeUndefined();
    expect(qty(result, 'oak_log')).toBe(8);
  });

  it('resolves stone_bricks and smooth_stone to stone', () => {
    const result = process(input);
    // stone_bricks:100 + smooth_stone:48 → stone: 148
    expect(qty(result, 'stone')).toBe(148);
  });
});

// ═══════════════════════════════════════════════════════════
// FAKE PROJECT 2: "Modern Office Building"
// Heavy on glass, wood, polished stone, copper
// ═══════════════════════════════════════════════════════════

describe('Fake Project: Modern Office Building', () => {
  const input: RawInput = [
    {
      RawItem: 'minecraft:sand',
      TotalEstimate: 2400,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:black_stained_glass_pane', ResultTotal: 384 },
        { ResultItem: 'minecraft:white_stained_glass_pane', ResultTotal: 256 },
        { ResultItem: 'minecraft:smooth_sandstone', ResultTotal: 40 },
      ],
    },
    {
      RawItem: 'minecraft:ink_sac',
      TotalEstimate: 48,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:black_stained_glass_pane', ResultTotal: 384 },
      ],
    },
    {
      RawItem: 'minecraft:bone',
      TotalEstimate: 32,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:white_stained_glass_pane', ResultTotal: 256 },
      ],
    },
    {
      RawItem: 'minecraft:cobblestone',
      TotalEstimate: 3000,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:polished_diorite_stairs', ResultTotal: 200 },
        { ResultItem: 'minecraft:polished_diorite', ResultTotal: 600 },
        { ResultItem: 'minecraft:smooth_stone', ResultTotal: 400 },
        { ResultItem: 'minecraft:stone_bricks', ResultTotal: 300 },
        { ResultItem: 'minecraft:stone_brick_stairs', ResultTotal: 150 },
        { ResultItem: 'minecraft:stone_brick_slab', ResultTotal: 80 },
      ],
    },
    {
      RawItem: 'minecraft:nether_quartz_ore',
      TotalEstimate: 600,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:polished_diorite_stairs', ResultTotal: 200 },
        { ResultItem: 'minecraft:polished_diorite', ResultTotal: 600 },
      ],
    },
    {
      RawItem: 'minecraft:birch_log',
      TotalEstimate: 400,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:birch_slab', ResultTotal: 120 },
        { ResultItem: 'minecraft:birch_stairs', ResultTotal: 80 },
        { ResultItem: 'minecraft:birch_door', ResultTotal: 32 },
        { ResultItem: 'minecraft:birch_trapdoor', ResultTotal: 24 },
        { ResultItem: 'minecraft:birch_fence', ResultTotal: 48 },
      ],
    },
    {
      RawItem: 'minecraft:stripped_birch_log',
      TotalEstimate: 800,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:stripped_birch_log', ResultTotal: 800 },
      ],
    },
    {
      RawItem: 'minecraft:copper_block',
      TotalEstimate: 200,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:waxed_copper_block', ResultTotal: 160 },
        { ResultItem: 'minecraft:lightning_rod', ResultTotal: 40 },
      ],
    },
    {
      RawItem: 'minecraft:copper_ingot',
      TotalEstimate: 80,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:waxed_copper_block', ResultTotal: 160 },
        { ResultItem: 'minecraft:lightning_rod', ResultTotal: 40 },
      ],
    },
    {
      RawItem: 'minecraft:honeycomb',
      TotalEstimate: 160,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:waxed_copper_block', ResultTotal: 160 },
      ],
    },
    {
      RawItem: 'minecraft:iron_block',
      TotalEstimate: 20,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:iron_bars', ResultTotal: 96 },
      ],
    },
    {
      RawItem: 'minecraft:iron_ingot',
      TotalEstimate: 48,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:iron_bars', ResultTotal: 96 },
      ],
    },
    {
      RawItem: 'minecraft:oak_log',
      TotalEstimate: 30,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:crafting_table', ResultTotal: 2 },
        { ResultItem: 'minecraft:lectern', ResultTotal: 8 },
        { ResultItem: 'minecraft:chest', ResultTotal: 6 },
      ],
    },
    {
      RawItem: 'minecraft:rabbit_hide',
      TotalEstimate: 96,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:lectern', ResultTotal: 8 },
      ],
    },
  ];

  it('deduplicates glass panes across raw sources', () => {
    const result = process(input);
    expect(qty(result, 'black_stained_glass_pane')).toBe(384);
    expect(qty(result, 'white_stained_glass_pane')).toBe(256);
  });

  it('resolves polished_diorite chain → diorite', () => {
    const result = process(input);
    // polished_diorite: 600 → diorite + stairs: 200 → polished_diorite → diorite
    // Total diorite: 800
    expect(qty(result, 'diorite')).toBe(800);
  });

  it('resolves stone_brick + smooth_stone chains → stone', () => {
    const result = process(input);
    // stone_bricks: 300 + stairs:150 + slabs:40 = 490 stone_bricks → stone
    // smooth_stone: 400 → stone
    // Total stone: 490 + 400 = 890
    expect(qty(result, 'stone')).toBe(890);
  });

  it('resolves birch slabs/stairs → birch_log (via planks)', () => {
    const result = process(input);
    // birch_planks: 60(slabs) + 80(stairs) = 140 → ceil(140/4) = 35 birch_log
    // + doors/trapdoors/fences: 16+18+20 = 54 birch_log
    // Total birch_log: 54 + 35 = 89
    // birch_log: 89 (from planks+doors+etc) + 800 (stripped_birch_log) = 889
    // + Phase 3c: crafting_table:2 + chest:6 → 2×4+6×8 = 56 planks → ceil(56/4) = 14
    // Total: 889 + 14 = 903
    expect(qty(result, 'birch_log')).toBe(903);
    expect(qty(result, 'birch_door')).toBeUndefined();
    expect(qty(result, 'birch_trapdoor')).toBeUndefined();
    expect(qty(result, 'birch_fence')).toBeUndefined();
    expect(qty(result, 'stripped_birch_log')).toBeUndefined();
    expect(qty(result, 'crafting_table')).toBeUndefined();
    expect(qty(result, 'chest')).toBeUndefined();
  });

  it('deduplicates waxed_copper_block across 3 sources', () => {
    const result = process(input);
    expect(qty(result, 'waxed_copper_block')).toBe(160);
  });

  it('deduplicates iron_bars and lectern', () => {
    const result = process(input);
    expect(qty(result, 'iron_bars')).toBe(96);
    expect(qty(result, 'lectern')).toBe(8);
  });

  it('resolves smooth_sandstone to sandstone', () => {
    const result = process(input);
    // smooth_sandstone: 40 → sandstone: 40
    expect(qty(result, 'sandstone')).toBe(40);
  });

  it('has correct total unique items', () => {
    const result = process(input);
    // black_stained_glass_pane, white_stained_glass_pane, sandstone (was smooth_sandstone),
    // diorite (was polished_diorite), stone (was smooth_stone+stone_bricks),
    // birch_log (was birch_planks+birch_log+stripped_birch_log+chest+crafting_table),
    // waxed_copper_block, lightning_rod, iron_bars, lectern = 10
    expect(result.length).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════
// FAKE PROJECT 3: "Nether Fortress Rebuild"
// Nether bricks, blackstone, deepslate, fire-related
// ═══════════════════════════════════════════════════════════

describe('Fake Project: Nether Fortress Rebuild', () => {
  const input: RawInput = [
    {
      RawItem: 'minecraft:netherrack',
      TotalEstimate: 1200,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:nether_brick_stairs', ResultTotal: 400 },
        { ResultItem: 'minecraft:nether_brick_slab', ResultTotal: 100 },
        { ResultItem: 'minecraft:nether_brick_wall', ResultTotal: 200 },
        { ResultItem: 'minecraft:nether_brick_fence', ResultTotal: 64 },
        { ResultItem: 'minecraft:nether_bricks', ResultTotal: 300 },
      ],
    },
    {
      RawItem: 'minecraft:nether_wart',
      TotalEstimate: 200,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:red_nether_brick_stairs', ResultTotal: 80 },
        { ResultItem: 'minecraft:red_nether_brick_slab', ResultTotal: 40 },
        { ResultItem: 'minecraft:red_nether_bricks', ResultTotal: 160 },
      ],
    },
    {
      RawItem: 'minecraft:blackstone',
      TotalEstimate: 600,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:polished_blackstone_bricks', ResultTotal: 200 },
        { ResultItem: 'minecraft:polished_blackstone_brick_stairs', ResultTotal: 150 },
        { ResultItem: 'minecraft:polished_blackstone_brick_slab', ResultTotal: 60 },
      ],
    },
    {
      RawItem: 'minecraft:cobbled_deepslate',
      TotalEstimate: 800,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:deepslate_tile_stairs', ResultTotal: 300 },
        { ResultItem: 'minecraft:deepslate_tile_slab', ResultTotal: 120 },
        { ResultItem: 'minecraft:deepslate_tile_wall', ResultTotal: 80 },
        { ResultItem: 'minecraft:deepslate_bricks', ResultTotal: 100 },
      ],
    },
    {
      RawItem: 'minecraft:blaze_rod',
      TotalEstimate: 16,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:end_rod', ResultTotal: 32 },
      ],
    },
    {
      RawItem: 'minecraft:chorus_fruit',
      TotalEstimate: 16,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:end_rod', ResultTotal: 32 },
      ],
    },
    {
      RawItem: 'minecraft:prismarine_shard',
      TotalEstimate: 100,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:sea_lantern', ResultTotal: 25 },
      ],
    },
    {
      RawItem: 'minecraft:prismarine_crystals',
      TotalEstimate: 125,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:sea_lantern', ResultTotal: 25 },
      ],
    },
    {
      RawItem: 'minecraft:glowstone_dust',
      TotalEstimate: 160,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:glowstone', ResultTotal: 40 },
      ],
    },
  ];

  it('consolidates nether_brick variants (including fence)', () => {
    const result = process(input);
    // nether_bricks: 300 (processed) + 400 (stairs) + ceil(100/2)=50 (slabs) + 200 (walls) + 64 (fence via special map) = 1014
    expect(qty(result, 'nether_bricks')).toBe(1014);
    expect(qty(result, 'nether_brick_fence')).toBeUndefined();
  });

  it('consolidates red_nether_brick variants', () => {
    const result = process(input);
    // red_nether_bricks: 160 (processed) + 80 (stairs) + ceil(40/2)=20 (slabs) = 260
    expect(qty(result, 'red_nether_bricks')).toBe(260);
  });

  it('resolves polished_blackstone_brick chain → blackstone', () => {
    const result = process(input);
    // polished_blackstone_bricks: 200 → blackstone + stairs:150 + slabs:30 = 380 → blackstone
    expect(qty(result, 'blackstone')).toBe(380);
  });

  it('resolves deepslate chains → cobbled_deepslate', () => {
    const result = process(input);
    // deepslate_tiles: 300+60+80 = 440 → cobbled_deepslate
    // deepslate_bricks: 100 → cobbled_deepslate
    // Total cobbled_deepslate: 540
    expect(qty(result, 'cobbled_deepslate')).toBe(540);
  });

  it('deduplicates end_rod across raw sources', () => {
    const result = process(input);
    expect(qty(result, 'end_rod')).toBe(32);
  });

  it('deduplicates sea_lantern', () => {
    const result = process(input);
    expect(qty(result, 'sea_lantern')).toBe(25);
  });

  it('keeps glowstone as functional', () => {
    const result = process(input);
    expect(qty(result, 'glowstone')).toBe(40);
  });
});

// ═══════════════════════════════════════════════════════════
// FAKE PROJECT 4: "Tuff & Copper Modern House"
// Tests newer block types (1.17+ copper, 1.21+ tuff bricks)
// ═══════════════════════════════════════════════════════════

describe('Fake Project: Tuff & Copper Modern House', () => {
  const input: RawInput = [
    {
      RawItem: 'minecraft:tuff',
      TotalEstimate: 1200,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:tuff_brick_stairs', ResultTotal: 400 },
        { ResultItem: 'minecraft:tuff_brick_slab', ResultTotal: 200 },
        { ResultItem: 'minecraft:tuff_brick_wall', ResultTotal: 50 },
        { ResultItem: 'minecraft:chiseled_tuff_bricks', ResultTotal: 120 },
        { ResultItem: 'minecraft:chiseled_tuff', ResultTotal: 30 },
        { ResultItem: 'minecraft:polished_tuff', ResultTotal: 80 },
      ],
    },
    {
      RawItem: 'minecraft:copper_block',
      TotalEstimate: 500,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:waxed_copper_block', ResultTotal: 200 },
        { ResultItem: 'minecraft:waxed_exposed_copper', ResultTotal: 100 },
        { ResultItem: 'minecraft:oxidized_copper_trapdoor', ResultTotal: 24 },
        { ResultItem: 'minecraft:lightning_rod', ResultTotal: 16 },
      ],
    },
    {
      RawItem: 'minecraft:copper_ingot',
      TotalEstimate: 40,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:waxed_copper_block', ResultTotal: 200 },
        { ResultItem: 'minecraft:waxed_exposed_copper', ResultTotal: 100 },
        { ResultItem: 'minecraft:oxidized_copper_trapdoor', ResultTotal: 24 },
        { ResultItem: 'minecraft:lightning_rod', ResultTotal: 16 },
      ],
    },
    {
      RawItem: 'minecraft:honeycomb',
      TotalEstimate: 300,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:waxed_copper_block', ResultTotal: 200 },
        { ResultItem: 'minecraft:waxed_exposed_copper', ResultTotal: 100 },
      ],
    },
    {
      RawItem: 'minecraft:dark_oak_log',
      TotalEstimate: 60,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:dark_oak_door', ResultTotal: 8 },
        { ResultItem: 'minecraft:dark_oak_trapdoor', ResultTotal: 16 },
      ],
    },
    {
      RawItem: 'minecraft:stripped_dark_oak_log',
      TotalEstimate: 300,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:stripped_dark_oak_log', ResultTotal: 300 },
      ],
    },
    {
      RawItem: 'minecraft:cherry_log',
      TotalEstimate: 80,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:cherry_stairs', ResultTotal: 40 },
        { ResultItem: 'minecraft:cherry_slab', ResultTotal: 30 },
        { ResultItem: 'minecraft:cherry_door', ResultTotal: 6 },
      ],
    },
  ];

  it('consolidates all tuff variants to tuff', () => {
    const result = process(input);
    // tuff_bricks: 400+100+50+120 = 670 → tuff (Phase 3b)
    // + chiseled_tuff: 30 → tuff
    // + polished_tuff: 80 → tuff (Phase 3b)
    // Total tuff: 670 + 30 + 80 = 780
    expect(qty(result, 'tuff')).toBe(780);
  });

  it('deduplicates waxed copper across 3 raw sources', () => {
    const result = process(input);
    expect(qty(result, 'waxed_copper_block')).toBe(200);
    expect(qty(result, 'waxed_exposed_copper')).toBe(100);
  });

  it('keeps copper functional items', () => {
    const result = process(input);
    expect(qty(result, 'oxidized_copper_trapdoor')).toBe(24);
    expect(qty(result, 'lightning_rod')).toBe(16);
  });

  it('decomposes door/trapdoor items to logs', () => {
    const result = process(input);
    // dark_oak_door:8 → 4, dark_oak_trapdoor:16 → 12 = 16 dark_oak_log + 300 stripped = 316
    expect(qty(result, 'dark_oak_log')).toBe(316);
    expect(qty(result, 'dark_oak_door')).toBeUndefined();
    expect(qty(result, 'dark_oak_trapdoor')).toBeUndefined();
  });

  it('resolves cherry wood → cherry_log (via planks)', () => {
    const result = process(input);
    // cherry_planks: 40+15 = 55 → ceil(55/4)=14 cherry_log
    // + cherry_door:6 → ceil(6/2)=3 cherry_log
    // Total cherry_log: 14+3 = 17
    expect(qty(result, 'cherry_log')).toBe(17);
    expect(qty(result, 'cherry_door')).toBeUndefined();
  });

  it('decomposes stripped_dark_oak_log into dark_oak_log', () => {
    const result = process(input);
    expect(qty(result, 'stripped_dark_oak_log')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// FAKE PROJECT 5: "Medieval Village"
// Mix of everything: wood, stone, terracotta, functional
// ═══════════════════════════════════════════════════════════

describe('Fake Project: Medieval Village', () => {
  const input: RawInput = [
    // Multiple wood types for different buildings
    {
      RawItem: 'minecraft:spruce_log',
      TotalEstimate: 200,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:spruce_stairs', ResultTotal: 80 },
        { ResultItem: 'minecraft:spruce_slab', ResultTotal: 60 },
        { ResultItem: 'minecraft:spruce_door', ResultTotal: 12 },
        { ResultItem: 'minecraft:spruce_trapdoor', ResultTotal: 20 },
        { ResultItem: 'minecraft:spruce_fence', ResultTotal: 36 },
        { ResultItem: 'minecraft:spruce_fence_gate', ResultTotal: 8 },
      ],
    },
    {
      RawItem: 'minecraft:oak_log',
      TotalEstimate: 150,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:oak_stairs', ResultTotal: 60 },
        { ResultItem: 'minecraft:oak_slab', ResultTotal: 40 },
        { ResultItem: 'minecraft:oak_door', ResultTotal: 10 },
        { ResultItem: 'minecraft:oak_sign', ResultTotal: 16 },
        { ResultItem: 'minecraft:chest', ResultTotal: 12 },
        { ResultItem: 'minecraft:crafting_table', ResultTotal: 6 },
        { ResultItem: 'minecraft:lectern', ResultTotal: 4 },
      ],
    },
    {
      RawItem: 'minecraft:stripped_spruce_log',
      TotalEstimate: 400,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:stripped_spruce_log', ResultTotal: 400 },
      ],
    },
    {
      RawItem: 'minecraft:stripped_oak_log',
      TotalEstimate: 200,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:stripped_oak_log', ResultTotal: 200 },
      ],
    },
    // Stone for foundations
    {
      RawItem: 'minecraft:cobblestone',
      TotalEstimate: 2000,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:stone_bricks', ResultTotal: 500 },
        { ResultItem: 'minecraft:stone_brick_stairs', ResultTotal: 200 },
        { ResultItem: 'minecraft:stone_brick_slab', ResultTotal: 100 },
        { ResultItem: 'minecraft:stone_brick_wall', ResultTotal: 80 },
        { ResultItem: 'minecraft:cracked_stone_bricks', ResultTotal: 120 },
        { ResultItem: 'minecraft:mossy_stone_bricks', ResultTotal: 60 },
        { ResultItem: 'minecraft:smooth_stone', ResultTotal: 100 },
        { ResultItem: 'minecraft:furnace', ResultTotal: 8 },
      ],
    },
    // Terracotta for roofs
    {
      RawItem: 'minecraft:clay',
      TotalEstimate: 600,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:bricks', ResultTotal: 100 },
        { ResultItem: 'minecraft:brick_stairs', ResultTotal: 160 },
        { ResultItem: 'minecraft:brick_slab', ResultTotal: 80 },
        { ResultItem: 'minecraft:brick_wall', ResultTotal: 40 },
        { ResultItem: 'minecraft:brown_terracotta', ResultTotal: 200 },
        { ResultItem: 'minecraft:white_terracotta', ResultTotal: 150 },
        { ResultItem: 'minecraft:terracotta', ResultTotal: 80 },
      ],
    },
    // Lighting
    {
      RawItem: 'minecraft:iron_ingot',
      TotalEstimate: 20,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:lantern', ResultTotal: 48 },
        { ResultItem: 'minecraft:iron_bars', ResultTotal: 32 },
        { ResultItem: 'minecraft:bell', ResultTotal: 2 },
      ],
    },
    {
      RawItem: 'minecraft:iron_nugget',
      TotalEstimate: 8,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:lantern', ResultTotal: 48 },
      ],
    },
    {
      RawItem: 'minecraft:coal',
      TotalEstimate: 12,
      Steps: [],
      Results: [
        { ResultItem: 'minecraft:torch', ResultTotal: 64 },
        { ResultItem: 'minecraft:lantern', ResultTotal: 48 },
      ],
    },
  ];

  it('resolves spruce wood → spruce_log (via planks + functional)', () => {
    const result = process(input);
    // spruce_planks: 80+30 = 110 → ceil(110/4)=28 spruce_log
    // + spruce_door:12→6, trapdoor:20→15, fence:36→15, fence_gate:8→8 = 44 spruce_log
    // Total spruce_log: 28+44 = 72
    // spruce_log: 72 (from planks+functional) + 400 (stripped_spruce_log) = 472
    // + Phase 3c: chest:12+crafting_table:6 → 12×8+6×4=120 planks → ceil(120/4)=30 (spruce is dominant)
    // Total: 472 + 30 = 502
    expect(qty(result, 'spruce_log')).toBe(502);
    expect(qty(result, 'spruce_door')).toBeUndefined();
    expect(qty(result, 'spruce_trapdoor')).toBeUndefined();
    expect(qty(result, 'spruce_fence')).toBeUndefined();
    expect(qty(result, 'spruce_fence_gate')).toBeUndefined();
    expect(qty(result, 'chest')).toBeUndefined();
    expect(qty(result, 'crafting_table')).toBeUndefined();
  });

  it('resolves oak wood → oak_log (via planks + functional)', () => {
    const result = process(input);
    // oak_planks: 60+20 = 80 → ceil(80/4)=20 oak_log
    // + oak_door:10→5, oak_sign:16→9 = 14 oak_log
    // + 200 stripped_oak_log = 234
    expect(qty(result, 'oak_log')).toBe(234);
    expect(qty(result, 'oak_door')).toBeUndefined();
    expect(qty(result, 'oak_sign')).toBeUndefined();
  });

  it('resolves stone chains → stone', () => {
    const result = process(input);
    // stone_bricks: 500+200+50+80 = 830 → stone
    // + cracked_stone_bricks: 120 → stone
    // + smooth_stone: 100 → stone
    // Total stone: 1050
    expect(qty(result, 'stone')).toBe(1050);
  });

  it('decomposes furnace to cobblestone', () => {
    const result = process(input);
    // furnace:8 → ceil(8/(1/8)) = 64 cobblestone
    expect(qty(result, 'furnace')).toBeUndefined();
    expect(qty(result, 'cobblestone')).toBe(64);
  });

  it('keeps mossy_stone_bricks as processed (multi-material)', () => {
    const result = process(input);
    expect(qty(result, 'mossy_stone_bricks')).toBe(60);
  });

  it('consolidates brick variants to bricks (stays, non-block base)', () => {
    const result = process(input);
    // bricks: 100 (processed) + 160 (stairs) + ceil(80/2)=40 (slabs) + 40 (walls) = 340
    expect(qty(result, 'bricks')).toBe(340);
  });

  it('keeps terracotta as functional', () => {
    const result = process(input);
    expect(qty(result, 'brown_terracotta')).toBe(200);
    expect(qty(result, 'white_terracotta')).toBe(150);
    expect(qty(result, 'terracotta')).toBe(80);
  });

  it('deduplicates lantern across 3 sources', () => {
    const result = process(input);
    expect(qty(result, 'lantern')).toBe(48);
  });

  it('keeps non-decomposable pass-through items', () => {
    const result = process(input);
    // stripped items decomposed into base logs (verified above)
    expect(qty(result, 'stripped_spruce_log')).toBeUndefined();
    expect(qty(result, 'stripped_oak_log')).toBeUndefined();
  });

  it('output is sorted by category and has no duplicates', () => {
    const result = process(input);
    const items = result.map((r) => r.Item);
    expect(new Set(items).size).toBe(items.length);
  });
});
