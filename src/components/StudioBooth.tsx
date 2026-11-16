import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CameraOff,
  Check,
  FlipHorizontal2,
  Grid3X3,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Wand2,
} from 'lucide-react';
import {
  PHOTO_FILTERS,
  RETOUCH_LEVELS,
  SAMPLE_TEN_SHOTS,
  TIMER_OPTIONS,
} from '../constants/studioPresets';
import {
  CountdownSeconds,
  PhotoFilterId,
  RetouchConfig,
  ShootMode,
} from '../types/photobooth';
import { buildLivePreviewCssFilter } from '../utils/retouchProcessor';
import { playCountdownBeep, playShutterSound } from '../utils/soundEffects';

interface StudioBoothProps {
  shootMode: ShootMode;
  setShootMode: (mode: ShootMode) => void;
  tenShots: (string | null)[];
  setTenShots: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  selectedShotIndices: number[];
  setSelectedShotIndices: React.Dispatch<React.SetStateAction<number[]>>;
  directFourCuts: (string | null)[];
  setDirectFourCuts: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  activeFilter: PhotoFilterId;
  setActiveFilter: (filter: PhotoFilterId) => void;
  retouch: RetouchConfig;
  setRetouch: React.Dispatch<React.SetStateAction<RetouchConfig>>;
  onProceedToEditor: () => void;
  cameraAutoStartTrigger: number;
}

