import React from 'react';
import { SKINS } from './skins';
import { Coins, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

export function Shop({ coins, ownedSkins, equippedSkin, onBuy, onEquip, onBack }: any) {
  return (
    <div className="absolute inset-0 text-white p-6 overflow-y-auto z-50 backdrop-blur-xl bg-black/40">
      <div className="max-w-4xl mx-auto z-10 relative">
        <div className="flex items-center justify-between mb-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" /> <span className="text-sm uppercase tracking-[1px] font-medium">Orqaga</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[1px] opacity-60">Tangalar</span>
            <span className="text-2xl font-bold text-[#ffd700] ml-2">{coins}</span>
          </div>
        </div>

        <h1 className="text-[10px] uppercase tracking-[2px] opacity-60 mb-6 border-b border-white/10 pb-2">
          Skins Do'koni
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {SKINS.map((skin) => {
            const isOwned = ownedSkins.includes(skin.id);
            const isEquipped = equippedSkin === skin.id;
            const canAfford = coins >= skin.price;

            return (
              <div key={skin.id} className={`relative rounded-[12px] p-6 flex flex-col items-center justify-between transition-all bg-white/[0.03] backdrop-blur-md ${isEquipped ? 'border border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.1)]' : 'border border-white/[0.08]'}`}>
                <div className="w-full aspect-square mb-4 flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-[8px]" style={{ background: `linear-gradient(45deg, ${skin.color}, ${skin.coreColor})`, boxShadow: `0 0 20px ${skin.color}` }}></div>
                </div>

                <div className="text-center w-full flex flex-col gap-2">
                  <h3 className="text-[14px] font-bold text-white">{skin.name}</h3>
                  {!isOwned ? (
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <span className="text-[12px] opacity-80 text-[#ffd700] font-bold">{skin.price} Tanga</span>
                    </div>
                  ) : (
                    <div className="mb-2 text-[10px] uppercase tracking-[1px] opacity-60 h-4 flex items-center justify-center">Sotib olingan</div>
                  )}

                  {isEquipped ? (
                    <button className="w-full py-3 rounded-full bg-[rgba(0,242,255,0.2)] text-[#00f2ff] text-[10px] uppercase tracking-[1px] font-bold flex items-center justify-center gap-2 border border-[#00f2ff] cursor-default">
                      <CheckCircle className="w-4 h-4" /> Tanlangan
                    </button>
                  ) : isOwned ? (
                    <button onClick={() => onEquip(skin.id)} className="w-full py-3 rounded-full bg-white/5 hover:bg-white/10 text-white text-[10px] uppercase tracking-[1px] border border-white/10 font-bold transition-colors">Tanlash</button>
                  ) : (
                    <button disabled={!canAfford} onClick={() => onBuy(skin.id, skin.price)} className={`w-full py-3 rounded-full text-[10px] uppercase tracking-[1px] font-bold transition-colors flex items-center justify-center gap-2 border ${canAfford ? 'bg-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.2)] text-[#ffd700] border-[#ffd700]' : 'bg-transparent text-white/50 border-white/10 cursor-not-allowed'}`}>
                      {!canAfford && <Lock className="w-3 h-3" />} Sotib olish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
