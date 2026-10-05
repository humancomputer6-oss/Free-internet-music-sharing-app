import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../types';
import { exportTrackToWav } from '../services/wavExporter';
import { Download, Play, Pause, RotateCcw, Share2, Sparkles, Volume2, X } from 'lucide-react';

interface SonicLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareTrackToFeed: (newTrack: Track) => void;
}

const INSTRUMENTS = [
  { name: 'Kick 909', type: 'kick', color: '#f59e0b' },
  { name: 'Snare Tight', type: 'snare', color: '#ec4899' },
  { name: 'Closed Hat', type: 'cl_hat', color: '#8b5cf6' },
  { name: 'Open Hat', type: 'op_hat', color: '#3b82f6' },
  { name: 'Clap Crisp', type: 'clap', color: '#10b981' },
  { name: '808 Sub Bass', type: 'bass', color: '#ef4444' },
  { name: 'Synth Lead', type: 'lead', color: '#eab308' },
];

const PRESETS: Record<string, number[][]> = {
  'Synthwave Drive': [
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // kick
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // hat
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // op_hat
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // clap
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // bass
    [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0], // lead
  ],
  'Lo-Fi BoomBap': [
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], // kick
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // hat
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], // op_hat
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // clap
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], // bass
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], // lead
  ],
  'Cyber Dance 4/4': [
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // kick
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // snare
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // hat
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], // op_hat
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // clap
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // bass
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // lead
  ],
};

