import {
  CountdownSeconds,
  FrameCategory,
  FrameThemeOption,
  PhotoFilterOption,
  RetouchStrength,
  StripLayoutId,
} from '../types/photobooth';

export const COLOR_SAMPLE_PORTRAITS: string[] = [
  '/src/assets/images/color_sample_one_1794812848730.jpg',
  '/src/assets/images/color_sample_two_1794812849582.jpg',
  '/src/assets/images/color_sample_three_1794812849320.jpg',
  '/src/assets/images/color_sample_four_1794812849790.jpg',
];

export const MONO_SAMPLE_PORTRAITS: string[] = [
  '/src/assets/images/sample_cut_one_1794812474561.jpg',
  '/src/assets/images/sample_cut_two_1794812474919.jpg',
  '/src/assets/images/sample_cut_three_1794812475168.jpg',
  '/src/assets/images/sample_cut_four_1794812475625.jpg',
];

// 10 diverse studio shots (color + mono) for instant 10-cut selection demo
export const SAMPLE_TEN_SHOTS: string[] = [
  COLOR_SAMPLE_PORTRAITS[0],
  COLOR_SAMPLE_PORTRAITS[1],
  COLOR_SAMPLE_PORTRAITS[2],
  COLOR_SAMPLE_PORTRAITS[3],
  MONO_SAMPLE_PORTRAITS[0],
  MONO_SAMPLE_PORTRAITS[1],
  MONO_SAMPLE_PORTRAITS[2],
  MONO_SAMPLE_PORTRAITS[3],
  COLOR_SAMPLE_PORTRAITS[1],
  COLOR_SAMPLE_PORTRAITS[3],
];

export const FRAME_CATEGORIES: { id: FrameCategory; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'mono', label: '모노·미니멀' },
  { id: 'color', label: '컬러·파스텔' },
  { id: 'pattern', label: '패턴·Y2K' },
  { id: 'editorial', label: '필름·에디토리얼' },
];

