export type Skin = {
  id: string;
  name: string;
  color: string;
  coreColor: string;
  price: number;
};

export interface Point {
  x: number;
  y: number;
}

export interface Snake {
  id: string;
  isPlayer: boolean;
  segments: Point[];
  targetLength: number;
  angle: number;
  targetAngle: number;
  speed: number;
  baseSpeed: number;
  isBoosting: boolean;
  powerUpTimer: number; // For speed powerups
  color: string;
  coreColor: string;
  dead: boolean;
}

export interface Food {
  x: number;
  y: number;
  size: number;
  value: number;
  color: string;
  type: 'food';
}

export interface PowerUp {
  x: number;
  y: number;
  size: number;
  type: 'speed';
}