export const SonicLabModal: React.FC<SonicLabModalProps> = ({
  isOpen,
  onClose,
  onShareTrackToFeed,
}) => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [grid, setGrid] = useState<number[][]>(() => PRESETS['Synthwave Drive']);

  // Share form states
  const [trackTitle, setTrackTitle] = useState('Cyber Orbit Loop');
  const [artistName, setArtistName] = useState('My Studio Persona');
  const [genre, setGenre] = useState<Track['genre']>('Synthwave');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playStepSound = (channelIndex: number, time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (channelIndex === 0) {
      // Kick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
      gain.gain.setValueAtTime(0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.28);
    } else if (channelIndex === 1) {
      // Snare
      const bSize = ctx.sampleRate * 0.15;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = b;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 850;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.65, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      src.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      src.start(time);
      src.stop(time + 0.16);
    } else if (channelIndex === 2) {
      // Closed Hat
      const bSize = ctx.sampleRate * 0.04;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = b;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 6500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
      src.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      src.start(time);
      src.stop(time + 0.04);
    } else if (channelIndex === 3) {
      // Open Hat
      const bSize = ctx.sampleRate * 0.2;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = b;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 5000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.35, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      src.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      src.start(time);
      src.stop(time + 0.2);
    } else if (channelIndex === 4) {
      // Clap
      const bSize = ctx.sampleRate * 0.12;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = b;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1300;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.5, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
      src.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      src.start(time);
      src.stop(time + 0.13);
    } else if (channelIndex === 5) {
      // 808 Bass
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, time);
      osc.frequency.exponentialRampToValueAtTime(55, time + 0.05);
      g.gain.setValueAtTime(0.7, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.52);
    } else if (channelIndex === 6) {
      // Lead Pluck
      const osc = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, time);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(1800, time);
      f.frequency.exponentialRampToValueAtTime(350, time + 0.15);
      g.gain.setValueAtTime(0.3, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.2);
    }
  };

  const togglePlayback = () => {
    initAudio();
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setIsPlaying(false);
      setCurrentStep(0);
    } else {
      setIsPlaying(true);
      let step = currentStep;
      const stepDuration = (60 / (bpm * 4)) * 1000;

      timerRef.current = window.setInterval(() => {
        if (!audioCtxRef.current) return;
        const now = audioCtxRef.current.currentTime;

        grid.forEach((row, channelIdx) => {
          if (row[step]) {
            playStepSound(channelIdx, now);
          }
        });

        setCurrentStep(step);
        step = (step + 1) % 16;
      }, stepDuration);
    }
  };

  const toggleCell = (rowIdx: number, colIdx: number) => {
    initAudio();
    const newGrid = grid.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? (cell ? 0 : 1) : cell))
    );
    setGrid(newGrid);

    // Audition sound if activated
    if (newGrid[rowIdx][colIdx] && audioCtxRef.current) {
      playStepSound(rowIdx, audioCtxRef.current.currentTime);
    }
  };

  const clearGrid = () => {
    setGrid(grid.map((row) => row.map(() => 0)));
  };

  const randomizeGrid = () => {
    setGrid(
      grid.map((row, idx) =>
        row.map(() => {
          // Density variation by instrument
          const prob = idx === 0 ? 0.25 : idx === 2 ? 0.6 : 0.2;
          return Math.random() < prob ? 1 : 0;
        })
      )
    );
  };

  const handleShareSubmit = () => {
    if (!trackTitle.trim()) return;

    // Generate waveform peaks from step sequencer pattern
    const peaks = Array.from({ length: 64 }, (_, i) => {
      const step16 = i % 16;
      let energy = 0.15;
      if (grid[0][step16]) energy += 0.4;
      if (grid[1][step16]) energy += 0.3;
      if (grid[5][step16]) energy += 0.25;
      return Math.min(0.95, energy + Math.random() * 0.1);
    });

    const newTrack: Track = {
      id: `beat-${Date.now()}`,
      title: trackTitle.trim(),
      artist: artistName.trim() || 'Sonic Lab Producer',
      artistHandle: `@${(artistName.trim() || 'producer').toLowerCase().replace(/\s+/g, '_')}`,
      artistAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      duration: 120, // 2:00
      genre: genre,
      stepSequencerData: grid,
      bpm: bpm,
      musicalKey: 'A Minor',
      plays: 1,
      likes: 1,
      reposts: 0,
      createdAt: 'Just now',
      description: `Original 8-channel loop created inside Resonance Sonic Lab at ${bpm} BPM.`,
      tags: ['soniclab', 'original', 'beatmaker', genre.toLowerCase().replace(/\s+/g, '')],
      waveformPeaks: peaks,
      comments: [
        {
          id: `c-${Date.now()}`,
          author: 'Resonance Bot',
          authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          timestampSeconds: 0,
          text: 'Fresh beat published to the internet community feed! 🔥',
          createdAt: 'Just now'
        }
      ],
      isUserUpload: true,
    };

    onShareTrackToFeed(newTrack);
    setShowShareModal(false);
    onClose();
  };

  const handleExportWav = async () => {
    try {
      setIsExporting(true);
      const mockTrack: Track = {
        id: 'export',
        title: trackTitle,
        artist: artistName,
        artistHandle: '@producer',
        artistAvatar: '',
        coverUrl: '',
        duration: 32,
        genre: genre,
        stepSequencerData: grid,
        bpm: bpm,
        musicalKey: 'A Minor',
        plays: 0,
        likes: 0,
        reposts: 0,
        createdAt: '',
        description: '',
        tags: [],
        waveformPeaks: [],
        comments: [],
      };

      const blob = await exportTrackToWav(mockTrack, 16);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trackTitle || 'SonicLab_Loop'}_${bpm}BPM.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0f131c] p-5 sm:p-8 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Sonic Lab — Loop Sequencer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sequence custom drum & synth patterns and instantly share them with the internet community.
            </p>
          </div>

          <button
            onClick={() => {
              if (isPlaying) togglePlayback();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar & Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/40 p-3.5 border border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-colors shadow-sm"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              <span>{isPlaying ? 'Pause Loop' : 'Play Loop'}</span>
            </button>

            {/* Tempo Slider */}
            <div className="flex items-center gap-2 text-xs text-slate-300 ml-2">
              <span className="font-medium text-slate-400">Tempo:</span>
              <input
                type="range"
                min="70"
                max="160"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="h-1.5 w-24 cursor-pointer accent-amber-400 bg-white/20 rounded-lg appearance-none"
              />
              <span className="font-mono-numbers text-amber-400 font-semibold w-14">
                {bpm} BPM
              </span>
            </div>
          </div>

          {/* Presets and actions */}
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const preset = PRESETS[e.target.value];
                if (preset) setGrid(preset);
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">Load Preset...</option>
              {Object.keys(PRESETS).map((name) => (
                <option key={name} value={name} className="bg-slate-900 text-white">
                  {name}
                </option>
              ))}
            </select>

            <button
              onClick={randomizeGrid}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
              title="Randomize"
            >
              Randomize
            </button>

            <button
              onClick={clearGrid}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear all steps"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 16-Step Grid Sequencer */}
        <div className="mt-5 space-y-2 overflow-x-auto pb-2">
          {/* Step header markers */}
          <div className="flex items-center gap-1.5 min-w-[600px] pl-28 pr-2">
            {Array.from({ length: 16 }).map((_, stepIdx) => (
              <div
                key={stepIdx}
                className={`flex-1 text-center text-[10px] font-mono-numbers ${
                  stepIdx === currentStep && isPlaying
                    ? 'text-amber-400 font-bold'
                    : stepIdx % 4 === 0
                    ? 'text-slate-300 font-semibold'
                    : 'text-slate-600'
                }`}
              >
                {stepIdx + 1}
              </div>
            ))}
          </div>

          {INSTRUMENTS.map((inst, rowIdx) => (
            <div key={inst.name} className="flex items-center gap-1.5 min-w-[600px]">
              {/* Instrument Label */}
              <button
                onClick={() => {
                  initAudio();
                  if (audioCtxRef.current) playStepSound(rowIdx, audioCtxRef.current.currentTime);
                }}
                className="w-28 flex items-center justify-between text-left text-xs font-semibold text-slate-300 px-2 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-colors shrink-0 group"
              >
                <span className="truncate">{inst.name}</span>
                <Volume2 className="h-3 w-3 text-slate-500 group-hover:text-amber-400 shrink-0" />
              </button>

              {/* 16 Step Buttons */}
              <div className="flex flex-1 items-center gap-1.5">
                {grid[rowIdx].map((isActive, colIdx) => {
                  const isCurrent = colIdx === currentStep && isPlaying;
                  const isDownbeat = colIdx % 4 === 0;

                  return (
                    <button
                      key={colIdx}
                      onClick={() => toggleCell(rowIdx, colIdx)}
                      className={`h-9 flex-1 rounded-md transition-all ${
                        isActive
                          ? 'bg-amber-400 shadow-sm shadow-amber-400/40 text-stone-950'
                          : isDownbeat
                          ? 'bg-white/10 hover:bg-white/20'
                          : 'bg-white/5 hover:bg-white/15'
                      } ${
                        isCurrent
                          ? 'ring-2 ring-white scale-105 z-10'
                          : ''
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions: Share to Community & Export WAV */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="text-xs text-slate-400">
            Tip: Press on any instrument name to preview its tone.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportWav}
              disabled={isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isExporting ? 'Rendering WAV...' : 'Export WAV File'}</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-colors shadow-sm"
            >
              <Share2 className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Share to Community</span>
            </button>
          </div>
        </div>

        {/* Share Track to Feed Sub-modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161b26] p-6 shadow-2xl">
              <h3 className="font-display text-lg font-bold text-white">Publish Beat to Community</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your beat will appear in the public discovery feed with full playback for other listeners.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Track Title</label>
                  <input
                    type="text"
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Midnight Cyber Run"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Artist / Producer Handle</label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Neon Wave"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as Track['genre'])}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Synthwave">Synthwave</option>
                    <option value="Lo-Fi Chill">Lo-Fi Chill</option>
                    <option value="Cyberpunk">Cyberpunk</option>
                    <option value="Indie Electronic">Indie Electronic</option>
                    <option value="Chiptune">Chiptune</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="rounded-lg border border-white/10 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareSubmit}
                  className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-400"
                >
                  Publish Track
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
