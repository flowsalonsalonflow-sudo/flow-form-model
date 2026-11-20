import type { CandidateStatus, HairQuizAnswers, PhotoAngle } from '../types/candidate';

export const FLOW_SALON_ASSETS = {
  brandLogo: '/assets/aistudio/logo_flow_2_white_57b53cf3.png',
  leafBackground: '/assets/aistudio/7d3c612399b96bd9329a6fd7a7b8475f_c612d810.jpg',
  heroPortrait: '/src/assets/images/flow_salon_hero_1795131929106.jpg',
  guideFront: '/src/assets/images/guide_hair_front_1795131928826.jpg',
  guideBack: '/src/assets/images/guide_hair_back_1795131928278.jpg',
  guideRight: '/src/assets/images/guide_hair_right_1795131929150.jpg',
  guideLeft: '/src/assets/images/guide_hair_left_1795131928060.jpg',
} as const;

export interface AngleMeta {
  key: PhotoAngle;
  shortLabel: string;
  title: string;
  hint: string;
  guideDetail: string;
  sampleUrl: string;
}

export const HAIR_ANGLES: AngleMeta[] = [
  {
    key: 'front',
    shortLabel: 'Depan',
    title: 'Tampak Depan',
    hint: 'Rambut diarahkan ke depan',
    guideDetail:
      'Hadap kamera lurus dengan rambut tergerai natural ke depan. Pastikan garis belahan, akar rambut atas, hingga ujung terbawah tidak terpotong frame.',
    sampleUrl: FLOW_SALON_ASSETS.guideFront,
  },
  {
    key: 'back',
    shortLabel: 'Belakang',
    title: 'Tampak Belakang',
    hint: 'Seluruh ujung rambut terlihat',
    guideDetail:
      'Sisir rambut rapi ke belakang punggung. Minta bantuan teman atau gunakan timer agar seluruh panjang, volume, dan ujung rambut terlihat utuh.',
    sampleUrl: FLOW_SALON_ASSETS.guideBack,
  },
  {
    key: 'right',
    shortLabel: 'Kanan',
    title: 'Tampak Kanan',
    hint: 'Profil rambut sisi kanan',
    guideDetail:
      'Hadap ke samping kanan dengan kepala tegak. Biarkan rambut jatuh alami mengikuti bahu agar tekstur, layer, dan ketebalan sisi kanan terlihat jelas.',
    sampleUrl: FLOW_SALON_ASSETS.guideRight,
  },
  {
    key: 'left',
    shortLabel: 'Kiri',
    title: 'Tampak Kiri',
    hint: 'Profil rambut sisi kiri',
    guideDetail:
      'Hadap ke samping kiri pada pencahayaan yang sama. Hindari poni atau helai rambut menutupi detail sisi kiri dari pangkal hingga ujung.',
    sampleUrl: FLOW_SALON_ASSETS.guideLeft,
  },
];

export interface HairQuizQuestion {
  key: keyof HairQuizAnswers;
  question: string;
  options: [string, string];
}

export const HAIR_QUIZ_QUESTIONS: HairQuizQuestion[] = [
  {
    key: 'coloredLast4Years',
    question: 'Apa rambut kamu pernah diwarnai dalam 4 tahun terakhir?',
    options: ['Pernah', 'Tidak Pernah'],
  },
  {
    key: 'smoothedLast4Years',
    question: 'Apa rambut kamu pernah di smoothing dalam 4 tahun terakhir?',
    options: ['Pernah', 'Tidak Pernah'],
  },
  {
    key: 'antiDandruffShampoo',
    question: 'Apakah Kamu menggunakan shampoo anti ketombe seperti selsun, head&shoulders, clear dll?',
    options: ['Ya', 'Tidak'],
  },
  {
    key: 'blackShampoo',
    question: 'Apakah Kamu menggunakan shampoo hitam seperti sunsilk hitam, emeron hitam, dll?',
    options: ['Ya', 'Tidak'],
  },
  {
    key: 'keratinLast4Years',
    question: 'Apa Anda pernah treatment Keratin dalam 4 tahun terakhir?',
    options: ['Pernah', 'Tidak Pernah'],
  },
];

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  pending: 'Menunggu Review',
  shortlisted: 'Lolos Kurasi',
  scheduled: 'Dijadwalkan',
  archived: 'Arsip',
};

export const PHOTO_CHECKLIST: string[] = [
  'Gunakan cahaya matahari alami atau lampu ruangan putih yang terang dan merata.',
  'Gerai seluruh rambut secara natural tanpa ikatan, jepit, bando, atau penutup kepala.',
  'Gunakan latar polos dan baju berwarna kontras dengan warna rambut agar ujung rambut terlihat tajam.',
  'Hindari filter warna, efek beauty berlebihan, atau foto yang terpotong pada bagian atas maupun ujung rambut.',
];
