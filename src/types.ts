export type Genre = 
  | 'Synthwave'
  | 'Lo-Fi Chill'
  | 'Cyberpunk'
  | 'Ambient'
  | 'Indie Electronic'
  | 'Neo-Classical'
  | 'Chiptune'
  | 'Live Record';

export interface TrackComment {
  id: string;
  author: string;
  authorAvatar: string;
  timestampSeconds: number; // point in the track where comment was left
  text: string;
  createdAt: string;
}

export interface SynthTrackConfig {
  type: 'synthwave' | 'lofi' | 'ambient' | 'indie' | 'chiptune';
  bpm: number;
  rootFreq: number; // fundamental note frequency
  scale: number[]; // semitone intervals
  patternLength: number; // bars
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistHandle: string;
  artistAvatar: string;
  coverUrl: string;
  duration: number; // in seconds
  genre: Genre;
  audioBlobUrl?: string; // For recorded or uploaded audio
  synthConfig?: SynthTrackConfig; // For procedural Web Audio synth
  stepSequencerData?: number[][]; // For Sonic Lab generated beats
  plays: number;
  likes: number;
  reposts: number;
  createdAt: string;
  description: string;
  bpm: number;
  musicalKey: string;
  waveformPeaks: number[]; // 60-80 normalized amplitude points (0.05 - 1.0)
  comments: TrackComment[];
  isUserUpload?: boolean;
  tags: string[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  coverUrl: string;
  author: string;
  followers: number;
}

export interface RadioChatMessage {
  id: string;
  user: string;
  userAvatar: string;
  text: string;
  time: string;
  isDj?: boolean;
}

export interface EqualizerSettings {
  low: number; // 60Hz (-12 to 12)
  lowMid: number; // 250Hz (-12 to 12)
  mid: number; // 1000Hz (-12 to 12)
  highMid: number; // 4000Hz (-12 to 12)
  high: number; // 12000Hz (-12 to 12)
  presetName: string;
}
