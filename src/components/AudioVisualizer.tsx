import React, { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../services/audioEngine';
import { Activity, BarChart2, Disc, Maximize2, Minimize2 } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  height?: number;
  interactive?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  isFullscreen = false,
  onToggleFullscreen,
  height = 80,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<'bars' | 'wave' | 'radial'>('bars');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const audioEngine = AudioEngine.getInstance();
    const analyser = audioEngine.getAnalyser();

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const render = () => {
      // Handle high-DPI scaling
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);
      } else {
        // Idle ambient gentle wave
        const now = Date.now() * 0.002;
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = Math.max(8, Math.sin(now + i * 0.1) * 20 + 25);
          timeData[i] = 128 + Math.sin(now + i * 0.15) * 10;
        }
      }

      if (visualMode === 'bars') {
        // Bars visualization
        const barCount = 48;
        const barWidth = width / barCount;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] || 0;
          const percent = val / 255;
          const barHeight = Math.max(3, percent * (h * 0.85));

          const x = i * barWidth;
          const y = h - barHeight;

          // Gradient
          const gradient = ctx.createLinearGradient(0, y, 0, h);
          gradient.addColorStop(0, '#f59e0b'); // amber-500
          gradient.addColorStop(0.6, '#ec4899'); // pink-500
          gradient.addColorStop(1, '#6366f1'); // indigo-500

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x + 1.5, y, Math.max(1, barWidth - 3), barHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Subtle peak cap
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x + 1.5, Math.max(0, y - 2), Math.max(1, barWidth - 3), 1.5);
        }
      } else if (visualMode === 'wave') {
        // Oscilloscope Smooth Waveform
        ctx.lineWidth = 2.5;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#38bdf8');
        gradient.addColorStop(0.5, '#f43f5e');
        gradient.addColorStop(1, '#eab308');
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();

        // Glow pass
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.stroke();
      } else {
        // Radial Mandala Spectrum
        const centerX = width / 2;
        const centerY = h / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.45;
        const points = 40;
        const angleStep = (Math.PI * 2) / points;

        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const val = freqData[i * 2] || 0;
          const offset = (val / 255) * (baseRadius * 0.8);
          const r = baseRadius + offset;
          const angle = i * angleStep;

          const px = centerX + Math.cos(angle) * r;
          const py = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();

        const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius * 1.6);
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        grad.addColorStop(0.7, 'rgba(236, 72, 153, 0.2)');
        grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, visualMode]);

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-black/40 border border-white/5 ${isFullscreen ? 'h-full w-full' : 'w-full'}`}>
      <canvas
        ref={canvasRef}
        width={isFullscreen ? 1200 : 700}
        height={isFullscreen ? 500 : height}
        className="w-full h-full object-contain"
      />

      {interactive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-xs text-slate-300">
          <button
            onClick={() => setVisualMode('bars')}
            className={`p-1 rounded hover:text-white transition-colors ${visualMode === 'bars' ? 'text-amber-400 bg-white/10' : ''}`}
            title="Frequency Bars"
          >
            <BarChart2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setVisualMode('wave')}
            className={`p-1 rounded hover:text-white transition-colors ${visualMode === 'wave' ? 'text-amber-400 bg-white/10' : ''}`}
            title="Oscilloscope"
          >
            <Activity className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setVisualMode('radial')}
            className={`p-1 rounded hover:text-white transition-colors ${visualMode === 'radial' ? 'text-amber-400 bg-white/10' : ''}`}
            title="Radial Mandala"
          >
            <Disc className="h-3.5 w-3.5" />
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1 ml-1 text-slate-400 hover:text-white border-l border-white/10 pl-1.5 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Visualizer'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
