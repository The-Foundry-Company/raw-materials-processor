import { isLogType } from './rules';

// ── Material categories for grouping output items ──

export type ItemCategory =
  | 'Wood'
  | 'Stone'
  | 'Brick'
  | 'Terracotta'
  | 'Concrete'
  | 'Glass'
  | 'Wool & Fabric'
  | 'Copper'
  | 'Metal'
  | 'Lighting'
  | 'Redstone'
  | 'Functional'
  | 'Other';

export const CATEGORY_ORDER: ItemCategory[] = [
  'Wood',
  'Stone',
  'Brick',
  'Terracotta',
  'Concrete',
  'Glass',
  'Wool & Fabric',
  'Copper',
  'Metal',
  'Lighting',
  'Redstone',
  'Functional',
  'Other',
];

const STONE_ITEMS: Set<string> = new Set([
  'stone',
  'cobblestone',
  'granite',
  'diorite',
  'andesite',
  'cobbled_deepslate',
  'basalt',
  'tuff',
  'calcite',
  'blackstone',
  'obsidian',
  'end_stone',
  'sandstone',
  'red_sandstone',
  'quartz_block',
  'dripstone_block',
]);

const BRICK_ITEMS: Set<string> = new Set([
  'bricks',
  'mossy_stone_bricks',
  'nether_bricks',
  'red_nether_bricks',
  'prismarine_bricks',
  'dark_prismarine',
  'purpur_block',
  'mud_bricks',
  'packed_mud',
]);

const GLASS_EXACT: Set<string> = new Set([
  'glass',
  'glass_pane',
  'tinted_glass',
]);

const METAL_ITEMS: Set<string> = new Set([
  'iron_ingot',
  'gold_ingot',
  'iron_bars',
  'chain',
  'anvil',
  'lightning_rod',
  'lodestone',
  'bell',
  'copper_ingot',
]);

const LIGHTING_ITEMS: Set<string> = new Set([
  'torch',
  'soul_torch',
  'lantern',
  'soul_lantern',
  'sea_lantern',
  'glowstone',
  'end_rod',
  'campfire',
  'soul_campfire',
  'redstone_lamp',
]);

const REDSTONE_ITEMS: Set<string> = new Set([
  'hopper',
  'dropper',
  'dispenser',
  'observer',
  'piston',
  'sticky_piston',
  'daylight_detector',
  'target',
  'tnt',
]);

const FUNCTIONAL_ITEMS: Set<string> = new Set([
  'trapped_chest',
  'ender_chest',
  'blast_furnace',
  'smoker',
  'lectern',
  'brewing_stand',
  'enchanting_table',
  'beacon',
  'conduit',
  'respawn_anchor',
  'bookshelf',
  'chiseled_bookshelf',
  'flower_pot',
  'armor_stand',
  'item_frame',
  'glow_item_frame',
  'painting',
  'barrel',
  'grindstone',
  'smithing_table',
  'stonecutter',
  'cartography_table',
  'fletching_table',
  'loom',
  'scaffolding',
]);

/**
 * Assigns a material category to an item name (without minecraft: prefix).
 * Categories are used for grouping in the output table.
 */
export function categorizeItem(name: string): ItemCategory {
  // Wood: logs, stems, bamboo_block, hanging signs
  if (isLogType(name)) return 'Wood';
  if (name.endsWith('_hanging_sign')) return 'Wood';

  // Stone: natural stone types and mineral blocks
  if (STONE_ITEMS.has(name)) return 'Stone';

  // Brick: processed multi-material brick blocks
  if (BRICK_ITEMS.has(name)) return 'Brick';

  // Terracotta: plain, colored, and glazed
  if (name === 'terracotta') return 'Terracotta';
  if (name.endsWith('_terracotta')) return 'Terracotta';

  // Concrete
  if (name.endsWith('_concrete')) return 'Concrete';
  if (name.endsWith('_concrete_powder')) return 'Concrete';

  // Glass: plain, tinted, and stained
  if (GLASS_EXACT.has(name)) return 'Glass';
  if (name.endsWith('_stained_glass')) return 'Glass';
  if (name.endsWith('_stained_glass_pane')) return 'Glass';

  // Wool & Fabric: wool, carpet, banners, beds
  if (name.endsWith('_wool')) return 'Wool & Fabric';
  if (name.endsWith('_carpet')) return 'Wool & Fabric';
  if (name.endsWith('_banner')) return 'Wool & Fabric';
  if (name === 'bed' || name.endsWith('_bed')) return 'Wool & Fabric';

  // Copper: waxed, oxidized, weathered, exposed prefixes
  if (name.startsWith('waxed_')) return 'Copper';
  if (name.startsWith('oxidized_')) return 'Copper';
  if (name.startsWith('weathered_')) return 'Copper';
  if (name.startsWith('exposed_')) return 'Copper';

  // Metal
  if (METAL_ITEMS.has(name)) return 'Metal';

  // Lighting: torches, lanterns, candles, etc.
  if (LIGHTING_ITEMS.has(name)) return 'Lighting';
  if (name.endsWith('_candle')) return 'Lighting';

  // Redstone components
  if (REDSTONE_ITEMS.has(name)) return 'Redstone';

  // Functional: crafting stations, storage, utility blocks
  if (FUNCTIONAL_ITEMS.has(name)) return 'Functional';
  if (name.endsWith('_shulker_box')) return 'Functional';

  return 'Other';
}