export const FRAME_THEMES: FrameThemeOption[] = [
  // Mono / Minimal
  {
    id: 'jet-black',
    name: '제트 블랙',
    category: 'mono',
    bgHex: '#09090B',
    textHex: '#FFFFFF',
    mutedHex: '#71717A',
    slotBorderHex: 'rgba(255, 255, 255, 0.08)',
    patternType: 'solid',
    swatchStyle: 'background: #09090B',
  },
  {
    id: 'pure-white',
    name: '퓨어 화이트',
    category: 'mono',
    bgHex: '#FFFFFF',
    textHex: '#09090B',
    mutedHex: '#71717A',
    slotBorderHex: 'rgba(9, 9, 11, 0.08)',
    patternType: 'solid',
    swatchStyle: 'background: #FFFFFF',
  },
  {
    id: 'studio-gray',
    name: '스튜디오 그레이',
    category: 'mono',
    bgHex: '#27272A',
    textHex: '#FAFAFA',
    mutedHex: '#A1A1AA',
    slotBorderHex: 'rgba(255, 255, 255, 0.1)',
    patternType: 'solid',
    swatchStyle: 'background: #27272A',
  },
  {
    id: 'warm-paper',
    name: '웜 페이퍼',
    category: 'mono',
    bgHex: '#F3F2EE',
    textHex: '#141413',
    mutedHex: '#73726E',
    slotBorderHex: 'rgba(20, 20, 19, 0.08)',
    patternType: 'solid',
    swatchStyle: 'background: #F3F2EE',
  },

  // Color / Pastel (Haru Film, Life4Cuts, Photoism Inspired)
  {
    id: 'haru-sky',
    name: '하루 스카이',
    category: 'color',
    bgHex: '#CBE8FA',
    bgSecondaryHex: '#EAF6FF',
    textHex: '#1E3A5F',
    mutedHex: '#52739A',
    slotBorderHex: 'rgba(30, 58, 95, 0.08)',
    patternType: 'gradient',
    swatchStyle: 'background: linear-gradient(180deg, #CBE8FA 0%, #EAF6FF 100%)',
  },
  {
    id: 'blush-pink',
    name: '블러쉬 핑크',
    category: 'color',
    bgHex: '#FADCE4',
    bgSecondaryHex: '#FFF0F4',
    textHex: '#4A1D2B',
    mutedHex: '#8C5264',
    slotBorderHex: 'rgba(74, 29, 43, 0.08)',
    patternType: 'gradient',
    swatchStyle: 'background: linear-gradient(180deg, #FADCE4 0%, #FFF0F4 100%)',
  },
  {
    id: 'butter-cream',
    name: '버터 크림',
    category: 'color',
    bgHex: '#FDF1C7',
    bgSecondaryHex: '#FFF9E5',
    textHex: '#3F2E12',
    mutedHex: '#7E6A44',
    slotBorderHex: 'rgba(63, 46, 18, 0.08)',
    patternType: 'gradient',
    swatchStyle: 'background: linear-gradient(180deg, #FDF1C7 0%, #FFF9E5 100%)',
  },
  {
    id: 'lavender-haze',
    name: '라벤더 헤이즈',
    category: 'color',
    bgHex: '#E5DCFA',
    bgSecondaryHex: '#F4F0FF',
    textHex: '#2E1F4F',
    mutedHex: '#695891',
    slotBorderHex: 'rgba(46, 31, 79, 0.08)',
    patternType: 'gradient',
    swatchStyle: 'background: linear-gradient(180deg, #E5DCFA 0%, #F4F0FF 100%)',
  },
  {
    id: 'cobalt-pop',
    name: '코발트 팝',
    category: 'color',
    bgHex: '#1D4ED8',
    textHex: '#FFFFFF',
    mutedHex: '#BFDBFE',
    slotBorderHex: 'rgba(255, 255, 255, 0.14)',
    patternType: 'solid',
    swatchStyle: 'background: #1D4ED8',
  },
  {
    id: 'cherry-red',
    name: '체리 레드',
    category: 'color',
    bgHex: '#B91C1C',
    textHex: '#FFFFFF',
    mutedHex: '#FECACA',
    slotBorderHex: 'rgba(255, 255, 255, 0.14)',
    patternType: 'solid',
    swatchStyle: 'background: #B91C1C',
  },
  {
    id: 'forest-sage',
    name: '포레스트 세이지',
    category: 'color',
    bgHex: '#1B3B2B',
    textHex: '#F3F7F4',
    mutedHex: '#9BB5A6',
    slotBorderHex: 'rgba(255, 255, 255, 0.1)',
    patternType: 'solid',
    swatchStyle: 'background: #1B3B2B',
  },

  // Pattern & Y2K
  {
    id: 'checker-bw',
    name: '모노 체커보드',
    category: 'pattern',
    bgHex: '#09090B',
    bgSecondaryHex: '#FFFFFF',
    textHex: '#FFFFFF',
    mutedHex: '#D4D4D8',
    slotBorderHex: '#09090B',
    patternType: 'checker',
    swatchStyle:
      'background: conic-gradient(#111 90deg, #fff 90deg 180deg, #111 180deg 270deg, #fff 270deg); background-size: 10px 10px',
  },
  {
    id: 'checker-pastel',
    name: '민트 체커',
    category: 'pattern',
    bgHex: '#B8E8D8',
    bgSecondaryHex: '#FFFDF7',
    textHex: '#133B2E',
    mutedHex: '#3B6E5D',
    slotBorderHex: 'rgba(19, 59, 46, 0.14)',
    patternType: 'checker',
    swatchStyle:
      'background: conic-gradient(#B8E8D8 90deg, #FFFDF7 90deg 180deg, #B8E8D8 180deg 270deg, #FFFDF7 270deg); background-size: 10px 10px',
  },
  {
    id: 'polka-dot',
    name: '블랙 도트',
    category: 'pattern',
    bgHex: '#0C0C0E',
    bgSecondaryHex: 'rgba(255,255,255,0.22)',
    textHex: '#FFFFFF',
    mutedHex: '#A1A1AA',
    slotBorderHex: 'rgba(255, 255, 255, 0.14)',
    patternType: 'dots',
    swatchStyle:
      'background: radial-gradient(#fff 22%, transparent 23%) #0C0C0E; background-size: 8px 8px',
  },
  {
    id: 'y2k-chrome',
    name: 'Y2K 실버 크롬',
    category: 'pattern',
    bgHex: '#D4D7DD',
    bgSecondaryHex: '#8E95A2',
    textHex: '#0F172A',
    mutedHex: '#334155',
    slotBorderHex: '#FFFFFF',
    patternType: 'y2k-chrome',
    swatchStyle: 'background: linear-gradient(135deg, #F8FAFC 0%, #94A3B8 55%, #E2E8F0 100%)',
  },

  // Film & Editorial
  {
    id: 'film-roll',
    name: '35mm 필름 롤',
    category: 'editorial',
    bgHex: '#0B0B0C',
    bgSecondaryHex: '#1C1C1E',
    textHex: '#F4F4F5',
    mutedHex: '#EAB308',
    slotBorderHex: 'rgba(255, 255, 255, 0.12)',
    patternType: 'film-sprocket',
    swatchStyle: 'background: #0B0B0C; border: 2px dashed #52525B',
  },
  {
    id: 'editorial-press',
    name: '모노 매거진',
    category: 'editorial',
    bgHex: '#FAF9F6',
    bgSecondaryHex: '#111111',
    textHex: '#111111',
    mutedHex: '#52525B',
    slotBorderHex: '#111111',
    patternType: 'editorial',
    swatchStyle: 'background: #FAF9F6; border: 2px solid #111111',
  },
];

