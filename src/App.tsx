import React, { useEffect, useState } from 'react';
import { EqualizerSettings, Playlist, Track, TrackComment } from './types';
import { INITIAL_PLAYLISTS, INITIAL_TRACKS } from './data/initialTracks';
import { AudioEngine } from './services/audioEngine';

import { TopBar } from './components/TopBar';
import { PlayerBar } from './components/PlayerBar';
import { TrackCard } from './components/TrackCard';
import { AudioVisualizer } from './components/AudioVisualizer';
import { SonicLabModal } from './components/SonicLabModal';
import { AudioRecorderModal } from './components/AudioRecorderModal';
import { UploadTrackModal } from './components/UploadTrackModal';
import { ShareModal } from './components/ShareModal';
import { EqualizerModal } from './components/EqualizerModal';
import { TrackDetailModal } from './components/TrackDetailModal';
import { LiveRadioRoom } from './components/LiveRadioRoom';
import { PlaylistsView } from './components/PlaylistsView';

import {
  Compass,
  Filter,
  Flame,
  Headphones,
  Maximize2,
  Mic,
  Music,
  Play,
  Pause,
  Radio,
  Search,
  Share2,
  Sparkles,
  Upload,
} from 'lucide-react';

export default function App() {
  // App navigation state
  const [currentTab, setCurrentTab] = useState<'discover' | 'radio' | 'lab' | 'playlists' | 'my-music'>('discover');

  // Music library state
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('resonance_tracks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_TRACKS;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('resonance_playlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_PLAYLISTS;
  });

  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('resonance_likes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return ['track-synth-1984', 'track-lofi-rain'];
  });

  // Audio player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(tracks[0]?.duration || 180);
  const [volume, setVolume] = useState(0.85);
  const [isLooping, setIsLooping] = useState(false);

  // Equalizer settings state
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>({
    low: 0,
    lowMid: 0,
    mid: 0,
    highMid: 0,
    high: 0,
    presetName: 'Flat',
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'trending' | 'plays' | 'recent'>('trending');

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isSonicLabOpen, setIsSonicLabOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [sharingTrack, setSharingTrack] = useState<Track | null>(null);
  const [detailTrack, setDetailTrack] = useState<Track | null>(null);
  const [isFullscreenVisualizer, setIsFullscreenVisualizer] = useState(false);

  // Audio Engine instance
  const audioEngine = AudioEngine.getInstance();

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('resonance_tracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem('resonance_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('resonance_likes', JSON.stringify(likedTrackIds));
  }, [likedTrackIds]);

  // Audio engine event bindings
  useEffect(() => {
    const unsubTime = audioEngine.onTimeUpdate((time, dur) => {
      setCurrentTime(time);
      if (dur > 0) setDuration(dur);
    });

    const unsubState = audioEngine.onPlayStateChange((playing) => {
      setIsPlaying(playing);
    });

    const unsubEnded = audioEngine.onEnded(() => {
      if (isLooping && currentTrack) {
        audioEngine.seek(0);
        audioEngine.resume();
      } else {
        handleNextTrack();
      }
    });

    return () => {
      unsubTime();
      unsubState();
      unsubEnded();
    };
  }, [currentTrack, isLooping, tracks]);

  // Handle URL hash track sharing (e.g. /#track=track-synth-1984)
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('track=')) {
        const match = hash.match(/track=([^&]+)/);
        if (match && match[1]) {
          const trackId = match[1];
          const found = tracks.find((t) => t.id === trackId);
          if (found) {
            setCurrentTrack(found);
            setDetailTrack(found);
          }
        }
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [tracks]);

  // Playback handlers
  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      audioEngine.pause();
    } else if (currentTrack?.id === track.id) {
      audioEngine.resume();
    } else {
      setCurrentTrack(track);
      setDuration(track.duration);
      audioEngine.playTrack(track);

      // Increment track plays
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, plays: t.plays + 1 } : t))
      );
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack) {
      if (tracks[0]) handlePlayTrack(tracks[0]);
      return;
    }
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.resume();
    }
  };

  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  };

  const handlePreviousTrack = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handlePlayTrack(tracks[prevIndex]);
  };

  const handleNextTrack = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handlePlayTrack(tracks[nextIndex]);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  };

  const handleEqChange = (settings: EqualizerSettings) => {
    setEqSettings(settings);
    audioEngine.setEq(settings);
  };

  const handleToggleLike = (trackId: string) => {
    setLikedTrackIds((prev) => {
      const isLiked = prev.includes(trackId);
      const updated = isLiked ? prev.filter((id) => id !== trackId) : [...prev, trackId];

      setTracks((tList) =>
        tList.map((t) =>
          t.id === trackId
            ? { ...t, likes: Math.max(0, t.likes + (isLiked ? -1 : 1)) }
            : t
        )
      );

      return updated;
    });
  };

  // Add new comment
  const handleAddComment = (
    trackId: string,
    newCommentData: Omit<TrackComment, 'id' | 'createdAt'>
  ) => {
    const comment: TrackComment = {
      ...newCommentData,
      id: `c-${Date.now()}`,
      createdAt: 'Just now',
    };

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const updatedComments = [...t.comments, comment];
          if (detailTrack?.id === trackId) {
            setDetailTrack({ ...t, comments: updatedComments });
          }
          if (currentTrack?.id === trackId) {
            setCurrentTrack({ ...t, comments: updatedComments });
          }
          return { ...t, comments: updatedComments };
        }
        return t;
      })
    );
  };

  // Upload or Beat creation handlers
  const handleAddNewTrack = (newTrack: Track) => {
    setTracks((prev) => [newTrack, ...prev]);
    handlePlayTrack(newTrack);
  };

  const handleCreatePlaylist = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [...prev, newPlaylist]);
  };

  // Filter and sort tracks
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre = selectedGenre === 'All' || track.genre === selectedGenre;

    if (currentTab === 'my-music') {
      return (track.isUserUpload || likedTrackIds.includes(track.id)) && matchesSearch;
    }

    return matchesSearch && matchesGenre;
  });

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'plays') return b.plays - a.plays;
    if (sortBy === 'recent') return b.id.localeCompare(a.id);
    return b.likes - a.likes; // trending default
  });

  const genres = ['All', 'Synthwave', 'Lo-Fi Chill', 'Ambient', 'Indie Electronic', 'Cyberpunk', 'Live Record'];

  // Spotlight featured track
  const heroTrack = tracks[0];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e2e8f0] pb-28 selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Bar following contract */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="w-full">
        {currentTab === 'discover' && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
            {/* Hero Section: Featured Audio Spotlight */}
            {heroTrack && (
              <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#181d2a] via-[#11141d] to-[#0d0f15] p-6 sm:p-10 shadow-2xl">
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                  {/* Left Column: Editorial context & play action */}
                  <div className="max-w-xl text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-amber-400">
                      <Sparkles className="h-4 w-4" />
                      <span>FEATURED OPEN RELEASE</span>
                      <span aria-hidden="true">·</span>
                      <span>{heroTrack.genre}</span>
                    </div>

                    <h1 className="mt-2 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                      {heroTrack.title}
                    </h1>

                    <p className="mt-2 text-sm text-slate-300">
                      by <strong className="text-white">{heroTrack.artist}</strong> ({heroTrack.artistHandle})
                    </p>

                    <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {heroTrack.description}
                    </p>

                    {/* Unboxed metadata with typographic separators */}
                    <div className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-400 font-mono-numbers">
                      <span>{heroTrack.bpm} BPM</span>
                      <span aria-hidden="true">·</span>
                      <span>Key of {heroTrack.musicalKey}</span>
                      <span aria-hidden="true">·</span>
                      <span>{heroTrack.plays.toLocaleString()} plays</span>
                      <span aria-hidden="true">·</span>
                      <span>{heroTrack.likes.toLocaleString()} likes</span>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                      <button
                        onClick={() => handlePlayTrack(heroTrack)}
                        className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-xs font-bold text-stone-950 shadow-lg hover:bg-amber-300 transition-transform active:scale-95"
                      >
                        {isPlaying && currentTrack?.id === heroTrack.id ? (
                          <>
                            <Pause className="h-4 w-4 fill-current" />
                            <span>Pause Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                            <span>Play Track Now</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setDetailTrack(heroTrack)}
                        className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        Discussions & Waveform
                      </button>

                      <button
                        onClick={() => setSharingTrack(heroTrack)}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Share Track"
                      >
                        <Share2 className="h-4 w-4 text-amber-400" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: High-Res Album Art with Live Spectrum Visualizer */}
                  <div className="relative group shrink-0">
                    <img
                      src={heroTrack.coverUrl}
                      alt={heroTrack.title}
                      referrerPolicy="no-referrer"
                      className="h-64 w-64 sm:h-80 sm:w-80 rounded-2xl object-cover shadow-2xl border border-white/15"
                    />

                    {/* Integrated audio spectrum inside hero card */}
                    <div className="mt-3 w-64 sm:w-80">
                      <AudioVisualizer
                        isPlaying={isPlaying && currentTrack?.id === heroTrack.id}
                        height={60}
                        interactive={false}
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Action Cards: Produce & Broadcast */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setIsSonicLabOpen(true)}
                className="flex items-center justify-between p-4.5 rounded-2xl border border-white/10 bg-[#121622] hover:border-amber-400/40 hover:bg-[#151a28] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      Sonic Lab Sequencer
                    </h3>
                    <p className="text-xs text-slate-400">Compose custom 8-channel beats and share instantly</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400">Launch ➔</span>
              </div>

              <div
                onClick={() => setCurrentTab('radio')}
                className="flex items-center justify-between p-4.5 rounded-2xl border border-white/10 bg-[#121622] hover:border-rose-400/40 hover:bg-[#151a28] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform">
                    <Radio className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                      Live 24/7 Radio Room
                    </h3>
                    <p className="text-xs text-slate-400">Listen synchronously with community chat & reactions</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-400">Tune In ➔</span>
              </div>

              <div
                onClick={() => setIsRecorderOpen(true)}
                className="flex items-center justify-between p-4.5 rounded-2xl border border-white/10 bg-[#121622] hover:border-amber-400/40 hover:bg-[#151a28] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      Record Microphone
                    </h3>
                    <p className="text-xs text-slate-400">Capture voice memos, acoustics, or vocals live</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-400">Record ➔</span>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Field */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tracks, artists, genres, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#10141d] pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Sort segmented buttons */}
                <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/5 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => setSortBy('trending')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      sortBy === 'trending' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Trending
                  </button>
                  <button
                    onClick={() => setSortBy('plays')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      sortBy === 'plays' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Most Played
                  </button>
                  <button
                    onClick={() => setSortBy('recent')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      sortBy === 'recent' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Newest
                  </button>
                </div>
              </div>

              {/* Genre Interactive Filter Buttons (adhering to zero-pill discipline section A) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      selectedGenre === g
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Track Catalog Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-white">
                  {selectedGenre === 'All' ? 'All Shared Tracks' : `${selectedGenre} Releases`}
                </h2>
                <span className="text-xs text-slate-400 font-mono-numbers">
                  {sortedTracks.length} tracks available
                </span>
              </div>

              {sortedTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#10131d] py-16 text-center">
                  <Headphones className="h-10 w-10 text-slate-500 mb-3" />
                  <p className="text-sm font-semibold text-white">No tracks match your query</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting your search query or upload the first track!</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenre('All');
                    }}
                    className="mt-4 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-400"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {sortedTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      isPlaying={isPlaying}
                      isCurrent={currentTrack?.id === track.id}
                      currentTime={currentTime}
                      onPlay={handlePlayTrack}
                      onPause={handlePlayPause}
                      onSeek={handleSeek}
                      onOpenDetails={(t) => setDetailTrack(t)}
                      onShare={(t) => setSharingTrack(t)}
                      onLike={handleToggleLike}
                      isLiked={likedTrackIds.includes(track.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Radio Broadcast Room */}
        {currentTab === 'radio' && (
          <LiveRadioRoom
            tracks={tracks}
            currentPlayingTrack={currentTrack}
            isPlaying={isPlaying}
            onTuneIn={handlePlayTrack}
            onOpenDetails={(t) => setDetailTrack(t)}
          />
        )}

        {/* Playlists View */}
        {currentTab === 'playlists' && (
          <PlaylistsView
            playlists={playlists}
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onOpenDetails={(t) => setDetailTrack(t)}
            onCreatePlaylist={handleCreatePlaylist}
          />
        )}

        {/* Sonic Lab Fullscreen View */}
        {currentTab === 'lab' && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Sonic Lab Beatmaker</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Create original beats and step-sequenced electronic music directly in your browser
                </p>
              </div>

              <button
                onClick={() => setIsSonicLabOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-300 shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                <span>Open Sequencer Modal</span>
              </button>
            </div>

            {/* Quick launch card */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#121622] p-8 text-center max-w-2xl mx-auto shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
                <Music className="h-8 w-8" />
              </div>
              <h2 className="font-display text-xl font-bold text-white">Interactive Step Sequencer</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Sequence drums, 808 sub bass, and synthesizer leads. Export high-quality WAV files or share straight to the Resonance community feed for other listeners to enjoy.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setIsSonicLabOpen(true)}
                  className="rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-300 transition-all shadow-md active:scale-95"
                >
                  Launch Sequencer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Music Tab */}
        {currentTab === 'my-music' && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">My Audio Stash</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Your uploaded files, microphone voice notes, created beats, and liked favorites
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecorderOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Mic className="h-3.5 w-3.5 text-rose-400" />
                  <span>Record Voice Take</span>
                </button>

                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-300 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Audio</span>
                </button>
              </div>
            </div>

            {/* My Tracks Grid */}
            <div className="mt-6">
              {sortedTracks.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-[#10131d] p-12 text-center">
                  <Headphones className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white">No tracks in your stash yet</p>
                  <p className="text-xs text-slate-400 mt-1">Upload a track, record a take, or like songs in the discover feed!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {sortedTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      isPlaying={isPlaying}
                      isCurrent={currentTrack?.id === track.id}
                      currentTime={currentTime}
                      onPlay={handlePlayTrack}
                      onPause={handlePlayPause}
                      onSeek={handleSeek}
                      onOpenDetails={(t) => setDetailTrack(t)}
                      onShare={(t) => setSharingTrack(t)}
                      onLike={handleToggleLike}
                      isLiked={likedTrackIds.includes(track.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Docked Player Bar (Persistent Audio Player) */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isLooping={isLooping}
        onPlayPause={handlePlayPause}
        onPrevious={handlePreviousTrack}
        onNext={handleNextTrack}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleLoop={() => setIsLooping(!isLooping)}
        onToggleVisualizer={() => setIsFullscreenVisualizer(!isFullscreenVisualizer)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenDetails={(t) => setDetailTrack(t)}
        onShare={(t) => setSharingTrack(t)}
        onLike={handleToggleLike}
        isLiked={currentTrack ? likedTrackIds.includes(currentTrack.id) : false}
      />

      {/* Fullscreen / Theater Mode Visualizer Modal */}
      {isFullscreenVisualizer && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-6 backdrop-blur-xl animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Theater Audio Visualizer</span>
              <h2 className="font-display text-xl font-bold text-white">
                {currentTrack?.title} — {currentTrack?.artist}
              </h2>
            </div>
            <button
              onClick={() => setIsFullscreenVisualizer(false)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
            >
              Exit Theater View
            </button>
          </div>

          <div className="flex-1 my-6 flex items-center justify-center">
            <AudioVisualizer
              isPlaying={isPlaying}
              isFullscreen={true}
              onToggleFullscreen={() => setIsFullscreenVisualizer(false)}
              interactive={true}
            />
          </div>
        </div>
      )}

      {/* Upload Track Modal */}
      <UploadTrackModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadTrack={handleAddNewTrack}
      />

      {/* Microphone Audio Recorder Modal */}
      <AudioRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onShareTrack={handleAddNewTrack}
      />

      {/* Sonic Lab Step Sequencer Modal */}
      <SonicLabModal
        isOpen={isSonicLabOpen}
        onClose={() => setIsSonicLabOpen(false)}
        onShareTrackToFeed={handleAddNewTrack}
      />

      {/* Share Track Modal */}
      <ShareModal
        track={sharingTrack}
        isOpen={Boolean(sharingTrack)}
        onClose={() => setSharingTrack(null)}
      />

      {/* Studio 5-Band Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        settings={eqSettings}
        onSettingsChange={handleEqChange}
      />

      {/* Track Details & Timestamped Waveform Comments Modal */}
      <TrackDetailModal
        track={detailTrack}
        isOpen={Boolean(detailTrack)}
        onClose={() => setDetailTrack(null)}
        isPlaying={isPlaying && currentTrack?.id === detailTrack?.id}
        currentTime={currentTrack?.id === detailTrack?.id ? currentTime : 0}
        onPlayPause={() => {
          if (detailTrack) handlePlayTrack(detailTrack);
        }}
        onSeek={handleSeek}
        onLike={handleToggleLike}
        isLiked={detailTrack ? likedTrackIds.includes(detailTrack.id) : false}
        onShare={(t) => setSharingTrack(t)}
        onAddComment={handleAddComment}
      />
    </div>
  );
}
