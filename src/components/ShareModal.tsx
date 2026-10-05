import React, { useState } from 'react';
import { Track } from '../types';
import { exportTrackToWav } from '../services/wavExporter';
import { Check, Copy, Download, ExternalLink, Share2, X } from 'lucide-react';

interface ShareModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ track, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !track) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${currentOrigin}/#track=${track.id}`;
  const embedCode = `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="${shareUrl}&embed=true"></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${track.title} by ${track.artist}`,
          text: `Listen to "${track.title}" on Resonance Internet Music!`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadAudio = async () => {
    try {
      setIsExporting(true);
      if (track.audioBlobUrl) {
        // Direct download
        const a = document.createElement('a');
        a.href = track.audioBlobUrl;
        a.download = `${track.artist} - ${track.title}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Render to WAV via OfflineAudioContext
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
    } catch (e) {
      console.error('Audio export error', e);
    } finally {
      setIsExporting(false);
    }
  };

  const socialLinks = [
    {
      name: 'X (Twitter)',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Listening to "${track.title}" by ${track.artist} on @ResonanceMusic 🎵`)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'WhatsApp',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this track: "${track.title}" by ${track.artist} - ${shareUrl}`)}`,
    },
    {
      name: 'Telegram',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`"${track.title}" by ${track.artist}`)}`,
    },
    {
      name: 'Reddit',
      url: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`${track.title} - ${track.artist} [${track.genre}]`)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121620] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header with track preview */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <img
            src={track.coverUrl}
            alt={track.title}
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-xl object-cover shadow-md border border-white/10"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">{track.genre}</span>
            <h3 className="font-display text-lg font-bold text-white truncate">{track.title}</h3>
            <p className="text-xs text-slate-400 truncate">{track.artist} · {track.artistHandle}</p>
          </div>
        </div>

        {/* Share Link field */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300">Direct Share Link</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors whitespace-nowrap active:scale-95"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social buttons */}
          <div>
            <span className="text-xs font-medium text-slate-400">Share to Social Network</span>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                  <span>{s.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Embed Code option */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Embed Player on Website</label>
              <button
                onClick={handleCopyEmbed}
                className="text-[11px] text-amber-400 hover:underline"
              >
                {copiedEmbed ? 'Copied Embed Code' : 'Copy HTML'}
              </button>
            </div>
            <textarea
              readOnly
              rows={2}
              value={embedCode}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-[11px] font-mono text-slate-400 focus:outline-none resize-none"
            />
          </div>

          {/* Native Share & Direct Audio Export */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={handleNativeShare}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            >
              <Share2 className="h-4 w-4 text-amber-400" />
              <span>Share via Device</span>
            </button>

            <button
              onClick={handleDownloadAudio}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>{isExporting ? 'Rendering WAV...' : 'Download Audio (.wav)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
