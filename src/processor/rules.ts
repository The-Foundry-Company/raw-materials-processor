// ── Functional items: keep as-is (crafted items that shouldn't be decomposed) ──

export const FUNCTIONAL_EXACT: Set<string> = new Set([
  'torch',
  'soul_torch',
  'lantern',
  'soul_lantern',
  'sea_lantern',
  'glowstone',
  'end_rod',
  'lightning_rod',
  'trapped_chest',
  'ender_chest',
  'blast_furnace',
  'smoker',
  'lectern',
  'bell',
  'lodestone',
  'iron_bars',
  'chain',
  'anvil',
  'brewing_stand',
  'enchanting_table',
  'beacon',
  'conduit',
  'respawn_anchor',
  'campfire',
  'soul_campfire',
  'bookshelf',
  'chiseled_bookshelf',
  'flower_pot',
  'armor_stand',
  'item_frame',
  'glow_item_frame',
  'painting',
  'bed',
  'barrel',
  'grindstone',
  'smithing_table',
  'stonecutter',
  'cartography_table',
  'fletching_table',
  'loom',
  'hopper',
  'dropper',
  'dispenser',
  'observer',
  'piston',
  'sticky_piston',
  'redstone_lamp',
  'daylight_detector',
  'target',
  'tnt',
  'scaffolding',
  'glass',
  'glass_pane',
  'tinted_glass',
]);

const FUNCTIONAL_SUFFIXES: string[] = [
  '_hanging_sign',
];

const FUNCTIONAL_PATTERNS: string[] = [
  '_terracotta',
  '_stained_glass_pane',
  '_stained_glass',
  '_glazed_terracotta',
  '_carpet',
  '_banner',
  '_candle',
  '_bed',
  '_shulker_box',
  '_concrete',
  '_concrete_powder',
  '_wool',
];

export function isFunctional(name: string): boolean {
  if (FUNCTIONAL_EXACT.has(name)) return true;
  if (name.startsWith('waxed_')) return true;
  if (name.startsWith('oxidized_')) return true;
  if (name.startsWith('weathered_')) return true;
  if (name.startsWith('exposed_')) return true;

  for (const suffix of FUNCTIONAL_SUFFIXES) {
    if (name.endsWith(suffix)) return true;
  }
  for (const pattern of FUNCTIONAL_PATTERNS) {
    if (name.endsWith(pattern)) return true;
  }

  // Plain "terracotta" (uncolored)
  if (name === 'terracotta') return true;

  return false;
}

// ── Processed blocks: blocks that are already "processed" and should stay as-is ──

export const PROCESSED_BLOCKS: Set<string> = new Set([
  // Multi-material or non-block base — these stay as processed blocks
  'mossy_stone_bricks',
  'bricks',
  'nether_bricks',
  'red_nether_bricks',
  'prismarine_bricks',
  'dark_prismarine',
  'purpur_block',
  'mud_bricks',
  'packed_mud',
  'bamboo_block',
]);

// ── Special variant → base block mappings ──
// These override generic suffix stripping because the naive approach gives wrong results

