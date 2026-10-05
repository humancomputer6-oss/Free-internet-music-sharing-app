import React from 'react';
import { Mic, Upload, Radio, Sliders } from 'lucide-react';

interface TopBarProps {
  currentTab: 'discover' | 'radio' | 'lab' | 'playlists' | 'my-music';
  onSelectTab: (tab: 'discover' | 'radio' | 'lab' | 'playlists' | 'my-music') => void;
  onOpenUpload: () => void;
  onOpenRecorder: () => void;
  onOpenEqualizer: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenUpload,
  onOpenRecorder,
  onOpenEqualizer,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0a0c10]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onSelectTab('discover')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 shadow-sm transition-transform group-hover:scale-105">
              <span className="text-sm font-black tracking-tighter text-white">R</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white transition-colors group-hover:text-amber-400">
              Resonance
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => onSelectTab('discover')}
            className={`transition-colors whitespace-nowrap ${
              currentTab === 'discover'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-1'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Discover Feed
          </button>

          <button
            onClick={() => onSelectTab('radio')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              currentTab === 'radio'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-1'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            Live Broadcast
          </button>

          <button
            onClick={() => onSelectTab('lab')}
            className={`transition-colors whitespace-nowrap ${
              currentTab === 'lab'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-1'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sonic Lab
          </button>

          <button
            onClick={() => onSelectTab('playlists')}
            className={`transition-colors whitespace-nowrap ${
              currentTab === 'playlists'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-1'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Playlists
          </button>

          <button
            onClick={() => onSelectTab('my-music')}
            className={`transition-colors whitespace-nowrap ${
              currentTab === 'my-music'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-1'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            My Audio
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenEqualizer}
            title="Studio Equalizer"
            aria-label="Studio Equalizer"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Sliders className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenRecorder}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
          >
            <Mic className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Record Mic</span>
            <span className="sm:hidden">Record</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-semibold text-stone-950 shadow-sm hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Upload Audio</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden items-center justify-around border-t border-white/[0.06] bg-[#0c0e14] px-2 py-2 text-xs">
        <button
          onClick={() => onSelectTab('discover')}
          className={`py-1 px-2 ${currentTab === 'discover' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Discover
        </button>
        <button
          onClick={() => onSelectTab('radio')}
          className={`py-1 px-2 ${currentTab === 'radio' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Radio
        </button>
        <button
          onClick={() => onSelectTab('lab')}
          className={`py-1 px-2 ${currentTab === 'lab' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Sonic Lab
        </button>
        <button
          onClick={() => onSelectTab('playlists')}
          className={`py-1 px-2 ${currentTab === 'playlists' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Playlists
        </button>
        <button
          onClick={() => onSelectTab('my-music')}
          className={`py-1 px-2 ${currentTab === 'my-music' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          My Audio
        </button>
      </div>
    </header>
  );
};
