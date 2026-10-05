import React from 'react';
import { EqualizerSettings } from '../types';
import { RotateCcw, Sliders, X } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EqualizerSettings;
  onSettingsChange: (settings: EqualizerSettings) => void;
}

const PRESETS: Record<string, Omit<EqualizerSettings, 'presetName'>> = {
  'Flat': { low: 0, lowMid: 0, mid: 0, highMid: 0, high: 0 },
  'Bass Boost': { low: 7, lowMid: 4, mid: -1, highMid: 1, high: 2 },
  'Club & Electronic': { low: 6, lowMid: 2, mid: -2, highMid: 3, high: 5 },
  'Lo-Fi Warmth': { low: 4, lowMid: 5, mid: 1, highMid: -3, high: -5 },
  'Vocal Clarity': { low: -2, lowMid: 0, mid: 4, highMid: 5, high: 2 },
  'Acoustic Air': { low: 2, lowMid: -1, mid: 2, highMid: 4, high: 6 },
};

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  if (!isOpen) return null;

  const handleBandChange = (band: keyof Omit<EqualizerSettings, 'presetName'>, val: number) => {
    onSettingsChange({
      ...settings,
      [band]: val,
      presetName: 'Custom',
    });
  };

  const handlePresetSelect = (presetName: string) => {
    const p = PRESETS[presetName];
    if (p) {
      onSettingsChange({
        ...p,
        presetName,
      });
    }
  };

  const bands: { key: keyof Omit<EqualizerSettings, 'presetName'>; label: string; freq: string }[] = [
    { key: 'low', label: 'Sub Bass', freq: '60 Hz' },
    { key: 'lowMid', label: 'Low Mid', freq: '250 Hz' },
    { key: 'mid', label: 'Midrange', freq: '1 kHz' },
    { key: 'highMid', label: 'High Mid', freq: '4 kHz' },
    { key: 'high', label: 'Treble Air', freq: '12 kHz' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121622] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">5-Band Studio Equalizer</h3>
            <p className="text-xs text-slate-400">Tune audio frequencies to match your monitors or headphones</p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="mt-5 flex items-center justify-between border-b border-white/10 pb-4">
          <label className="text-xs font-semibold text-slate-300">Preset:</label>
          <div className="flex items-center gap-2">
            <select
              value={settings.presetName}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="Custom" className="bg-slate-900 text-white">Custom</option>
              {Object.keys(PRESETS).map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">
                  {p}
                </option>
              ))}
            </select>

            <button
              onClick={() => handlePresetSelect('Flat')}
              title="Reset to Flat"
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 5 Vertical Sliders */}
        <div className="mt-6 grid grid-cols-5 gap-2 text-center">
          {bands.map((band) => {
            const val = settings[band.key];
            return (
              <div key={band.key} className="flex flex-col items-center">
                <span className="text-[11px] font-mono-numbers font-semibold text-amber-400">
                  {val > 0 ? `+${val}` : val} dB
                </span>

                <div className="relative my-3 flex h-36 w-8 items-center justify-center">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={val}
                    onChange={(e) => handleBandChange(band.key, parseInt(e.target.value))}
                    className="h-28 w-2 -rotate-90 cursor-pointer accent-amber-400 bg-white/10 rounded-lg appearance-none"
                  />
                </div>

                <span className="text-xs font-bold text-white">{band.freq}</span>
                <span className="text-[10px] text-slate-400 leading-none mt-0.5">{band.label}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-amber-500 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-colors shadow-md"
        >
          Apply Equalizer
        </button>
      </div>
    </div>
  );
};
