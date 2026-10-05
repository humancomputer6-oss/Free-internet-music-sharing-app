import React from 'react';
import { Track } from '../types';
import { WaveformDisplay } from './WaveformDisplay';
import { Download, Heart, MessageSquare, Pause, Play, Share2 } from 'lucide-react';

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  isCurrent: boolean;
  currentTime: number;
  onPlay: (track: Track) => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onOpenDetails: (track: Track) => void;
  onShare: (track: Track) => void;
  onLike: (trackId: string) => void;
  isLiked: boolean;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isPlaying,
  isCurrent,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  onOpenDetails,
  onShare,
  onLike,
  isLiked,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent && isPlaying) {
      onPause();
    } else {
      onPlay(track);
    }
  };

  return (
    <div
      onClick={() => onOpenDetails(track)}
      className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#11141c] p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl hover:shadow-black/50 cursor-pointer"
    >
      <div>
        {/* Top Cover Image and Quick Play button */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-900 border border-white/5">
          <img
            src={track.coverUrl}
            alt={track.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Graceful fallback container if asset error
              (e.target as HTMLElement).style.display = 'none';
            }}
          />

          {/* Quick Play overlay button */}
          <button
            onClick={handlePlayToggle}
            className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform ${
              isCurrent && isPlaying
                ? 'bg-amber-400 text-stone-950 scale-100'
                : 'bg-white/95 text-stone-950 scale-90 group-hover:scale-100 hover:bg-amber-400'
            }`}
            title={isCurrent && isPlaying ? 'Pause' : 'Play'}
          >
            {isCurrent && isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Duration Badge */}
          <div className="absolute top-2.5 left-2.5 rounded bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-mono-numbers text-white/90">
            {formatTime(track.duration)}
          </div>
        </div>

        {/* Unboxed metadata with typographic separators */}
        <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-amber-400 font-medium">{track.genre}</span>
          <span aria-hidden="true">·</span>
          <span>{track.bpm} BPM</span>
          <span aria-hidden="true">·</span>
          <span>{track.musicalKey}</span>
        </div>

        {/* Title & Artist */}
        <h3 className="mt-1 font-display text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
          {track.title}
        </h3>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {track.artist} <span className="text-slate-400 font-normal">{track.artistHandle}</span>
        </p>

        {/* Waveform Scrubber */}
        <div
          className="mt-3.5 rounded-lg bg-black/30 p-2 border border-white/5"
          onClick={(e) => e.stopPropagation()}
        >
          <WaveformDisplay
            peaks={track.waveformPeaks}
            duration={track.duration}
            currentTime={isCurrent ? currentTime : 0}
            onSeek={(secs) => {
              if (!isCurrent) onPlay(track);
              onSeek(secs);
            }}
            comments={track.comments}
            height={36}
            interactive={true}
          />
        </div>
      </div>

      {/* Footer Metrics & Actions */}
      <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(track.id);
            }}
            className={`flex items-center gap-1 transition-colors hover:text-rose-400 ${
              isLiked ? 'text-rose-400 font-medium' : ''
            }`}
            title="Like track"
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-mono-numbers">{track.likes + (isLiked ? 1 : 0)}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(track);
            }}
            className="flex items-center gap-1 hover:text-white transition-colors"
            title="Comments"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-mono-numbers">{track.comments.length}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(track);
            }}
            className="rounded p-1 text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
            title="Share track"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
