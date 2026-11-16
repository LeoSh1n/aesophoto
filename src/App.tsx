import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArchiveGallery } from './components/ArchiveGallery';
import { FrameEditor } from './components/FrameEditor';
import { GuestbookSection } from './components/GuestbookSection';
import { GuideSection } from './components/GuideSection';
import { Header } from './components/Header';
import { PrintModal } from './components/PrintModal';
import { StudioBooth } from './components/StudioBooth';
import { COLOR_SAMPLE_PORTRAITS, SAMPLE_TEN_SHOTS } from './constants/studioPresets';
import { SavedStripRecord, ShootMode, StripConfig } from './types/photobooth';
import { formatStudioDate, renderStripDataUrl } from './utils/stripRenderer';

const STORAGE_KEY = 'aesophoto_archive_v2';

export default function App() {
  const [shootMode, setShootMode] = useState<ShootMode>('10-pick-4');
  const [tenShots, setTenShots] = useState<(string | null)[]>(() =>
    Array(10).fill(null)
  );
  const [selectedShotIndices, setSelectedShotIndices] = useState<number[]>([]);
  const [directFourCuts, setDirectFourCuts] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  const [config, setConfig] = useState<StripConfig>({
    layout: '1x4',
    frameTheme: 'jet-black',
    filter: 'original',
    retouch: {
      enabled: true,
      strength: 2,
    },
    showDate: true,
    caption: '',
    doublePrintSheet: false,
  });

  const activeFourCuts = useMemo<(string | null)[]>(() => {
    if (shootMode === '4-direct') {
      return directFourCuts;
    }
    return [0, 1, 2, 3].map((pos) => {
      const idx = selectedShotIndices[pos];
      return idx !== undefined ? tenShots[idx] ?? null : null;
    });
  }, [shootMode, directFourCuts, selectedShotIndices, tenShots]);

  const [records, setRecords] = useState<SavedStripRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read errors
    }
    return [];
  });

  const [cameraAutoStartTrigger, setCameraAutoStartTrigger] = useState(0);
  const [printModalStripUrl, setPrintModalStripUrl] = useState<string | null>(
    null
  );
  const [guestbookPhotoUrl, setGuestbookPhotoUrl] = useState<string | null>(
    null
  );
  const [guestbookAttachNonce, setGuestbookAttachNonce] = useState(0);

  // Keep latest rendered strip ready for guestbook attachment whenever cuts/config change
  useEffect(() => {
    const filled = activeFourCuts.filter(Boolean).length;
    if (filled === 0) {
      setGuestbookPhotoUrl(null);
      return;
    }
    let active = true;
    renderStripDataUrl(activeFourCuts, config)
      .then((url) => {
        if (active) setGuestbookPhotoUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeFourCuts, config]);

  // Seed one color studio sample strip on very first visit if empty
  useEffect(() => {
    if (records.length > 0) return;
    let cancelled = false;

    const seedSample = async () => {
      try {
        const sampleConfig: StripConfig = {
          layout: '1x4',
          frameTheme: 'haru-sky',
          filter: 'bright-color',
          retouch: { enabled: true, strength: 2 },
          showDate: true,
          caption: 'STUDIO SAMPLE',
          doublePrintSheet: false,
        };
        const dataUrl = await renderStripDataUrl(
          COLOR_SAMPLE_PORTRAITS,
          sampleConfig
        );
        if (!cancelled) {
          setRecords((prev) => {
            if (prev.length > 0) return prev;
            return [
              {
                id: 'sample-color-studio-01',
                createdAt: formatStudioDate(),
                layout: sampleConfig.layout,
                frameTheme: sampleConfig.frameTheme,
                filter: sampleConfig.filter,
                caption: sampleConfig.caption,
                dataUrl,
              },
            ];
          });
        }
      } catch {
        // Ignore if sample render fails
      }
    };

    seedSample();
    return () => {
      cancelled = true;
    };
  }, [records.length]);

  useEffect(() => {
    try {
      const toStore = records.slice(0, 9);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Ignore storage quota errors
    }
  }, [records]);

  const handleStartShoot = () => {
    const el = document.getElementById('studio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setCameraAutoStartTrigger((n) => n + 1);
  };

  const handleProceedToEditor = () => {
    const el = document.getElementById('editor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoadSamples = useCallback(() => {
    if (shootMode === '10-pick-4') {
      setTenShots([...SAMPLE_TEN_SHOTS]);
      setSelectedShotIndices([0, 1, 2, 3]);
    } else {
      setDirectFourCuts([...COLOR_SAMPLE_PORTRAITS]);
    }
  }, [shootMode]);

  const handleSaveToArchive = useCallback(
    (dataUrl: string) => {
      const newRecord: SavedStripRecord = {
        id: `${Date.now()}`,
        createdAt: formatStudioDate(),
        layout: config.layout,
        frameTheme: config.frameTheme,
        filter: config.filter,
        caption: config.caption,
        dataUrl,
      };
      setRecords((prev) => {
        if (prev.length > 0 && prev[0].dataUrl === dataUrl) {
          return prev;
        }
        return [newRecord, ...prev].slice(0, 12);
      });
    },
    [config]
  );

  const handleDeleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleOpenPrintModal = useCallback((stripDataUrl: string) => {
    setPrintModalStripUrl(stripDataUrl);
  }, []);

  const handlePostToGuestbook = useCallback((stripDataUrl: string) => {
    setGuestbookPhotoUrl(stripDataUrl);
    setGuestbookAttachNonce((n) => n + 1);
    const el = document.getElementById('guestbook');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div id="top" className="min-h-screen bg-[#050505] text-white">
      <Header onStartShoot={handleStartShoot} />

      <main>
        <StudioBooth
          shootMode={shootMode}
          setShootMode={setShootMode}
          tenShots={tenShots}
          setTenShots={setTenShots}
          selectedShotIndices={selectedShotIndices}
          setSelectedShotIndices={setSelectedShotIndices}
          directFourCuts={directFourCuts}
          setDirectFourCuts={setDirectFourCuts}
          activeFilter={config.filter}
          setActiveFilter={(filter) =>
            setConfig((prev) => ({ ...prev, filter }))
          }
          retouch={config.retouch}
          setRetouch={(updater) =>
            setConfig((prev) => ({
              ...prev,
              retouch:
                typeof updater === 'function' ? updater(prev.retouch) : updater,
            }))
          }
          onProceedToEditor={handleProceedToEditor}
          cameraAutoStartTrigger={cameraAutoStartTrigger}
        />

        <FrameEditor
          cuts={activeFourCuts}
          config={config}
          setConfig={setConfig}
          onSaveToArchive={handleSaveToArchive}
          onPrintStrip={handleOpenPrintModal}
          onPostToGuestbook={handlePostToGuestbook}
          onLoadSamples={handleLoadSamples}
        />

        <ArchiveGallery
          records={records}
          onDeleteRecord={handleDeleteRecord}
          onPrintDataUrl={handleOpenPrintModal}
        />

        <GuestbookSection
          currentStripDataUrl={guestbookPhotoUrl}
          attachTriggerNonce={guestbookAttachNonce}
        />

        <GuideSection />
      </main>

      <PrintModal
        isOpen={Boolean(printModalStripUrl)}
        stripDataUrl={printModalStripUrl}
        onClose={() => setPrintModalStripUrl(null)}
      />
    </div>
  );
}
