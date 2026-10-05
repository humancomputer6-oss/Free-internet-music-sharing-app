import React, { useEffect, useState } from 'react';
import { Track } from '../types';
import { WaveformDisplay } from './WaveformDisplay';
import { AudioVisualizer } from './AudioVisualizer';
import { Heart, MessageSquare, Radio, Send, Users, Volume2 } from 'lucide-react';

interface LiveRadioRoomProps {
  tracks: Track[];
  currentPlayingTrack: Track | null;
  isPlaying: boolean;
  onTuneIn: (track: Track) => void;
  onOpenDetails: (track: Track) => void;
}

interface ChatMsg {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  reaction?: string;
}

const INITIAL_MESSAGES: ChatMsg[] = [
  {
    id: 'm1',
    user: 'Sora_Beats',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    text: 'Welcome everyone to the late night session! ☕✨',
    time: '2m ago',
    reaction: '☕'
  },
  {
    id: 'm2',
    user: 'Kavinsky Drift',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    text: 'Turn up that bass frequency on the equalizer, this groove is massive.',
    time: '1m ago',
    reaction: '🔥'
  },
  {
    id: 'm3',
    user: 'CyberZen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    text: 'Tuned in from Berlin! Sounding pristine on monitors.',
    time: 'Just now',
    reaction: '🎧'
  },
];

const EMOJI_BURSTS = ['🔥', '✨', '💜', '🎧', '⚡', '☕'];

export const LiveRadioRoom: React.FC<LiveRadioRoomProps> = ({
  tracks,
  currentPlayingTrack,
  isPlaying,
  onTuneIn,
  onOpenDetails,
}) => {
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL_MESSAGES);
  const [inputVal, setInputVal] = useState('');
  const [listeners, setListeners] = useState(148);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; left: number }[]>([]);

  // Choose the live radio track
  const currentRadioTrack = currentPlayingTrack || tracks[0];

  useEffect(() => {
    // Subtle listener jitter simulation
    const interval = setInterval(() => {
      setListeners((prev) => Math.max(120, prev + Math.floor(Math.random() * 5 - 2)));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const triggerEmoji = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 80) + 10;
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newMsg: ChatMsg = {
      id: `chat-${Date.now()}`,
      user: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: inputVal.trim(),
      time: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputVal('');
    triggerEmoji('🔥');
  };

  const isCurrentLivePlaying = isPlaying && currentPlayingTrack?.id === currentRadioTrack?.id;

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Floating live reaction emojis container */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-20 text-3xl animate-bounce transition-all duration-1000 opacity-90"
            style={{ left: `${item.left}%`, transform: 'translateY(-120px)' }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Main Broadcast Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs uppercase tracking-wider text-rose-400 font-bold">Live Global Broadcast</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Resonance 24/7 Internet Radio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Non-stop community-curated music streaming synchronously across all connected listeners.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3.5 py-2 border border-white/10">
            <Users className="h-4 w-4 text-emerald-400" />
            <span className="font-mono-numbers text-xs font-semibold text-white">
              {listeners} listening now
            </span>
          </div>

          <button
            onClick={() => onTuneIn(currentRadioTrack)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-lg active:scale-95 ${
              isCurrentLivePlaying
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-amber-400 text-stone-950 hover:bg-amber-300'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>{isCurrentLivePlaying ? 'On Air (Playing)' : 'Tune In Live'}</span>
          </button>
        </div>
      </div>

      {/* Broadcast Stage & Chat Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Turntable & Track Showcase */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#141824] to-[#0c0e14] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group shrink-0">
                <img
                  src={currentRadioTrack.coverUrl}
                  alt={currentRadioTrack.title}
                  referrerPolicy="no-referrer"
                  className="h-40 w-40 sm:h-48 sm:w-48 rounded-2xl object-cover shadow-2xl border border-white/15"
                />
                <div className="absolute top-2 left-2 rounded-md bg-rose-500/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Live Stream
                </div>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  {currentRadioTrack.genre} · {currentRadioTrack.bpm} BPM
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1 truncate">
                  {currentRadioTrack.title}
                </h2>
                <p className="text-sm text-slate-300 mt-0.5">
                  by <span className="font-semibold text-white">{currentRadioTrack.artist}</span> ({currentRadioTrack.artistHandle})
                </p>

                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {currentRadioTrack.description}
                </p>

                <div className="mt-5 flex items-center justify-center sm:justify-start gap-3">
                  <button
                    onClick={() => onTuneIn(currentRadioTrack)}
                    className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-300 transition-colors shadow-sm"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>{isCurrentLivePlaying ? 'Live Audio Active' : 'Listen with Room'}</span>
                  </button>

                  <button
                    onClick={() => onOpenDetails(currentRadioTrack)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Track Details & Comments
                  </button>
                </div>
              </div>
            </div>

            {/* Embedded Live Visualizer */}
            <div className="mt-7">
              <AudioVisualizer isPlaying={isCurrentLivePlaying} height={90} />
            </div>
          </div>

          {/* Up Next in Rotation */}
          <div className="rounded-2xl border border-white/10 bg-[#10131d] p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Up Next In Radio Rotation
            </h3>
            <div className="space-y-2">
              {tracks.filter(t => t.id !== currentRadioTrack.id).slice(0, 3).map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => onOpenDetails(track)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono-numbers text-xs text-slate-500 w-4">0{idx + 2}</span>
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-lg object-cover border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{track.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{track.artist} · {track.genre}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono-numbers text-slate-400">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Synchronous Chat Room */}
        <div className="flex flex-col h-[600px] rounded-2xl border border-white/10 bg-[#10131d] p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Live Listener Chat</h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono-numbers">● Sync ON</span>
          </div>

          {/* Quick emoji reactions trigger */}
          <div className="flex items-center justify-around py-2.5 border-b border-white/5 bg-white/[0.02] rounded-lg mt-3">
            {EMOJI_BURSTS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => triggerEmoji(emoji)}
                className="text-base hover:scale-125 transition-transform"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 space-y-3 overflow-y-auto py-3 pr-1 text-xs">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5">
                <img
                  src={m.avatar}
                  alt={m.user}
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 rounded-full object-cover mt-0.5 border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">{m.user}</span>
                    <span className="text-[10px] text-slate-500">{m.time}</span>
                  </div>
                  <p className="text-slate-300 mt-0.5 leading-snug break-words">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Send Form */}
          <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 border-t border-white/10 pt-3">
            <input
              type="text"
              placeholder="Chat with listeners in the room..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-stone-950 hover:bg-amber-400 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
