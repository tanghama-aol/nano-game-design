import { useState, useEffect } from 'react';
import { Pause, Play } from 'lucide-react';
import { useI18n } from '../i18n';

interface Props {
  imageUrl: string;
  frames: number;
}

export function SpritePreviewer({ imageUrl, frames }: Props) {
  const { t } = useI18n();
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(8);

  useEffect(() => {
    let interval: any;
    if (playing && frames > 1) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % frames);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [playing, frames, fps]);

  if (frames <= 1) return null;

  // Assuming horizontal uniform sprite sheet for simplicity
  const bgPositionX = `${(currentFrame / (frames - 1)) * 100 || 0}%`;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-4">
      <h3 className="mb-3 text-sm font-black text-slate-100">{t('spritePreview')}</h3>
      
      <div 
        className="mx-auto h-36 w-36 rounded-md border border-dashed border-slate-600 bg-slate-900"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${frames * 100}% 100%`,
          backgroundPosition: `${bgPositionX} center`,
          imageRendering: 'pixelated'
        }}
      />
      
      <div className="mt-4 flex w-full items-center justify-center gap-4">
        <button 
          className="secondary-button min-h-0 px-3 py-2 text-xs"
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? t('pause') : t('play')}
        </button>
        
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-300">FPS: {fps}</label>
          <input 
            type="range" 
            min="1" 
            max="24" 
            value={fps} 
            onChange={(e) => setFps(parseInt(e.target.value))}
            className="w-24 accent-cyan-400"
          />
        </div>
      </div>
      
      <div className="mt-3 flex justify-center gap-1">
        {Array.from({ length: frames }).map((_, idx) => (
          <div 
            key={idx} 
            className={`h-2 w-2 rounded-full ${idx === currentFrame ? 'bg-cyan-300' : 'bg-slate-700'}`} 
          />
        ))}
      </div>
    </div>
  );
}
