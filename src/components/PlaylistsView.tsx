import React, { useState } from 'react';
import { Playlist, Track } from '../types';
import { ListMusic, Play, Plus, Users } from 'lucide-react';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onOpenDetails: (track: Track) => void;
  onCreatePlaylist: (newPlaylist: Playlist) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenDetails,
  onCreatePlaylist,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(playlists[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];
  const playlistTracks = tracks.filter((t) => selectedPlaylist?.trackIds.includes(t.id));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: Playlist = {
      id: `pl-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Curated user collection on Resonance',
      trackIds: tracks.slice(0, 2).map((t) => t.id),
      coverUrl: tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      author: 'You',
      followers: 1,
    };

    onCreatePlaylist(created);
    setSelectedPlaylistId(created.id);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Community Playlists</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Curated sound journeys shared by independent producers and listeners
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Playlist</span>
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Playlist Cards / Selector */}
        <div className="space-y-3">
          {playlists.map((playlist) => {
            const isSelected = playlist.id === selectedPlaylist?.id;
            return (
              <div
                key={playlist.id}
                onClick={() => setSelectedPlaylistId(playlist.id)}
                className={`flex items-center gap-3.5 rounded-xl border p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <img
                  src={playlist.coverUrl}
                  alt={playlist.title}
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-bold text-white truncate">{playlist.title}</h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{playlist.author}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{playlist.trackIds.length} tracks</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {playlist.followers.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 2 Columns: Selected Playlist Details & Track Listing */}
        {selectedPlaylist && (
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#10141e] p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-white/10 pb-6">
              <img
                src={selectedPlaylist.coverUrl}
                alt={selectedPlaylist.title}
                referrerPolicy="no-referrer"
                className="h-28 w-28 rounded-xl object-cover border border-white/10 shadow-xl"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">Playlist</span>
                <h2 className="font-display text-2xl font-bold text-white mt-1">{selectedPlaylist.title}</h2>
                <p className="text-xs text-slate-400 mt-1">{selectedPlaylist.description}</p>
                <div className="mt-3 flex items-center gap-3">
                  {playlistTracks.length > 0 && (
                    <button
                      onClick={() => onPlayTrack(playlistTracks[0])}
                      className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-300 transition-colors shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Play Playlist</span>
                    </button>
                  )}
                  <span className="text-xs text-slate-400 font-mono-numbers">
                    {playlistTracks.length} tracks
                  </span>
                </div>
              </div>
            </div>

            {/* Track List */}
            <div className="mt-4 divide-y divide-white/5">
              {playlistTracks.map((track, idx) => {
                const isTrackPlaying = isPlaying && currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => onOpenDetails(track)}
                    className="flex items-center justify-between gap-3 py-3 px-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-mono-numbers text-xs text-slate-400 w-5 text-center">
                        {idx + 1}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrack(track);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 transition-colors shrink-0 ${
                          isTrackPlaying ? 'bg-amber-400 text-stone-950' : 'bg-white/5 text-white group-hover:bg-amber-400 group-hover:text-stone-950'
                        }`}
                      >
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {track.artist} <span className="text-slate-400">· {track.genre}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono-numbers shrink-0">
                      <span>{track.bpm} BPM</span>
                      <span>
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141824] p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white">Create New Playlist</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Playlist Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyberpunk Night Highway"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description for listeners..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-white/10 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-400"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
