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

export interface TermsContent {
  id: string;
  termsType: string;
  version: string;
  title: string;
  description?: string;
  sections: TermsSection[];
}

export interface TermsContentResponse {
  success: boolean;
  content: TermsContent;
}
