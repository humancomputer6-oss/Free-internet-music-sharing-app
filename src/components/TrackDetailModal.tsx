import React, { useState } from 'react';
import { Track, TrackComment } from '../types';
import { WaveformDisplay } from './WaveformDisplay';
import { Download, Heart, MessageSquare, Play, Pause, Repeat, Share2, X, Send } from 'lucide-react';
import { exportTrackToWav } from '../services/wavExporter';

interface TrackDetailModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onLike: (trackId: string) => void;
  isLiked: boolean;
  onShare: (track: Track) => void;
  onAddComment: (trackId: string, comment: Omit<TrackComment, 'id' | 'createdAt'>) => void;
}

export const TrackDetailModal: React.FC<TrackDetailModalProps> = ({
  track,
  isOpen,
  onClose,
  isPlaying,
  currentTime,
  onPlayPause,
  onSeek,
  onLike,
  isLiked,
  onShare,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('Sonic Explorer');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !track) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(track.id, {
      author: authorName.trim() || 'Anonymous Listener',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      timestampSeconds: Math.floor(currentTime),
      text: commentText.trim(),
    });

    setCommentText('');
  };

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      if (track.audioBlobUrl) {
        const a = document.createElement('a');
        a.href = track.audioBlobUrl;
        a.download = `${track.artist} - ${track.title}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const blob = await exportTrackToWav(track, 32);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${track.artist} - ${track.title}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0e121a] p-5 sm:p-8 shadow-2xl my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Track Header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="relative group shrink-0">
            <img
              src={track.coverUrl}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl object-cover shadow-2xl border border-white/10"
            />
            <button
              onClick={onPlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-stone-950 shadow-lg hover:scale-105 transition-transform">
                {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
              </div>
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {/* Unboxed metadata with typographic separators */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="text-amber-400 font-semibold">{track.genre}</span>
              <span aria-hidden="true">·</span>
              <span>{track.bpm} BPM</span>
              <span aria-hidden="true">·</span>
              <span>Key of {track.musicalKey}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-numbers">{formatTime(track.duration)}</span>
            </div>

            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {track.title}
            </h2>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-medium text-slate-200">{track.artist}</span>
              <span className="text-xs text-slate-400">{track.artistHandle}</span>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              {track.description}
            </p>

            {/* Tags unboxed */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
              {track.tags.map(tag => (
                <span key={tag} className="text-amber-400/80">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Big Waveform Section with Comment Pins */}
        <div className="mt-7 rounded-xl bg-black/40 p-4 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono-numbers text-amber-400">{formatTime(currentTime)}</span>
            <span className="text-[11px] text-slate-400">Click waveform to seek or click markers to read comments</span>
            <span className="font-mono-numbers">{formatTime(track.duration)}</span>
          </div>

          <WaveformDisplay
            peaks={track.waveformPeaks}
            duration={track.duration}
            currentTime={currentTime}
            onSeek={onSeek}
            comments={track.comments}
            height={64}
            interactive={true}
          />
        </div>

        {/* Action Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLike(track.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isLiked
                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-mono-numbers">{track.likes + (isLiked ? 1 : 0)}</span>
            </button>

            <button
              onClick={() => onShare(track)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <Share2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Share Track</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isExporting ? 'Exporting...' : 'Export WAV'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono-numbers">
            <span>{track.plays.toLocaleString()} plays</span>
            <span>·</span>
            <span>{track.reposts} reposts</span>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              <span>Waveform Discussions ({track.comments.length})</span>
            </h4>
            <span className="text-xs text-slate-400">
              Pinning to current timestamp: <strong className="text-amber-400 font-mono-numbers">{formatTime(currentTime)}</strong>
            </span>
          </div>

          {/* New Comment Input */}
          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Your handle..."
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-36 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder={`Comment at ${formatTime(currentTime)}...`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Pin</span>
            </button>
          </form>

          {/* Existing comments list */}
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {track.comments.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                No waveform comments yet. Be the first to pin a thought!
              </p>
            ) : (
              track.comments.map((comment) => (
                <div
                  key={comment.id}
                  onClick={() => onSeek(comment.timestampSeconds)}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 hover:bg-white/[0.05] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <img
                      src={comment.authorAvatar}
                      alt={comment.author}
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5 border border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {comment.author}
                        </span>
                        <span className="text-[10px] font-mono-numbers text-amber-400/90 bg-amber-500/10 px-1.5 py-0.2 rounded">
                          at {formatTime(comment.timestampSeconds)}
                        </span>
                        <span className="text-[10px] text-slate-400">{comment.createdAt}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-300 leading-snug">{comment.text}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-amber-400 shrink-0 self-center">
                    Jump ➔
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
