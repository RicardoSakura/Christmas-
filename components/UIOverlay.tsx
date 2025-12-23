
import React, { useState } from 'react';
import { GestureState } from '../types';

interface UIOverlayProps {
  gesture: GestureState;
  musicPlaying: boolean;
  onToggleMusic: () => void;
}

const GESTURE_LABELS: Record<GestureState, string> = {
  [GestureState.TREE]: "圣诞之树",
  [GestureState.SCATTER]: "粒子炸裂",
  [GestureState.FOCUS]: "深度聚焦",
  [GestureState.HEART]: "心动告白"
};

const UIOverlay: React.FC<UIOverlayProps> = ({ gesture, musicPlaying, onToggleMusic }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: 'Lumina Arbor - 魔法粒子圣诞树',
      text: '快来看看我为你定制的魔法粒子圣诞树，对比心手势有惊喜哦！',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <>
      {/* Branding */}
      <div className="absolute top-6 left-6 z-40">
        <h1 className="cinzel text-3xl font-bold tracking-widest text-[#D4AF37] drop-shadow-lg">
          Lumina <span className="text-[#DC143C]">Arbor</span>
        </h1>
        <p className="text-sm italic text-[#D4AF37]/70">节日互动粒子体验</p>
      </div>

      {/* HUD */}
      <div className="absolute bottom-8 left-8 z-40 flex flex-col gap-4">
        <div className="bg-black/40 backdrop-blur-md border border-[#D4AF37]/30 p-4 rounded-lg min-w-[120px]">
          <div className="cinzel text-[10px] uppercase text-[#D4AF37]/60 mb-1">当前形态</div>
          <div className="text-xl font-bold tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-ping" />
            {GESTURE_LABELS[gesture]}
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onToggleMusic}
            className="w-12 h-12 rounded-full bg-[#D4AF37] text-[#050505] flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-xl"
            title={musicPlaying ? "静音" : "播放音乐"}
          >
            {musicPlaying ? '♪' : '✕'}
          </button>
          
          <button 
            onClick={handleShare}
            className="px-4 h-12 rounded-full bg-white/10 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center shadow-lg hover:bg-[#D4AF37]/20 transition-all text-sm font-bold cinzel"
          >
            {copyFeedback ? "链接已复制!" : "分享体验"}
          </button>
        </div>
      </div>

      {/* Toggle Help */}
      <div className="absolute top-6 right-60 z-40">
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="cinzel border border-[#D4AF37] px-4 py-2 rounded-full hover:bg-[#D4AF37] hover:text-[#050505] transition-all text-sm"
        >
          {showHelp ? "隐藏指南" : "手势指南"}
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute top-20 right-6 z-40 w-64 bg-black/80 border border-[#D4AF37]/50 p-6 rounded-lg backdrop-blur-lg animate-in slide-in-from-right duration-300">
          <h3 className="cinzel text-[#D4AF37] font-bold mb-4 border-b border-[#D4AF37]/30 pb-2 text-base">手势交互说明</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="text-[#DC143C] font-bold">✊ 握拳:</span>
              <span>重构神圣的圣诞之树 (默认)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#DC143C] font-bold">✋ 张手:</span>
              <span>让粒子如星尘般炸裂飞散</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#DC143C] font-bold">🤌 捏合:</span>
              <span>将万千星光汇聚于指尖</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#DC143C] font-bold">❤ 比心:</span>
              <span>召唤尘封的秘密告白信</span>
            </li>
          </ul>
          <div className="mt-6 pt-4 border-t border-[#D4AF37]/30 text-[10px] opacity-60 italic text-center">
            提示：请确保光线充足，以便更精准地捕捉手势
          </div>
        </div>
      )}
    </>
  );
};

export default UIOverlay;
