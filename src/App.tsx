import { useState, useEffect } from 'react';
import { Game } from './Game';
import { Shop } from './Shop';
import { Trophy, Coins, Play, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SKINS, getSkinById } from './skins';

export default function App() {
  const [view, setView] = useState<'menu' | 'game' | 'shop' | 'gameover'>('menu');
  
  // Persistence
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('snake_coins') || '0'));
  const [ownedSkins, setOwnedSkins] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('snake_skins') || '["neon_green"]'); }
    catch { return ['neon_green']; }
  });
  const [equippedSkin, setEquippedSkin] = useState(() => localStorage.getItem('snake_equipped') || 'neon_green');

  // Session Results
  const [lastSurvivalTime, setLastSurvivalTime] = useState(0);
  const [lastCoinsEarned, setLastCoinsEarned] = useState(0);
  
  useEffect(() => {
    localStorage.setItem('snake_coins', coins.toString());
    localStorage.setItem('snake_skins', JSON.stringify(ownedSkins));
    localStorage.setItem('snake_equipped', equippedSkin);
  }, [coins, ownedSkins, equippedSkin]);

  const handleGameOver = (timeAlive: number, coinsEarned: number) => {
    setLastSurvivalTime(timeAlive);
    setLastCoinsEarned(coinsEarned);
    setCoins(prev => prev + coinsEarned);
    setView('gameover');
  };

  const handleBuy = (skinId: string, price: number) => {
    if (coins >= price && !ownedSkins.includes(skinId)) {
      setCoins(coins - price);
      setOwnedSkins([...ownedSkins, skinId]);
      setEquippedSkin(skinId);
    }
  };

  const currentSkinInfo = getSkinById(equippedSkin);

  return (
    <div className="w-full h-screen bg-[#0a0a0c] bg-[radial-gradient(circle_at_50%_50%,#1a1a2e_0%,#0a0a0c_100%)] font-sans text-white overflow-hidden flex flex-col items-center justify-center relative">
      {view !== 'game' && (
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      )}
      <AnimatePresence mode="wait">
        
        {view === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8 max-w-md w-full px-6 z-10"
          >
            <div className="text-center">
              <div className="flex justify-center mb-6 relative">
                 {/* Decorative Logo */}
                 <div className="w-32 h-32 rounded-full flex items-center justify-center border-4 border-slate-800 relative z-10"
                      style={{ backgroundColor: currentSkinInfo.coreColor, boxShadow: `0 0 50px ${currentSkinInfo.color}` }}>
                      <Gamepad2 className="w-16 h-16 text-slate-900" />
                 </div>
              </div>
              <h1 className="text-6xl font-black mb-2 tracking-tighter text-[#00f2ff] drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">
                NEON SNAKE
              </h1>
              <p className="text-white/60 text-[10px] uppercase tracking-[1px]">Zamonaviy ilonlar maydoni</p>
            </div>

            <div className="w-full flex flex-col gap-4">
              <button onClick={() => setView('game')} className="w-full py-4 rounded-full bg-[rgba(0,242,255,0.2)] backdrop-blur-md hover:bg-[rgba(0,242,255,0.3)] text-[#00f2ff] font-bold text-xl flex items-center justify-center gap-3 border border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-all">
                <Play className="fill-current w-6 h-6" /> O'YNASH
              </button>
              
              <button onClick={() => setView('shop')} className="w-full py-4 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 text-white font-bold text-lg flex items-center justify-center gap-3 border border-white/10 transition-all">
                Do'kon va Terilar
              </button>
            </div>

            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10">
               <span className="text-[10px] uppercase tracking-[1px] opacity-60">Tangalar</span>
               <span className="text-2xl font-bold text-[#ffd700] ml-2">{coins}</span>
            </div>
          </motion.div>
        )}

        {view === 'game' && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
            <Game equippedSkinId={equippedSkin} onGameOver={handleGameOver} />
          </motion.div>
        )}

        {view === 'shop' && (
           <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
              <Shop coins={coins} ownedSkins={ownedSkins} equippedSkin={equippedSkin} onBuy={handleBuy} onEquip={setEquippedSkin} onBack={() => setView('menu')} />
           </motion.div>
        )}

        {view === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 max-w-md w-full px-6 z-50 bg-white/5 backdrop-blur-xl p-8 rounded-[16px] border border-white/10 shadow-2xl"
          >
            <h2 className="text-5xl font-black mb-2 text-[#ff4444] drop-shadow-[0_0_15px_rgba(255,68,68,0.5)]">O'LDINGIZ</h2>
            
            <div className="w-full bg-black/20 rounded-xl p-6 flex flex-col gap-4 border border-white/5">
              <div className="flex justify-between flex-row items-center border-b border-white/5 pb-4">
                 <span className="text-[10px] uppercase tracking-[1px] opacity-60">Yashash vaqti</span>
                 <span className="text-[#00f2ff] font-bold text-2xl">{lastSurvivalTime} s</span>
              </div>
              <div className="flex justify-between flex-row items-center">
                 <span className="text-[10px] uppercase tracking-[1px] opacity-60">Topilgan pul</span>
                 <span className="text-[#ffd700] font-bold text-2xl">+{lastCoinsEarned}</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3 mt-4">
               <button onClick={() => setView('game')} className="w-full py-4 rounded-full bg-[rgba(0,242,255,0.2)] backdrop-blur-md hover:bg-[rgba(0,242,255,0.3)] text-[#00f2ff] font-bold text-lg border border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-colors">
                 Qaytadan O'ynash
               </button>
               <button onClick={() => setView('menu')} className="w-full py-4 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 text-white font-bold text-lg border border-white/10 transition-colors">
                 Bosh Sahifa
               </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
