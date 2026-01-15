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
  total_credit: number;
}

export interface UsageInfo {
  total_usage: number;
}

export interface SettingsData {
  counselor: CounselorInfo;
  plan: PlanInfo;
  usage: UsageInfo;
}
