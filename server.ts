import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const GUESTBOOK_FILE = path.join(DATA_DIR, 'guestbook.json');

interface GuestbookEntry {
  id: string;
  author: string;
  message: string;
  tag: string;
  createdAt: string;
  photoDataUrl?: string;
}

const INITIAL_ENTRIES: GuestbookEntry[] = [
  {
    id: 'gb-seed-1',
    author: '지민',
    message: '흑백 감성이 너무 깔끔해서 인생컷 건졌어요. 10장 찍고 4장 고르는 기능이 진짜 편하네요.',
    tag: '방문 기념',
    createdAt: '2026.11.15',
  },
  {
    id: 'gb-seed-2',
    author: '현우 & 수빈',
    message: '하루 스카이 프레임에 AI 보정 2단계 켜고 바로 인화까지 완료! 화질 엄청 선명해요.',
    tag: '커플 촬영',
    createdAt: '2026.11.15',
  },
  {
    id: 'gb-seed-3',
    author: '서연',
    message: '35mm 필름 롤 프레임 분위기 최고. 친구들이랑 또 찍으러 올게요.',
    tag: '친구들과',
    createdAt: '2026.11.15',
  },
];

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(GUESTBOOK_FILE)) {
    fs.writeFileSync(
      GUESTBOOK_FILE,
      JSON.stringify(INITIAL_ENTRIES, null, 2),
      'utf-8'
    );
  }
}

function readGuestbook(): GuestbookEntry[] {
  ensureDataStore();
  try {
    const raw = fs.readFileSync(GUESTBOOK_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ENTRIES;
  } catch {
    return INITIAL_ENTRIES;
  }
}

function writeGuestbook(entries: GuestbookEntry[]) {
  ensureDataStore();
  fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

function formatDateKr(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '4mb' }));

  // Guestbook REST API
  app.get('/api/guestbook', (_req, res) => {
    const entries = readGuestbook();
    res.json({ entries });
  });

  app.post('/api/guestbook', (req, res) => {
    const body = req.body as Partial<GuestbookEntry>;
    const author = typeof body.author === 'string' ? body.author.trim().slice(0, 24) : '';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 160) : '';
    const tag = typeof body.tag === 'string' ? body.tag.trim().slice(0, 20) : '방문 기념';
    const photoDataUrl =
      typeof body.photoDataUrl === 'string' &&
      body.photoDataUrl.startsWith('data:image/') &&
      body.photoDataUrl.length < 1_500_000
        ? body.photoDataUrl
        : undefined;

    if (!author || !message) {
      res.status(400).json({ error: '이름과 방명록 내용을 모두 입력해주세요.' });
      return;
    }

    const newEntry: GuestbookEntry = {
      id: `gb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author,
      message,
      tag: tag || '방문 기념',
      createdAt: formatDateKr(),
      ...(photoDataUrl ? { photoDataUrl } : {}),
    };

    const existing = readGuestbook();
    const updated = [newEntry, ...existing].slice(0, 60);
    writeGuestbook(updated);

    res.status(201).json({ entry: newEntry });
  });

  app.delete('/api/guestbook/:id', (req, res) => {
    const { id } = req.params;
    const existing = readGuestbook();
    const filtered = existing.filter((e) => e.id !== id);
    writeGuestbook(filtered);
    res.json({ ok: true });
  });

  // Mount Vite middleware in development, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`aesophoto server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
