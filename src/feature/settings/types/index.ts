export interface CounselorInfo {
  name: string;
  email: string;
  organization: string;
}

export interface CardInfo {
  type: string;
  company: string;
  card_number: string;
}

export interface PlanInfo {
  type: string;
  description: string;
  price: number;
  audio_credit: number;
  summary_credit: number;
}

export interface UsageLimit {
  credit: number;
}

export interface UsageInfo {
  voice_transcription: UsageLimit;
  summary_generation: UsageLimit;
}

export interface SettingsData {
  counselor: CounselorInfo;
  plan: PlanInfo;
  usage: UsageInfo;
}
