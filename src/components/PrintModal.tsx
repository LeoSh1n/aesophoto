import { useEffect, useState } from 'react';
import { Check, Download, Printer, Usb, X } from 'lucide-react';
import { PaperSizeId, PrintSettings } from '../types/photobooth';
import {
  composePrintSheet,
  PAPER_SPECS,
  triggerHardwarePrinter,
} from '../utils/printService';

interface PrintModalProps {
  isOpen: boolean;
  stripDataUrl: string | null;
  onClose: () => void;
}

export function PrintModal({ isOpen, stripDataUrl, onClose }: PrintModalProps) {
  const [settings, setSettings] = useState<PrintSettings>({
    paperSize: '4x6',
    copies: 2,
    showCropMarks: true,
  });
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [usbStatus, setUsbStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !stripDataUrl) return;
    let active = true;
    setIsComposing(true);

    composePrintSheet(stripDataUrl, settings)
      .then((url) => {
        if (active) setSheetUrl(url);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsComposing(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, stripDataUrl, settings]);

  if (!isOpen || !stripDataUrl) return null;

  const handlePrintNow = async () => {
    const targetUrl =
      sheetUrl ?? (await composePrintSheet(stripDataUrl, settings));
    setIsPrinting(true);
    await triggerHardwarePrinter(targetUrl, settings.paperSize);
    setIsPrinting(false);
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  const handleDownloadSheet = async () => {
    const targetUrl =
      sheetUrl ?? (await composePrintSheet(stripDataUrl, settings));
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = `aesophoto-print-${settings.paperSize}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheckUsbPrinter = async () => {
    const nav = navigator as Navigator & {
      usb?: { requestDevice: (opts: { filters: object[] }) => Promise<{ productName?: string }> };
    };
    if (!nav.usb) {
      setUsbStatus(
        '시스템 프린터 연동(Canon, Epson, HP, AirPrint 등)을 바로 사용하실 수 있습니다.'
      );
      return;
    }
    try {
      const device = await nav.usb.requestDevice({ filters: [] });
      setUsbStatus(
        `연결된 USB 장치 확인됨: ${device.productName || '포토 프린터'}`
      );
    } catch {
      setUsbStatus(
        'OS에 설치된 기본 프린터는 별도 USB 선택 없이 "프린터로 인쇄하기"로 즉시 연결됩니다.'
      );
    }
  };

  const paperKeys: PaperSizeId[] = ['4x6', 'a4', '2x6'];

  return (
    <div
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0B0B0D] text-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-white">
              프린터 인화 연동
            </h2>
            <p className="text-xs text-zinc-400">
              용지 규격과 매수를 맞추어 연결된 프린터로 바로 출력하세요
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-zinc-300 hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-12">
          {/* Left: Real Paper Sheet Preview */}
          <div className="md:col-span-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#050505] p-6">
            <div className="mb-3 flex w-full items-center justify-between text-xs text-zinc-400">
              <span>용지 미리보기</span>
              <span className="font-mono-tabular">
                {PAPER_SPECS[settings.paperSize].widthMm} ×{' '}
                {PAPER_SPECS[settings.paperSize].heightMm} mm
              </span>
            </div>

            <div className="flex h-[340px] w-full items-center justify-center">
              {sheetUrl ? (
                <img
                  src={sheetUrl}
                  alt="인화 용지 미리보기"
                  className={`max-h-full max-w-full object-contain shadow-[0_14px_40px_rgba(0,0,0,0.85)] transition-opacity ${
                    isComposing ? 'opacity-60' : 'opacity-100'
                  }`}
                />
              ) : (
                <span className="text-xs text-zinc-500">
                  인화 시트 생성 중...
                </span>
              )}
            </div>
          </div>

          {/* Right: Printer Settings & Actions */}
          <div className="md:col-span-6 flex flex-col justify-between gap-5">
            <div className="space-y-5">
              {/* Paper Size */}
              <div>
                <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-zinc-300">
                  인화 용지 규격
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {paperKeys.map((key) => {
                    const spec = PAPER_SPECS[key];
                    const active = settings.paperSize === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            paperSize: key,
                            copies: key === '2x6' ? 1 : prev.copies,
                          }))
                        }
                        className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-white bg-white text-black'
                            : 'border-white/10 bg-[#111114] text-white hover:border-white/30'
                        }`}
                      >
                        <span className="text-xs font-bold">{spec.label}</span>
                        <span
                          className={`text-[11px] ${
                            active ? 'text-zinc-700' : 'text-zinc-400'
                          }`}
                        >
                          {spec.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Copies */}
              {settings.paperSize !== '2x6' && (
                <div>
                  <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-zinc-300">
                    한 장에 배치할 매수
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4]
                      .filter((n) => (settings.paperSize === '4x6' ? n <= 2 : true))
                      .map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({ ...prev, copies: num }))
                          }
                          className={`rounded-lg border py-2 text-xs font-semibold transition-colors cursor-pointer ${
                            settings.copies === num
                              ? 'border-white bg-white text-black'
                              : 'border-white/10 bg-[#111114] text-zinc-300 hover:border-white/30'
                          }`}
                        >
                          {num}컷
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Crop Marks Toggle */}
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111114] px-4 py-3 cursor-pointer">
                <div>
                  <span className="block text-xs font-semibold text-white">
                    모서리 재단선 표시
                  </span>
                  <span className="block text-[11px] text-zinc-400">
                    인화 후 가위나 커터로 자르기 쉽도록 여백 표시선 추가
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showCropMarks}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      showCropMarks: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-white cursor-pointer"
                />
              </label>

              {/* Hardware Printer Check */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCheckUsbPrinter}
                  className="inline-flex items-center gap-2 self-start text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Usb className="h-3.5 w-3.5" />
                  연결된 USB / 시스템 프린터 확인
                </button>
                {usbStatus && (
                  <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-zinc-300">
                    {usbStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Print Execute Buttons */}
            <div className="space-y-2.5 border-t border-white/10 pt-4">
              <button
                type="button"
                disabled={isPrinting || isComposing}
                onClick={handlePrintNow}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {printSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    프린터 인쇄 대화상자 전송 완료
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" />
                    {isPrinting ? '프린터 준비 중...' : '프린터로 인쇄하기'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadSheet}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-[#111114] px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                인화용 시트 이미지(PNG) 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
