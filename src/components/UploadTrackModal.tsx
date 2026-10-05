import React, { useRef, useState } from 'react';
import { Track } from '../types';
import { Check, Music, UploadCloud, X } from 'lucide-react';

interface UploadTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadTrack: (newTrack: Track) => void;
}

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=80',
];

export const UploadTrackModal: React.FC<UploadTrackModalProps> = ({
  isOpen,
  onClose,
  onUploadTrack,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Indie Creator');
  const [genre, setGenre] = useState<Track['genre']>('Indie Electronic');
  const [bpm, setBpm] = useState(120);
  const [musicalKey, setMusicalKey] = useState('A Minor');
  const [coverUrl, setCoverUrl] = useState(DEFAULT_COVERS[0]);
  const [duration, setDuration] = useState(180);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processAudioFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    // Extract title from filename (strip extension)
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    setTitle(baseName);

    const blobUrl = URL.createObjectURL(selectedFile);
    setAudioUrl(blobUrl);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const tempCtx = new AudioCtx();
      const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);

      setDuration(Math.round(audioBuffer.duration));

      // Calculate real waveform peaks
      const rawData = audioBuffer.getChannelData(0);
      const samples = 64;
      const blockSize = Math.floor(rawData.length / samples);
      const peaks: number[] = [];

      for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j]);
        }
        peaks.push(Math.max(0.1, Math.min(1.0, (sum / blockSize) * 3.5)));
      }
      setWaveformPeaks(peaks);
      tempCtx.close();
    } catch (e) {
      console.warn('Could not decode waveform, generating fallback peaks', e);
      setWaveformPeaks(Array.from({ length: 64 }, () => 0.15 + Math.random() * 0.7));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type.startsWith('audio/') || f.name.endsWith('.mp3') || f.name.endsWith('.wav')) {
        processAudioFile(f);
      }
    }
  };

  const handlePublish = () => {
    if (!audioUrl || !title.trim()) return;

    const newTrack: Track = {
      id: `upload-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim() || 'Community Artist',
      artistHandle: `@${(artist.trim() || 'artist').toLowerCase().replace(/\s+/g, '_')}`,
      artistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      coverUrl: coverUrl,
      duration: duration || 180,
      genre: genre,
      audioBlobUrl: audioUrl,
      bpm: bpm,
      musicalKey: musicalKey,
      plays: 1,
      likes: 1,
      reposts: 0,
      createdAt: 'Just now',
      description: `Uploaded audio track shared to Resonance open community. Original file: ${file?.name}`,
      tags: ['community', 'upload', genre.toLowerCase().replace(/\s+/g, '')],
      waveformPeaks: waveformPeaks.length > 0 ? waveformPeaks : Array.from({ length: 64 }, () => 0.2 + Math.random() * 0.6),
      comments: [
        {
          id: `c-up-${Date.now()}`,
          author: 'Welcome Bot',
          authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          timestampSeconds: 0,
          text: 'Thanks for sharing your music with the world! 🎶',
          createdAt: 'Just now'
        }
      ],
      isUserUpload: true,
    };

    onUploadTrack(newTrack);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121622] p-6 shadow-2xl my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <UploadCloud className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Share Audio Track</h3>
            <p className="text-xs text-slate-400">Upload your own MP3, WAV, or OGG file to the community</p>
          </div>
        </div>

        {/* Drop zone */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-amber-400 bg-amber-500/5' : 'border-white/10 hover:border-white/25 bg-black/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.flac"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processAudioFile(e.target.files[0]);
                }
              }}
            />
            <Music className="h-10 w-10 text-amber-400/80 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-white">Drag & drop your audio file here</p>
            <p className="text-xs text-slate-400 mt-1">Supports MP3, WAV, FLAC, OGG · Automatic waveform analysis</p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Browse Computer
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3 border border-white/5">
              <div className="flex items-center gap-2.5 truncate">
                <Music className="h-5 w-5 text-amber-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · {Math.floor(duration / 60)}:
                    {(duration % 60).toString().padStart(2, '0')} duration
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  if (audioUrl) URL.revokeObjectURL(audioUrl);
                  setAudioUrl(null);
                }}
                className="text-xs text-slate-400 hover:text-rose-400 ml-2 shrink-0"
              >
                Change
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Track Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-300">Artist</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
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
                    <option value="Indie Electronic">Indie Electronic</option>
                    <option value="Ambient">Ambient</option>
                    <option value="Cyberpunk">Cyberpunk</option>
                    <option value="Live Record">Live Record</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-300">BPM (Approx)</label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Musical Key</label>
                  <input
                    type="text"
                    value={musicalKey}
                    onChange={(e) => setMusicalKey(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Artwork selector */}
              <div>
                <label className="text-xs font-medium text-slate-300">Choose Artwork</label>
                <div className="mt-1.5 flex gap-2">
                  {DEFAULT_COVERS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverUrl(url)}
                      className={`relative h-12 w-12 rounded-lg overflow-hidden border-2 transition-all ${
                        coverUrl === url ? 'border-amber-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Cover option" className="h-full w-full object-cover" />
                      {coverUrl === url && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={isProcessing || !title.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Publish Track to Community Feed</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
