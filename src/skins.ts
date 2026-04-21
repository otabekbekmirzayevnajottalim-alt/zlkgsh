import { Skin } from './types';

export const SKINS: Skin[] = [
  { id: 'neon_green', name: 'Neon Green', color: '#00ff00', coreColor: '#ccffcc', price: 0 },
  { id: 'laser_red', name: 'Laser Red', color: '#ff0033', coreColor: '#ffcccc', price: 50 },
  { id: 'cyber_blue', name: 'Cyber Blue', color: '#00ccff', coreColor: '#ccffff', price: 100 },
  { id: 'toxic_purple', name: 'Toxic Purple', color: '#cc00ff', coreColor: '#e6ccff', price: 250 },
  { id: 'golden_king', name: 'Golden King', color: '#ffcc00', coreColor: '#ffffcc', price: 500 },
  { id: 'ghost_white', name: 'Ghost White', color: '#ffffff', coreColor: '#ffffff', price: 1000 },
  { id: 'crimson_dark', name: 'Crimson Dark', color: '#8b0000', coreColor: '#ff6666', price: 1500 },
  { id: 'abyss_glow', name: 'Abyss Glow', color: '#00fa9a', coreColor: '#b3ffe0', price: 2000 },
  { id: 'galaxy_serpent', name: 'Kosmik Ajdaho', color: '#8a2be2', coreColor: '#ff69b4', price: 3000 },
  { id: 'plasma_storm', name: 'Plazma Bo\'roni', color: '#00ffff', coreColor: '#ffffff', price: 5000 },
  { id: 'magma_worm', name: 'Qaqshatqich Olov', color: '#ff4500', coreColor: '#ffff00', price: 8000 },
  { id: 'dark_matter', name: 'Qora Teshik', color: '#111111', coreColor: '#ff00ff', price: 12000 }
];

export const getSkinById = (id: string) => SKINS.find((s) => s.id === id) || SKINS[0];
