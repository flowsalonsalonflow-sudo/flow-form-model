import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type PhotoAngle = 'front' | 'back' | 'right' | 'left';
type CandidateStatus = 'pending' | 'shortlisted' | 'scheduled' | 'archived';

interface CandidatePhotos {
  front: string;
  back: string;
  right: string;
  left: string;
}

interface HairQuizAnswers {
  coloredLast4Years: string;
  smoothedLast4Years: string;
  antiDandruffShampoo: string;
  blackShampoo: string;
  keratinLast4Years: string;
}

interface CandidateRecord {
  id: string;
  registrationCode: string;
  fullName: string;
  whatsappDisplay: string;
  whatsappNormalized: string;
  hairNote: string;
  hairQuiz?: HairQuizAnswers;
  photos: CandidatePhotos;
  status: CandidateStatus;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'candidates.json');

const ALLOWED_STATUSES: CandidateStatus[] = ['pending', 'shortlisted', 'scheduled', 'archived'];
const REQUIRED_ANGLES: PhotoAngle[] = ['front', 'back', 'right', 'left'];

const SEED_CANDIDATES: CandidateRecord[] = [
  {
    id: 'seed-nadia-01',
    registrationCode: 'FLW-2611-8401',
    fullName: 'Nadia Pramesti',
    whatsappDisplay: '0812-8940-3321',
    whatsappNormalized: '6281289403321',
    hairNote: 'Rambut alami belum pernah bleaching, panjang melewati bahu.',
    photos: {
      front: '/src/assets/images/guide_hair_front_1795131928826.jpg',
      back: '/src/assets/images/guide_hair_back_1795131928278.jpg',
      right: '/src/assets/images/guide_hair_right_1795131929150.jpg',
      left: '/src/assets/images/guide_hair_left_1795131928060.jpg',
    },
    status: 'shortlisted',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'seed-clara-02',
    registrationCode: 'FLW-2611-8394',
    fullName: 'Clara Wijaya',
    whatsappDisplay: '0857-2104-7782',
    whatsappNormalized: '6285721047782',
    hairNote: 'Bergelombang natural, potong terakhir 4 bulan lalu.',
    photos: {
      front: '/src/assets/images/flow_salon_hero_1795131929106.jpg',
      back: '/src/assets/images/guide_hair_back_1795131928278.jpg',
      right: '/src/assets/images/guide_hair_right_1795131929150.jpg',
      left: '/src/assets/images/guide_hair_left_1795131928060.jpg',
    },
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
  },
];

function ensureStorage(): void {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(SEED_CANDIDATES, null, 2), 'utf-8');
  }
}

function readCandidates(): CandidateRecord[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as CandidateRecord[];
    }
    return [];
  } catch {
    return [];
  }
}

function writeCandidates(records: CandidateRecord[]): void {
  ensureStorage();
  const tmpFile = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(records, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

function normalizeIndonesianWhatsapp(input: string): { display: string; normalized: string } | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) {
    return null;
  }

  let normalized = digits;
  if (normalized.startsWith('0')) {
    normalized = `62${normalized.slice(1)}`;
  } else if (normalized.startsWith('8')) {
    normalized = `62${normalized}`;
  } else if (!normalized.startsWith('62')) {
    normalized = digits;
  }

  const localDigits = normalized.startsWith('62') ? `0${normalized.slice(2)}` : normalized;
  const formatted = localDigits.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3');

  return {
    display: formatted,
    normalized,
  };
}

function generateRegistrationCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = crypto.randomInt(1000, 9999);
  return `FLW-${yy}${mm}-${rand}`;
}

function savePhotoDataUrl(candidateId: string, angle: PhotoAngle, dataUrl: string): string {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim());
  if (!match) {
    throw new Error(`Format foto ${angle} tidak valid. Gunakan format JPG, PNG, atau WEBP.`);
  }

  const mimeExt = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length === 0 || buffer.length > 6 * 1024 * 1024) {
    throw new Error(`Ukuran foto ${angle} melebihi batas maksimal 6 MB.`);
  }

  const filename = `${candidateId}_${angle}.${mimeExt}`;
  const fullPath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(fullPath, buffer);
  return `/uploads/${filename}`;
}

