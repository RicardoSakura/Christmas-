
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Scene3D from './components/Scene3D';
import HandTracker from './components/HandTracker';
import Envelope from './components/Envelope';
import UIOverlay from './components/UIOverlay';
import LetterManager from './components/LetterManager';
import { GestureState, HandData, LetterContent } from './types';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [gesture, setGesture] = useState<GestureState>(GestureState.TREE);
  const [handData, setHandData] = useState<HandData | null>(null);
  const [showLetter, setShowLetter] = useState(false);
  const [letterContent, setLetterContent] = useState<LetterContent>({
    title: "节日快乐",
    body: "在这个充满魔力的夜晚，星光璀璨。我想告诉你，你对我而言是多么特别。愿这棵圣诞树的每一个闪烁粒子，都承载着我对我们未来的美好期许。",
    sender: "你的神秘圣诞老人",
    photos: [],
    photoCount: 40
  });

  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 加载本地存储内容
    const saved = localStorage.getItem('holiday_letter');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLetterContent(prev => ({
          ...prev,
          ...parsed,
          photos: parsed.photos || [],
          photoCount: parsed.photoCount || 40
        }));
      } catch (e) {
        console.error("Failed to parse saved letter", e);
      }
    }

    // Audio setup - Christmas List (Anson Seabra) - Using a stable sample link
    audioRef.current = new Audio('https://www.chosic.com/wp-content/uploads/2021/11/Christmas-Magic.mp3'); 
    audioRef.current.loop = true;

    const timer = setTimeout(() => setLoading(false), 2000);
    return () => {
      clearTimeout(timer);
      audioRef.current?.pause();
    };
  }, []);

  const handleGestureChange = useCallback((data: HandData) => {
    setHandData(data);
    if (data.gesture !== gesture) {
      setGesture(data.gesture);
      // Fix: Removed redundant type comparison since data.gesture is already narrowed within the else block.
      if (data.gesture === GestureState.HEART) {
        setShowLetter(true);
      } else {
        setShowLetter(false);
      }
    }
  }, [gesture]);

  const toggleMusic = () => {
    if (musicPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(console.error);
    }
    setMusicPlaying(!musicPlaying);
  };

  const updateLetter = (newContent: LetterContent) => {
    setLetterContent(newContent);
    localStorage.setItem('holiday_letter', JSON.stringify(newContent));
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden text-[#D4AF37]">
      {/* 3D 场景 */}
      <Scene3D gesture={gesture} handData={handData} letterContent={letterContent} />

      {/* MediaPipe 手势追踪 */}
      <HandTracker onGesture={handleGestureChange} />

      {/* UI 覆盖层 */}
      <UIOverlay 
        gesture={gesture} 
        musicPlaying={musicPlaying} 
        onToggleMusic={toggleMusic} 
      />

      {/* 告白信管理面板 */}
      <LetterManager 
        content={letterContent} 
        onUpdate={updateLetter} 
      />

      {/* 3D 信封动画 */}
      {showLetter && (
        <Envelope 
          content={letterContent} 
          onClose={() => setShowLetter(false)} 
        />
      )}

      {/* 加载界面 */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-1000">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h1 className="cinzel text-2xl font-bold tracking-widest text-[#D4AF37]">Lumina Arbor</h1>
          <p className="mt-2 text-[#DC143C] opacity-80 uppercase tracking-[0.2em] text-[10px]">Christmas Magic is Loading...</p>
        </div>
      )}
    </div>
  );
};

export default App;