export const SPECIAL_VARIANT_MAP: Record<string, string> = {
  // Pluralization issues
  'deepslate_tile_slab': 'deepslate_tiles',
  'deepslate_tile_stairs': 'deepslate_tiles',
  'deepslate_tile_wall': 'deepslate_tiles',
  'tuff_brick_slab': 'tuff_bricks',
  'tuff_brick_stairs': 'tuff_bricks',
  'tuff_brick_wall': 'tuff_bricks',
  'chiseled_tuff_bricks': 'tuff_bricks',
  'chiseled_tuff': 'tuff',
  'brick_slab': 'bricks',
  'brick_stairs': 'bricks',
  'brick_wall': 'bricks',
  'stone_brick_slab': 'stone_bricks',
  'stone_brick_stairs': 'stone_bricks',
  'stone_brick_wall': 'stone_bricks',
  'mossy_stone_brick_slab': 'mossy_stone_bricks',
  'mossy_stone_brick_stairs': 'mossy_stone_bricks',
  'mossy_stone_brick_wall': 'mossy_stone_bricks',
  'deepslate_brick_slab': 'deepslate_bricks',
  'deepslate_brick_stairs': 'deepslate_bricks',
  'deepslate_brick_wall': 'deepslate_bricks',
  'nether_brick_slab': 'nether_bricks',
  'nether_brick_stairs': 'nether_bricks',
  'nether_brick_wall': 'nether_bricks',
  'nether_brick_fence': 'nether_bricks',
  'red_nether_brick_slab': 'red_nether_bricks',
  'red_nether_brick_stairs': 'red_nether_bricks',
  'red_nether_brick_wall': 'red_nether_bricks',
  'end_stone_brick_slab': 'end_stone_bricks',
  'end_stone_brick_stairs': 'end_stone_bricks',
  'end_stone_brick_wall': 'end_stone_bricks',
  'mud_brick_slab': 'mud_bricks',
  'mud_brick_stairs': 'mud_bricks',
  'mud_brick_wall': 'mud_bricks',
  'prismarine_brick_slab': 'prismarine_bricks',
  'prismarine_brick_stairs': 'prismarine_bricks',
  'polished_blackstone_brick_slab': 'polished_blackstone_bricks',
  'polished_blackstone_brick_stairs': 'polished_blackstone_bricks',
  'polished_blackstone_brick_wall': 'polished_blackstone_bricks',

  // Wood → planks
  'oak_slab': 'oak_planks',
  'oak_stairs': 'oak_planks',
  'spruce_slab': 'spruce_planks',
  'spruce_stairs': 'spruce_planks',
  'birch_slab': 'birch_planks',
  'birch_stairs': 'birch_planks',
  'jungle_slab': 'jungle_planks',
  'jungle_stairs': 'jungle_planks',
  'acacia_slab': 'acacia_planks',
  'acacia_stairs': 'acacia_planks',
  'dark_oak_slab': 'dark_oak_planks',
  'dark_oak_stairs': 'dark_oak_planks',
  'mangrove_slab': 'mangrove_planks',
  'mangrove_stairs': 'mangrove_planks',
  'cherry_slab': 'cherry_planks',
  'cherry_stairs': 'cherry_planks',
  'bamboo_slab': 'bamboo_planks',
  'bamboo_stairs': 'bamboo_planks',
  'bamboo_mosaic_slab': 'bamboo_mosaic',
  'bamboo_mosaic_stairs': 'bamboo_mosaic',
  'crimson_slab': 'crimson_planks',
  'crimson_stairs': 'crimson_planks',
  'warped_slab': 'warped_planks',
  'warped_stairs': 'warped_planks',
  'pale_oak_slab': 'pale_oak_planks',
  'pale_oak_stairs': 'pale_oak_planks',
};

// ── Variant suffixes and their stonecutter ratios ──
// ratio = how many variants you get per 1 base block
// So to go from variant count → base block count: ceil(count / ratio)

export const VARIANT_SUFFIXES: { suffix: string; ratio: number }[] = [
  { suffix: '_stairs', ratio: 1 },
  { suffix: '_slab', ratio: 2 },
  { suffix: '_wall', ratio: 1 },
];

export const VARIANT_PREFIXES: { prefix: string; ratio: number }[] = [
  { prefix: 'chiseled_', ratio: 1 },
  { prefix: 'cut_', ratio: 1 },
];

/**
 * Strips the minecraft: prefix from an item ID.
 */
export function stripNamespace(item: string): string {
  return item.startsWith('minecraft:') ? item.slice('minecraft:'.length) : item;
}

/**
 * Adds the minecraft: prefix to an item name.
 */
export function addNamespace(name: string): string {
  return name.startsWith('minecraft:') ? name : `minecraft:${name}`;
}

