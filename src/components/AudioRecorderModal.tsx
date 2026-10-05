import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../types';
import { Check, Mic, Pause, Play, RotateCcw, Send, Square, Volume2, X } from 'lucide-react';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareTrack: (newTrack: Track) => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  onShareTrack,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Metadata form
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Studio Voice');
  const [genre, setGenre] = useState<Track['genre']>('Live Record');
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (previewAudioRef.current) previewAudioRef.current.pause();
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microphone permission denied or not available';
      setMicError(message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePreview = () => {
    if (!audioUrl) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(audioUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const resetRecording = () => {
    if (previewAudioRef.current) previewAudioRef.current.pause();
    setIsPlayingPreview(false);
    setRecordedBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordSeconds(0);
  };

  const handleShare = () => {
    if (!recordedBlob || !audioUrl) return;

    const finalTitle = title.trim() || `Live Recording #${Math.floor(Math.random() * 900 + 100)}`;
    const finalArtist = artist.trim() || 'Acoustic Creator';

    const peaks = Array.from({ length: 60 }, () => 0.15 + Math.random() * 0.7);

    const newTrack: Track = {
      id: `rec-${Date.now()}`,
      title: finalTitle,
      artist: finalArtist,
      artistHandle: `@${finalArtist.toLowerCase().replace(/\s+/g, '_')}`,
      artistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
      duration: Math.max(1, recordSeconds),
      genre: genre,
      audioBlobUrl: audioUrl,
      bpm: 90,
      musicalKey: 'C Major',
      plays: 1,
      likes: 1,
      reposts: 0,
      createdAt: 'Just now',
      description: 'Live field audio recording captured directly via Resonance studio microphone.',
      tags: ['liverecord', 'microphone', 'acoustics', 'raw'],
      waveformPeaks: peaks,
      comments: [
        {
          id: `c-rec-${Date.now()}`,
          author: 'Resonance Stream',
          authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          timestampSeconds: 0,
          text: 'Fresh live take shared to the community! 🎙️',
          createdAt: 'Just now'
        }
      ],
      isUserUpload: true,
    };

    onShareTrack(newTrack);
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#11151f] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Live Microphone Studio</h3>
            <p className="text-xs text-slate-400">Record voice, guitar, or ambient sound directly from your mic</p>
          </div>
        </div>

        {micError && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {micError}
          </div>
        )}

        {/* Recording Visual / Timer */}
        <div className="mt-5 flex flex-col items-center justify-center rounded-xl bg-black/40 p-8 border border-white/5">
          <div className="font-mono-numbers text-3xl font-bold tracking-wider text-white">
            {formatTime(recordSeconds)}
          </div>

          {isRecording && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-400 animate-pulse font-medium">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>RECORDING IN PROGRESS...</span>
            </div>
          )}

          {/* Record / Stop Action Button */}
          <div className="mt-6 flex items-center gap-3">
            {!recordedBlob ? (
              isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600 transition-transform active:scale-95"
                  title="Stop Recording"
                >
                  <Square className="h-6 w-6 fill-current" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-stone-950 shadow-lg hover:scale-105 transition-transform active:scale-95"
                  title="Start Recording"
                >
                  <Mic className="h-6 w-6" />
                </button>
              )
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePreview}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  {isPlayingPreview ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isPlayingPreview ? 'Pause' : 'Preview Take'}</span>
                </button>

                <button
                  onClick={resetRecording}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Re-record</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata form if audio is ready */}
        {recordedBlob && (
          <div className="mt-5 space-y-3 animate-fade-in">
            <div>
              <label className="text-xs font-medium text-slate-300">Track Title</label>
              <input
                type="text"
                placeholder="e.g. Acoustic Bedroom Take"
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
                  placeholder="Your artist handle"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Category</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as Track['genre'])}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Live Record">Live Record</option>
                  <option value="Lo-Fi Chill">Lo-Fi Chill</option>
                  <option value="Ambient">Ambient</option>
                  <option value="Indie Electronic">Indie Electronic</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-all shadow-md active:scale-98"
            >
              <Send className="h-4 w-4" />
              <span>Publish Take to Community Feed</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
