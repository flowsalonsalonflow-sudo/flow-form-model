export type PhotoAngle = 'front' | 'back' | 'right' | 'left';

export type CandidateStatus = 'pending' | 'shortlisted' | 'scheduled' | 'archived';

export interface CandidatePhotos {
  front: string;
  back: string;
  right: string;
  left: string;
}

export type YesNoAnswer = 'Pernah' | 'Tidak Pernah' | 'Ya' | 'Tidak';

export interface HairQuizAnswers {
  coloredLast4Years: string;
  smoothedLast4Years: string;
  antiDandruffShampoo: string;
  blackShampoo: string;
  keratinLast4Years: string;
}

export interface CandidateRecord {
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

export interface DatabaseSummary {
  total: number;
  pending: number;
  shortlisted: number;
  scheduled: number;
  archived: number;
}

export interface CreateCandidatePayload {
  fullName: string;
  whatsapp: string;
  hairNote?: string;
  hairQuiz: HairQuizAnswers;
  photos: CandidatePhotos;
}

export type AppView = 'form' | 'guide';