export const PHOTO_FILTERS: PhotoFilterOption[] = [
  {
    id: 'original',
    name: '내추럴 컬러',
    group: 'color',
    cssFilter: 'none',
  },
  {
    id: 'bright-color',
    name: '퓨어 브라이트',
    group: 'color',
    cssFilter: 'brightness(106%) contrast(103%) saturate(108%)',
  },
  {
    id: 'film-color',
    name: '코닥 필름',
    group: 'color',
    cssFilter: 'contrast(105%) brightness(101%) saturate(92%) sepia(14%)',
  },
  {
    id: 'cool-sky',
    name: '쿨 스카이',
    group: 'color',
    cssFilter: 'brightness(105%) contrast(98%) saturate(94%) hue-rotate(-4deg)',
  },
  {
    id: 'noir',
    name: '느와르 흑백',
    group: 'mono',
    cssFilter: 'grayscale(100%) contrast(122%) brightness(98%)',
  },
  {
    id: 'silver',
    name: '실버 모노',
    group: 'mono',
    cssFilter: 'grayscale(100%) contrast(104%) brightness(107%)',
  },
];

export const RETOUCH_LEVELS: {
  level: RetouchStrength;
  label: string;
  desc: string;
}[] = [
  { level: 1, label: '1단계', desc: '자연스러운 톤 정리' },
  { level: 2, label: '2단계', desc: '스튜디오 화사함' },
  { level: 3, label: '3단계', desc: '하이엔드 뽀샤시' },
];

export const LAYOUT_OPTIONS: {
  id: StripLayoutId;
  label: string;
  ratioText: string;
}[] = [
  { id: '1x4', label: '1×4 클래식 스트립', ratioText: '세로형 4컷' },
  { id: '2x2', label: '2×2 그리드 포토', ratioText: '엽서형 4컷' },
];

export const TIMER_OPTIONS: { value: CountdownSeconds; label: string }[] = [
  { value: 0, label: '즉시' },
  { value: 3, label: '3초' },
  { value: 5, label: '5초' },
  { value: 10, label: '10초' },
];