function buildSummary(records: CandidateRecord[]) {
  return {
    total: records.length,
    pending: records.filter((item) => item.status === 'pending').length,
    shortlisted: records.filter((item) => item.status === 'shortlisted').length,
    scheduled: records.filter((item) => item.status === 'scheduled').length,
    archived: records.filter((item) => item.status === 'archived').length,
  };
}

async function startServer(): Promise<void> {
  ensureStorage();

  const app = express();
  app.use(express.json({ limit: '28mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/uploads/:filename', (req: Request, res: Response) => {
    const safeName = path.basename(req.params.filename || '');
    if (!safeName || safeName.includes('..')) {
      res.status(400).json({ error: 'Nama file tidak valid.' });
      return;
    }

    const filePath = path.join(UPLOADS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Foto tidak ditemukan.' });
      return;
    }

    const ext = path.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    fs.createReadStream(filePath).pipe(res);
  });

  const getAdminPin = () => (process.env.ADMIN_PIN || 'flowsalon').trim();

  const isAuthorizedAdmin = (req: Request): boolean => {
    const pinHeader = (req.headers['x-admin-pin'] as string | undefined)?.trim();
    return Boolean(pinHeader && pinHeader === getAdminPin());
  };

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const body = req.body as { pin?: unknown };
    const provided = typeof body.pin === 'string' ? body.pin.trim() : '';
    if (provided && provided === getAdminPin()) {
      res.json({ ok: true });
      return;
    }
    res.status(401).json({ error: 'PIN Admin tidak sesuai.' });
  });

  app.get('/api/candidates', (req: Request, res: Response) => {
    if (!isAuthorizedAdmin(req)) {
      res.status(401).json({ error: 'Akses ditolak. Khusus Admin Flow Salon.' });
      return;
    }
    const allRecords = readCandidates().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const statusParam = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const queryParam = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    let filtered = allRecords;

    if (statusParam && statusParam !== 'all') {
      filtered = filtered.filter((item) => item.status === statusParam);
    }

    if (queryParam) {
      filtered = filtered.filter(
        (item) =>
          item.fullName.toLowerCase().includes(queryParam) ||
          item.whatsappDisplay.toLowerCase().includes(queryParam) ||
          item.whatsappNormalized.toLowerCase().includes(queryParam) ||
          item.registrationCode.toLowerCase().includes(queryParam),
      );
    }

    res.json({
      candidates: filtered,
      summary: buildSummary(allRecords),
    });
  });

  app.post('/api/candidates', (req: Request, res: Response) => {
    try {
      const body = req.body as {
        fullName?: unknown;
        whatsapp?: unknown;
        hairNote?: unknown;
        hairQuiz?: Partial<Record<keyof HairQuizAnswers, unknown>>;
        photos?: Partial<Record<PhotoAngle, unknown>>;
      };

      const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
      if (fullName.length < 2 || fullName.length > 120) {
        res.status(400).json({ error: 'Nama lengkap wajib diisi (minimal 2 karakter).' });
        return;
      }

      const rawWhatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
      const phone = normalizeIndonesianWhatsapp(rawWhatsapp);
      if (!phone) {
        res.status(400).json({ error: 'Nomor WhatsApp tidak valid. Masukkan 9–15 digit angka.' });
        return;
      }

      const hairNote =
        typeof body.hairNote === 'string' ? body.hairNote.trim().slice(0, 500) : '';

      let hairQuiz: HairQuizAnswers | undefined;
      if (body.hairQuiz && typeof body.hairQuiz === 'object') {
        hairQuiz = {
          coloredLast4Years:
            typeof body.hairQuiz.coloredLast4Years === 'string'
              ? body.hairQuiz.coloredLast4Years.trim()
              : '',
          smoothedLast4Years:
            typeof body.hairQuiz.smoothedLast4Years === 'string'
              ? body.hairQuiz.smoothedLast4Years.trim()
              : '',
          antiDandruffShampoo:
            typeof body.hairQuiz.antiDandruffShampoo === 'string'
              ? body.hairQuiz.antiDandruffShampoo.trim()
              : '',
          blackShampoo:
            typeof body.hairQuiz.blackShampoo === 'string'
              ? body.hairQuiz.blackShampoo.trim()
              : '',
          keratinLast4Years:
            typeof body.hairQuiz.keratinLast4Years === 'string'
              ? body.hairQuiz.keratinLast4Years.trim()
              : '',
        };
      }

      if (!body.photos || typeof body.photos !== 'object') {
        res.status(400).json({
          error: 'Semua 4 foto rambut (depan, belakang, kanan, kiri) wajib diunggah.',
        });
        return;
      }

      for (const angle of REQUIRED_ANGLES) {
        if (typeof body.photos[angle] !== 'string' || !body.photos[angle]) {
          res.status(400).json({
            error: `Foto tampak ${angle} belum diunggah. Pastikan 4 sudut rambut lengkap.`,
          });
          return;
        }
      }

      const id = `cand-${crypto.randomUUID().slice(0, 12)}`;
      const savedPaths: Partial<CandidatePhotos> = {};
      const writtenFiles: string[] = [];

      try {
        for (const angle of REQUIRED_ANGLES) {
          const urlPath = savePhotoDataUrl(id, angle, body.photos[angle] as string);
          savedPaths[angle] = urlPath;
          writtenFiles.push(path.join(UPLOADS_DIR, path.basename(urlPath)));
        }
      } catch (uploadError) {
        for (const filePath of writtenFiles) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        const message =
          uploadError instanceof Error ? uploadError.message : 'Gagal memproses unggahan foto.';
        res.status(400).json({ error: message });
        return;
      }

      const now = new Date().toISOString();
      const newRecord: CandidateRecord = {
        id,
        registrationCode: generateRegistrationCode(),
        fullName,
        whatsappDisplay: phone.display,
        whatsappNormalized: phone.normalized,
        hairNote,
        hairQuiz,
        photos: savedPaths as CandidatePhotos,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      const existing = readCandidates();
      existing.unshift(newRecord);
      writeCandidates(existing);

      const vpsWebhookUrl = (process.env.VPS_WEBHOOK_URL || '').trim();
      if (vpsWebhookUrl) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        const vpsSecret = (process.env.VPS_WEBHOOK_SECRET || '').trim();
        if (vpsSecret) {
          headers['Authorization'] = `Bearer ${vpsSecret}`;
        }
        fetch(vpsWebhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: 'candidate.registered',
            candidate: newRecord,
            rawPhotosBase64: body.photos,
          }),
        }).catch((webhookErr) => {
          console.error('VPS webhook sync warning:', webhookErr);
        });
      }

      res.status(201).json({
        candidate: newRecord,
        summary: buildSummary(existing),
        message: 'Pendaftaran berhasil disimpan ke database pusat Flow Salon.',
      });
    } catch (err) {
      console.error('Error creating candidate:', err);
      res.status(500).json({
        error: 'Terjadi kendala saat menyimpan data ke database pusat. Silakan coba lagi.',
      });
    }
  });

  app.patch('/api/candidates/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body as { status?: unknown; hairNote?: unknown };

    const records = readCandidates();
    const index = records.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Data kandidat tidak ditemukan.' });
      return;
    }

    const updated: CandidateRecord = { ...records[index] };

    if (typeof body.status === 'string') {
      if (!ALLOWED_STATUSES.includes(body.status as CandidateStatus)) {
        res.status(400).json({ error: 'Status kurasi tidak valid.' });
        return;
      }
      updated.status = body.status as CandidateStatus;
    }

    if (typeof body.hairNote === 'string') {
      updated.hairNote = body.hairNote.trim().slice(0, 280);
    }

    updated.updatedAt = new Date().toISOString();
    records[index] = updated;
    writeCandidates(records);

    res.json({
      candidate: updated,
      summary: buildSummary(records),
    });
  });

  app.delete('/api/candidates/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const records = readCandidates();
    const target = records.find((item) => item.id === id);

    if (!target) {
      res.status(404).json({ error: 'Data kandidat tidak ditemukan.' });
      return;
    }

    for (const angle of REQUIRED_ANGLES) {
      const photoUrl = target.photos[angle];
      if (photoUrl.startsWith('/uploads/')) {
        const filePath = path.join(UPLOADS_DIR, path.basename(photoUrl));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {
            // ignore cleanup errors
          }
        }
      }
    }

    const remaining = records.filter((item) => item.id !== id);
    writeCandidates(remaining);

    res.json({
      deletedId: id,
      summary: buildSummary(remaining),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Flow Salon server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
