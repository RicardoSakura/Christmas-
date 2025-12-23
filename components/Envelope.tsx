
import React, { useState } from 'react';
import { LetterContent } from '../types';

interface EnvelopeProps {
  content: LetterContent;
  onClose: () => void;
}

const Envelope: React.FC<EnvelopeProps> = ({ content, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative perspective-1000">
        <div className={`relative w-80 h-56 transition-all duration-1000 preserve-3d cursor-pointer ${isOpen ? 'rotate-x-12' : ''}`}
             onClick={() => !isOpen && setIsOpen(true)}>
          
          {/* Back side of Envelope */}
          <div className="absolute inset-0 bg-[#8b0000] border-2 border-[#D4AF37] rounded-sm z-10 shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
                  style={{backgroundImage: 'url(https://www.transparenttextures.com/patterns/snow.png)'}} />
          </div>

          {/* Front Flap */}
          <div className={`absolute top-0 left-0 w-full h-1/2 bg-[#a52a2a] border-2 border-[#D4AF37] origin-top transition-transform duration-700 z-30 ${isOpen ? '-rotate-x-180' : ''}`}
               style={{clipPath: 'polygon(0 0, 100% 0, 50% 100%)'}}>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#8b0000] font-bold shadow-inner">
               ❤
            </div>
          </div>

          {/* Letter content */}
          <div className={`absolute left-4 right-4 bg-[#fdf5e6] p-6 shadow-xl transition-all duration-1000 z-20 overflow-hidden ${isOpen ? '-translate-y-48 h-80 opacity-100' : 'translate-y-0 h-0 opacity-0'}`}>
            <div className="border-2 border-[#D4AF37]/30 h-full p-4 flex flex-col justify-between">
              <div>
                <h3 className="cinzel text-xl font-bold text-[#8b0000] border-b border-[#D4AF37] pb-2 mb-4">{content.title}</h3>
                <p className="text-[#333] leading-relaxed italic text-sm">"{content.body}"</p>
              </div>
              <div className="text-right border-t border-[#D4AF37]/30 pt-2 mt-4">
                <p className="cinzel text-[#8b0000] font-bold">- {content.sender}</p>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute top-2 right-2 text-[#8b0000] hover:scale-125 transition-transform"
            >
              ✕
            </button>
          </div>
        </div>
        
        {!isOpen && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 cinzel text-[#D4AF37] animate-pulse whitespace-nowrap">
            点击开启神秘信件
          </div>
        )}
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .-rotate-x-180 { transform: rotateX(-180deg); }
        .rotate-x-12 { transform: rotateX(12deg); }
      `}</style>
    </div>
  );
};

export default Envelope;
