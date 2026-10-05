import React, { useState } from 'react';
import { Track } from '../types';
import { WaveformDisplay } from './WaveformDisplay';
import {
  Heart,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Share2,
  SkipBack,
  SkipForward,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleLoop: () => void;
  onToggleVisualizer: () => void;
  onOpenEqualizer: () => void;
  onOpenDetails: (track: Track) => void;
  onShare: (track: Track) => void;
  onLike: (trackId: string) => void;
  isLiked: boolean;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isLooping,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleLoop,
  onToggleVisualizer,
  onOpenEqualizer,
  onOpenDetails,
  onShare,
  onLike,
  isLiked,
}) => {
  const [prevVolume, setPrevVolume] = useState(volume || 0.85);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolume || 0.85);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0d1017]/95 px-4 py-2.5 backdrop-blur-lg shadow-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left Track Info */}
        <div className="flex items-center gap-3.5 min-w-0 max-w-[280px] sm:max-w-xs shrink-0">
          <button
            onClick={() => onOpenDetails(currentTrack)}
            className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10"
          >
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="h-4 w-4 text-white" />
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <button
              onClick={() => onOpenDetails(currentTrack)}
              className="text-left font-display text-sm font-bold text-white hover:text-amber-400 transition-colors truncate block w-full"
            >
              {currentTrack.title}
            </button>
            <p className="text-xs text-slate-400 truncate">
              {currentTrack.artist}
            </p>
          </div>

          <button
            onClick={() => onLike(currentTrack.id)}
            className={`p-1.5 transition-colors ${
              isLiked ? 'text-rose-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Like track"
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => onShare(currentTrack)}
            className="hidden sm:block p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
            title="Share track"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* Center Waveform & Controls */}
        <div className="flex flex-1 flex-col items-center max-w-2xl px-2">
          {/* Controls Bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Previous Track"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={onPlayPause}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-stone-950 shadow-md hover:scale-105 transition-transform"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Next Track"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              onClick={onToggleLoop}
              className={`p-1.5 transition-colors ${
                isLooping ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={isLooping ? 'Looping enabled' : 'Loop disabled'}
            >
              <Repeat className="h-4 w-4" />
            </button>
          </div>

          {/* Scrubbing Waveform with Time stamps */}
          <div className="flex w-full items-center gap-2 mt-1">
            <span className="text-[11px] font-mono-numbers text-slate-400 w-8 text-right shrink-0">
              {formatTime(currentTime)}
            </span>

            <div className="flex-1">
              <WaveformDisplay
                peaks={currentTrack.waveformPeaks}
                duration={duration || currentTrack.duration}
                currentTime={currentTime}
                onSeek={onSeek}
                comments={currentTrack.comments}
                height={26}
                interactive={true}
              />
            </div>

            <span className="text-[11px] font-mono-numbers text-slate-400 w-8 text-left shrink-0">
              {formatTime(duration || currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Right Tools: Visualizer, Equalizer & Volume */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleVisualizer}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            title="Toggle Visualizer"
          >
            <span>Visualizer</span>
          </button>

          <button
            onClick={onOpenEqualizer}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Equalizer"
          >
            <Sliders className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMuteToggle}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="h-1.5 w-20 cursor-pointer accent-amber-400 bg-white/20 rounded-lg appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
