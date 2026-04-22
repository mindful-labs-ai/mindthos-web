// content 블록 타입
export interface HeadingBlock {
  type: 'h1' | 'h2' | 'h3';
  text: string;
}

export interface SpanBlock {
  type: 'span';
  text: string; // **bold**, __underline__, --strikethrough-- 지원
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt: string;
  width: number;
  height: number;
}

export type ContentBlock = HeadingBlock | SpanBlock | ImageBlock;

// notice 테이블 row (API 응답)
export interface Notice {
  id: string;
  version: string;
  category: string;
  title: string;
  thumbnail: string;
  date: string;
  content: ContentBlock[];
  createdAt: string;
}

// Edge function 응답
export interface NoticeListResponse {
  success: boolean;
  notices: Notice[];
}
