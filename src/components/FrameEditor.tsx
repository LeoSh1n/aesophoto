import { useEffect, useState } from 'react';
import { Check, Download, Eye, MessageSquarePlus, Printer, Sparkles, Wand2 } from 'lucide-react';
import {
  FRAME_CATEGORIES,
  FRAME_THEMES,
  LAYOUT_OPTIONS,
  PHOTO_FILTERS,
  RETOUCH_LEVELS,
} from '../constants/studioPresets';
import { FrameCategory, StripConfig } from '../types/photobooth';
import {
  formatStudioDate,
  renderPrintableSheetDataUrl,
  renderStripDataUrl,
} from '../utils/stripRenderer';

interface FrameEditorProps {
  cuts: (string | null)[];
  config: StripConfig;
  setConfig: React.Dispatch<React.SetStateAction<StripConfig>>;
  onSaveToArchive: (dataUrl: string) => void;
  onPrintStrip: (stripDataUrl: string) => void;
  onPostToGuestbook: (stripDataUrl: string) => void;
  onLoadSamples: () => void;
}

export function FrameEditor({
  cuts,
  config,
  setConfig,
  onSaveToArchive,
  onPrintStrip,
  onPostToGuestbook,
  onLoadSamples,
}: FrameEditorProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FrameCategory>('all');
  const [compareOriginal, setCompareOriginal] = useState(false);

  const filledCount = cuts.filter(Boolean).length;

  const filteredFrames =
    activeCategory === 'all'
      ? FRAME_THEMES
      : FRAME_THEMES.filter((t) => t.category === activeCategory);

  useEffect(() => {
    let active = true;
    setIsRendering(true);

    const effectiveConfig: StripConfig = compareOriginal
      ? {
          ...config,
          retouch: { ...config.retouch, enabled: false },
          filter: 'original',
        }
      : config;

    const renderPreview = async () => {
      try {
        const url =
          effectiveConfig.layout === '1x4' && effectiveConfig.doublePrintSheet
            ? await renderPrintableSheetDataUrl(cuts, effectiveConfig)
            : await renderStripDataUrl(cuts, effectiveConfig);
        if (active) {
          setPreviewUrl(url);
        }
      } catch {
        // Ignore transient render errors
      } finally {
        if (active) {
          setIsRendering(false);
        }
      }
    };

    renderPreview();
    return () => {
      active = false;
    };
  }, [cuts, config, compareOriginal]);

  const handleDownloadPng = async () => {
    const finalUrl = await renderStripDataUrl(cuts, config);
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(
      2,
      '0'
    )}${String(now.getMinutes()).padStart(2, '0')}${String(
      now.getSeconds()
    ).padStart(2, '0')}`;

    const link = document.createElement('a');
    link.href = finalUrl;
    link.download = `aesophoto-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onSaveToArchive(finalUrl);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2200);
  };

  const handleDirectPrint = async () => {
    const singleUrl = await renderStripDataUrl(cuts, config);
    onSaveToArchive(singleUrl);
    onPrintStrip(singleUrl);
  };

  const handleSendToGuestbook = async () => {
    const singleUrl = await renderStripDataUrl(cuts, config);
    onSaveToArchive(singleUrl);
    onPostToGuestbook(singleUrl);
  };

  return (
    <section id="editor" className="no-print border-b border-white/10 py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Section Heading */}
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-zinc-400">
              02. AI 보정 · 프레임 편집 및 인화
            </p>
            <h2 className="font-display mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-white text-balance">
              17가지 인기 프레임과 AI 자동 보정을 조합하세요
            </h2>
          </div>
          {filledCount === 0 && (
            <button
              type="button"
              onClick={onLoadSamples}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-white/20 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              샘플 사진 불러오기
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
          {/* Left: High-Res Strip Preview Stage */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0B0B0D] p-6 md:p-8 min-h-[540px]">
            {filledCount > 0 && (
              <div className="mb-4 flex w-full items-center justify-between">
                <span className="text-xs font-mono-tabular text-zinc-400">
                  {compareOriginal
                    ? '보정 전 원본 미리보기'
                    : config.retouch.enabled
                    ? `AI 보정 ${config.retouch.strength}단계 적용`
                    : 'AI 보정 OFF'}
                </span>
                <button
                  type="button"
                  onClick={() => setCompareOriginal((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    compareOriginal
                      ? 'border-white bg-white text-black'
                      : 'border-white/15 text-zinc-300 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {compareOriginal ? '편집본 보기' : '보정 전 비교'}
                </button>
              </div>
            )}

            {previewUrl ? (
              <div className="relative flex items-center justify-center w-full">
                <img
                  src={previewUrl}
                  alt="aesophoto 네컷사진 미리보기"
                  className={`max-h-[600px] w-auto object-contain shadow-[0_24px_60px_rgba(0,0,0,0.85)] transition-opacity duration-150 ${
                    isRendering ? 'opacity-70' : 'opacity-100'
                  }`}
                />
              </div>
            ) : (
              <div className="text-sm text-zinc-500">
                프레임 미리보기를 생성 중입니다...
              </div>
            )}

            <p className="mt-5 text-xs text-zinc-500 font-mono-tabular">
              {config.layout === '1x4'
                ? config.doublePrintSheet
                  ? '인화용 2컷 절취 시트 · 2096 × 3176 px'
                  : '고화질 PNG · 1000 × 3080 px'
                : '고화질 PNG · 1600 × 1460 px'}
            </p>
          </div>

          {/* Right: Editorial Controls */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-white/10">
            {/* 1. AI Auto Retouch Controls */}
            <div className="pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-white" />
                  <h3 className="text-xs font-semibold tracking-wide text-zinc-200">
                    AI 자동 보정
                  </h3>
                </div>

                <div className="flex items-center rounded-lg border border-white/10 bg-[#050505] p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        retouch: { ...prev.retouch, enabled: false },
                      }))
                    }
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      !config.retouch.enabled
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    OFF
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        retouch: { ...prev.retouch, enabled: true },
                      }))
                    }
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      config.retouch.enabled
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    ON
                  </button>
                </div>
              </div>

              {config.retouch.enabled ? (
                <div className="grid grid-cols-3 gap-2.5">
                  {RETOUCH_LEVELS.map((item) => {
                    const active = config.retouch.strength === item.level;
                    return (
                      <button
                        key={item.level}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            retouch: { ...prev.retouch, strength: item.level },
                          }))
                        }
                        className={`flex flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-white bg-white text-black'
                            : 'border-white/10 bg-[#0E0E10] text-white hover:border-white/30'
                        }`}
                      >
                        <span className="text-xs font-bold whitespace-nowrap">
                          {item.label}
                        </span>
                        <span
                          className={`mt-0.5 text-[11px] ${
                            active ? 'text-zinc-700' : 'text-zinc-400'
                          }`}
                        >
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  AI 자동 보정이 꺼져 있어 촬영된 원본 톤 그대로 합성됩니다.
                </p>
              )}
            </div>

            {/* 2. Layout Selector */}
            <div className="py-6">
              <h3 className="text-xs font-semibold tracking-wide text-zinc-300 mb-3">
                레이아웃
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {LAYOUT_OPTIONS.map((opt) => {
                  const active = config.layout === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, layout: opt.id }))
                      }
                      className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-[#0E0E10] text-white hover:border-white/30'
                      }`}
                    >
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {opt.label}
                      </span>
                      <span
                        className={`mt-0.5 text-xs ${
                          active ? 'text-zinc-700' : 'text-zinc-400'
                        }`}
                      >
                        {opt.ratioText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Rich Frame Collection (17 Frames across 4 Categories) */}
            <div className="py-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-zinc-300">
                  프레임 디자인 ({FRAME_THEMES.length}종)
                </h3>
                <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#050505] p-1">
                  {FRAME_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-white text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredFrames.map((theme) => {
                  const active = config.frameTheme === theme.id;
                  const swatchCssProps: Record<string, string> = {};
                  theme.swatchStyle.split(';').forEach((rule) => {
                    const [k, v] = rule.split(':');
                    if (k && v) {
                      const camelKey = k
                        .trim()
                        .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                      swatchCssProps[camelKey] = v.trim();
                    }
                  });

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, frameTheme: theme.id }))
                      }
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-white bg-white/12 text-white ring-1 ring-white'
                          : 'border-white/10 bg-[#0E0E10] text-zinc-300 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <span
                        style={swatchCssProps}
                        className="h-5 w-5 shrink-0 rounded-md border border-white/20"
                      />
                      <span className="text-xs font-medium whitespace-nowrap truncate">
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Color & Mono Filters */}
            <div className="py-6">
              <h3 className="text-xs font-semibold tracking-wide text-zinc-300 mb-3">
                컬러 · 흑백 필터
              </h3>
              <div className="flex flex-wrap gap-2">
                {PHOTO_FILTERS.map((filter) => {
                  const active = config.filter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, filter: filter.id }))
                      }
                      className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-[#0E0E10] text-zinc-300 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {filter.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Stamp & Custom Caption */}
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-zinc-300">
                    하단 스탬프 및 문구
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    오늘 날짜({formatStudioDate()})와 짧은 메모를 프레임에 새깁니다
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, showDate: !prev.showDate }))
                  }
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    config.showDate
                      ? 'border-white bg-white text-black'
                      : 'border-white/15 text-zinc-400 hover:text-white'
                  }`}
                >
                  {config.showDate ? '날짜 표시 켜짐' : '날짜 숨김'}
                </button>
              </div>

              <input
                type="text"
                maxLength={28}
                value={config.caption}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, caption: e.target.value }))
                }
                placeholder="프레임 하단 문구 입력 (예: SEOUL STUDIO)"
                className="w-full rounded-xl border border-white/15 bg-[#0E0E10] px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
              />

              {config.layout === '1x4' && (
                <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0E0E10] px-4 py-3 cursor-pointer">
                  <div>
                    <span className="block text-xs font-semibold text-white">
                      2컷 나란히 인화용 시트
                    </span>
                    <span className="block text-[11px] text-zinc-400">
                      인화 시 동일한 세로 스트립 2장을 한 용지에 배치해 절취선을 표시합니다
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.doublePrintSheet}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        doublePrintSheet: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-white cursor-pointer"
                  />
                </label>
              )}
            </div>

            {/* 6. Download & Direct Print Actions */}
            <div className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={filledCount === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                >
                  {savedFeedback ? (
                    <>
                      <Check className="h-4 w-4" />
                      저장 완료
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      이미지 저장 (PNG)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDirectPrint}
                  disabled={filledCount === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-[#0E0E10] px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  프린터 인화 연동
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendToGuestbook}
                disabled={filledCount === 0}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#0B0B0D] px-5 py-3 text-xs font-semibold text-zinc-200 hover:border-white/35 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                이 사진으로 방명록 남기기
              </button>

              <p className="mt-3 text-xs text-zinc-500">
                프린터 인화 연동을 누르면 4×6 인화지·A4·2×6 규격 선택 후 연결된 프린터로 즉시 출력됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
