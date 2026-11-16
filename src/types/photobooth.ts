export type StripLayoutId = '1x4' | '2x2';

export type ShootMode = '10-pick-4' | '4-direct';

export type FrameCategory = 'all' | 'mono' | 'color' | 'pattern' | 'editorial';

export type FrameThemeId =
  | 'jet-black'
  | 'pure-white'
  | 'studio-gray'
  | 'warm-paper'
  | 'haru-sky'
  | 'blush-pink'
  | 'butter-cream'
  | 'lavender-haze'
  | 'cobalt-pop'
  | 'cherry-red'
  | 'forest-sage'
  | 'checker-bw'
  | 'checker-pastel'
  | 'polka-dot'
  | 'y2k-chrome'
  | 'film-roll'
  | 'editorial-press';

export type PhotoFilterId =
  | 'original'
  | 'bright-color'
  | 'film-color'
  | 'cool-sky'
  | 'noir'
  | 'silver';

export type CountdownSeconds = 0 | 3 | 5 | 10;

export type RetouchStrength = 1 | 2 | 3;

export interface RetouchConfig {
  enabled: boolean;
  strength: RetouchStrength;
}

export type FramePatternType =
  | 'solid'
  | 'gradient'
  | 'checker'
  | 'dots'
  | 'film-sprocket'
  | 'y2k-chrome'
  | 'editorial';

export interface FrameThemeOption {
  id: FrameThemeId;
  name: string;
  category: Exclude<FrameCategory, 'all'>;
  bgHex: string;
  bgSecondaryHex?: string;
  textHex: string;
  mutedHex: string;
  slotBorderHex: string;
  patternType: FramePatternType;
  swatchStyle: string;
}

export interface PhotoFilterOption {
  id: PhotoFilterId;
  name: string;
  group: 'color' | 'mono';
  cssFilter: string;
}

export interface StripConfig {
  layout: StripLayoutId;
  frameTheme: FrameThemeId;
  filter: PhotoFilterId;
  retouch: RetouchConfig;
  showDate: boolean;
  caption: string;
  doublePrintSheet: boolean;
}

export interface SavedStripRecord {
  id: string;
  createdAt: string;
  layout: StripLayoutId;
  frameTheme: FrameThemeId;
  filter: PhotoFilterId;
  caption: string;
  dataUrl: string;
}

export type PaperSizeId = '4x6' | 'a4' | '2x6';

export interface PrintSettings {
  paperSize: PaperSizeId;
  copies: number;
  showCropMarks: boolean;
}

export interface GuestbookEntry {
  id: string;
  author: string;
  message: string;
  tag: string;
  createdAt: string;
  photoDataUrl?: string;
}