export function StudioBooth({
  shootMode,
  setShootMode,
  tenShots,
  setTenShots,
  selectedShotIndices,
  setSelectedShotIndices,
  directFourCuts,
  setDirectFourCuts,
  activeFilter,
  setActiveFilter,
  retouch,
  setRetouch,
  onProceedToEditor,
  cameraAutoStartTrigger,
}: StudioBoothProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetSlotRef = useRef<number | null>(null);
  const burstCancelRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState<CountdownSeconds>(3);

  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [isShootingSequence, setIsShootingSequence] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [shootingCutLabel, setShootingCutLabel] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  const baseFilterCss =
    PHOTO_FILTERS.find((f) => f.id === activeFilter)?.cssFilter ?? 'none';
  const livePreviewCss = buildLivePreviewCssFilter(baseFilterCss, retouch);

  const totalSlots = shootMode === '10-pick-4' ? 10 : 4;
  const currentList = shootMode === '10-pick-4' ? tenShots : directFourCuts;
  const capturedCount = currentList.filter(Boolean).length;

  const readyCutsCount =
    shootMode === '10-pick-4'
      ? selectedShotIndices.filter((i) => Boolean(tenShots[i])).length
      : directFourCuts.filter(Boolean).length;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        '이 브라우저에서는 카메라 API를 지원하지 않습니다. 사진 업로드나 샘플 모드를 이용해주세요.'
      );
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1600 },
          height: { ideal: 1200 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch {
      setCameraError(
        '카메라 접근 권한이 차단되었거나 카메라가 연결되지 않았습니다. 권한을 허용하거나 사진 업로드/샘플 모드를 이용해주세요.'
      );
      setCameraActive(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (cameraAutoStartTrigger > 0 && !cameraActive) {
      startCamera();
    }
  }, [cameraAutoStartTrigger, cameraActive, startCamera]);

  useEffect(() => {
    return () => {
      burstCancelRef.current = true;
      stopCamera();
    };
  }, [stopCamera]);

  const captureVideoFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;

    const targetW = 1200;
    const targetH = 900;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const videoRatio = video.videoWidth / video.videoHeight;
    const targetRatio = targetW / targetH;
    let sx = 0;
    let sy = 0;
    let sw = video.videoWidth;
    let sh = video.videoHeight;

    if (videoRatio > targetRatio) {
      sw = video.videoHeight * targetRatio;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / targetRatio;
      sy = (video.videoHeight - sh) / 2;
    }

    ctx.save();
    if (isMirrored) {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.92);
  }, [isMirrored]);

  const waitWithCountdown = useCallback(
    async (seconds: number): Promise<boolean> => {
      if (seconds <= 0) return true;

      for (let s = seconds; s >= 1; s--) {
        if (burstCancelRef.current) return false;
        setCountdownValue(s);
        if (soundEnabled) {
          playCountdownBeep(s === 1);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdownValue(null);
      return !burstCancelRef.current;
    },
    [soundEnabled]
  );

  const triggerFlashAndShutter = useCallback(() => {
    setFlashKey((k) => k + 1);
    if (soundEnabled) {
      playShutterSound();
    }
  }, [soundEnabled]);

  const handleSingleShot = useCallback(async () => {
    if (!cameraActive || isShootingSequence) return;
    burstCancelRef.current = false;
    setIsShootingSequence(true);

    const slot = Math.min(activeSlotIndex, totalSlots - 1);
    const padNum = String(slot + 1).padStart(2, '0');
    const padTotal = String(totalSlots).padStart(2, '0');
    setShootingCutLabel(`${padNum} / ${padTotal} 촬영 중`);

    const ok = await waitWithCountdown(timerSeconds);
    if (ok) {
      const frame = captureVideoFrame();
      if (frame) {
        triggerFlashAndShutter();
        if (shootMode === '10-pick-4') {
          setTenShots((prev) => {
            const next = [...prev];
            next[slot] = frame;
            return next;
          });
        } else {
          setDirectFourCuts((prev) => {
            const next = [...prev];
            next[slot] = frame;
            return next;
          });
        }
        setActiveSlotIndex((prev) => (prev < totalSlots - 1 ? prev + 1 : prev));
      }
    }

    setCountdownValue(null);
    setShootingCutLabel(null);
    setIsShootingSequence(false);
  }, [
    cameraActive,
    isShootingSequence,
    activeSlotIndex,
    totalSlots,
    timerSeconds,
    waitWithCountdown,
    captureVideoFrame,
    triggerFlashAndShutter,
    shootMode,
    setTenShots,
    setDirectFourCuts,
  ]);

  const handleBurstShoot = useCallback(async () => {
    if (!cameraActive || isShootingSequence) return;
    burstCancelRef.current = false;
    setIsShootingSequence(true);

    const padTotal = String(totalSlots).padStart(2, '0');

    for (let idx = 0; idx < totalSlots; idx++) {
      if (burstCancelRef.current) break;
      setActiveSlotIndex(idx);
      const padNum = String(idx + 1).padStart(2, '0');
      setShootingCutLabel(`${padNum} / ${padTotal} 연속 촬영`);

      const waitSec = idx === 0 ? timerSeconds : Math.max(timerSeconds, 2);
      const ok = await waitWithCountdown(waitSec);
      if (!ok) break;

      const frame = captureVideoFrame();
      if (frame) {
        triggerFlashAndShutter();
        if (shootMode === '10-pick-4') {
          setTenShots((prev) => {
            const next = [...prev];
            next[idx] = frame;
            return next;
          });
        } else {
          setDirectFourCuts((prev) => {
            const next = [...prev];
            next[idx] = frame;
            return next;
          });
        }
      }
      await new Promise((r) => setTimeout(r, 420));
    }

    setCountdownValue(null);
    setShootingCutLabel(null);
    setIsShootingSequence(false);
  }, [
    cameraActive,
    isShootingSequence,
    totalSlots,
    timerSeconds,
    waitWithCountdown,
    captureVideoFrame,
    triggerFlashAndShutter,
    shootMode,
    setTenShots,
    setDirectFourCuts,
  ]);

  const handleCancelShooting = () => {
    burstCancelRef.current = true;
    setCountdownValue(null);
    setShootingCutLabel(null);
    setIsShootingSequence(false);
  };

  const handleLoadSamples = () => {
    if (shootMode === '10-pick-4') {
      setTenShots([...SAMPLE_TEN_SHOTS]);
      setSelectedShotIndices([0, 1, 2, 3]);
    } else {
      setDirectFourCuts(SAMPLE_TEN_SHOTS.slice(0, 4));
    }
    setActiveSlotIndex(0);
  };

  const handleClearAll = () => {
    if (shootMode === '10-pick-4') {
      setTenShots(Array(10).fill(null));
      setSelectedShotIndices([]);
    } else {
      setDirectFourCuts([null, null, null, null]);
    }
    setActiveSlotIndex(0);
  };

  const toggleSelectShotForStrip = (idx: number) => {
    if (!tenShots[idx]) return;
    setSelectedShotIndices((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((item) => item !== idx);
      }
      if (prev.length >= 4) {
        // Replace the 4th selection or keep max 4? Removing oldest or ignoring? Let's replace oldest so clicking feels fluid, OR wait: better to let user explicitly click a slot to deselect or replace 4th. Replacing 4th only if already 4 might surprise—actually let's replace oldest when >=4 or toggle! Wait: even clearer: if already 4, shift out the first or ignore? Let's replace the last slot or show exact feedback: if <4 add, if full replace the last slot so user can swap effortlessly.
        return [...prev.slice(0, 3), idx];
      }
      return [...prev, idx];
    });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const targetSlot = uploadTargetSlotRef.current;
    const maxFiles = totalSlots;
    const fileArray = Array.from(files).slice(0, maxFiles);

    fileArray.forEach((file, offset) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        const resultStr = reader.result;

        if (shootMode === '10-pick-4') {
          setTenShots((prev) => {
            const next = [...prev];
            if (targetSlot !== null && fileArray.length === 1) {
              next[targetSlot] = resultStr;
            } else {
              const emptyIdx = next.findIndex((c) => c === null);
              const insertIdx = emptyIdx !== -1 ? emptyIdx : offset % 10;
              next[insertIdx] = resultStr;
            }
            return next;
          });
        } else {
          setDirectFourCuts((prev) => {
            const next = [...prev];
            if (targetSlot !== null && fileArray.length === 1) {
              next[targetSlot] = resultStr;
            } else {
              const emptyIdx = next.findIndex((c) => c === null);
              const insertIdx = emptyIdx !== -1 ? emptyIdx : offset % 4;
              next[insertIdx] = resultStr;
            }
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    uploadTargetSlotRef.current = null;
  };

  const triggerUploadForSlot = (slotIndex: number | null) => {
    uploadTargetSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  };

  return (
    <section id="studio" className="no-print border-b border-white/10 py-10 md:py-14">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Section Heading & Shoot Mode Switcher */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-zinc-400">
              01. 스튜디오 촬영 및 컷 선택
            </p>
            <h1 className="font-display mt-1.5 text-3xl md:text-4xl font-bold tracking-tight text-white text-balance">
              10컷을 찍고 마음에 드는 4컷을 고르세요
            </h1>
          </div>

          {/* Interactive Shoot Mode Segmented Control */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0E0E10] p-1 self-start lg:self-auto">
            <button
              type="button"
              disabled={isShootingSequence}
              onClick={() => {
                setShootMode('10-pick-4');
                setActiveSlotIndex(0);
              }}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                shootMode === '10-pick-4'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              10컷 촬영 후 4컷 선택
            </button>
            <button
              type="button"
              disabled={isShootingSequence}
              onClick={() => {
                setShootMode('4-direct');
                setActiveSlotIndex(0);
              }}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                shootMode === '4-direct'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              4컷 바로 촬영
            </button>
          </div>
        </div>

        {/* AI Auto Retouch Prompt Bar (Asks On/Off + Strength 1, 2, 3 clearly before/during shooting) */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/15 bg-[#0B0B0D] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white">
              <Wand2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                AI 자동 보정을 적용할까요?
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                피부 톤 정리와 스튜디오 광량 보정 여부를 켜고 강도(1·2·3단계)를 선택하세요.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* ON / OFF Toggle */}
            <div className="flex items-center rounded-lg border border-white/10 bg-[#050505] p-1">
              <button
                type="button"
                onClick={() =>
                  setRetouch((prev) => ({ ...prev, enabled: false }))
                }
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  !retouch.enabled
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                OFF · 원본
              </button>
              <button
                type="button"
                onClick={() =>
                  setRetouch((prev) => ({ ...prev, enabled: true }))
                }
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  retouch.enabled
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ON · AI 보정
              </button>
            </div>

            {/* Strength 1, 2, 3 Selector */}
            {retouch.enabled && (
              <div className="flex items-center rounded-lg border border-white/15 bg-[#050505] p-1">
                {RETOUCH_LEVELS.map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    title={item.desc}
                    onClick={() =>
                      setRetouch((prev) => ({ ...prev, strength: item.level }))
                    }
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      retouch.strength === item.level
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {item.level}단계
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input for local uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelected}
          className="hidden"
        />

        {/* Main 2-column Studio Workspace */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Left: Viewfinder & Camera Controls */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#0B0B0D]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  filter: livePreviewCss,
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                }}
                className={`h-full w-full object-cover transition-opacity duration-200 ${
                  cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />

              {cameraActive && showGrid && (
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-white/15" />
                  <div className="border-r border-white/15" />
                  <div />
                </div>
              )}

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
                    <Camera className="h-6 w-6" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-white">
                    카메라를 켜고 자유롭게 촬영하세요
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                    컬러와 흑백 모두 지원합니다. {shootMode === '10-pick-4' ? '10번 연속 촬영 후 마음에 드는 4컷을 직접 고를 수 있습니다.' : '4컷을 연속으로 촬영해 바로 프레임을 꾸며보세요.'}
                  </p>

                  {cameraError && (
                    <p className="mt-4 max-w-md rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-zinc-200">
                      {cameraError}
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Camera className="h-4 w-4" />
                      카메라 켜기
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerUploadForSlot(null)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="h-4 w-4" />
                      사진 업로드
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadSamples}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-white/30 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="h-4 w-4" />
                      {shootMode === '10-pick-4' ? '샘플 10컷 체험' : '샘플 4컷 체험'}
                    </button>
                  </div>
                </div>
              )}

              {cameraActive && (
                <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-md bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  <span className="font-mono-tabular">
                    {shootingCutLabel
                      ? shootingCutLabel
                      : `촬영 슬롯 ${String(activeSlotIndex + 1).padStart(2, '0')} / ${String(
                          totalSlots
                        ).padStart(2, '0')}`}
                  </span>
                </div>
              )}

              {countdownValue !== null && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                  <span className="font-display font-mono-tabular text-8xl md:text-9xl font-bold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                    {countdownValue}
                  </span>
                </div>
              )}

              {flashKey > 0 && (
                <div
                  key={flashKey}
                  className="animate-shutter-flash pointer-events-none absolute inset-0 bg-white"
                />
              )}
            </div>

            {/* Camera Controls Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0E0E10] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-lg border border-white/10 bg-[#050505] p-1">
                  {TIMER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isShootingSequence}
                      onClick={() => setTimerSeconds(opt.value)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        timerSeconds === opt.value
                          ? 'bg-white text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsMirrored((m) => !m)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isMirrored
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <FlipHorizontal2 className="h-3.5 w-3.5" />
                  반전
                </button>

                <button
                  type="button"
                  onClick={() => setShowGrid((g) => !g)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    showGrid
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                  그리드
                </button>

                <button
                  type="button"
                  onClick={() => setSoundEnabled((s) => !s)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    soundEnabled
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3.5 w-3.5" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5" />
                  )}
                  셔터음
                </button>

                {cameraActive && (
                  <button
                    type="button"
                    onClick={stopCamera}
                    disabled={isShootingSequence}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-white/25 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <CameraOff className="h-3.5 w-3.5" />
                    끄기
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isShootingSequence ? (
                  <button
                    type="button"
                    onClick={handleCancelShooting}
                    className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    촬영 중단
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!cameraActive}
                      onClick={handleSingleShot}
                      className="inline-flex items-center justify-center rounded-lg border border-white/20 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {String(activeSlotIndex + 1).padStart(2, '0')}번 컷 촬영
                    </button>
                    <button
                      type="button"
                      disabled={!cameraActive}
                      onClick={handleBurstShoot}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-35 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                      {shootMode === '10-pick-4' ? '10컷 연속 촬영' : '4컷 연속 촬영'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Live Color & Monochrome Filter Selector */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="mr-1 text-xs font-medium text-zinc-400">
                컬러/흑백 필터
              </span>
              {PHOTO_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeFilter === f.id
                      ? 'border-white bg-white text-black'
                      : 'border-white/10 bg-[#0E0E10] text-zinc-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right: 10-Shot Contact Sheet & Direct 4-Cut Picker OR Direct 4-Cut Grid */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="font-display text-base font-semibold text-white">
                  {shootMode === '10-pick-4'
                    ? `촬영된 10컷 (${capturedCount}/10)`
                    : `촬영된 4컷 (${capturedCount}/4)`}
                </h2>
                <p className="text-xs text-zinc-400">
                  {shootMode === '10-pick-4'
                    ? '원하는 사진 4장을 클릭해 직접 골라주세요'
                    : '슬롯을 눌러 재촬영하거나 사진을 업로드하세요'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSamples}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  샘플
                </button>
                <span className="text-zinc-700" aria-hidden="true">
                  ·
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  초기화
                </button>
              </div>
            </div>

            {shootMode === '10-pick-4' ? (
              <>
                {/* 10-Shot Selection Grid (2 columns x 5 rows or 5x2 compact) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                  {tenShots.map((imgSrc, idx) => {
                    const orderIdx = selectedShotIndices.indexOf(idx);
                    const isPicked = orderIdx !== -1;
                    const isShootingTarget = activeSlotIndex === idx;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveSlotIndex(idx);
                          if (imgSrc) {
                            toggleSelectShotForStrip(idx);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveSlotIndex(idx);
                            if (imgSrc) toggleSelectShotForStrip(idx);
                          }
                        }}
                        className={`group relative aspect-[4/3] overflow-hidden rounded-xl border transition-colors cursor-pointer bg-[#0E0E10] ${
                          isPicked
                            ? 'border-white ring-2 ring-white'
                            : isShootingTarget
                            ? 'border-white/50'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={`촬영 컷 ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            style={{ filter: livePreviewCss }}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-zinc-500">
                            <span className="font-mono-tabular text-xs font-medium">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-[11px]">대기 중</span>
                          </div>
                        )}

                        {/* Top-left Shot Index or Selection Order Badge */}
                        {isPicked ? (
                          <span className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-mono-tabular text-[11px] font-bold text-black shadow">
                            <Check className="h-3 w-3" />
                            {orderIdx + 1}번 컷
                          </span>
                        ) : (
                          <span className="pointer-events-none absolute top-2 left-2 rounded bg-black/75 px-1.5 py-0.5 font-mono-tabular text-[11px] font-medium text-zinc-200">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        )}

                        {/* Quick Upload / Retake Target / Delete */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="사진 업로드"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerUploadForSlot(idx);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded bg-black/80 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
                          >
                            <ImagePlus className="h-3 w-3" />
                          </button>
                          {imgSrc && (
                            <button
                              type="button"
                              title="삭제"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTenShots((prev) => {
                                  const next = [...prev];
                                  next[idx] = null;
                                  return next;
                                });
                                setSelectedShotIndices((prev) =>
                                  prev.filter((item) => item !== idx)
                                );
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded bg-black/80 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected 4-Cut Order Strip Summary */}
                <div className="rounded-xl border border-white/10 bg-[#0B0B0D] p-3.5">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      내가 고른 4컷 순서 ({readyCutsCount} / 4)
                    </span>
                    {selectedShotIndices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedShotIndices([])}
                        className="text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        선택 비우기
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((pos) => {
                      const shotIdx = selectedShotIndices[pos];
                      const src =
                        shotIdx !== undefined ? tenShots[shotIdx] : null;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => {
                            if (shotIdx !== undefined) {
                              setSelectedShotIndices((prev) =>
                                prev.filter((_, i) => i !== pos)
                              );
                            }
                          }}
                          className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/15 bg-[#050505] flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors"
                        >
                          {src ? (
                            <img
                              src={src}
                              alt={`선택 ${pos + 1}`}
                              style={{ filter: livePreviewCss }}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-mono-tabular text-[11px] text-zinc-500">
                              {pos + 1}ST
                            </span>
                          )}
                          <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1 font-mono-tabular text-[10px] text-white">
                            {pos + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Direct 4-Cut Grid */
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((idx) => {
                  const imgSrc = directFourCuts[idx];
                  const isSelected = activeSlotIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveSlotIndex(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveSlotIndex(idx);
                        }
                      }}
                      className={`group relative aspect-[4/3] overflow-hidden rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-white ring-1 ring-white'
                          : 'border-white/10 hover:border-white/30'
                      } bg-[#0E0E10]`}
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={`촬영 컷 ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          style={{ filter: livePreviewCss }}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-zinc-500">
                          <span className="font-mono-tabular text-xs font-medium">
                            0{idx + 1}
                          </span>
                          <span className="text-[11px]">비어 있음</span>
                        </div>
                      )}

                      <span className="pointer-events-none absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 font-mono-tabular text-[11px] font-medium text-white">
                        0{idx + 1}
                      </span>

                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          title="이 컷에 사진 업로드"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerUploadForSlot(idx);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-black/80 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                        </button>
                        {imgSrc && (
                          <button
                            type="button"
                            title="이 컷 삭제"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDirectFourCuts((prev) => {
                                const next = [...prev];
                                next[idx] = null;
                                return next;
                              });
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/80 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Proceed to Editor CTA */}
            <button
              type="button"
              onClick={onProceedToEditor}
              disabled={readyCutsCount === 0}
              className="mt-1 flex w-full items-center justify-between rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>보정 확인 & 프레임 편집하기</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