// ── Decomposition: single-material functional items → base material ──

const WOOD_TO_LOG: Record<string, string> = {
  oak: 'oak_log',
  spruce: 'spruce_log',
  birch: 'birch_log',
  jungle: 'jungle_log',
  acacia: 'acacia_log',
  dark_oak: 'dark_oak_log',
  mangrove: 'mangrove_log',
  cherry: 'cherry_log',
  pale_oak: 'pale_oak_log',
  bamboo: 'bamboo_block',
  crimson: 'crimson_stem',
  warped: 'warped_stem',
};

const DECOMPOSABLE_SUFFIXES: {
  suffix: string;
  stdRatio: number;
  bambooRatio: number;
}[] = [
  { suffix: '_door', stdRatio: 2, bambooRatio: 1 },
  { suffix: '_trapdoor', stdRatio: 4 / 3, bambooRatio: 2 / 3 },
  { suffix: '_fence', stdRatio: 12 / 5, bambooRatio: 6 / 5 },
  { suffix: '_fence_gate', stdRatio: 1, bambooRatio: 1 / 2 },
  { suffix: '_sign', stdRatio: 24 / 13, bambooRatio: 12 / 13 },
  { suffix: '_wall_sign', stdRatio: 24 / 13, bambooRatio: 12 / 13 },
  { suffix: '_button', stdRatio: 4, bambooRatio: 2 },
  { suffix: '_pressure_plate', stdRatio: 2, bambooRatio: 1 },
];

// ── Single-chain decomposition: processed blocks → rawest block-form base ──
// All 1:1 ratios (stonecutter or smelting, single material chain)

const SINGLE_CHAIN_DECOMPOSITION: Record<string, { base: string; ratio: number }> = {
  stone_bricks: { base: 'stone', ratio: 1 },
  cracked_stone_bricks: { base: 'stone', ratio: 1 },
  smooth_stone: { base: 'stone', ratio: 1 },
  smooth_sandstone: { base: 'sandstone', ratio: 1 },
  smooth_red_sandstone: { base: 'red_sandstone', ratio: 1 },
  smooth_quartz: { base: 'quartz_block', ratio: 1 },
  polished_andesite: { base: 'andesite', ratio: 1 },
  polished_diorite: { base: 'diorite', ratio: 1 },
  polished_granite: { base: 'granite', ratio: 1 },
  polished_basalt: { base: 'basalt', ratio: 1 },
  polished_tuff: { base: 'tuff', ratio: 1 },
  polished_deepslate: { base: 'cobbled_deepslate', ratio: 1 },
  deepslate_bricks: { base: 'cobbled_deepslate', ratio: 1 },
  deepslate_tiles: { base: 'cobbled_deepslate', ratio: 1 },
  polished_blackstone: { base: 'blackstone', ratio: 1 },
  polished_blackstone_bricks: { base: 'blackstone', ratio: 1 },
  tuff_bricks: { base: 'tuff', ratio: 1 },
  end_stone_bricks: { base: 'end_stone', ratio: 1 },
  quartz_bricks: { base: 'quartz_block', ratio: 1 },
  quartz_pillar: { base: 'quartz_block', ratio: 1 },
  purpur_pillar: { base: 'purpur_block', ratio: 1 },
  bamboo_mosaic: { base: 'bamboo_planks', ratio: 1 },
};

const NON_WOOD_DECOMPOSITION: Record<string, { base: string; ratio: number }> = {
  furnace: { base: 'cobblestone', ratio: 1 / 8 },
  iron_door: { base: 'iron_ingot', ratio: 0.5 },
  iron_trapdoor: { base: 'iron_ingot', ratio: 0.25 },
  copper_door: { base: 'copper_ingot', ratio: 0.5 },
  copper_trapdoor: { base: 'copper_ingot', ratio: 0.5 },
  stone_button: { base: 'stone', ratio: 1 },
  stone_pressure_plate: { base: 'stone', ratio: 0.5 },
  polished_blackstone_button: { base: 'polished_blackstone', ratio: 1 },
  polished_blackstone_pressure_plate: { base: 'polished_blackstone', ratio: 0.5 },
  heavy_weighted_pressure_plate: { base: 'iron_ingot', ratio: 0.5 },
  light_weighted_pressure_plate: { base: 'gold_ingot', ratio: 0.5 },
};

