import { Playlist, Track } from '../types';

import albumSynthwave from '../assets/images/album_synthwave_sunset_1791190654466.jpg';
import albumLofi from '../assets/images/album_lofi_rainy_cafe_1791190664237.jpg';
import albumAmbient from '../assets/images/album_cyber_ambient_depths_1791190674128.jpg';
import albumIndie from '../assets/images/album_indie_electronic_pulse_1791190684605.jpg';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-synth-1984',
    title: 'Neon Horizon 1984',
    artist: 'Kavinsky Drift',
    artistHandle: '@kavinsky_drift',
    artistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    coverUrl: albumSynthwave,
    duration: 194, // 3:14
    genre: 'Synthwave',
    bpm: 120,
    musicalKey: 'A Minor',
    synthConfig: {
      type: 'synthwave',
      bpm: 120,
      rootFreq: 220,
      scale: [0, 3, 5, 7, 10],
      patternLength: 4,
    },
    plays: 14280,
    likes: 1845,
    reposts: 342,
    createdAt: '2 hours ago',
    description: 'Analog brass chords, rolling 16th bassline, and gated 80s drums captured through vintage tape saturation. Created for late night highway drives.',
    tags: ['retrowave', 'synth', 'outrun', 'nightdrive', '80s'],
    waveformPeaks: [
      0.2, 0.45, 0.6, 0.55, 0.8, 0.92, 0.75, 0.65, 0.88, 0.95, 0.7, 0.6, 0.45, 0.8, 0.9, 0.75,
      0.82, 0.88, 0.7, 0.55, 0.4, 0.35, 0.65, 0.85, 0.9, 0.78, 0.65, 0.8, 0.95, 0.88, 0.7, 0.6,
      0.5, 0.65, 0.75, 0.85, 0.9, 0.95, 0.8, 0.7, 0.6, 0.85, 0.9, 0.75, 0.6, 0.45, 0.35, 0.25,
      0.55, 0.75, 0.88, 0.92, 0.85, 0.7, 0.65, 0.8, 0.85, 0.7, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1
    ],
    comments: [
      {
        id: 'c-1',
        author: 'Elena R.',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        timestampSeconds: 16,
        text: 'That bassline transition right here is so smooth!',
        createdAt: '40m ago'
      },
      {
        id: 'c-2',
        author: 'Marcus Vance',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        timestampSeconds: 64,
        text: 'The gated reverb on that snare is authentic 1984 gold.',
        createdAt: '1h ago'
      },
      {
        id: 'c-3',
        author: 'Synthetica',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        timestampSeconds: 128,
        text: 'Shared this to our synth community discord! Masterpiece.',
        createdAt: '2h ago'
      }
    ]
  },
  {
    id: 'track-lofi-rain',
    title: 'Midnight Tokyo Rain',
    artist: 'Sora & Teahouse',
    artistHandle: '@sora_beats',
    artistAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    coverUrl: albumLofi,
    duration: 168, // 2:48
    genre: 'Lo-Fi Chill',
    bpm: 84,
    musicalKey: 'C# Minor',
    synthConfig: {
      type: 'lofi',
      bpm: 84,
      rootFreq: 138.59,
      scale: [0, 3, 7, 10, 14],
      patternLength: 4,
    },
    plays: 28910,
    likes: 4120,
    reposts: 789,
    createdAt: '5 hours ago',
    description: 'Cozy Rhodes electric piano chords recorded with subtle vinyl warmth, rainy city atmosphere, and swing boom-bap percussion for late night coding.',
    tags: ['lofi', 'chillhop', 'study', 'rain', 'relax'],
    waveformPeaks: [
      0.15, 0.25, 0.35, 0.45, 0.5, 0.48, 0.52, 0.55, 0.42, 0.5, 0.58, 0.6, 0.52, 0.45, 0.5, 0.55,
      0.62, 0.58, 0.48, 0.42, 0.38, 0.45, 0.5, 0.55, 0.6, 0.58, 0.5, 0.45, 0.52, 0.6, 0.55, 0.48,
      0.45, 0.5, 0.55, 0.62, 0.58, 0.52, 0.48, 0.5, 0.58, 0.62, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3,
      0.38, 0.45, 0.52, 0.58, 0.55, 0.5, 0.48, 0.52, 0.5, 0.42, 0.35, 0.28, 0.2, 0.18, 0.15, 0.1
    ],
    comments: [
      {
        id: 'c-4',
        author: 'Aiko Tanaka',
        authorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
        timestampSeconds: 12,
        text: 'The rain samples with the electric piano chords are giving pure serenity.',
        createdAt: '3h ago'
      },
      {
        id: 'c-5',
        author: 'DevLiam',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        timestampSeconds: 52,
        text: 'Studying for my software finals with this on repeat!',
        createdAt: '4h ago'
      }
    ]
  },
  {
    id: 'track-ambient-depths',
    title: 'Deep Ocean Bioluminescence',
    artist: 'Abyssal Frequencies',
    artistHandle: '@abyssal_lab',
    artistAvatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&auto=format&fit=crop&q=80',
    coverUrl: albumAmbient,
    duration: 240, // 4:00
    genre: 'Ambient',
    bpm: 65,
    musicalKey: 'F Major',
    synthConfig: {
      type: 'ambient',
      bpm: 65,
      rootFreq: 87.31,
      scale: [0, 4, 7, 9, 12],
      patternLength: 8,
    },
    plays: 8750,
    likes: 1240,
    reposts: 198,
    createdAt: '1 day ago',
    description: 'Sub-bass ocean current drones, glistening acoustic crystal chimes, and deep generative soundscapes designed for meditation and focus.',
    tags: ['ambient', 'meditation', 'soundscape', 'drone', 'sleep'],
    waveformPeaks: [
      0.1, 0.15, 0.2, 0.28, 0.35, 0.42, 0.4, 0.45, 0.5, 0.48, 0.42, 0.46, 0.5, 0.52, 0.48, 0.44,
      0.4, 0.38, 0.42, 0.45, 0.48, 0.52, 0.5, 0.45, 0.4, 0.44, 0.48, 0.5, 0.46, 0.42, 0.4, 0.38,
      0.42, 0.46, 0.5, 0.52, 0.48, 0.44, 0.4, 0.38, 0.35, 0.4, 0.44, 0.46, 0.42, 0.38, 0.35, 0.32,
      0.3, 0.34, 0.38, 0.4, 0.38, 0.35, 0.32, 0.3, 0.28, 0.25, 0.22, 0.2, 0.18, 0.15, 0.12, 0.08
    ],
    comments: [
      {
        id: 'c-6',
        author: 'Nadia Sol',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        timestampSeconds: 30,
        text: 'The spatial depth on headphones is breathtaking.',
        createdAt: '18h ago'
      }
    ]
  },
  {
    id: 'track-indie-pulse',
    title: 'Prism Pulse',
    artist: 'Solaris Wave',
    artistHandle: '@solariswave',
    artistAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
    coverUrl: albumIndie,
    duration: 176, // 2:56
    genre: 'Indie Electronic',
    bpm: 124,
    musicalKey: 'D Minor',
    synthConfig: {
      type: 'indie',
      bpm: 124,
      rootFreq: 293.66,
      scale: [0, 2, 3, 5, 7, 9, 10],
      patternLength: 4,
    },
    plays: 19230,
    likes: 2740,
    reposts: 512,
    createdAt: '2 days ago',
    description: 'Crisp syncopated percussion, sparkling arpeggios, and driving synth bass with uplifting harmonic transitions.',
    tags: ['indie', 'electronic', 'club', 'dance', 'melodic'],
    waveformPeaks: [
      0.25, 0.45, 0.65, 0.8, 0.72, 0.85, 0.9, 0.78, 0.82, 0.88, 0.75, 0.65, 0.78, 0.88, 0.92, 0.85,
      0.75, 0.68, 0.8, 0.9, 0.85, 0.72, 0.6, 0.75, 0.85, 0.9, 0.82, 0.7, 0.62, 0.78, 0.88, 0.95,
      0.82, 0.7, 0.6, 0.75, 0.85, 0.92, 0.8, 0.72, 0.65, 0.8, 0.9, 0.85, 0.75, 0.6, 0.5, 0.4,
      0.6, 0.75, 0.85, 0.9, 0.82, 0.7, 0.6, 0.55, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1
    ],
    comments: [
      {
        id: 'c-7',
        author: 'Julian Cole',
        authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
        timestampSeconds: 24,
        text: 'Instantly added to my running playlist!',
        createdAt: '1d ago'
      },
      {
        id: 'c-8',
        author: 'Freya M.',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        timestampSeconds: 88,
        text: 'This drop is insane! How did you craft that vocal chop effect?',
        createdAt: '1d ago'
      }
    ]
  }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-featured',
    title: 'Internet Underground Staff Picks',
    description: 'The finest handcrafted audio shared by creators worldwide this week.',
    trackIds: ['track-synth-1984', 'track-lofi-rain', 'track-indie-pulse', 'track-ambient-depths'],
    coverUrl: albumSynthwave,
    author: 'Resonance Editorial',
    followers: 4890
  },
  {
    id: 'pl-lofi',
    title: 'Midnight Coding & Coffee',
    description: 'Deep focus beats, gentle crackle, warm analog Rhodes and acoustic rain.',
    trackIds: ['track-lofi-rain', 'track-ambient-depths'],
    coverUrl: albumLofi,
    author: 'Sora & Friends',
    followers: 12400
  },
  {
    id: 'pl-synthwave',
    title: 'Outrun & Cyber Sunset',
    description: 'High energy arps, 80s drums and neon horizons.',
    trackIds: ['track-synth-1984', 'track-indie-pulse'],
    coverUrl: albumIndie,
    author: 'Kavinsky Drift',
    followers: 8320
  }
];
