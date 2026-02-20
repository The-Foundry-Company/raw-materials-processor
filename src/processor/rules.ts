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
  'chest',
  'trapped_chest',
  'ender_chest',
  'crafting_table',
  'furnace',
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
  'composter',
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
  'ladder',
  'scaffolding',
  'glass',
  'glass_pane',
  'tinted_glass',
]);

const FUNCTIONAL_SUFFIXES: string[] = [
  '_door',
  '_trapdoor',
  '_fence',
  '_fence_gate',
  '_sign',
  '_hanging_sign',
  '_wall_sign',
  '_pressure_plate',
  '_button',
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
  'stone_bricks',
  'cracked_stone_bricks',
  'mossy_stone_bricks',
  'smooth_stone',
  'smooth_sandstone',
  'smooth_red_sandstone',
  'smooth_quartz',
  'polished_andesite',
  'polished_diorite',
  'polished_granite',
  'polished_deepslate',
  'polished_blackstone',
  'polished_blackstone_bricks',
  'polished_basalt',
  'polished_tuff',
  'deepslate_bricks',
  'deepslate_tiles',
  'tuff_bricks',
  'bricks',
  'nether_bricks',
  'red_nether_bricks',
  'end_stone_bricks',
  'prismarine_bricks',
  'dark_prismarine',
  'purpur_block',
  'purpur_pillar',
  'quartz_bricks',
  'quartz_pillar',
  'mud_bricks',
  'packed_mud',
  'bamboo_mosaic',
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

/**
 * Determines the base block for a variant item.
 * Returns [baseBlock, ratio] or null if not a variant.
 */
export function resolveVariant(name: string): { base: string; ratio: number } | null {
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