// ── Generic wood items: no wood-type prefix, decompose to dominant log type ──

export const GENERIC_WOOD_ITEMS: Record<string, number> = {
  chest: 8,           // 8 planks
  crafting_table: 4,  // 4 planks
  composter: 3.5,     // 7 slabs = 3.5 planks
  ladder: 3.5,        // 7 sticks = 3.5 planks
};

export function isLogType(name: string): boolean {
  return name.endsWith('_log') || name.endsWith('_stem') || name === 'bamboo_block';
}

/**
 * Resolves single-material functional items to their base material.
 * Returns { base, ratio } or null if not decomposable.
 */
function resolveDecomposition(name: string): { base: string; ratio: number } | null {
  // Check non-wood items first (exact match)
  if (NON_WOOD_DECOMPOSITION[name]) {
    return NON_WOOD_DECOMPOSITION[name];
  }

  // Check wood-based items by suffix
  for (const { suffix, stdRatio, bambooRatio } of DECOMPOSABLE_SUFFIXES) {
    if (name.endsWith(suffix)) {
      const woodPrefix = name.slice(0, -suffix.length);
      const log = WOOD_TO_LOG[woodPrefix];
      if (log) {
        const ratio = woodPrefix === 'bamboo' ? bambooRatio : stdRatio;
        return { base: log, ratio };
      }
    }
  }

  // Check planks → logs
  if (name.endsWith('_planks')) {
    const woodPrefix = name.slice(0, -'_planks'.length);
    const log = WOOD_TO_LOG[woodPrefix];
    if (log) {
      const ratio = woodPrefix === 'bamboo' ? 2 : 4;
      return { base: log, ratio };
    }
  }

  // Stripped wood items → non-stripped form (1:1, axe-stripping is free)
  if (name.startsWith('stripped_')) {
    const base = name.slice('stripped_'.length);
    if (
      base.endsWith('_log') ||
      base.endsWith('_wood') ||
      base.endsWith('_stem') ||
      base.endsWith('_hyphae') ||
      base === 'bamboo_block'
    ) {
      return { base, ratio: 1 };
    }
  }

  // Check single-chain decomposition (processed → raw base)
  if (SINGLE_CHAIN_DECOMPOSITION[name]) {
    return SINGLE_CHAIN_DECOMPOSITION[name];
  }

  return null;
}

/**
 * Determines the base block for a variant item.
 * Returns [baseBlock, ratio] or null if not a variant.
 */
export function resolveVariant(name: string): { base: string; ratio: number } | null {
  // Check decomposable items first (single-material functional items → base)
  const decomp = resolveDecomposition(name);
  if (decomp) return decomp;
  // Check special mappings first
  if (SPECIAL_VARIANT_MAP[name]) {
    // Determine ratio from suffix
    let ratio = 1;
    if (name.endsWith('_slab')) ratio = 2;
    return { base: SPECIAL_VARIANT_MAP[name], ratio };
  }

  // Check suffix-based variants
  for (const { suffix, ratio } of VARIANT_SUFFIXES) {
    if (name.endsWith(suffix)) {
      const base = name.slice(0, -suffix.length);
      return { base, ratio };
    }
  }

  // Check prefix-based variants
  for (const { prefix, ratio } of VARIANT_PREFIXES) {
    if (name.startsWith(prefix)) {
      const base = name.slice(prefix.length);
      return { base, ratio };
    }
  }

  return null;
}
