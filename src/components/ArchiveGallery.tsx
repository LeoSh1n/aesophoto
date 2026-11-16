import { useEffect, useState } from 'react';
import { Download, Maximize2, Printer, Trash2, X } from 'lucide-react';
import { FRAME_THEMES, PHOTO_FILTERS } from '../constants/studioPresets';
import { SavedStripRecord } from '../types/photobooth';

interface ArchiveGalleryProps {
  records: SavedStripRecord[];
  onDeleteRecord: (id: string) => void;
  onPrintDataUrl: (dataUrl: string) => void;
}

export function ArchiveGallery({
  records,
  onDeleteRecord,
  onPrintDataUrl,
}: ArchiveGalleryProps) {
  const [lightboxRecord, setLightboxRecord] = useState<SavedStripRecord | null>(
    null
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxRecord(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getThemeLabel = (id: string) =>
    FRAME_THEMES.find((t) => t.id === id)?.name ?? id;

  const getFilterLabel = (id: string) =>
    PHOTO_FILTERS.find((f) => f.id === id)?.name ?? id;

  const triggerDownload = (record: SavedStripRecord) => {
    const link = document.createElement('a');
    link.href = record.dataUrl;
    link.download = `aesophoto-${record.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="archive" className="no-print border-b border-white/10 py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-zinc-400">
              03. 보관함
            </p>
            <h2 className="font-display mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-white">
              최근 완성한 네컷사진
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-mono-tabular">
            총 {records.length}장 보관 중
          </p>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0B0B0D] px-6 py-14 text-center">
            <p className="text-sm font-medium text-zinc-300">
              아직 저장하거나 인화한 네컷사진이 없습니다.
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              위 스튜디오에서 사진을 촬영하고 저장 또는 인화하면 이곳에 자동으로 보관됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((rec) => (
              <article
                key={rec.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B0D] transition-colors hover:border-white/25"
              >
                <div
                  onClick={() => setLightboxRecord(rec)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxRecord(rec);
                    }
                  }}
                  className="relative flex h-80 items-center justify-center bg-[#060608] p-5 cursor-pointer"
                >
                  <img
                    src={rec.dataUrl}
                    alt={`aesophoto 기록 ${rec.createdAt}`}
                    className="max-h-full w-auto object-contain shadow-lg"
                  />
                  <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-4 w-4" />
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {rec.caption.trim() || 'aesophoto'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                      <span>{rec.layout === '1x4' ? '1×4 스트립' : '2×2 그리드'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{getThemeLabel(rec.frameTheme)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{getFilterLabel(rec.filter)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="PNG 다운로드"
                      onClick={() => triggerDownload(rec)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-300 hover:border-white hover:text-white transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="바로 인화"
                      onClick={() => onPrintDataUrl(rec.dataUrl)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-300 hover:border-white hover:text-white transition-colors cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="삭제"
                      onClick={() => onDeleteRecord(rec.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:border-white/30 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxRecord && (
        <div
          onClick={() => setLightboxRecord(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] max-w-3xl flex-col items-center rounded-2xl border border-white/15 bg-[#0B0B0D] p-6"
          >
            <button
              type="button"
              onClick={() => setLightboxRecord(null)}
              aria-label="닫기"
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-zinc-300 hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <img
              src={lightboxRecord.dataUrl}
              alt="확대 미리보기"
              className="max-h-[68vh] w-auto object-contain"
            />

            <div className="mt-5 flex w-full flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="text-xs text-zinc-400">
                <span className="font-medium text-white">
                  {lightboxRecord.caption.trim() || 'aesophoto'}
                </span>
                <span className="mx-2" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono-tabular">{lightboxRecord.createdAt}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => triggerDownload(lightboxRecord)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  이미지 저장
                </button>
                <button
                  type="button"
                  onClick={() => onPrintDataUrl(lightboxRecord.dataUrl)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Printer className="h-3.5 w-3.5" />
                  바로 인화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
