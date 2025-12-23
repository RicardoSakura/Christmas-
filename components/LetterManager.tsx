
import React, { useState, useEffect, useRef } from 'react';
import { LetterContent } from '../types';

interface LetterManagerProps {
  content: LetterContent;
  onUpdate: (content: LetterContent) => void;
}

const LetterManager: React.FC<LetterManagerProps> = ({ content, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(content);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(content);
  }, [content]);

  const handleSave = () => {
    onUpdate(form);
    setIsOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fix: Explicitly type 'file' as 'File' to resolve the 'unknown' error when calling readAsDataURL.
    // This ensures TypeScript knows 'file' is a Blob/File which is required by FileReader.
    const filePromises = Array.from(files).map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(base64Images => {
      setForm(prev => ({
        ...prev,
        photos: [...prev.photos, ...base64Images].slice(-10) // 最多保存10张
      }));
    });
  };

  const removePhoto = (index: number) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-2">
      {isOpen && (
        <div className="bg-black/90 border border-[#D4AF37] p-6 rounded-xl shadow-2xl w-80 mb-4 animate-in fade-in zoom-in duration-300 backdrop-blur-xl text-[#D4AF37] max-h-[80vh] overflow-y-auto custom-scrollbar">
          <h2 className="cinzel text-lg font-bold mb-4 text-[#D4AF37] border-b border-[#D4AF37]/30 pb-2">个性化节日设置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase text-[#D4AF37]/60 block mb-1 tracking-wider">信件内容</label>
              <input 
                type="text"
                placeholder="信件主题"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full bg-white/5 border border-[#D4AF37]/30 p-2 text-sm rounded focus:outline-none focus:border-[#D4AF37] text-white mb-2"
              />
              <textarea 
                rows={3}
                placeholder="心语内容"
                value={form.body}
                onChange={e => setForm({...form, body: e.target.value})}
                className="w-full bg-white/5 border border-[#D4AF37]/30 p-2 text-sm rounded focus:outline-none focus:border-[#D4AF37] text-white mb-2"
              />
              <input 
                type="text"
                placeholder="落款署名"
                value={form.sender}
                onChange={e => setForm({...form, sender: e.target.value})}
                className="w-full bg-white/5 border border-[#D4AF37]/30 p-2 text-sm rounded focus:outline-none focus:border-[#D4AF37] text-white"
              />
            </div>

            <div className="pt-2 border-t border-[#D4AF37]/30">
              <label className="text-[10px] uppercase text-[#D4AF37]/60 block mb-2 tracking-wider">照片粒子 (内容)</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {form.photos.map((src, idx) => (
                  <div key={idx} className="relative aspect-square border border-[#D4AF37]/50 rounded overflow-hidden group">
                    <img src={src} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => removePhoto(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white text-[8px] p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                  </div>
                ))}
                {form.photos.length < 10 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border border-dashed border-[#D4AF37]/50 rounded flex items-center justify-center text-[#D4AF37] hover:bg-white/5"
                  >
                    +
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple 
                accept="image/*"
              />
              <p className="text-[8px] text-[#D4AF37]/40">提示：点击上传照片，照片将出现在粒子中</p>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase text-[#D4AF37]/60 tracking-wider">照片粒子 (数量)</label>
                <span className="text-[10px] text-[#D4AF37] font-bold">{form.photoCount}</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={form.photoCount}
                onChange={e => setForm({...form, photoCount: parseInt(e.target.value)})}
                className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <button 
              onClick={handleSave}
              className="w-full bg-[#D4AF37] text-black cinzel py-2 rounded font-bold hover:brightness-110 transition-all mt-4"
            >
              封存并保存
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 bg-black/40 border border-[#D4AF37] rounded-full shadow-lg overflow-hidden transition-all hover:w-40"
      >
        <span className="text-xl">✎</span>
        <span className="absolute left-10 opacity-0 group-hover:opacity-100 transition-opacity cinzel text-sm whitespace-nowrap">
          {isOpen ? "关闭编辑" : "定制粒子"}
        </span>
      </button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default LetterManager;
