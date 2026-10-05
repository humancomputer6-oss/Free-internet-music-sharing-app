import React, { useState } from 'react';
import { TrackComment } from '../types';

interface WaveformDisplayProps {
  peaks: number[];
  duration: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
  comments?: TrackComment[];
  onCommentClick?: (comment: TrackComment) => void;
  height?: number;
  interactive?: boolean;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  peaks,
  duration,
  currentTime,
  onSeek,
  comments = [],
  onCommentClick,
  height = 48,
  interactive = true,
}) => {
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = x / rect.width;
    setHoverPosition(percent);
    setHoverTime(percent * duration);
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
    setHoverTime(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = x / rect.width;
    onSeek(percent * duration);
  };

  const currentPercent = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      className={`relative w-full select-none ${interactive ? 'cursor-pointer' : ''}`}
      style={{ height: `${height}px` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Waveform Bars */}
      <div className="flex h-full w-full items-center gap-[2px]">
        {peaks.map((peak, index) => {
          const barPercent = index / peaks.length;
          const isPlayed = barPercent <= currentPercent;
          const isHovered = hoverPosition !== null && barPercent <= hoverPosition;

          // Scale height
          const barHeight = Math.max(12, Math.round(peak * height * 0.9));

          return (
            <div
              key={index}
              className="flex-1 flex flex-col justify-center items-center h-full transition-all duration-75"
            >
              <div
                style={{ height: `${barHeight}px` }}
                className={`w-full rounded-sm transition-colors ${
                  isPlayed
                    ? 'bg-amber-400'
                    : isHovered
                    ? 'bg-amber-200/60'
                    : 'bg-white/20'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Current Playhead Line */}
      {duration > 0 && (
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-amber-300 pointer-events-none shadow-[0_0_8px_rgba(245,158,11,0.8)]"
          style={{ left: `${Math.min(100, currentPercent * 100)}%` }}
        />
      )}

      {/* Hover scrubber indicator */}
      {hoverPosition !== null && (
        <>
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-white/70 pointer-events-none"
            style={{ left: `${hoverPosition * 100}%` }}
          />
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono tabular-nums text-white pointer-events-none border border-white/10 shadow-lg"
              style={{ left: `${hoverPosition * 100}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </>
      )}

      {/* Interactive Comment Markers */}
      {comments.map((comment) => {
        const commentPercent = duration > 0 ? (comment.timestampSeconds / duration) * 100 : 0;
        return (
          <div
            key={comment.id}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(comment.timestampSeconds);
              if (onCommentClick) onCommentClick(comment);
            }}
            className="group absolute bottom-0 -translate-x-1/2 flex flex-col items-center cursor-pointer z-10"
            style={{ left: `${Math.min(98, Math.max(2, commentPercent))}%` }}
            title={`${comment.author} at ${formatTime(comment.timestampSeconds)}: "${comment.text}"`}
          >
            {/* Small avatar or pin dot */}
            <div className="h-3 w-3 rounded-full border border-stone-900 bg-amber-400 shadow-sm transition-transform hover:scale-125 hover:bg-rose-400" />

            {/* Hover tooltip for comment preview */}
            <div className="pointer-events-none absolute bottom-5 hidden max-w-[200px] flex-col rounded-md bg-[#161a23] p-1.5 text-[11px] text-white shadow-xl border border-white/10 group-hover:flex z-30">
              <div className="flex items-center gap-1 font-semibold text-amber-300">
                <span>{comment.author}</span>
                <span className="text-[10px] text-slate-400">· {formatTime(comment.timestampSeconds)}</span>
              </div>
              <p className="line-clamp-2 text-slate-200 mt-0.5 leading-snug">{comment.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
