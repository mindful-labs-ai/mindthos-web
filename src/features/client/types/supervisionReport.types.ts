/**
 * 다회기 분석(AI 슈퍼비전) 결과 JSON 스키마.
 *
 * 서버가 client_analyses.content에 section/block JSON으로 저장한다.
 * (구 버전 row는 Markdown 문자열이라 하위호환으로 별도 처리됨)
 */

export interface SupervisionMeta {
  key: string;
  value: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

/**
 * 하위 항목. 모델이 문자열 배열 또는 {text} 객체 배열로 산출할 수 있어 둘 다 허용.
 */
export type ListItemChild = string | { text?: string };

export interface ListItem {
  text: string;
  children?: ListItemChild[];
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  items: ListItem[];
}

export interface KeyValueBlock {
  type: 'keyvalue';
  items: { key: string; value: string }[];
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface QuoteBlock {
  type: 'quote';
  text: string;
}

export type SupervisionBlock =
  | ParagraphBlock
  | ListBlock
  | KeyValueBlock
  | TableBlock
  | QuoteBlock;

export interface SupervisionSection {
  title: string;
  blocks: SupervisionBlock[];
}

export interface SupervisionReport {
  /** 모델이 생략할 수 있어 optional (감지는 sections 배열 기준). */
  schema_version?: number;
  title?: string;
  meta?: SupervisionMeta[];
  sections: SupervisionSection[];
}
