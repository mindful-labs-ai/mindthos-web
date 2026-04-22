export type TermsContentBlock =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'span'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'link'; text: string; href: string };

export interface TermsSection {
  value: string;
  header: string;
  content: TermsContentBlock[];
}

/** API 응답의 sections 필드는 정규화 전 다양한 형태로 올 수 있음 */
export type RawTermsSections =
  | TermsSection[]
  | string
  | {
      title?: string;
      description?: string;
      sections: TermsSection[];
    };

export interface TermsContent {
  id: string;
  termsType: string;
  version: string;
  title: string;
  description?: string;
  sections: RawTermsSections;
}

/** sections가 정규화된 후의 타입 */
export interface NormalizedTermsContent extends Omit<TermsContent, 'sections'> {
  sections: TermsSection[];
}

export interface TermsContentResponse {
  success: boolean;
  content: TermsContent;
}
