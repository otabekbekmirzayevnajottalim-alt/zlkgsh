import React, { useEffect, useRef, useState } from 'react';
import { Snake, Food, PowerUp } from './types';
import { SKINS, getSkinById } from './skins';

const MAP_SIZE = 4000;
const INITIAL_BOTS = 15;
const MAX_FOOD = 600;

const createSnake = (id: string, isPlayer: boolean, skinId: string, startX: number, startY: number): Snake => {
  const skin = getSkinById(skinId);
  const segments = [];
  for (let i = 0; i < 15; i++) segments.push({ x: startX, y: startY });
  return {
    id, isPlayer, segments, targetLength: 15, angle: Math.random() * Math.PI * 2,
    targetAngle: 0, speed: 4, baseSpeed: 4, isBoosting: false,
    powerUpTimer: 0, color: skin.color, coreColor: skin.coreColor, dead: false
  };
};

interface GameProps {
  equippedSkinId: string;
  onGameOver: (timeAlive: number, coinsEarned: number) => void;
}

export function Game({ equippedSkinId, onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);
  const [rankInfo, setRankInfo] = useState({ rank: 1, total: INITIAL_BOTS + 1 });

  // Use refs for mutable game state to avoid re-renders
  const gameState = useRef({
    snakes: [] as Snake[],
    foods: [] as Food[],
    powerups: [] as PowerUp[],
    mouseX: 0,
    mouseY: 0,
    keys: { space: false },
    lastTime: performance.now(),
    frameCount: 0,
    startTime: Date.now(),
    isGameOver: false,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    cameraX: MAP_SIZE / 2,
    cameraY: MAP_SIZE / 2,
  });

  // Initialization
  useEffect(() => {
    const state = gameState.current;
    
    // Player
    state.snakes.push(createSnake('player', true, equippedSkinId, MAP_SIZE/2, MAP_SIZE/2));

    // Bots
    const botSkins = SKINS.map(s => s.id);
    for(let i=0; i<INITIAL_BOTS; i++) {
        state.snakes.push(createSnake(`bot_${i}_${Date.now()}`, false, botSkins[Math.floor(Math.random()*botSkins.length)], Math.random()*MAP_SIZE, Math.random()*MAP_SIZE));
    }

    // Initial Food
    for(let i=0; i<300; i++) {
      state.foods.push({
        x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE,
        size: 3 + Math.random()*3, value: 1, color: botSkins[Math.floor(Math.random()*botSkins.length)], type: 'food'
      });
    }

    const onMouseMove = (e: MouseEvent) => { state.mouseX = e.clientX; state.mouseY = e.clientY; };
    const onTouchMove = (e: TouchEvent) => {
       if (e.touches.length > 0) { state.mouseX = e.touches[0].clientX; state.mouseY = e.touches[0].clientY; }
    };
    const onKeyDown = (e: KeyboardEvent) => { if(e.code === 'Space') state.keys.space = true; };
    const onKeyUp = (e: KeyboardEvent) => { if(e.code === 'Space') state.keys.space = false; };
    const onResize = () => { 
        if(canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            state.screenWidth = window.innerWidth;
            state.screenHeight = window.innerHeight;
        }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    onResize();

    // Game Loop
    let animationId: number;
    const loop = (timestamp: number) => {
      update(timestamp);
      draw();
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const update = (timestamp: number) => {
    const state = gameState.current;
    if (state.isGameOver) return;
    const dt = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;

    const player = state.snakes.find(s => s.isPlayer);
    if (!player) return;

    if (player.dead) {
      state.isGameOver = true;
      const survivalTime = Math.floor((Date.now() - state.startTime) / 1000);
      const coins = survivalTime * 2 + Math.floor(player.targetLength / 10);
      onGameOver(survivalTime, coins);
      return;
    }

    state.frameCount += 1;
    if (state.frameCount % 10 === 0) {
      const aliveSnakes = state.snakes.filter(s => !s.dead).sort((a,b) => b.targetLength - a.targetLength);
      const playerIdx = aliveSnakes.findIndex(s => s.isPlayer);
      if (playerIdx !== -1) {
         setScore(aliveSnakes[playerIdx].targetLength);
         setRankInfo({ rank: playerIdx + 1, total: aliveSnakes.length });
      }
    }

    // Player inputs
    const dx = state.mouseX - state.screenWidth / 2;
    const dy = state.mouseY - state.screenHeight / 2;
    player.targetAngle = Math.atan2(dy, dx);

    // Turn smooth
    state.snakes.forEach(snake => {
      if (snake.dead) return;

      // Bot AI
      if (!snake.isPlayer) {
          if (Math.random() < 0.05) {
              snake.targetAngle += (Math.random() - 0.5) * Math.PI;
          }
          if (snake.targetLength > 20 && Math.random() < 0.005) snake.isBoosting = true;
          if (Math.random() < 0.02) snake.isBoosting = false;

          // Steer towards food occasionally
          if (Math.random() < 0.1) {
             const head = snake.segments[0];
             let nearestF = null; let nearestD = 500;
             for(let f of state.foods) {
                 const dist = Math.hypot(head.x - f.x, head.y - f.y);
                 if(dist < nearestD) { nearestD = dist; nearestF = f;}
             }
             if (nearestF) snake.targetAngle = Math.atan2(nearestF.y - head.y, nearestF.x - head.x);
          }
      }

      let angleDiff = snake.targetAngle - snake.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      snake.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.1);

      // Boosting Logic
      if (snake.powerUpTimer > 0) {
          snake.powerUpTimer -= 1;
          snake.isBoosting = true;
      } else if (snake.isPlayer) {
          snake.isBoosting = state.keys.space && snake.targetLength > 15;
          if (snake.isBoosting && Math.random() < 0.2) {
              snake.targetLength -= 1; // Consume length for speed
              const tail = snake.segments[snake.segments.length-1];
              state.foods.push({ x: tail.x, y: tail.y, size: 4, value: 1, color: snake.color, type: 'food' });
          }
      } else {
          // Bots also consume length to boost
          if (snake.isBoosting && snake.targetLength > 15 && Math.random() < 0.2) {
              snake.targetLength -= 1;
              const tail = snake.segments[snake.segments.length-1];
              state.foods.push({ x: tail.x, y: tail.y, size: 4, value: 1, color: snake.color, type: 'food' });
          } else if (snake.targetLength <= 15) {
              snake.isBoosting = false;
          }
      }

      snake.speed = snake.isBoosting ? snake.baseSpeed * 2.5 : snake.baseSpeed;

      // Move Head
      const head = snake.segments[0];
      head.x += Math.cos(snake.angle) * snake.speed;
      head.y += Math.sin(snake.angle) * snake.speed;

      // Map bounds (clamp)
      head.x = Math.max(0, Math.min(MAP_SIZE, head.x));
      head.y = Math.max(0, Math.min(MAP_SIZE, head.y));

      // Move Body
      for (let i = 1; i < snake.targetLength; i++) {
        if (!snake.segments[i]) snake.segments[i] = { x: snake.segments[i-1].x, y: snake.segments[i-1].y };
        const prev = snake.segments[i-1];
        const curr = snake.segments[i];
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const desiredSpacing = 10;
        if (dist > desiredSpacing) {
          curr.x += (dx / dist) * (dist - desiredSpacing);
          curr.y += (dy / dist) * (dist - desiredSpacing);
        }
      }
      if (snake.segments.length > snake.targetLength) snake.segments.length = snake.targetLength;
    });

    // Check Collisions & Interactions
    for (let i = 0; i < state.snakes.length; i++) {
        const s = state.snakes[i];
        if (s.dead) continue;
        const head = s.segments[0];
        
        // Map edges kill (optional: I clamped them above, let's keep it forgiving or kill? "katta maydon", let's kill if they touch edge)
        if (head.x <= 0 || head.x >= MAP_SIZE || head.y <= 0 || head.y >= MAP_SIZE) {
            s.dead = true;
        }

        // Eat Food
        for (let j = state.foods.length - 1; j >= 0; j--) {
            const f = state.foods[j];
            if (Math.hypot(head.x - f.x, head.y - f.y) < 20 + f.size) {
                state.foods.splice(j, 1);
                s.targetLength += f.value;
            }
        }

        // Eat PowerUp
        for (let j = state.powerups.length - 1; j >= 0; j--) {
            const p = state.powerups[j];
            if (Math.hypot(head.x - p.x, head.y - p.y) < 20 + p.size) {
                state.powerups.splice(j, 1);
                s.powerUpTimer += 300; // 5 seconds of free boost
            }
        }

        // Check against other snakes
        for (let j = 0; j < state.snakes.length; j++) {
            const other = state.snakes[j];
            if (s.id === other.id || other.dead) continue;
            
            // Check body intersection (kallasidan tashqari har qanday tana qismiga tegsa)
            for(let k = 2; k < other.segments.length; k++) { // Bosh va bo'yin qismini o'zaro to'qnashuvda e'tiborga olmaslik uchun 2 dan boshlaymiz
                const seg = other.segments[k];
                // Agar bosh markazi va tana qismining markazi orasidagi masofa 35 dan kichik bo'lsa (ya'ni chetlari tegib ketsa)
                if (Math.hypot(head.x - seg.x, head.y - seg.y) < 35) {
                    s.dead = true;
                    break;
                }
            }
            if (s.dead) break;
        }
    }

    // Process Deaths
    state.snakes.forEach(s => {
        if (s.dead && s.segments.length > 0) {
            // Explode into massive food!
            const amount = Math.min(100, Math.floor(s.targetLength / 3)); // High yield, capped object count
            const valPerDrop = Math.max(1, Math.floor(s.targetLength / amount));
            
            for(let k=0; k<amount; k++) {
                const segIdx = k % s.segments.length;
                const seg = s.segments[segIdx];
                state.foods.push({
                    x: seg.x + (Math.random()*60 - 30),
                    y: seg.y + (Math.random()*60 - 30),
                    size: 6 + Math.random()*8,
                    value: valPerDrop,
                    color: s.color,
                    type: 'food'
                });
            }
            s.segments = []; // Clear to prevent re-processing
        }
    });

    // Respawn missing food/bots
    if (state.foods.length < MAX_FOOD) {
        state.foods.push({
            x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE,
            size: 3 + Math.random()*3, value: 1, color: '#00ff00', type: 'food'
        });
    }
    if (state.powerups.length < 5 && Math.random() < 0.01) {
        state.powerups.push({ x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, size: 10, type: 'speed' });
    }
    
    // Always keep active bots around INITIAL_BOTS
    const activeBots = state.snakes.filter(s => !s.isPlayer && !s.dead).length;
    if (activeBots < INITIAL_BOTS) {
        const botSkins = SKINS.map(s => s.id);
        const newBotId = `bot_${Math.random()}_${Date.now()}`;
        state.snakes.push(createSnake(newBotId, false, botSkins[Math.floor(Math.random()*botSkins.length)], Math.random()*MAP_SIZE, Math.random()*MAP_SIZE));
    }
    
    // Clean up completely dead snakes from the list occasionally to free memory
    if (state.frameCount % 60 === 0) {
        state.snakes = state.snakes.filter(s => !s.dead || s.isPlayer);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = gameState.current;
    const player = state.snakes.find(s => s.isPlayer);
    if (!player) return;

    // Background gradient matching frosted theme
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0a0a0c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    let px = state.cameraX;
    let py = state.cameraY;
    
    if (player.segments && player.segments.length > 0) {
        px = player.segments[0].x;
        py = player.segments[0].y;
        state.cameraX = px;
        state.cameraY = py;
    }
    
    ctx.translate(cx - px, cy - py);

    // Draw Map Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const startX = Math.floor((px - cx) / gridSize) * gridSize;
    const startY = Math.floor((py - cy) / gridSize) * gridSize;
    for(let x=startX; x<px+cx; x+=gridSize) {
       ctx.beginPath(); ctx.moveTo(x, py - cy); ctx.lineTo(x, py + cy); ctx.stroke();
    }
    for(let y=startY; y<py+cy; y+=gridSize) {
       ctx.beginPath(); ctx.moveTo(px - cx, y); ctx.lineTo(px + cx, y); ctx.stroke();
    }

    // Map Borders
    ctx.strokeStyle = '#ff0033';
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Draw Foods
    state.foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.size, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.size*2, 0, Math.PI*2); ctx.fill();
    });

    // Draw Powerups
    state.powerups.forEach(p => {
        ctx.fillStyle = '#ffff00';
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size*2.5, 0, Math.PI*2); ctx.fill();
    });

    ctx.globalAlpha = 1.0;

    // Draw Snakes (bots first, then player)
    [...state.snakes].sort((a,b) => (a.isPlayer ? 1 : -1)).forEach(s => {
        if(s.dead || s.segments.length === 0) return;

        // Draw body segments (reverse order so head is on top)
        for(let i = s.segments.length-1; i >= 0; i--) {
            const seg = s.segments[i];
            const isHead = i === 0;

            // Optional Glow
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = s.color;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, isHead ? 24 : 18, 0, Math.PI*2); 
            ctx.fill();

            // Core
            ctx.globalAlpha = 1;
            ctx.fillStyle = s.coreColor;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, isHead ? 14 : 10, 0, Math.PI*2);
            ctx.fill();

            // Eyes if head
            if (isHead) {
                ctx.fillStyle = '#111';
                const eyeOffset = 6;
                const eyeAngle1 = s.angle - Math.PI/4;
                const eyeAngle2 = s.angle + Math.PI/4;
                
                ctx.beginPath(); ctx.arc(seg.x + Math.cos(eyeAngle1)*eyeOffset, seg.y + Math.sin(eyeAngle1)*eyeOffset, 4, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(seg.x + Math.cos(eyeAngle2)*eyeOffset, seg.y + Math.sin(eyeAngle2)*eyeOffset, 4, 0, Math.PI*2); ctx.fill();
            }
        }
    });

    ctx.restore();
    
    // --- Draw Minimap ---
    const minimapSize = 120;
    const padding = 20;
    const mx = padding;
    const my = canvas.height - minimapSize - padding;

    ctx.save();
    // Minimap Background (Frosted Glass style)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(mx, my, minimapSize, minimapSize, 8);
    } else {
        ctx.rect(mx, my, minimapSize, minimapSize); // fallback
    }
    ctx.fill();
    ctx.stroke();

    // Map Content
    state.snakes.forEach(s => {
        if(s.dead || s.segments.length === 0) return;
        const head = s.segments[0];
        
        // Scale down to minimap
        const dx = mx + (head.x / MAP_SIZE) * minimapSize;
        const dy = my + (head.y / MAP_SIZE) * minimapSize;
        
        ctx.fillStyle = s.isPlayer ? '#ffffff' : s.color;
        const dotSize = s.isPlayer ? 3 : 2;
        
        ctx.beginPath();
        ctx.arc(dx, dy, dotSize, 0, Math.PI*2);
        ctx.fill();
        
        // Player pulse on minimap
        if (s.isPlayer) {
           ctx.fillStyle = s.color;
           ctx.globalAlpha = 0.5;
           ctx.beginPath();
           ctx.arc(dx, dy, 6, 0, Math.PI*2);
           ctx.fill();
           ctx.globalAlpha = 1.0;
        }
    });
    ctx.restore();
    
    // Draw Name/Status Overlays on Snakes (if needed, skipping for performance)
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden select-none bg-[#0a0a0c]">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* HUD overlay */}
      <div className="absolute top-5 left-5 right-5 flex justify-between z-10 pointer-events-none">
         <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex gap-8">
            <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-[1px] opacity-60 text-white">HOZIRGI BALL</span>
               <span className="text-2xl font-bold text-[#00f2ff]">{score}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-[1px] opacity-60 text-white">O'RIN</span>
               <span className="text-2xl font-bold text-[#ffd700]">#{rankInfo.rank} <span className="text-sm opacity-50">/ {rankInfo.total}</span></span>
            </div>
         </div>
      </div>

      <div className="absolute bottom-12 w-full flex justify-center pointer-events-none z-10">
         <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-[30px] flex items-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
             <span className="text-[11px] uppercase tracking-[2px] opacity-50 text-white">Space tugmasini bosing: Tezlashish</span>
         </div>
      </div>
    </div>
  );
}
